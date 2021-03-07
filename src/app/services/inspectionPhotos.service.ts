import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as zipFolder from 'zip-folder';

import { InspectionImagesDTO } from '../../dto/inspectionImages.dto';
import { INSPECTION_TYPE } from '../../entities/inspection.entity';
import { OrderEntity } from '../../entities/order.entity';
import { getFile, uploadBufferFile } from '../../utils/fileSign.util';

@Injectable()
export class InspectionPhotosService {

    public async createPhotos(order: OrderEntity): Promise<void> {
        const folderName = path.join(__dirname, `../../../upload/order-${order.id}`);
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
        if (!fs.existsSync(`${folderName}/${INSPECTION_TYPE.PICKUP}`)) {
            fs.mkdirSync(`${folderName}/${INSPECTION_TYPE.PICKUP}`);
        }
        if (!fs.existsSync(`${folderName}/${INSPECTION_TYPE.DELIVERY}`)) {
            fs.mkdirSync(`${folderName}/${INSPECTION_TYPE.DELIVERY}`);
        }

        const imagesPickup = order.inspections.find(inspection => inspection.type === INSPECTION_TYPE.PICKUP).images;
        const imagesDelivery = order.inspections.find(inspection => inspection.type === INSPECTION_TYPE.DELIVERY).images;

        await this.createPhotosInspection(folderName, imagesPickup);
        await this.createPhotosInspection(folderName, imagesDelivery, true);

        await this.createZip(folderName);
        const zip = fs.readFileSync(`${folderName}.zip`);
        await uploadBufferFile(zip, `order-${order.id}.zip`);
        rimraf.sync(folderName);
        fs.unlinkSync(`${folderName}.zip`);
    }

    private createZip(folderName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            zipFolder(folderName, `${folderName}.zip`, (err) => {
                if (err) {
                    return reject();
                } else {
                    return resolve();
                }
            });
        });
    }

    private async createPhotosInspection(
        folderName: string,
        images: InspectionImagesDTO[],
        isDeliveryDamage: boolean = false): Promise<void> {
        for (const image of images) {
            await this.createPhoto(folderName, image, isDeliveryDamage);
        }
    }

    private async createPhoto(
        folderName: string,
        image: InspectionImagesDTO,
        isDeliveryDamage: boolean = false): Promise<void> {
        const data = await getFile(image.url);
        try {
            fs.writeFileSync(`${folderName}/${isDeliveryDamage ? INSPECTION_TYPE.DELIVERY : INSPECTION_TYPE.PICKUP}/${image.url}`, data.Body);
        } catch (e) {
            throw new Error(`Write file ${image.url}`);
        }
    }

}
