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
import { Medicine } from '../../medicines/entities/medicine.entity';
import { Sale } from '../../sales/entities/sale.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Reporte de farmacovigilancia: evento adverso asociado a un medicamento
 * (y opcionalmente a la venta), con severidad y estado de gestión.
 */
@Entity('pharmacovigilance_reports')
export class AdverseEventReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  medicineId: number;

  @ManyToOne(() => Medicine, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  @Column({ type: 'int', nullable: true })
  saleId: number | null;

  @ManyToOne(() => Sale, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale | null;

  @Column({ type: 'varchar', length: 120 })
  patientName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 10, default: 'leve' })
  severity: string;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'recibido' })
  status: string;

  @Index()
  @Column()
  branchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'int', nullable: true })
  reportedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reportedById' })
  reportedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
