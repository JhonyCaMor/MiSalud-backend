import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbientReading } from './entities/ambient-reading.entity';
import { Branch } from '../branches/entities/branch.entity';
import { TemperaturaHumidityService } from './temperatura-humidity.service';
import { TemperaturaHumidityController } from './temperatura-humidity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AmbientReading, Branch])],
  controllers: [TemperaturaHumidityController],
  providers: [TemperaturaHumidityService],
  exports: [TemperaturaHumidityService],
})
export class TemperaturaHumidityModule {}
