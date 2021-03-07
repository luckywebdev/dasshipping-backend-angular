import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectEventEmitter } from 'nest-emitter';
import { In, Not, Repository, Transaction, TransactionRepository } from 'typeorm';

import { InspectionDetailsDTO } from '../../dto/inspectionDetails.dto';
import { CLIENT_NOTIFICATION_TYPES } from '../../dto/notification.dto';
import { AccountEntity } from '../../entities/account.entity';
import { CarEntity } from '../../entities/car.entity';
import { INSPECTION_STATUS, INSPECTION_TYPE, InspectionEntity } from '../../entities/inspection.entity';
import { InspectionDetailsEntity } from '../../entities/inspectionDetails.entity';
import { LocationEntity } from '../../entities/location.entity';
import { ORDER_STATUS } from '../../entities/orderBase.entity';
import { InspectionRepository } from '../../repositories/inspection.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { TripRepository } from '../../repositories/trip.repository';
import { fileSign } from '../../utils/fileSign.util';
import { DeliveryDamagesRequest } from '../client/dto/patch/deliveryDamages.dto';
import { DriverLocationService } from '../driverLocation/driverLocation.service';
import { GetList } from '../dto/requestList.dto';
import { SuccessResponseDTO } from '../dto/successResponse.dto';
import { AppEventEmitter } from '../event/app.events';
import { HereService } from '../here/here.service';
import { LocationService } from '../services/location/location.service';
import { CreateInspectionDTO } from './dto/create/createInspection.dto';
import { EditInspectionDTO } from './dto/edit/patchInspection.dto';
import { GetInspectionListResponse } from './dto/list/response.dto';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(InspectionRepository)
    private readonly inspectionRepository: InspectionRepository,
    @InjectRepository(InspectionDetailsEntity)
    private readonly inspectionDetailsRepository: Repository<
      InspectionDetailsEntity
    >,
    @InjectRepository(TripRepository)
    private readonly tripRepository: TripRepository,
    @InjectRepository(OrderRepository)
    private readonly orderRepository: OrderRepository,
    @InjectRepository(CarEntity)
    private readonly carRepository: Repository<CarEntity>,
    private readonly locationService: LocationService,
    private readonly driverLocationService: DriverLocationService,
    @InjectEventEmitter() private readonly emitter: AppEventEmitter,
    private readonly hereService: HereService,
  ) { }

  @Transaction()
  public async create(
    account: AccountEntity,
    inspectionData: CreateInspectionDTO,
    @TransactionRepository(LocationEntity) locationRepository?: Repository<LocationEntity>,
    @TransactionRepository(InspectionRepository) inspectionRepository?: InspectionRepository,
    @TransactionRepository(InspectionDetailsEntity) inspectionDetailsRepository?: Repository<InspectionDetailsEntity>,
  ): Promise<InspectionEntity> {
    const car = await this.carRepository.findOne(inspectionData.carId);
    if (!car) {
      throw new BadRequestException(
        `Car not found for id (${inspectionData.carId})`,
      );
    }
    const existingCarInspection = await this.inspectionRepository.findOne({
      where: {
        carId: inspectionData.carId,
        type: inspectionData.type,
      },
    });
    if (existingCarInspection) {
      throw new BadRequestException(
        `There is already an inspection for car (${inspectionData.carId})`,
      );
    }

    const trip = await this.tripRepository.getTrip({
      where: { orderId: inspectionData.orderId, driverId: account.id },
    });
    if (!trip) {
      throw new BadRequestException(
        `No Trip not found assigned to driver for order (${
        inspectionData.orderId
        }) `,
      );
    }
    let inspection = null;
    let errSource: string;
    try {
      errSource = 'Could not set inspection location';
      let { createdLocation } = inspectionData;
      delete inspectionData.createdLocation;
      if (!createdLocation) {
        const driverLocation = await this.driverLocationService.getLastLocation(
          account.id,
        );
        const lastLocation = await this.hereService.reverseGeocode({
          maxresults: 1,
          prox: `${driverLocation.lat},${driverLocation.lon},250`,
          mode: 'retrieveAll',
        });
        const [toSaveLocation] = lastLocation;
        createdLocation = {
          lat: toSaveLocation.lat,
          lon: toSaveLocation.lon,
          zipCode: toSaveLocation.zipCode,
          city: toSaveLocation.city,
          state: toSaveLocation.state,
          address: toSaveLocation.address ? toSaveLocation.address : null,
        };
      }

      const location = await this.locationService.save(createdLocation, locationRepository);
      errSource = 'Could not save inspection';
      inspection = await inspectionRepository.save({
        ...inspectionData,
        createdById: account.id,
        driverId: account.id,
        status: INSPECTION_STATUS.STARTED,
        createdLocationId: location.id,
      });

      if (inspectionData.details) {
        errSource = 'Could not update details';
        inspectionData.details.map(
          details => (details.inspectionId = inspection.id),
        );
        errSource = 'Could not save inspection details';
        await inspectionDetailsRepository.save(inspectionData.details);
      }
    } catch (e) {
      const outError = {
        message: e.detail || e.message,
        source: errSource,
        input: inspectionData,
      };
      throw new BadRequestException(JSON.stringify(outError));
    }

    if (this.isInspectionFinished(inspection)) {
      await inspectionRepository.update(inspection.id, {
        status: INSPECTION_STATUS.FINISHED,
      });
      inspection.status = INSPECTION_STATUS.FINISHED;
    }

    const order = await this.orderRepository.findOne(inspection.orderId);
    this.emitter.emit('notification', {
      type: CLIENT_NOTIFICATION_TYPES.ORDER_INSPECTIONS,
      actions: [],
      title: '',
      content: '',
      additionalInfo: inspection.orderId.toString(),
      targetUserId: order.createdById,
    });
    return inspection;
  }

  public async edit(
    account: AccountEntity,
    inspectionId: number,
    inspectionData: EditInspectionDTO,
  ): Promise<InspectionEntity> {
    const car = await this.carRepository.findOne(inspectionData.carId);
    if (!car) {
      throw new BadRequestException(
        `Car not found for id (${inspectionData.carId})`,
      );
    }
    let inspection = await this.inspectionRepository.getDetailedInspection({
      id: inspectionId,
      driverId: account.id,
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection not found for id (${inspectionId})`,
      );
    }
    if (INSPECTION_STATUS.STARTED !== inspection.status) {
      throw new BadRequestException(
        `Inspection is not available to be updated for id (${inspectionId})`,
      );
    }
    const trip = await this.tripRepository.getTrip({
      where: { orderId: inspectionData.orderId, driverId: account.id },
    });
    if (!trip) {
      throw new BadRequestException(
        `No Trip not found assigned to driver for order (${
        inspectionData.orderId
        }) `,
      );
    }

    try {
      if (inspectionData.details) {
        await this.updateInspectionDetails(inspection, inspectionData.details);
        delete inspectionData.details;
      }

      await this.inspectionRepository.update(inspection.id, {
        ...inspectionData,
        updatedAt: new Date(),
      });
    } catch (e) {
      throw new BadRequestException(e.detail);
    }

    inspection = await this.inspectionRepository.getDetailedInspection({
      id: inspectionId,
      driverId: account.id,
    });

    if (this.isInspectionFinished(inspection)) {
      await this.inspectionRepository.update(inspection.id, {
        status: INSPECTION_STATUS.FINISHED,
      });
      inspection.status = INSPECTION_STATUS.FINISHED;
    }

    return inspection;
  }

  public async getCarInspection(
    inspectionCarId: number,
    query: any = {},
  ): Promise<InspectionEntity> {
    const where = Object.assign(query.where, {
      carId: inspectionCarId,
    });

    const inspection = await this.inspectionRepository.getDetailedInspection(
      where,
    );

    if (!inspection) {
      throw new NotFoundException(
        `Inspection not found for car id (${inspectionCarId})`,
      );
    }
    let images = [];
    if (inspection.images) {
      images = inspection.images.map(item => {
        return {
          ...item,
          signedUrl: fileSign(item.url),
        };
      });
    }

    return {
      ...inspection,
      images,
    };
  }

  public async getOrderInspections(
    inspectionOrderId: number,
    query: GetList,
  ): Promise<GetInspectionListResponse> {
    if (!query.where) {
      query.where = {};
    }
    query.where = Object.assign(query.where, {
      orderId: inspectionOrderId,
    });

    let { count, data } = await this.inspectionRepository.getAll(query);
    data = data.map(inspection => {
      return {
        ...inspection,
        images: inspection.images.map(item => {
          return {
            ...item,
            signedUrl: fileSign(item.url),
          };
        }),
      };
    });
    return { count, data };
  }

  public async getCarInspectionBasedOnOrder(
    inspectionCarId: number,
    query: any = {},
  ): Promise<InspectionEntity> {
    const where = Object.assign(query.where, {
      carId: inspectionCarId,
    });

    const inspection = await this.inspectionRepository.getDetailedInspectionBasedOnOrder(
      where,
    );

    if (!inspection) {
      throw new NotFoundException(
        `Inspection not found for car id (${inspectionCarId})`,
      );
    }
    let images = [];
    if (inspection.images) {
      images = inspection.images.map(item => {
        return {
          ...item,
          signedUrl: fileSign(item.url),
        };
      });
    }

    return {
      ...inspection,
      images,
    };
  }

  public async getInspectionsBasedOnOrder(
    inspectionOrderId: number,
    query: GetList,
  ): Promise<GetInspectionListResponse> {
    if (!query.where) {
      query.where = {};
    }
    query.where = Object.assign(query.where, {
      orderId: inspectionOrderId,
    });

    let {
      count,
      data,
    } = await this.inspectionRepository.getInspectionsBasedOnOrder(query);

    data = data.map(inspection => {
      return {
        ...inspection,
        images: inspection.images.map(item => {
          return {
            ...item,
            signedUrl: fileSign(item.url),
          };
        }),
      };
    });
    return { count, data };
  }

  public async markPickUpInspectionAsViewed(
    orderId: number,
    inspectionId: number,
    query: any = {},
  ): Promise<SuccessResponseDTO> {
    const inspection = await this.inspectionRepository.findOne({
      orderId,
      id: inspectionId,
      ...query.where,
      status: In([INSPECTION_STATUS.SIGNATURE_REQUESTED, INSPECTION_STATUS.FINISHED]),
    });
    if (!inspection) {
      throw new BadRequestException(
        `No Pending Signature inspection found for id ${inspectionId} and order ${orderId}`,
      );
    }
    await this.inspectionRepository.update(inspectionId, {
      status: INSPECTION_STATUS.VIEWED,
      updatedAt: new Date(),
    });

    return { message: 'Inspection is marked as viewed successfully' };
  }

  @Transaction()
  public async addInspectionDamages(
    inspectionId: number,
    data: DeliveryDamagesRequest,
    query: any,
    @TransactionRepository(InspectionRepository) inspectionRepository?: InspectionRepository,
    @TransactionRepository(InspectionDetailsEntity) inspectionDetailsRepository?: Repository<InspectionDetailsEntity>,
    @TransactionRepository(OrderRepository) orderRepository?: OrderRepository,
  ): Promise<InspectionEntity> {
    const inspection = await inspectionRepository.findOne({
      id: inspectionId,
      type: INSPECTION_TYPE.DELIVERY,
      status: Not(INSPECTION_STATUS.SIGNED),
      ...query.where,
    });
    if (!inspection) {
      throw new NotFoundException(
        `No unsigned delivery inspection found for id ${inspectionId}`,
      );
    }

    inspection.images = inspection.images || [];
    data.images = data.images || [];
    let updateData;
    if (data.details && data.details.length) {
      data.details.map(inspectionDetail => (inspectionDetail.inspectionId = inspectionId));
      await inspectionDetailsRepository.save(data.details);
      updateData = { images: [...inspection.images, ...data.images] };
      await orderRepository.update(
        { id: inspection.orderId },
        { preStatus: ORDER_STATUS.CLAIMED },
      );
    }

    if (data.notes) {
      updateData = { ...updateData, driverNotes: data.notes };
    }

    if (updateData && Object.keys(updateData).length) {
      await inspectionRepository.update(inspectionId, updateData);
    }

    this.emitter.emit('notification_admin', { orderId: inspection.orderId });
    this.emitter.emit('notification_carrier', { orderId: inspection.orderId });

    return inspectionRepository.findOne(
      { id: inspectionId },
      { relations: ['details'] },
    );
  }

  private async updateInspectionDetails(
    inspection: InspectionEntity,
    details: InspectionDetailsDTO[],
  ): Promise<InspectionDetailsEntity[]> {
    const detailsToDelete = inspection.details.filter(
      detail =>
        !details
          .filter(dataDetail => dataDetail.hasOwnProperty('id'))
          .map(dataC => dataC.id)
          .includes(detail.id),
    );
    const detailsToAdd = details
      .filter(detail => !detail.hasOwnProperty('id'))
      .map(detail => {
        return {
          ...detail,
          inspectionId: inspection.id,
        };
      });
    const detailsToUpdate = details
      .filter(detail => detail.hasOwnProperty('id'))
      .map(detail => {
        return {
          ...detail,
          updatedAt: new Date(),
        };
      });
    const detailsToSave = detailsToAdd.concat(detailsToUpdate);
    await this.inspectionDetailsRepository.remove(detailsToDelete);

    return await this.inspectionDetailsRepository.save(detailsToSave);
  }

  private isInspectionFinished(inspection: InspectionEntity): boolean {
    return (
      (inspection.driverNotes || inspection.driverNotes === '') &&
      inspection.details &&
      inspection.details.length === 5
    );
  }
}
