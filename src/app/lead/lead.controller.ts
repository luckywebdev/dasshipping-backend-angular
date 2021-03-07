import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Patch,
  Param,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { SuccessDTO } from '../../dto/success.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AccountEntity } from '../../entities/account.entity';
import { Account } from '../account/account.decorator';
import { Roles } from '../auth/guards/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guart';
import { ROLES } from '../../constants/roles.constant';
import { GetLeadsRequest } from './dto/list/request.dto';
import { GetLeadsListResponse } from './dto/list/response.dto';
import { LeadService } from './lead.service';
import { QuoteDTO } from '../../dto/quote.dto';
import { EditLeadRequest } from './dto/dit/request.dto';

@ApiUseTags('leads')
@Controller('/leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post('/import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'upload',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiOperation({ title: 'Upload single file' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  uploadFile(@Account() account: AccountEntity, @UploadedFile() file) {
    return this.leadService.importCsv(account, file);
  }

  @Get('/new-leads')
  @ApiOperation({ title: 'Get all new leads' })
  @ApiResponse({ status: HttpStatus.OK, type: GetLeadsListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async getNewLeads(@Query() query: GetLeadsRequest) {
    return this.leadService.getNewLeads(query);
  }

  @Get('/quoted')
  @ApiOperation({ title: 'Get all quoted leads' })
  @ApiResponse({ status: HttpStatus.OK, type: GetLeadsListResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async getQuptedLeads(@Query() query: GetLeadsRequest) {
    return this.leadService.getQuptedLeads(query);
  }

  @Patch('/:id')
  @ApiOperation({ title: 'Edit leed' })
  @ApiResponse({ status: HttpStatus.OK, type: QuoteDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async updateLead(@Param('id') id: number, @Body() data: EditLeadRequest) {
    return this.leadService.updateLead(id, data);
  }

  @Delete('/')
  @ApiOperation({ title: 'Delete Leads' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async deleteLeads(@Body('ids') ids: number[]) {
    return await this.leadService.delete(ids);
  }

  @Post('/send-email')
  @ApiOperation({ title: 'Send emails' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(ROLES.SUPER_ADMIN)
  async sendEmail(@Body('ids') ids: number[]) {
    return await this.leadService.checkSendEmails(ids);
  }
}
