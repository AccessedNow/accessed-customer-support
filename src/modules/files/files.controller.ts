import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  BadRequestException,
  Version,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { MulterFile } from 'src/common/interfaces/multer-file.interface';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'File uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file type or size' })
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.filesService.uploadFile(file);
  }

  @Post('uploads')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Files uploaded successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file type or size' })
  @UseInterceptors(FilesInterceptor('files', 10))
  @Version('1')
  async uploadMultipleFiles(@UploadedFiles() files: MulterFile[]) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    if (files.length > 10) throw new BadRequestException('Maximum 10 files allowed');

    return this.filesService.uploadMultipleFiles(files);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'File not found' })
  @Version('1')
  async deleteFile(@Param('fileId') fileId: string) {
    return this.filesService.deleteFile(fileId);
  }
}
