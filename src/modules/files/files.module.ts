import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSchema, File } from './schemas/file.schema';
import { FilesRepository } from 'src/core/repositories/files.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]), ConfigModule],
  controllers: [FilesController],
  providers: [FilesService, { provide: 'FilesRepositoryInterface', useClass: FilesRepository }],
  exports: [FilesService],
})
export class FilesModule {}
