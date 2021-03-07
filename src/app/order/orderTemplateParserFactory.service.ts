import {BadRequestException} from '@nestjs/common';
import {OrderParserInterface} from './templateParsers/orderParser.interface';
import {RPMTemplateParser} from './templateParsers/rpmTemplate.parser';
import {DispatchSheetTemplateParser} from './templateParsers/DispatchSheetTemplate.parser';
import {MetrogisticsBOLTemplate} from './templateParsers/metrogisticsBOLTemplate.parser';
import {DispatchContractTemplateParser} from './templateParsers/dispatchContractTemplateParser';

export class OrderTemplateParserFactory {

    public static getTemplateParser(text: string): OrderParserInterface {
        let templateParser = null;
        switch (true) {
            case this.checkTemplateType(text, 'Dispatch Sheet'):
                templateParser = new DispatchSheetTemplateParser(text);
                break;
            case this.checkTemplateType(text, 'RPM'):
                templateParser = new RPMTemplateParser(text);
                break;
            case this.checkTemplateType(text, 'Metrogistics'):
                templateParser = new MetrogisticsBOLTemplate(text);
                break;
            case this.checkTemplateType(text, 'Dispatch Contract'):
                templateParser = new DispatchContractTemplateParser(text);
                break;
            default: throw new BadRequestException('No parser found for imported order');
        }

        return templateParser;
    }

    private static checkTemplateType(text: string, templateSubstring: string): boolean {
        return text.includes(templateSubstring);
    }
}
