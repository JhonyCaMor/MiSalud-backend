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
import { Role } from '../../../common/enums/role.enum';
import { City } from '../../cities/entities/city.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  // Obligatorio para SUPERVISOR: alcance = todas las sucursales de esta ciudad
  @Index()
  @Column({ type: 'int', nullable: true })
  cityId: number | null;

  @ManyToOne(() => City, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cityId' })
  city: City | null;

  // Obligatorio para VENDEDOR: alcance = solo esta sucursal
  @Index()
  @Column({ type: 'int', nullable: true })
  branchId: number | null;

  @ManyToOne(() => Branch, (branch) => branch.vendedores, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
