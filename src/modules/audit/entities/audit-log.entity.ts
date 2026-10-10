import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Auditoría de trazabilidad (marco INVIMA - Resolución 2013 de 2021,
 * buenas prácticas de distribución y trazabilidad de medicamentos).
 * Registra QUIÉN hizo QUÉ, CUÁNDO y DÓNDE sobre operaciones críticas.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  path: string;

  @Index()
  @Column({ type: 'varchar', length: 60 })
  entityType: string;

  @Column({ type: 'int', nullable: true })
  entityId: number | null;

  @Column({ type: 'int' })
  status: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  userEmail: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  userRole: string | null;

  @Column({ type: 'int', nullable: true })
  branchId: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requestBody: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
