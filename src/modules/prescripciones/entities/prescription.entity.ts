import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Fórmula médica y control de retención (Res. 1403/2005):
 * quién la extendió, en qué sucursal y si quedó retenida.
 */
@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  prescriptionNumber: string;

  @Column({ type: 'varchar', length: 120 })
  doctorName: string;

  @Column({ type: 'varchar', length: 30 })
  doctorLicense: string;

  @Column({ type: 'varchar', length: 120 })
  patientName: string;

  @Column({ type: 'varchar', length: 20 })
  patientDocument: string;

  @Index()
  @Column()
  branchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column()
  sellerId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'activa' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  retainedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  retainedReason: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
