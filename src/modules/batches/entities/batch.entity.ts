import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Medicine } from '../../medicines/entities/medicine.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

@Entity('batches')
// El código de lote es único POR SUCURSAL: el mismo código
// puede existir en otra sucursal, pero nunca repetirse en la misma.
@Index('UQ_batches_code_branch', ['code', 'branchId'], { unique: true })
export class Batch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'date' })
  expirationDate: string;

  @Column({ type: 'int' })
  quantityInitial: number;

  @Column({ type: 'int' })
  quantityRemaining: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  unitCost: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  notes: string | null;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @Index()
  @Column()
  medicineId: number;

  @ManyToOne(() => Medicine, (medicine) => medicine.batches, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  @Index()
  @Column()
  supplierId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.batches, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Index()
  @Column()
  branchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column({ type: 'int', nullable: true })
  registeredById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registeredById' })
  registeredBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
