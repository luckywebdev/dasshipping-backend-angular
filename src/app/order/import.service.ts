import {BadRequestException, Injectable} from '@nestjs/common';
import {FileDTO} from '../../file/dto/upload/file.dto';
import * as pdfParse from 'pdf-parse';
import {OrderTemplateParserFactory} from './orderTemplateParserFactory.service';
import {OrderParserInterface} from './templateParsers/orderParser.interface';

@Injectable()
export class ImportOrderService {
    constructor() {}

    public async import(file: FileDTO): Promise<OrderParserInterface> {
        let parsedPdf = null;
        try {
            parsedPdf = await pdfParse(file.buffer);
        } catch (e) {
            throw new BadRequestException(`Failed to parse the pdf ${e || e.message}`);
        }

        return OrderTemplateParserFactory.getTemplateParser(parsedPdf.text);
    }
}
