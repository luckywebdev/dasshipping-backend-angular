import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {
    }

    private static checkStaticRoles({ user }, roles: number[]): boolean {
        return roles.includes(user.roleId);
    }

    private static checkDynamicRoles({ user }, roles: string[]): boolean {
        return true;
    }

    canActivate(context: ExecutionContext) {
        const staticRoles = this.reflector.get<number[]>('roles', context.getHandler());
        const dynamic = this.reflector.get<string[]>('dynamicRoles', context.getHandler());

        let allowedByStatic = !staticRoles;
        let allowedByDynamic = !dynamic;

        if (allowedByStatic && allowedByDynamic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        if (!request.user) {
            return false;
        }

        if (!allowedByDynamic) {
            allowedByDynamic = RolesGuard.checkDynamicRoles(request, dynamic);
        }

        if (!allowedByStatic) {
            allowedByStatic = RolesGuard.checkStaticRoles(request, staticRoles);
        }
        return allowedByStatic && allowedByDynamic;
    }
}
