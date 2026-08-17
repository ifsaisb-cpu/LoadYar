import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { TripsModule } from './modules/trips/trips.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { AuditModule } from './modules/audit/audit.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'loadyar',
      password: process.env.DB_PASSWORD || 'loadyar',
      database: process.env.DB_NAME || 'loadyar_db',
      entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
      migrationsRun: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.DB_LOGGING === 'true',
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    BookingsModule,
    TripsModule,
    InvoicesModule,
    AuditModule,
    CustomersModule,
    CarriersModule,
    DriversModule,
    VendorsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
