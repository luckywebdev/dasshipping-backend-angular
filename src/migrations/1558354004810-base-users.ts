import { MigrationInterface, QueryRunner } from 'typeorm';

// pwd: Fudokan!2019
// tslint:disable:max-line-length
const account = `
        INSERT INTO public.account (address, approved, "avatarUrl", blocked, city, "companyId", "dispatcherId", deleted, "dlNumber", email, "emailConfirmed", "firstName", "genderId", "lastName", password, "receiveNotifications", "roleId", state, zip, "phoneNumber", birthday,"signatureUrl","companyName","termsOfServiceAccepted") VALUES ('address', true, '1555354285860.JPG', false, 'city s', null, null, false, null, 'admin@yotashipping.com', true, 'Dufas', null, 'Logistics', '87ed70f4b680393fdd37a00c7692a9ad6722824a', false, 1, 'state', 'zip', null, null, null, null,true);
        INSERT INTO public.account (address, approved, "avatarUrl", blocked, city, "companyId", "dispatcherId", deleted, "dlNumber", email, "emailConfirmed", "firstName", "genderId", "lastName", password, "receiveNotifications", "roleId", state, zip, "phoneNumber", birthday,"signatureUrl","companyName","termsOfServiceAccepted") VALUES ('dfadf', true, null, false, null, null, null, false, null, 'client@yotashipping.com', true, 'Client', null, 'Mihai', '87ed70f4b680393fdd37a00c7692a9ad6722824a', false, 6, null, null, null, null, null, null,true);
        INSERT INTO public.account (address, approved, "avatarUrl", blocked, city, "companyId", "dispatcherId", deleted, "dlNumber", email, "emailConfirmed", "firstName", "genderId", "lastName", password, "receiveNotifications", "roleId", state, zip, "phoneNumber", birthday,"signatureUrl","companyName","termsOfServiceAccepted") VALUES (null, true, null, false, null, 1, null, false, null, 'carrier@yotashipping.com', true, 'Mihai', null, 'Dascal', '87ed70f4b680393fdd37a00c7692a9ad6722824a', false, 2, null, null, null, null, null, null,true);
        INSERT INTO public.account (address, approved, "avatarUrl", blocked, city, "companyId", "dispatcherId", deleted, "dlNumber", email, "emailConfirmed", "firstName", "genderId", "lastName", password, "receiveNotifications", "roleId", state, zip, "phoneNumber", birthday,"signatureUrl","companyName","termsOfServiceAccepted") VALUES ('Mircea Cel Batrin 16/2', true, null, false, 'Chisinau', 1, null, false, null, 'dispatcher@yotashipping.com', true, 'Dispatcher', 1,'Dascal', '87ed70f4b680393fdd37a00c7692a9ad6722824a', false, 4, 'Chisinau', '2000', 'Mircea Cel Batrin 16/2', '2016-02-04', null, null,true);
        INSERT INTO public.account (address, approved, "avatarUrl", blocked, city, "companyId", "dispatcherId", deleted, "dlNumber", email, "emailConfirmed", "firstName", "genderId", "lastName", password, "receiveNotifications", "roleId", state, zip, "phoneNumber", birthday,"signatureUrl","companyName","termsOfServiceAccepted") VALUES ('sdfcasdf', true, '1558299057827.jpg', false, 'Chisinau', 1, 4, false, '2222', 'driver@yotashipping.com', true, 'Driver', 1,'Mihai', '87ed70f4b680393fdd37a00c7692a9ad6722824a', false, 3, 'Moldova', 'MD2000', null, null, null, null,true);
`;

const company = `
        INSERT INTO public.company (address, "avatarUrl", blocked, city, "contactPersonFirstName", "contactPersonLastName", "contactPersonPhone", "dotNumber", email, "insuranceUrl", "mcCertificateUrl", "msNumber", name, "officePhone", state, zip, "createdAt", "updatedAt", status) VALUES ('Mircea Cel Batrin 18/2', null, false, 'Chisinau', 'Mihai', 'Dascal', '068160961', '1111', 'carrier@yotashipping.com', 'https://zoolu.sfo2.digitaloceanspaces.com/1558289192482.jpg?AWSAccessKeyId=N7URGJ7F4YYYONQVDYIU&Expires=1558292795&Signature=fePxxACFK0su3AIopauWHuVEBJg%3D', 'https://zoolu.sfo2.digitaloceanspaces.com/1558289189177.jpg?AWSAccessKeyId=N7URGJ7F4YYYONQVDYIU&Expires=1558292792&Signature=IZonaBrZzB871%2Fe8AT4MFIyn60Y%3D', '1111', 'DASsoft+', '068160961', 'Alabama', 'MD-2044', '2019-05-19 18:06:00.698655', '2019-05-19 18:06:00.698655', 'active');
`;

const migrationMap = {
    company,
    account,
};

export class baseUsers1558354004810 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        for (const key in migrationMap) {
            if (migrationMap.hasOwnProperty(key)) {
                await queryRunner.query(migrationMap[key]);
            }
        }

    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const promises = [];
        for (const key in migrationMap) {
            if (migrationMap.hasOwnProperty(key)) {
                promises.push(queryRunner.clearTable(key));
            }
        }
        return Promise.all(promises);
    }
}
