import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import * as pdf from 'html-pdf';
import * as moment from 'moment';
import { path } from 'ramda';

import { DamageDTO } from '../../dto/damage.dto';
import { INSPECTION_TYPE, InspectionEntity } from '../../entities/inspection.entity';
import { INSPECTION_DETAILS_FACE } from '../../entities/inspectionDetails.entity';
import { OrderEntity } from '../../entities/order.entity';
import { fileSign } from '../../utils/fileSign.util';
import { AccountEntity } from '../../entities/account.entity';

@Injectable()
export class PdfGenerationService {

    public async generateBOL(orderEntity: OrderEntity, options: any = {}): Promise<Buffer> {
        const driver = path(['orderTrips', '0', 'trip', 'driver'], orderEntity) as AccountEntity;
        const pickUpInspection = orderEntity.inspections.find(inspection => inspection.type === INSPECTION_TYPE.PICKUP);
        const deliveryInspection = orderEntity.inspections.find(inspection => inspection.type === INSPECTION_TYPE.DELIVERY);

        const content = await ejs.renderFile('./src/views/bol.ejs', {
            domain: options.domain,
            photosInspection: `${options.domain}/orders/${orderEntity.id}/photos`,
            order: orderEntity,
            pickUpInspection,
            deliveryInspection,
            driverSignature: fileSign(driver.signatureUrl),
            clientSignaturePickUp: fileSign(pickUpInspection.signatureUrl),
            driverPickUpAddress: pickUpInspection.createdLocation,
            clientPickUpAddress: pickUpInspection.signLocation,
            driverDeliveryAddress: deliveryInspection.createdLocation,
            driverFullName: `${driver.firstName} ${driver.lastName}`,
            clientPickUpFullName: `${pickUpInspection.signedBy.firstName} ${pickUpInspection.signedBy.lastName}`,
            clientDeliveryFullName: `${deliveryInspection.signedBy.firstName} ${deliveryInspection.signedBy.lastName}`,
            clientDeliveryAddress: deliveryInspection.signLocation,
            driverPickUpDate: PdfGenerationService.formatDateTime(pickUpInspection.createdAt),
            clientPickUpDate: PdfGenerationService.formatDateTime(pickUpInspection.signedAt),
            driverDeliveryDate: PdfGenerationService.formatDateTime(deliveryInspection.createdAt),
            clientDeliveryDate: PdfGenerationService.formatDateTime(deliveryInspection.signedAt),
            clientSignatureDelivery: fileSign(deliveryInspection.signatureUrl),
            frontDamages: this.getInspectionDamages(orderEntity, INSPECTION_DETAILS_FACE.FRONT),
            backDamages: this.getInspectionDamages(orderEntity, INSPECTION_DETAILS_FACE.BACK),
            leftDamages: this.getInspectionDamages(orderEntity, INSPECTION_DETAILS_FACE.LEFT),
            rightDamages: this.getInspectionDamages(orderEntity, INSPECTION_DETAILS_FACE.RIGHT),
            topDamages: this.getInspectionDamages(orderEntity, INSPECTION_DETAILS_FACE.TOP),
            noDamages: this.noDamages(orderEntity.inspections),
        }) as string;

        return new Promise((resolve, reject) => {
            pdf.create(content, {
                format: 'A4',
                orientation: 'portrait',
                width: '21cm',
                height: '29.7cm',
                type: 'pdf',
                header: {
                    height: '25mm',
                },
                footer: {
                    height: '10mm',
                },
            }).toBuffer((err, buffer) => {
                if (err) {
                    reject(err);
                }
                resolve(buffer);
            });
        });

    }

    public async generateInvoice(orderEntity: OrderEntity, options: any = {}): Promise<Buffer> {
        const currentDate = new Date();
        const content = await ejs.renderFile('./src/views/invoice.ejs', {
            domain: options.domain,
            order: orderEntity,
            salePrice: orderEntity.salePrice.toFixed(2),
            invoiceDate: `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
        }) as string;

        return new Promise((resolve, reject) => {
            pdf.create(content, {
                format: 'A4',
                orientation: 'portrait',
                width: '21cm',
                height: '29.7cm',
                type: 'pdf',
                header: {
                    height: '25mm',
                },
                footer: {
                    height: '20mm',
                },
            }).toBuffer((err, buffer) => {
                if (err) {
                    reject(err);
                }
                resolve(buffer);
            });
        });
    }

    public async generateReceipt(orderEntity: OrderEntity, options: any = {}): Promise<Buffer> {
        const currentDate = new Date();
        const paidDate = orderEntity.invoicePaidDate || new Date();
        const content = await ejs.renderFile('./src/views/receipt.ejs', {
            domain: options.domain,
            order: orderEntity,
            salePrice: orderEntity.salePrice.toFixed(2),
            paidDate: `${paidDate.toLocaleString('default', { month: 'long' })} ${paidDate.getDate()}, ${paidDate.getFullYear()}`,
            currentDate: `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`,
        }) as string;

        return new Promise((resolve, reject) => {
            pdf.create(content, {
                format: 'A4',
                orientation: 'portrait',
                width: '21cm',
                height: '29.7cm',
                type: 'pdf',
                header: {
                    height: '25mm',
                },
                footer: {
                    height: '20mm',
                },
            }).toBuffer((err, buffer) => {
                if (err) {
                    reject(err);
                }
                resolve(buffer);
            });
        });
    }

    private noDamages(inspections: InspectionEntity[]): boolean {
        return !inspections.find(inspection => !!(inspection.details.find(item => item.damages.length > 0)));
    }

    private getInspectionDamages(orderEntity: OrderEntity, face: string): DamageDTO[] {
        return orderEntity.inspections.reduce((filteredDamages, inspection) => {
            const inspectionDetails = inspection.type === INSPECTION_TYPE.PICKUP ? inspection.details : inspection.details.slice(5);

            return filteredDamages.concat(inspectionDetails.reduce((damages, detail) => {
                if (detail.face === face) {
                    const newDamages = detail.damages.map(item => ({ ...item, carId: inspection.carId, isDeliveryDamage: inspection.type === INSPECTION_TYPE.DELIVERY }));
                    return damages.concat(newDamages);
                }
                return damages;
            }, []));
        }, []);
    }

    public static formatDateTime(dateTime: Date): string {
        return moment(dateTime).format('DD/MM/YYYY HH:mm:ss');
    }
}
