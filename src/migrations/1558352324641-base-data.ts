import { MigrationInterface, QueryRunner } from 'typeorm';

const language =
    `INSERT INTO public.language (id, iso2, name) VALUES (1, 'EN', 'English');
         INSERT INTO public.language (id, iso2, name) VALUES (2, 'FR', 'Français');
`;

const role =
    `INSERT INTO public.role (id, name) VALUES (2, 'Company Admin');
        INSERT INTO public.role (id, name) VALUES (1, 'Super Admin');
        INSERT INTO public.role (id, name) VALUES (3, 'Driver');
        INSERT INTO public.role (id, name) VALUES (4, 'Dispatcher');
        INSERT INTO public.role (id, name) VALUES (5, 'Accountant');
        INSERT INTO public.role (id, name) VALUES (6, 'Client');
        INSERT INTO public.role (id, name) VALUES (7, 'Agent');`;

const inviteStatus = `
        INSERT INTO public."inviteStatus" (id, name) VALUES (1, 'Pending');
        INSERT INTO public."inviteStatus" (id, name) VALUES (2, 'Accepted');
        INSERT INTO public."inviteStatus" (id, name) VALUES (3, 'Declined');
        INSERT INTO public."inviteStatus" (id, name) VALUES (4, 'Expired');
`;

const gender = `
        INSERT INTO public.gender (id, name) VALUES (1, 'Male');
        INSERT INTO public.gender (id, name) VALUES (2, 'Female');
        INSERT INTO public.gender (id, name) VALUES (3, 'Other');
`;

// tslint:disable:max-line-length
const general = `
        INSERT INTO public.general (id, "minimumProfitPercentage", "recommendedProfitPercentage", "inopAdditionalPricePercentage", "enclosedAdditionalPricePercentage", "minimalSalePrice","serviceAbsoluteFee","creditCardPaymentFee","achPaymentFee","liftedPercentage","headRackPercentage","utilityBedPercentage","handicapPercentage") VALUES (1, 2.2, 10.1, 10, 10, 100,100,4,1,10,10,10,10);
`;

const policy = `
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Coupe', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Incomplete - Cutaway', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Liftback', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Minivan', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Motorcycle - Cruiser', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Motorcycle - Scooter', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (2, 'Motorcycle - Sport', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Motorcycle - Street', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Pickup', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Sedan', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Truck', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Truck - Tractor', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Van', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Wagon', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Hatchback', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1.25, 'Bus', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1.25, 'Chassis', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (1, 'Convertible', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (0.5, 'Crossover', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (0.5, 'Incomplete', false);
        INSERT INTO public.policy (price, type, "isNew") VALUES (0.85, 'SUV', false);
`;

const migrationMap = {
    role,
    language,
    inviteStatus,
    gender, general,
    policy,
};

export class baseData1558352324641 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        for (const key in migrationMap) {
            if (migrationMap.hasOwnProperty(key)) {
                await queryRunner.query(migrationMap[key]);
            }
        }

    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        for (const key in migrationMap) {
            if (migrationMap.hasOwnProperty(key)) {
                await queryRunner.clearTable(key);
            }
        }
    }

}
