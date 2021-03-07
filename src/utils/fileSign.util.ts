import * as AWS from 'aws-sdk';

const s3 = new AWS.S3({
    region: 'sfo2',
    endpoint: 'https://sfo2.digitaloceanspaces.com',
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY_ID,
    secretAccessKey: process.env.DIGITAL_OCEAN_ACCESS_KEY_SECRET,
});

export function getS3() {
    return s3;
}

export function fileSign(key: string, expires: string = process.env.DIGITAL_OCEAN_ACCESS_TOKEN_EXPIRES_IN): string {
    if (key) {
        return s3.getSignedUrl('getObject', {
            Bucket: process.env.DIGITAL_OCEAN_BUCKET,
            Key: key,
            Expires: parseInt(expires, 10),
        });
    }
    return key;
}

export async function checkExistsFile(key: string) {
    return await s3.headObject({
        Bucket: process.env.DIGITAL_OCEAN_BUCKET,
        Key: key,
    }).promise();
}

export async function deleteFiles(files: any) {
    return new Promise((resolve, reject) => {
        s3.deleteObjects({
            Bucket: process.env.DIGITAL_OCEAN_BUCKET,
            Delete: {
                Objects: files,
            },
        }, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

export async function getFile(key: string) {
    return await s3.getObject({
        Bucket: process.env.DIGITAL_OCEAN_BUCKET,
        Key: key,
    }).promise();
}

export async function uploadBufferFile(buffer: Buffer, key: string, properties?: Partial<AWS.S3.PutObjectRequest>): Promise<any> {
    const params = {
        Body: buffer,
        Bucket: process.env.DIGITAL_OCEAN_BUCKET as string,
        Key: key,
        ...properties,
    };

    return s3
        .putObject(params)
        .promise();
}
