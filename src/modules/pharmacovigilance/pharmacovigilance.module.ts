import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdverseEventReport } from './entities/adverse-event-report.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { Sale } from '../sales/entities/sale.entity';
import { PharmacovigilanceService } from './pharmacovigilance.service';
import { PharmacovigilanceController } from './pharmacovigilance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdverseEventReport, Branch, Medicine, Sale]),
  ],
  controllers: [PharmacovigilanceController],
  providers: [PharmacovigilanceService],
  exports: [PharmacovigilanceService],
})
export class PharmacovigilanceModule {}
