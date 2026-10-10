import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CitiesModule } from './modules/cities/cities.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { MedicinesModule } from './modules/medicines/medicines.module';
import { BatchesModule } from './modules/batches/batches.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { TemperaturaHumidityModule } from './modules/temperatura-humidity/temperatura-humidity.module';
import { PrescripcionesModule } from './modules/prescripciones/prescripciones.module';
import { InvimaSanitaryModule } from './modules/invima-sanitary/invima-sanitary.module';
import { PharmacovigilanceModule } from './modules/pharmacovigilance/pharmacovigilance.module';
import { ElectronicInvoicingModule } from './modules/electronic-invoicing/electronic-invoicing.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        url:  config.get<string>('DATABASE_URL'), // O configService.get('database.url') según tu archivo configuration
        ssl: {
          rejectUnauthorized: false, // Requerido para Neon.tech
        },
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: false, // solo desarrollo: usa migraciones en producción
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    AuthModule,
    UsersModule,
    BranchesModule,
    CitiesModule,
    SuppliersModule,
    MedicinesModule,
    BatchesModule,
    InventoryModule,
    SalesModule,
    AuditModule,
    TemperaturaHumidityModule,
    PrescripcionesModule,
    InvimaSanitaryModule,
    PharmacovigilanceModule,
    ElectronicInvoicingModule,
    TransfersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
