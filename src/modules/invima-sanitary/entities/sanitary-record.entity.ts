import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Medicine } from '../../medicines/entities/medicine.entity';

/** Registro sanitario INVIMA (resolución, vigencia y vínculo con medicamento). */
@Entity('invima_sanitary_records')
export class SanitaryRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  invimaCode: string;

  @Column({ type: 'varchar', length: 40 })
  resolutionNumber: string;

  @Column({ type: 'varchar', length: 150 })
  description: string;

  @Column({ type: 'varchar', length: 40 })
  category: string;

  @Column({ type: 'date' })
  issuedAt: string;

  @Column({ type: 'date', nullable: true })
  expiresAt: string | null;

  @Column({ type: 'int', nullable: true })
  medicineId: number | null;

  @ManyToOne(() => Medicine, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'medicineId' })
  medicine: Medicine | null;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
