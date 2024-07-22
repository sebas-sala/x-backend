import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

import configuration from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: seconds(60),
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,

    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerModule,
    },
  ],
})
export class AppModule {}
