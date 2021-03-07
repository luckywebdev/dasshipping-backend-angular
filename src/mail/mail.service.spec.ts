import { Test, TestingModule } from '@nestjs/testing';

import { MailService } from './mail.service';
import {ConfigService} from '../config/config.service';

const ConfigServiceMock = jest.fn().mockImplementation(() => {
  return {
    email: {apiKey: 'apiKey', domain: 'domain'},
    apiKey: jest.fn(),
  };
});

describe('MailService', () => {
  let mailService: MailService;
  let configServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
          MailService,
        {
          provide: ConfigService,
          useValue: new ConfigServiceMock(),
        },
      ],
    }).compile();

    mailService = module.get(MailService);
    configServiceMock = module.get(ConfigService);
  });

  it('should be defined', () => {
    configServiceMock.email = {apiKey: 'apiKey', domain: 'domain'};
    expect(mailService).toBeDefined();
  });
});
