import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SanitaryRecord } from './entities/sanitary-record.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { InvimaSanitaryService } from './invima-sanitary.service';
import { InvimaSanitaryController } from './invima-sanitary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SanitaryRecord, Medicine])],
  controllers: [InvimaSanitaryController],
  providers: [InvimaSanitaryService],
  exports: [InvimaSanitaryService],
})
export class InvimaSanitaryModule {}
