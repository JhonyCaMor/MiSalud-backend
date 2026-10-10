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
import { Branch } from '../../branches/entities/branch.entity';

/**
 * Tabla pivote: stock disponible de cada medicamento en cada sucursal.
 * Se actualiza al ingresar lotes (+) y al registrar ventas (-).
 */
@Entity('inventory_items')
@Index('UQ_inventory_medicine_branch', ['medicineId', 'branchId'], {
  unique: true,
})
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  medicineId: number;

  @ManyToOne(() => Medicine, (medicine) => medicine.inventory, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  @Index()
  @Column()
  branchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'int', default: 0 })
  quantityAvailable: number;

  @Column({ type: 'timestamp', nullable: true })
  lastMovementAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
