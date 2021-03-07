import { Body, Controller, HttpStatus, Post, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { Roles } from '../app/auth/guards/roles.decorator';
import { RolesGuard } from '../app/auth/guards/roles.guart';
import { BadRequestDTO } from '../app/dto/badRequest.dto';
import { ROLES } from '../constants/roles.constant';
import { SuccessDTO } from '../dto/success.dto';
import { FileDeleteRequest } from './dto/delete/request.dto';
import { FileDTO } from './dto/upload/file.dto';
import { FileUploadResponse } from './dto/upload/response.dto';
import { FileService } from './file.service';

@ApiUseTags('file')
@Controller('file')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @Post('/upload')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    }))
    @ApiOperation({ title: 'Upload single file' })
    @ApiResponse({ status: HttpStatus.OK, type: FileUploadResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    uploadFile(@UploadedFile() file: FileDTO) {
        return this.fileService.uploadFile(file);
    }

    @Post('/uploads')
    @UseInterceptors(FilesInterceptor('files', 10, {
        limits: {
            fileSize: 100 * 1024 * 1024,
        },
    }))
    @ApiOperation({ title: 'Upload multiple files' })
    @ApiResponse({ status: HttpStatus.OK, isArray: true, type: FileUploadResponse })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    uploadFileS(@UploadedFiles() files: FileDTO[]) {
        return this.fileService.uploadFiles(files);
    }

    @Post('/delete')
    @ApiOperation({ title: 'Delete files' })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
    @UseGuards(AuthGuard(), RolesGuard)
    @Roles(ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.CLIENT, ROLES.DRIVER)
    deleteFiles(@Body() files: FileDeleteRequest) {
        return this.fileService.deleteFiles(files);
    }
}
