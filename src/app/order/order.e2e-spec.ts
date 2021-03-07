import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as supertest from 'supertest';
import { AuthService } from '../auth/auth.service';
import { FixturesModule } from '../../fixtures/fixtures.module';
import { FixturesService } from '../../fixtures/fixtures.service';
import { AppModule } from '../app.module';
import { users } from '../../testutils/users';
import { OrderRepository } from '../../repositories/order.repository';
import { ORDER_STATUS } from '../../entities/orderBase.entity';

describe('Order', () => {
    let app: INestApplication;
    let testingModule: TestingModule;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                FixturesModule,
            ],
        }).compile();

        app = testingModule.createNestApplication();
        await app.init();
    });
    beforeEach(async () => {
        const fixtureService = testingModule.get(FixturesService);
        await fixtureService.reloadFixtures();
        // import database instead of reloading fixtures
    });

    describe('Get Orders List ADMIN ROLE (GET /orders)', async () => {
        it('should throw unauthorized exception', async () => {
            const { body } = await supertest
                .agent(app.getHttpServer())
                .get('/orders')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(401);
            expect(body).toEqual({
                statusCode: 401,
                error: 'Unauthorized',
            });
        });
        it('should return order list (GET /orders)', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const { body } = await supertest
                .agent(app.getHttpServer())
                .get('/orders?limit=1&orderByField=order_id&orderByDirection=ASC')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(body.count).toEqual(4);
            expect(body.data[0].id).toEqual(1);
            expect(body.data[0].trailerType).toEqual('Open');
            expect(body.data[0].pickLocationId).not.toBeNull();
            expect(body.data[0].deliveryLocationId).not.toBeNull();
            expect(body.data[0].discount).toEqual(0);
            expect(body.data[0].status).toEqual('new');
            expect(body.data[0].initialPrice).toEqual(328.79658172778124);
            expect(body.data[0].priceWithDiscount).toEqual(328.79658172778124);
            expect(body.data[0].distance).toEqual(252.92044748290863);
            expect(body.data[0].salePrice).toEqual(195.58812697327534);
            expect(body.data[0].loadPrice).toEqual(228.79658172778124);
            expect(body.data[0].createdAt).not.toBeNull();
            expect(body.data[0].updatedAt).not.toBeNull();
            expect(body.data[0].uuid).toHaveLength(8);
            expect(body.data[0].senderId).not.toBeNull();
            expect(body.data[0].createdById).not.toBeNull();
            expect(body.data[0].receiverId).not.toBeNull();
            expect(body.data[0].companyId).toBeNull();
            expect(body.data[0].isVirtual).toBeFalsy();
            expect(body.data[0].driverId).toBeNull();
            expect(body.data[0].dispatcherId).toBeNull();
            expect(body.data[0].published).toEqual(true);
            expect(body.data[0].pickInstructions).toBeNull();
            expect(body.data[0].deliveryInstructions).toBeNull();
            expect(body.data[0].bolUrl).toBeNull();
            expect(body.data[0].invoiceUrl).toBeNull();
            expect(body.data[0].receiptUrl).toBeNull();
            expect(body.data[0].invoiceDueDate).toBeNull();
            expect(body.data[0].invoicePaidDate).toBeNull();
            expect(body.data[0].quoteId).toBeNull();
            expect(body.data[0].source).toEqual('internal');
            expect(body.data[0].pickDate).toBeNull();
            expect(body.data[0].deliveryDate).toBeNull();
            expect(body.data[0].exactDistance).toEqual(267.11684275947795);
            expect(body.data[0].shipperId).toBeNull();
            expect(body.data[0].brokerFee).toBeNull();
            expect(body.data[0].paymentNote).toBeNull();
            expect(body.data[0].paymentMethods).toEqual('ACH');
            expect(body.data[0].dispatchInstructions).toBeNull();
            expect(body.data[0].clientPaymentStatus).toEqual('none');
            expect(body.data[0].preStatus).toBeNull();
            expect(body.data[0].company).toBeNull();

            expect(body.data[0].pickLocation.id).not.toBeNull();
            expect(body.data[0].pickLocation.state).toEqual('Alabama');
            expect(body.data[0].pickLocation.city).toEqual('Butler');
            expect(body.data[0].pickLocation.zipCode).toEqual('36904');
            expect(body.data[0].pickLocation.address).toEqual('350 Park Boulevard');
            expect(body.data[0].pickLocation.addressType).toEqual('123');
            expect(body.data[0].pickLocation.instructions).toBeNull();
            expect(body.data[0].pickLocation.lat).toEqual('32.1279455');
            expect(body.data[0].pickLocation.lon).toEqual('-88.3312513');
            expect(body.data[0].pickLocation.point).toEqual({
                type: 'Point',
                coordinates: [
                    32.1279455,
                    -88.3312513,
                ],
            });
            expect(body.data[0].pickLocation.createdAt).not.toBeNull();
            expect(body.data[0].pickLocation.updatedAt).not.toBeNull();

            expect(body.data[0].deliveryLocation.id).not.toBeNull();
            expect(body.data[0].deliveryLocation.state).toEqual('Alabama');
            expect(body.data[0].deliveryLocation.city).toEqual('Huntsville');
            expect(body.data[0].deliveryLocation.zipCode).toEqual('35801');
            expect(body.data[0].deliveryLocation.address).toEqual('100 Park Boulevard');
            expect(body.data[0].deliveryLocation.addressType).toEqual('123');
            expect(body.data[0].deliveryLocation.instructions).toBeNull();
            expect(body.data[0].deliveryLocation.lat).toEqual('34.74679');
            expect(body.data[0].deliveryLocation.lon).toEqual('-86.68826');
            expect(body.data[0].deliveryLocation.point).toEqual({
                type: 'Point',
                coordinates: [
                    34.74679,
                    -86.68826,
                ],
            });
            expect(body.data[0].deliveryLocation.createdAt).not.toBeNull();
            expect(body.data[0].deliveryLocation.updatedAt).not.toBeNull();

            expect(body.data[0].createdBy.id).not.toBeNull();

            expect(body.data[0].sender.id).not.toBeNull();
            expect(body.data[0].sender.phoneNumber).toEqual('0123456789');
            expect(body.data[0].sender.email).toEqual('email@test.com');
            expect(body.data[0].sender.firstName).toEqual('test');
            expect(body.data[0].sender.lastName).toEqual('test');
            expect(body.data[0].sender.hash).toBeNull();
            expect(body.data[0].sender.createdAt).not.toBeNull();

            expect(body.data[0].sender.id).not.toEqual(body.data[0].receiver.id);
            expect(body.data[0].receiver.id).not.toBeNull();
            expect(body.data[0].receiver.phoneNumber).toEqual('0123456789');
            expect(body.data[0].receiver.email).toEqual('email@test.com');
            expect(body.data[0].receiver.firstName).toEqual('test');
            expect(body.data[0].receiver.lastName).toEqual('test');
            expect(body.data[0].receiver.hash).toBeNull();
            expect(body.data[0].receiver.createdAt).not.toBeNull();

            expect(body.data[0].dispatches).toEqual([]);
            expect(body.data[0].cars).toEqual([]);
            expect(body.data[0].notes).toEqual([]);
            expect(body.data[0].orderTrips).toEqual([]);
        });
        it('should return order list offset (GET /orders)', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .get('/orders?limit=1&orderByField=order_id&orderByDirection=ASC&offset=1')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);
            expect(body.count).toEqual(4);
            expect(body.data[0].id).toEqual(2);
        });
    });

    describe('Create Order', () => {
        it('should create order', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .post('/orders')
                .send({
                    isVirtual: false,
                    cars: [
                        {
                            height: '200',
                            length: '100',
                            make: '100',
                            model: '100',
                            type: 'Coupe',
                            weight: '100',
                            year: '100',
                            vin: '100',
                            inop: false,
                            lifted: false,
                            headRack: true,
                            utilityBed: true,
                            handicap: true,
                            pricePerMile: 500,
                            id: 4,
                        },
                    ],
                    deliveryLocation: {
                        address: '100 Park Boulevard',
                        state: 'Alabama',
                        zipCode: '35801',
                        city: 'Huntsville',
                        country: 'USA',
                        addressType: '123',
                    },
                    pickLocation: {
                        address: '350 Park Boulevard',
                        state: 'Alabama',
                        zipCode: '36904',
                        city: 'Butler',
                        country: 'USA',
                        addressType: '123',
                    },
                    initialPrice: 2000,
                    instructions: 'get my cars from here',
                    sender: {
                        firstName: 'test',
                        lastName: 'test',
                        email: 'email@test.com',
                        phoneNumber: '0123456789',
                    },
                    receiver: {
                        firstName: 'test',
                        lastName: 'test',
                        email: 'email@test.com',
                        phoneNumber: '0123456789',
                    },
                    trailerType: 'Open',
                    status: 'Published',
                    published: true,
                    distance: 0,
                    createdById: 1,
                    companyId: 1,
                    priceWithDiscount: 2000,
                    createdAt: '2019-05-17T21:29:28.783Z',
                    updatedAt: '2019-05-17T21:29:28.783Z',
                    discount: 7,
                    tripId: null,
                    driverId: null,
                })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(body.id).not.toBeNull();
            expect(body.trailerType).toEqual('Open');
            expect(body.pickLocationId).not.toBeNull();
            expect(body.deliveryLocationId).not.toBeNull();
            expect(body.discount).toEqual(7);
            expect(body.status).toEqual('Published');
            expect(body.initialPrice).toEqual(328.79658172778124);
            expect(body.priceWithDiscount).toEqual(305.78082100683656);
            expect(body.distance).toEqual(252.92044748290863);
            expect(body.salePrice).toEqual(195.58812697327534);
            expect(body.loadPrice).toEqual(205.78082100683656);
            expect(body.createdAt).not.toBeNull();
            expect(body.updatedAt).not.toBeNull();
            expect(body.uuid).toHaveLength(8);
            expect(body.senderId).not.toBeNull();
            expect(body.createdById).not.toBeNull();
            expect(body.receiverId).not.toBeNull();
            expect(body.companyId).toEqual(1);
            expect(body.isVirtual).toBeFalsy();
            expect(body.driverId).toBeNull();
            expect(body.dispatcherId).toBeNull();
            expect(body.published).toEqual(true);
            expect(body.pickInstructions).toBeNull();
            expect(body.deliveryInstructions).toBeNull();
            expect(body.bolUrl).toBeNull();
            expect(body.invoiceUrl).toBeNull();
            expect(body.receiptUrl).toBeNull();
            expect(body.invoiceDueDate).toBeNull();
            expect(body.invoicePaidDate).toBeNull();
            expect(body.quoteId).toBeNull();
            expect(body.source).toEqual('internal');
            expect(body.pickDate).toBeNull();
            expect(body.deliveryDate).toBeNull();
            expect(body.exactDistance).toEqual(267.11684275947795);
            expect(body.shipperId).toBeNull();
            expect(body.brokerFee).toBeNull();
            expect(body.paymentNote).toBeNull();
            expect(body.paymentMethods).toEqual('ACH');
            expect(body.dispatchInstructions).toBeNull();
            expect(body.clientPaymentStatus).toEqual('none');
            expect(body.preStatus).toBeNull();

            expect(body.pickLocation.id).not.toBeNull();
            expect(body.pickLocation.state).toEqual('Alabama');
            expect(body.pickLocation.city).toEqual('Butler');
            expect(body.pickLocation.zipCode).toEqual('36904');
            expect(body.pickLocation.address).toEqual('350 Park Boulevard');
            expect(body.pickLocation.addressType).toEqual('123');
            expect(body.pickLocation.instructions).toBeNull();
            expect(body.pickLocation.lat).toEqual(32.1279455);
            expect(body.pickLocation.lon).toEqual(-88.3312513);
            expect(body.pickLocation.point).toEqual({
                type: 'Point',
                coordinates: [
                    32.1279455,
                    -88.3312513,
                ],
            });
            expect(body.pickLocation.createdAt).not.toBeNull();
            expect(body.pickLocation.updatedAt).not.toBeNull();

            expect(body.deliveryLocation.id).not.toBeNull();
            expect(body.deliveryLocation.state).toEqual('Alabama');
            expect(body.deliveryLocation.city).toEqual('Huntsville');
            expect(body.deliveryLocation.zipCode).toEqual('35801');
            expect(body.deliveryLocation.address).toEqual('100 Park Boulevard');
            expect(body.deliveryLocation.addressType).toEqual('123');
            expect(body.deliveryLocation.instructions).toBeNull();
            expect(body.deliveryLocation.lat).toEqual(34.74679);
            expect(body.deliveryLocation.lon).toEqual(-86.68826);
            expect(body.deliveryLocation.point).toEqual({
                type: 'Point',
                coordinates: [
                    34.74679,
                    -86.68826,
                ],
            });
            expect(body.deliveryLocation.createdAt).not.toBeNull();
            expect(body.deliveryLocation.updatedAt).not.toBeNull();

            expect(body.isVirtual).toEqual(false);
            expect(body.cars.length).toEqual(1);
            expect(body.cars[0].height).toEqual('200');
            expect(body.cars[0].make).toEqual('100');
            expect(body.cars[0].model).toEqual('100');
            expect(body.cars[0].type).toEqual('Coupe');
            expect(body.cars[0].weight).toEqual('100');
            expect(body.cars[0].year).toEqual('100');
            expect(body.cars[0].vin).toEqual('100');
            expect(body.cars[0].inop).toEqual(false);
            expect(body.cars[0].lifted).toEqual(false);
            expect(body.cars[0].headRack).toEqual(true);
            expect(body.cars[0].utilityBed).toEqual(true);
            expect(body.cars[0].handicap).toEqual(true);
            expect(body.cars[0].pricePerMile).toEqual(1);
            expect(body.cars[0].id).not.toBeNull();
            expect(body.cars[0].orderId).not.toBeNull();
            expect(body.cars[0].quoteId).toBeNull();
            expect(body.cars[0].urlVin).toBeNull();
            expect(body.cars[0].imageUrl).toBeNull();
        });
    });

    describe('Cancel Order', () => {
        it('cancel published order, should return bad request', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .post('/orders/1/cancel')
                .send({
                })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(400);
        });
        it('cancel new order, should return cancel successfully', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .post('/orders/2/cancel')
                .send({
                })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(201);
        });
        it('cancel new order with trip', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .post('/orders/3/cancel')
                .send({
                })
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(201);
        });
        it('cancel new order, no order found', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .post('/orders/0/cancel')
                .send()
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(400);
        });
    });

    describe('Get published orders (ADMIN)', () => {
        it('get list', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .get('/orders/published')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(body.count).toEqual(1);
            expect(body.data[0].status).toEqual('published');
        });
    });

    describe('Get dispatched orders (ADMIN)', () => {
        it('get list', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .get('/orders/dispatched')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(body.count).toEqual(1);
            expect(body.data[0].status).toEqual('published');
        });
    });

    describe('Get order (ADMIN)', () => {
        it('get by id', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .get('/orders/1')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(body).toEqual({
                bolUrl: null,
                brokerFee: null,
                clientPaymentStatus: 'none',
                companyId: null,
                createdAt: '2019-12-24T17:43:43.812Z',
                createdById: 1,
                deliveryDate: null,
                deliveryInstructions: null,
                deliveryLocationId: 2,
                discount: 0,
                dispatchInstructions: null,
                dispatcherId: null,
                distance: 252.92044748290863,
                driverId: null,
                exactDistance: 267.11684275947795,
                id: 1,
                initialPrice: 328.79658172778124,
                invoiceDueDate: null,
                invoicePaidDate: null,
                invoiceUrl: null,
                isVirtual: false,
                loadPrice: 228.79658172778124,
                paymentMethods: 'ACH',
                paymentNote: null,
                pickDate: null,
                pickInstructions: null,
                pickLocationId: 1,
                preStatus: null,
                priceWithDiscount: 328.79658172778124,
                published: true,
                quoteId: null,
                receiptUrl: null,
                receiverId: 2,
                salePrice: 195.58812697327534,
                senderId: 1,
                shipperId: null,
                source: 'internal',
                status: 'new',
                trailerType: 'Open',
                updatedAt: '2019-12-24T17:43:43.812Z',
                uuid: 'JCnm7KaJ',
            });
        });

        it('get by id include relations', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});
            const {body} = await supertest
                .agent(app.getHttpServer())
                // tslint:disable-next-line:max-line-length
                .get('/orders/1?include=company,createdBy,pickLocation,deliveryLocation,sender,receiver,cars,dispatches,inspections,orderTrips,shipper')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(body.id).toEqual(1);
            expect(body).toHaveProperty('company');
            expect(body).toHaveProperty('createdBy');
            expect(body).toHaveProperty('pickLocation');
            expect(body).toHaveProperty('deliveryLocation');
            expect(body).toHaveProperty('sender');
            expect(body).toHaveProperty('receiver');
            expect(body).toHaveProperty('cars');
            expect(body).toHaveProperty('dispatches');
            expect(body).toHaveProperty('inspections');
            expect(body).toHaveProperty('orderTrips');
            expect(body).toHaveProperty('shipper');
        });

        it('get by id include non existent relations', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});
            const {body} = await supertest
                .agent(app.getHttpServer())
                .get('/orders/1?include=receiver,nonexistent')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(body.message).toEqual('Relation nonexistent is not allowed');
        });
    });

    describe('Delete order (ADMIN)', () => {
        it('delete by id', async () => {
            const authService: AuthService = testingModule.get(AuthService);
            const {accessToken} = await authService.login({email: users.admin.email, password: users.admin.password});

            const {body} = await supertest
                .agent(app.getHttpServer())
                .delete('/orders/1')
                .set('Accept', 'application/json')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(body).toEqual({ success: true });

            const order = await testingModule.get(OrderRepository).findOne(1);
            expect(order.status).toEqual(ORDER_STATUS.DELETED);
            expect(order.published).toEqual(false);
        });
    });

    afterAll(async () => {
        await app.close();
    });
});
