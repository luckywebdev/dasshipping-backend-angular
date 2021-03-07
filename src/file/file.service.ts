import { BadRequestException, Injectable } from '@nestjs/common';
import Axios from 'axios';
import * as CryptoJS from 'crypto-js';
import * as zipFolder from 'zip-folder';

import { ConfigService } from '../config/config.service';
import { SuccessDTO } from '../dto/success.dto';
import { deleteFiles, fileSign } from '../utils/fileSign.util';
import { FileDeleteRequest } from './dto/delete/request.dto';
import { FileDTO } from './dto/upload/file.dto';
import { FileUploadResponse } from './dto/upload/response.dto';

@Injectable()
export class FileService {

    constructor(
        private readonly configService: ConfigService,
    ) { }

    uploadFile(file: FileDTO): FileUploadResponse {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        this.cacheThumbnail([file.key]);
        return {
            url: file.key,
            signedUrl: fileSign(file.key),
            originalName: file.originalname,
        };
    }

    uploadFiles(files: FileDTO[]): FileUploadResponse[] {
        if (!files.length) {
            throw new BadRequestException('File is required');
        }
        const images = files.map(item => ({
            url: item.key,
            signedUrl: fileSign(item.key),
            originalName: item.originalname,
        }));
        const thumbnails = files.map(item => item.key);
        this.cacheThumbnail(thumbnails);
        return images;
    }

    public static async createZip(folderName: string): Promise<void> {
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

    public async deleteFiles(data: FileDeleteRequest): Promise<SuccessDTO> {
        try {
            const keys = data.files.map(item => ({ Key: item }));
            await deleteFiles(keys);
        } catch (e) {
            throw new BadRequestException(e);
        }
        return { success: true };
    }

    private cacheThumbnail(files: string[]): void {
        const secretKey = this.configService.secretKeyThumbnail;
        const sizes = ['50', '200', '400'];
        files.forEach(async (file) => {
            const extension = file.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png'].includes(extension)) {
                try {
                    const urls = [];
                    for (const size of sizes) {
                        const sign = CryptoJS.HmacSHA1(`h=${size}&op=thumbnail&path=${file}&w=${size}`, secretKey).toString(CryptoJS.enc.Hex);
                        const url = `${this.configService.imageUrl}/display?path=${file}&w=${size}&h=${size}&op=thumbnail&sig=${sign}`;
                        urls.push(Axios.get(url));
                    }
                    await Promise.all(urls);
                } catch (e) {
                    //
                }
            }
        });
    }
}
