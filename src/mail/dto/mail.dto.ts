import { IsEmail, IsString } from 'class-validator';

export class MailMessage {
    @IsEmail() from: string;

    @IsString()
    html?: string;

    @IsString()
    subject: string;

    @IsString()
    text?: string;

    @IsEmail()
    to: string;

    attachment?: any[];
}
