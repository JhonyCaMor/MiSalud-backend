import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Batch } from '../../batches/entities/batch.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  activeIngredient: string;

  @Column({ type: 'varchar', length: 60 })
  concentration: string;

  @Column({ type: 'varchar', length: 80 })
  presentation: string;

  @Column({ type: 'varchar', length: 60, default: 'General' })
  category: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  invimaNumber: string;

  @Column({ type: 'bool', default: false })
  requiresPrescription: boolean;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @OneToMany(() => Batch, (batch) => batch.medicine)
  batches: Batch[];

  @OneToMany(() => InventoryItem, (item) => item.medicine)
  inventory: InventoryItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
