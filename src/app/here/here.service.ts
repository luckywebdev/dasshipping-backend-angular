import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Axios from 'axios';
import { path } from 'ramda';

import { ConfigService } from '../../config/config.service';
import { OrderEntity } from '../../entities/order.entity';
import { meterToMile } from '../../utils/meterToMile.util';
import { CalculateRoute } from '../trip/dto/default/response.dto';
import { AddressRequestDTO } from './dto/address/addressRequest.dto';
import { AddressValidationResponsetDTO } from './dto/address/addressValidationResponse.dto';
import { CalculateTripDTO } from './dto/calculateTrip/calculateTrip.dto';
import { LocationTripDTO } from './dto/calculateTrip/locationTrip.dto';
import { CalculateTripRequestDTO } from './dto/calculateTrip/request.dto';
import { DistanceResponseDTO } from './dto/calculateTrip/response.dto';

@Injectable()
export class HereService {
  constructor(private readonly configService: ConfigService) { }

  async calculateroute(query): Promise<any> {
    try {
      const result = await Axios.get(
        'https://route.api.here.com/routing/7.2/calculateroute.json',
        {
          params: {
            ...query,
            ...this.configService.here,
          },
        },
      );
      return result.data.response.route;
    } catch (err) {
      const error = path(['response', 'data', 'details'], err);
      throw new BadRequestException(error);
    }
  }

  private setLocationData(location) {
    const {
      Label,
      State,
      City,
      PostalCode,
      HouseNumber,
      Street,
    } = location.Address;
    const { Latitude, Longitude } = location.DisplayPosition;
    let address = HouseNumber;
    if (address && Street) {
      address += ', ' + Street;
    }
    if (!address && Street) {
      address = Street;
    }

    return {
      label: Label,
      state: State,
      city: City,
      zipCode: PostalCode,
      address: address || '',
      lat: Latitude,
      lon: Longitude,
    };
  }

  async geocode(query) {
    try {
      const result = await Axios.get(
        'https://geocoder.api.here.com/6.2/geocode.json',
        {
          params: {
            ...query,
            ...this.configService.here,
            country: 'USA',
          },
        },
      );
      if (result.data.Response.View[0]) {
        return result.data.Response.View[0].Result.map(r => {
          return this.setLocationData(r.Location);
        }).filter(
          item =>
            item.state && item.city && item.lat && item.lon,
        );
      }
      return [];
    } catch (err) {
      const error = path(['response', 'data', 'Details'], err);
      throw new BadRequestException(error);
    }
  }

  async reverseGeocode(query) {
    try {
      const result = await Axios.get(
        'https://reverse.geocoder.api.here.com/6.2/reversegeocode.json',
        {
          params: {
            ...query,
            ...this.configService.here,
          },
        },
      );
      if (result.data.Response.View[0]) {
        return result.data.Response.View[0].Result.map(r => {
          return this.setLocationData(r.Location);
        }).filter(
          item =>
            item.state && item.city && item.lat && item.lon,
        );
      }
      return [];
    } catch (err) {
      const error = path(['response', 'data', 'Details'], err);
      throw new BadRequestException(error);
    }
  }

  public async validateAddress(
    address: AddressRequestDTO,
  ): Promise<AddressValidationResponsetDTO> {
    const foundAddress = await this.getAddress(address);

    return {
      matchLevel: foundAddress.MatchLevel,
      relevance: foundAddress.Relevance,
    };
  }

  public async getAddress(address: AddressRequestDTO): Promise<any> {
    let foundAddress = null;
    try {
      const result = await Axios.get(
        'https://geocoder.api.here.com/6.2/geocode.json',
        {
          params: {
            ...this.configService.here,
            searchText: `${address.address} ${address.city} ${
              address.state
              } United States ${address.zipCode}`,
            gen: 9,
          },
        },
      );
      foundAddress = path(
        ['data', 'Response', 'View', '0', 'Result', '0'],
        result,
      );
    } catch (err) {
      const error = path(['response', 'data', 'details'], err);
      throw new BadRequestException(error);
    }

    if (!foundAddress) {
      throw new NotFoundException(`Address not found`);
    }

    if (foundAddress.Relevance < this.configService.relevanceAddress) {
      throw new NotFoundException(`Address not found`);
    }

    if (this.configService.matchLevel && !['street', 'houseNumber'].includes(foundAddress.MatchLevel)) {
      throw new NotFoundException(`Please provide more accurate address`);
    }

    return foundAddress;
  }

  public async findAddress(address: string): Promise<any> {
    let foundAddress = null;
    try {
      const result = await Axios.get(
        'https://geocoder.api.here.com/6.2/geocode.json',
        {
          params: {
            ...this.configService.here,
            searchText: address,
            gen: 9,
          },
        },
      );
      foundAddress = path(
        ['data', 'Response', 'View', '0', 'Result', '0'],
        result,
      );
    } catch (err) {
      const error = path(['response', 'data', 'details'], err);
      throw new BadRequestException(error);
    }

    if (!foundAddress) {
      throw new NotFoundException(`Address not found`);
    }

    return foundAddress;
  }

  public async calculateTrip(
    data: CalculateTripRequestDTO,
  ): Promise<DistanceResponseDTO> {
    const { optimize, locations } = data;
    let price = 0;
    for (const item of locations) {
      if (!item.originPoint || (!item.destinationPoint && !item.isVirtual)) {
        const results = await Promise.all([
          this.geocode({ searchtext: item.origin }),
          this.geocode({ searchtext: item.destination }),
        ]);
        const [resultOrigin, resultDestinaion] = results;
        const [locationOrigin] = resultOrigin;
        const [locationDestination] = resultDestinaion;
        item.originPoint = `${locationOrigin.lat},${locationOrigin.lon}`;
        item.destinationPoint = `${locationDestination.lat},${
          locationDestination.lon
          }`;
      }
      if (!item.originPoint && item.isVirtual) {
        const results = await this.geocode({ searchtext: item.origin });
        const [resultOrigin] = results;
        const [locationOrigin] = resultOrigin;
        item.originPoint = `${locationOrigin.lat},${locationOrigin.lon}`;
      }
      const cost = item.isVirtual ? 0 : item.cost;
      price = price + cost;
    }

    let result;
    if (optimize) {
      result = await this.optimizeRoute(locations);
    } else {
      result = await this.getDistance(locations);
    }
    const { distance, locationsOrdered } = result;
    const totalDistance = meterToMile(distance);

    return {
      price,
      distance: totalDistance,
      costPerMile: (price / totalDistance).toFixed(8),
      locations: locationsOrdered,
    };
  }

  private async getDistance(
    locations: CalculateTripDTO[],
  ): Promise<{ distance: number; locationsOrdered: LocationTripDTO[] }> {
    const query: any = {};
    const locationsOrdered: any = [];
    const start = locations.find(item => item.isStartPoint && item.isVirtual);

    if (start) {
      query[`waypoint0`] = start.originPoint;
      locations = locations.filter(item => !item.isVirtual);
    }
    const inverse = locations.length * 2 - 1;

    for (let i = 0; i < locations.length; i++) {
      const waypoint = start ? i + 1 : i;
      query[`waypoint${waypoint}`] = locations[i].originPoint;
      query[`waypoint${inverse - waypoint}`] = locations[i].destinationPoint;
      locationsOrdered[i] = {
        point: locations[i].originPoint,
        origin: locations[i].origin,
        key: locations[i].key,
      };
      locationsOrdered[inverse - i] = {
        point: locations[i].destinationPoint,
        origin: locations[i].destination,
        key: locations[i].key,
      };
    }

    const result = await this.calculateroute({
      ...query,
      improveFor: 'time',
      mode: 'fastest;truck',
    });

    const virtualDistance = start
      ? parseInt(path(['0', 'leg', '0', 'length'], result), 10)
      : 0;
    const distance: string = path(['0', 'summary', 'distance'], result);

    return {
      distance: parseInt(distance, 10) - virtualDistance,
      locationsOrdered,
    };
  }

  private async optimizeRoute(
    locations: CalculateTripDTO[],
  ): Promise<{ distance: number; locationsOrdered: LocationTripDTO[] }> {
    let locationsSearch: any = [];
    let start: CalculateTripDTO;
    let end: CalculateTripDTO;

    for (let i = 0; i < locations.length; i++) {
      if (locations[i].isStartPoint) {
        start = locations[i];
        delete locations[i];
      }
      if (locations[i] && locations[i].isEndPoint) {
        end = locations[i];
        delete locations[i];
      }
    }

    if (!start) {
      start = locations[0];
      delete locations[0];
    }
    const newOrderer = locations.reduce((reduce, item) => {
      return [
        ...reduce,
        { origin: item.origin, point: item.originPoint, key: item.key },
        {
          origin: item.destination,
          point: item.destinationPoint,
          key: item.key,
        },
      ];
    }, []);

    const queryPick: any = {};
    queryPick.start = start.originPoint;
    locationsSearch = start.isVirtual
      ? [...newOrderer]
      : [
        {
          origin: start.destination,
          point: start.destinationPoint,
          key: start.key,
        },
        ...newOrderer,
      ];
    if (end) {
      queryPick.end = end.destinationPoint;
      locationsSearch.push({
        origin: end.origin,
        point: end.originPoint,
        key: end.key,
      });
    }

    for (let i = 0; i < locationsSearch.length; i++) {
      queryPick[`destination${i + 1}`] = locationsSearch[i].point;
      locationsSearch[i].label = `destination${i + 1}`;
    }
    const {
      distance,
      waypoints,
      interconnections,
    } = await this.calculateOptimalroute(queryPick);

    const virtualDistance = start.isVirtual
      ? parseInt(
        interconnections.find(item => item.fromWaypoint === 'start').distance,
        10,
      )
      : 0;

    let locationsOrdered = start.isVirtual
      ? []
      : [{ point: start.originPoint, origin: start.origin, key: start.key }];
    for (const waypoint of waypoints) {
      const location = locationsSearch.find(item => item.label === waypoint.id);
      if (location) {
        delete location.label;
        locationsOrdered = [...locationsOrdered, location];
      }
    }

    if (end) {
      locationsOrdered = [
        ...locationsOrdered,
        { point: end.destinationPoint, origin: end.destination, key: end.key },
      ];
    }

    return {
      distance: parseInt(distance, 10) - virtualDistance,
      locationsOrdered,
    };
  }

  private async calculateOptimalroute(query): Promise<any> {
    try {
      const result = await Axios.get(
        'https://wse.api.here.com/2/findsequence.json',
        {
          params: {
            ...query,
            improveFor: 'time',
            mode: 'fastest;truck',
            ...this.configService.here,
          },
        },
      );
      return path(['data', 'results', '0'], result);
    } catch (err) {
      const error = path(['response', 'data', 'details'], err);
      throw new BadRequestException(error);
    }
  }

  public async calculateRouteTrip(
    orders: OrderEntity[],
  ): Promise<CalculateRoute> {
    const inverse = orders.length * 2 - 1;
    const query: any = {};
    let totalPrice = 0;

    for (let i = 0; i < orders.length; i++) {
      query[`waypoint${i}`] = `${orders[i].pickLocation.lat},${
        orders[i].pickLocation.lon
        }`;
      query[`waypoint${inverse - i}`] = `${orders[i].deliveryLocation.lat},${
        orders[i].deliveryLocation.lon
        }`;
      totalPrice = totalPrice + orders[i].salePrice;
    }

    const result = await this.calculateroute({
      ...query,
      improveFor: 'distance',
      mode: 'fastest;truck',
      routeattributes: 'sh,bb,gr',
    });
    const totalDistance: string = path(['0', 'summary', 'distance'], result);
    const route: string[] = path(['0', 'shape'], result);
    const distance = meterToMile(totalDistance);

    return {
      totalPrice,
      route,
      distance,
      pickLocationId: orders[0].pickLocationId,
      deliveryLocationId: orders[orders.length - 1].deliveryLocationId,
    };
  }
}
