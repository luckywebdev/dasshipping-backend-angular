import {Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UnauthorizedException} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';

import { TemporaryLeadService } from './temporaryLead.service';
import { BadRequestDTO } from '../dto/badRequest.dto';
import { CreateLeadDTO } from './dto/requests/create.dto';
import { TemporaryLeadEntity } from '../../entities/temporaryLead.entity';
import {SuccessDTO} from '../../dto/success.dto';
import {LeadService} from '../lead/lead.service';
import {Response} from 'express';
import {AuthService} from '../auth/auth.service';

@ApiUseTags('leads')
@Controller('/leads')
export class TemporaryLeadController {
  constructor(
      private readonly temporaryLeadService: TemporaryLeadService,
      private readonly leadService: LeadService,
      private readonly authService: AuthService,
  ) {
  }

  @Post()
  @ApiOperation({ title: 'Create Temporary Lead' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  async create(@Body() data: CreateLeadDTO, @Req() request) {
    const tempLead: TemporaryLeadEntity =  await this.authService.recaptchaValidate(data.token)
        .then(() => {
          delete data.token;
          return this.temporaryLeadService.create(data, request.ip);
        });

    return this.temporaryLeadService.send(tempLead);
  }

  @Get('/download-app/:token')
  @ApiOperation({ title: 'Create lead and download app' })
  @ApiResponse({ status: HttpStatus.OK, type: SuccessDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: BadRequestDTO })
  async createLeadFromDownloadAppUrl(@Param('token') token: string, @Res() res: Response) {
    const verifiedToken: {tempLeadId: number, platform: string, type: number} = await this.temporaryLeadService.verifyToken(token);
    const tmpLead = await this.temporaryLeadService.getById(verifiedToken.tempLeadId);
    let lead;

    if (tmpLead.leadId) {
      lead = await this.leadService.getById(tmpLead.leadId);
    } else {
      lead = await this.leadService.createFromTemporaryLead(tmpLead);
      await this.temporaryLeadService.update({...tmpLead, leadId: lead.id});
    }

    return this.leadService.redirectToDownloadApp(verifiedToken.platform, lead, res);
  }
}
