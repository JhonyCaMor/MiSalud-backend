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
 * Lectura de control ambiental (Res. 1403/2005): temperatura y humedad
 * por sucursal, con indicador de si el valor quedó dentro de rango.
 */
@Entity('ambient_readings')
export class AmbientReading {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  branchId: number;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'varchar', length: 20, default: 'ambiente' })
  zone: string;

  @Column({
    type: 'numeric',
    precision: 4,
    scale: 1,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  temperature: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => Number(v) },
  })
  humidity: number;

  @Column({ type: 'bool', default: true })
  inRange: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  recordedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User | null;

  @Index()
  @CreateDateColumn()
  recordedAt: Date;
}
