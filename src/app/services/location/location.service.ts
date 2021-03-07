import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { path } from 'ramda';
import { Repository } from 'typeorm';

import { ConfigService } from '../../../config/config.service';
import { LocationDTO } from '../../../dto/location.dto';
import { LocationEntity } from '../../../entities/location.entity';
import { AddressRequestDTO } from '../../here/dto/address/addressRequest.dto';
import { HereService } from '../../here/here.service';

@Injectable()
export class LocationService {
  constructor(
    private readonly hereService: HereService,
    private readonly configService: ConfigService,
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
  ) { }

  public async save(
    location: LocationDTO,
    locationRepository: Repository<LocationEntity> = this.locationRepository,
  ): Promise<LocationEntity> {
    let objToSave: LocationDTO;
    if (!location.lat || !location.lon) {
      const foundLocation = await this.hereService.getAddress({
        address: location.address,
        state: location.state,
        zipCode: location.zipCode,
        city: location.city,
      } as AddressRequestDTO);
      if (foundLocation.Relevance < this.configService.relevanceAddress) {
        throw new BadRequestException(
          `Invalid address ${JSON.stringify(location)}`,
        );
      }
      const latitude = path(
        ['Location', 'NavigationPosition', '0', 'Latitude'],
        foundLocation,
      ) as number;
      const longitude = path(
        ['Location', 'NavigationPosition', '0', 'Longitude'],
        foundLocation,
      ) as number;
      objToSave = {
        ...location,
        lat: latitude,
        lon: longitude,
        point: {
          type: 'Point',
          coordinates: [latitude, longitude],
        },
      };
    } else {
      objToSave = {
        ...location,
        point: {
          type: 'Point',
          coordinates: [location.lat, location.lon],
        },
      };
    }

    return await locationRepository.save(objToSave);
  }

}
