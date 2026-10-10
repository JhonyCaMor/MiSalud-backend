import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

const SENSITIVE_FIELDS = [
  'password',
  'newPassword',
  'currentPassword',
  'token',
];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(entry: {
    method: string;
    path: string;
    entityType: string;
    entityId?: number | null;
    status: number;
    userId?: number | null;
    userEmail?: string | null;
    userRole?: string | null;
    branchId?: number | null;
    ipAddress?: string | null;
    requestBody?: unknown;
    error?: string | null;
  }): Promise<void> {
    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          method: entry.method,
          path: entry.path.slice(0, 200),
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          status: entry.status,
          userId: entry.userId ?? null,
          userEmail: entry.userEmail ?? null,
          userRole: entry.userRole ?? null,
          branchId: entry.branchId ?? null,
          ipAddress: entry.ipAddress ?? null,
          requestBody: this.sanitize(entry.requestBody),
          error: entry.error ? entry.error.slice(0, 1000) : null,
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo registrar auditoría: ${(error as Error).message}`,
      );
    }
  }

  async findAll(filters: {
    entityType?: string;
    method?: string;
    userId?: number;
    status?: number;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC');

    if (filters.entityType) qb.andWhere('a.entityType = :entityType', filters);
    if (filters.method) qb.andWhere('a.method = :method', filters);
    if (filters.userId) qb.andWhere('a.userId = :userId', filters);
    if (filters.status) qb.andWhere('a.status = :status', filters);
    if (filters.from)
      qb.andWhere('a.createdAt >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('a.createdAt <= :to', { to: filters.to });

    const total = await qb.getCount();
    const limit = Math.min(filters.limit ?? 50, 200);
    qb.skip(filters.offset ?? 0).take(limit);

    return { data: await qb.getMany(), total };
  }

  private sanitize(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') return null;
    const clone = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
    for (const field of SENSITIVE_FIELDS) {
      if (field in clone) clone[field] = '***REDACTADO***';
    }
    const json = JSON.stringify(clone);
    if (json.length > 5000) {
      return { truncated: true, preview: json.slice(0, 5000) };
    }
    return clone;
  }
}
