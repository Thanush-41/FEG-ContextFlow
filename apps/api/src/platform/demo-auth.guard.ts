import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class DemoAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const header = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>().headers.authorization;
    if (!header?.startsWith('Bearer ') || header.slice(7).length < 8) throw new UnauthorizedException('Demo authentication is required.');
    return true;
  }
}
