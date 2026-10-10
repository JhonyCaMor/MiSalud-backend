import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Medicine } from '../../medicines/entities/medicine.entity';

/** Traslado de stock entre sucursales (pendiente → en tránsito → recibido). */
@Entity('stock_transfers')
export class StockTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  fromBranchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromBranchId' })
  fromBranch: Branch;

  @Index()
  @Column()
  toBranchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toBranchId' })
  toBranch: Branch;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  status: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  notes: string | null;

  @Column()
  createdById: number;

  @Column({ type: 'int', nullable: true })
  receivedById: number | null;

  @OneToMany(() => TransferItem, (item) => item.transfer, { cascade: true })
  items: TransferItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('transfer_items')
@Index('UQ_transfer_items', ['transferId', 'medicineId'], { unique: true })
export class TransferItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  transferId: number;

  @ManyToOne(() => StockTransfer, (transfer) => transfer.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transferId' })
  transfer: StockTransfer;

  @Column()
  medicineId: number;

  @ManyToOne(() => Medicine, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine;

  @Column({ type: 'int' })
  quantity: number;
}
