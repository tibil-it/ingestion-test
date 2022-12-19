import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngestionModule } from './ingestion/ingestion.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import {TypeOrmModule} from '@nestjs/typeorm';
import {TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseModule } from './database/database.module';
@Module({

  controllers: [AppController],
  providers: [AppService],
  imports: [IngestionModule,
    ConfigModule.forRoot({ isGlobal: true }), 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [],
        synchronize: true,
      }),
      inject: [ConfigService],
    }), DatabaseModule,
  ],
})
export class AppModule {}
