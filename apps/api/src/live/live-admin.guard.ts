import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LiveAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const key = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>().headers['x-demo-admin-key'];
    const expected = process.env.DEMO_ADMIN_KEY ?? (process.env.NODE_ENV === 'production' ? undefined : 'local-demo-admin-key');
    if (!expected || key !== expected) throw new UnauthorizedException('A valid demo administrator key is required.');
    return true;
  }
}
