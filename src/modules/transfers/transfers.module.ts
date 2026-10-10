import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransfer, TransferItem } from './entities/transfer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockTransfer, TransferItem, Branch, Medicine]),
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
