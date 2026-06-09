import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service.js';
import { EducationController } from './education/education.controller.js';
import { EducationService } from './education/education.service.js';

/** Root module for lessons, progress, XP, badges, and certificates. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [EducationController],
  providers: [DatabaseService, EducationService],
})
export class AppModule {}
