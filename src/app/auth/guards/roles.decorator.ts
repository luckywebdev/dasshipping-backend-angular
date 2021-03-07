import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: number[]) => SetMetadata('roles', roles);

export const DynamicRoles = (...roles: string[]) => SetMetadata('dynamicRoles', roles);
