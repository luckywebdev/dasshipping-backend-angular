import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint } from 'class-validator';
import { createQueryBuilder } from 'typeorm';

@ValidatorConstraint({ async: true })
export class IsValidIdConstraint {

    validate(id: number, args: ValidationArguments) {
        const tableName = args.constraints[0];
        return createQueryBuilder(tableName)
            .where({ id })
            .getOne()
            .then(record => {
                return record ? true : false;
            });
    }
}

export function IsValidId(tableName: string, validationOptions?: ValidationOptions) {
    return (object, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [tableName],
            validator: IsValidIdConstraint,
        });
    };
}
