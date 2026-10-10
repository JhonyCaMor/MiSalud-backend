import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectronicInvoice } from './entities/electronic-invoice.entity';
import { Sale } from '../sales/entities/sale.entity';
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import { ElectronicInvoicingController } from './electronic-invoicing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ElectronicInvoice, Sale])],
  controllers: [ElectronicInvoicingController],
  providers: [ElectronicInvoicingService],
  exports: [ElectronicInvoicingService],
})
export class ElectronicInvoicingModule {}
