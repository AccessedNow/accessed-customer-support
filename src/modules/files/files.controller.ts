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

@ApiTags('Files Management')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a single file',
    description: 'Upload a single file (image, document) to the system',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully',
    schema: {
      example: {
        data: {
          urls: {
            thumbnail:
              'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/38f327e4-0713-4658-8b03-d4bab32b963a/thumbnail/screenshot-2025-03-23-at-9.webp',
            small:
              'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/38f327e4-0713-4658-8b03-d4bab32b963a/small/screenshot-2025-03-23-at-9.webp',
            medium:
              'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/38f327e4-0713-4658-8b03-d4bab32b963a/medium/screenshot-2025-03-23-at-9.webp',
            large:
              'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/38f327e4-0713-4658-8b03-d4bab32b963a/large/screenshot-2025-03-23-at-9.webp',
            original:
              'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/38f327e4-0713-4658-8b03-d4bab32b963a/original/screenshot-2025-03-23-at-9.png',
          },
          type: 'image',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file type or size',
    schema: {
      example: {
        data: {
          code: 400,
          message: 'Invalid file format. Allowed formats: jpg, jpeg, png, pdf, doc, docx',
        },
        code: 400,
        message: 'Success',
      },
    },
  })
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.filesService.uploadFile(file);
  }

  @Post('uploads')
  @ApiOperation({
    summary: 'Upload multiple files',
    description:
      'Upload multiple files (images, documents) to the system. Maximum 10 files allowed.',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Files uploaded successfully',
    schema: {
      example: {
        data: [
          {
            urls: {
              thumbnail:
                'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/thumbnail/screenshot-2025-03-23-at-9.webp',
              small:
                'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/small/screenshot-2025-03-23-at-9.webp',
              medium:
                'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/medium/screenshot-2025-03-23-at-9.webp',
              large:
                'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/large/screenshot-2025-03-23-at-9.webp',
              original:
                'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/original/screenshot-2025-03-23-at-9.png',
            },
            type: 'image',
          },
        ],
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file type or size',
    schema: {
      example: {
        data: {
          code: 400,
          message: 'Invalid file format or maximum files limit exceeded',
        },
        code: 400,
        message: 'Success',
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @Version('1')
  async uploadMultipleFiles(@UploadedFiles() files: MulterFile[]) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    if (files.length > 10) throw new BadRequestException('Maximum 10 files allowed');

    return this.filesService.uploadMultipleFiles(files);
  }

  @Delete(':fileId')
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Permanently delete a file from the system and storage',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
    schema: {
      example: {
        data: true,
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'File not found',
    schema: {
      example: {
        data: {
          code: 400,
          message: 'File not found',
        },
        code: 400,
        message: 'Success',
      },
    },
  })
  @Version('1')
  async deleteFile(@Param('fileId') fileId: string) {
    return this.filesService.deleteFile(fileId);
  }
}
