import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Interceptor global de auditoría (trazabilidad INVIMA):
 * registra toda operación de escritura con quién, qué, cuándo y desde dónde.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url?: string;
      ip?: string;
      socket?: { remoteAddress?: string };
      user?: {
        id?: number;
        email?: string;
        role?: string;
        branchId?: number | null;
      };
      body?: unknown;
      params?: Record<string, string>;
    }>();

    if (!MUTATING_METHODS.includes(request.method)) {
      return next.handle();
    }

    const path = (request.originalUrl ?? request.url ?? '').split('?')[0];
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      tap(() => this.log(request, path, response.statusCode ?? 200)),
      catchError((error: unknown) => {
        const err = error as {
          status?: number;
          getStatus?: () => number;
          message?: string;
        };
        const status = err.getStatus ? err.getStatus() : (err.status ?? 500);
        this.log(request, path, status, err.message ?? 'Error desconocido');
        return throwError(() => error);
      }),
    );
  }

  private log(
    request: {
      method: string;
      ip?: string;
      socket?: { remoteAddress?: string };
      user?: {
        id?: number;
        email?: string;
        role?: string;
        branchId?: number | null;
      };
      body?: unknown;
      params?: Record<string, string>;
    },
    path: string,
    status: number,
    error?: string,
  ): void {
    void this.auditService.log({
      method: request.method,
      path,
      entityType: this.entityType(path),
      entityId: this.entityId(request, path),
      status,
      userId: request.user?.id ?? null,
      userEmail: request.user?.email ?? null,
      userRole: request.user?.role ?? null,
      branchId: request.user?.branchId ?? null,
      ipAddress: request.ip ?? request.socket?.remoteAddress ?? null,
      requestBody: request.body,
      error,
    });
  }

  private entityType(path: string): string {
    const segments = path.replace(/^\/api\//, '').split('/');
    return segments[0] || 'unknown';
  }

  private entityId(
    request: { params?: Record<string, string> },
    path: string,
  ): number | null {
    const fromParams = request.params?.['id'] ?? request.params?.['orderId'];
    if (fromParams && !Number.isNaN(Number(fromParams)))
      return Number(fromParams);
    const segments = path.split('/');
    const last = segments[segments.length - 1];
    return last && !Number.isNaN(Number(last)) ? Number(last) : null;
  }
}
