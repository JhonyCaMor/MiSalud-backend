import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Medicine } from '../../medicines/entities/medicine.entity';
import { Batch } from '../../batches/entities/batch.entity';

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  medicineId: number;

  @ManyToOne(() => Medicine, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  // Trazabilidad INVIMA: cada unidad vendida queda ligada a su lote
  @Index()
  @Column()
  batchId: number;

  @ManyToOne(() => Batch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  unitPrice: number;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;
}
