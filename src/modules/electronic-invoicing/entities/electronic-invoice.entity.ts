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
import { Sale } from '../../sales/entities/sale.entity';

/**
 * Factura electrónica (DIAN) asociada 1:1 a una venta.
 * El CUFE es un hash SHA-256 único generado en el alta.
 */
@Entity('electronic_invoices')
export class ElectronicInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  saleId: number;

  @ManyToOne(() => Sale, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  invoiceNumber: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  cufe: string;

  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  total: number;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'borrador' })
  status: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  dianResponse: string | null;

  @CreateDateColumn()
  issuedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
