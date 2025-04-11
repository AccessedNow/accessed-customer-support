import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import * as sharp from 'sharp';
import { FILE_SIZE_LIMITS } from 'src/common/enums/file-type.enum';
import { FILE_TYPE_MIME_MAP, FileType } from 'src/common/enums/file-type.enum';
import { IMAGE_SIZE_CONFIG } from 'src/common/enums/image-size.enum';
import { ImageSize } from 'src/common/enums/image-size.enum';
import { MulterFile } from 'src/common/interfaces/multer-file.interface';
import { ProcessedImage } from 'src/common/interfaces/process-image.interface';
import { FilesRepositoryInterface } from 'src/core/repositories/interfaces/files.interface';
import { FileDto } from '../tickets/dto/create-ticket.dto';

@Injectable()
export class FilesService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(FilesService.name);
  private readonly s3Prefix: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('FilesRepositoryInterface')
    protected readonly filesRepository: FilesRepositoryInterface,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.s3Prefix = this.configService.get('AWS_S3_PREFIX', 'customer-support');
  }

  private getFileType(mimeType: string): FileType {
    for (const [type, mimeTypes] of Object.entries(FILE_TYPE_MIME_MAP)) {
      if (mimeTypes.includes(mimeType)) {
        return type as FileType;
      }
    }
    return FileType.OTHER;
  }

  private validateFile(file: MulterFile) {
    const fileType = this.getFileType(file.mimetype);
    const maxSize = FILE_SIZE_LIMITS[fileType];

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size too large. Maximum size for ${fileType} is ${maxSize / (1024 * 1024)}MB`,
      );
    }

    if (fileType === FileType.IMAGE) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid image type. Only JPEG/JPG, PNG and WebP are allowed',
        );
      }
    }
  }

  private generateS3Key(file: MulterFile, size: ImageSize = ImageSize.ORIGINAL): string {
    const now = new Date();
    const year = format(now, 'yyyy');
    const month = format(now, 'MM');
    const day = format(now, 'dd');
    const uuid = uuidv4();
    const filename = file.originalname
      .split('.')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    const sizePrefix = size ? `${size}/` : '';

    return `${this.s3Prefix}/${year}/${month}/${day}/${uuid}/${sizePrefix}${filename}`;
  }

  private async processImage(file: MulterFile, size: ImageSize): Promise<ProcessedImage> {
    const config = IMAGE_SIZE_CONFIG[size];
    let sharpInstance = sharp(file.buffer);
    let outputFormat = config.format;

    if (size === ImageSize.ORIGINAL) {
      if (file.mimetype === 'image/png') {
        outputFormat = 'png';
      }
    } else {
      sharpInstance = sharpInstance.resize(config.width, config.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format and quality
    switch (outputFormat) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: config.quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: config.quality });
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality: config.quality });
        break;
    }

    const buffer = await sharpInstance.toBuffer();

    return {
      buffer,
      format: outputFormat,
    };
  }

  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    const region = this.configService.get('AWS_REGION');
    const bucket = this.configService.get('AWS_S3_BUCKET');
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async uploadFile(file: MulterFile): Promise<{
    urls: Record<ImageSize, string>;
    type: string;
  }> {
    try {
      this.validateFile(file);
      const fileType = this.getFileType(file.mimetype);

      // Only process images
      if (fileType === FileType.IMAGE) {
        const urls: Record<ImageSize, string> = {} as Record<ImageSize, string>;
        const now = new Date();
        const year = format(now, 'yyyy');
        const month = format(now, 'MM');
        const day = format(now, 'dd');
        const uuid = uuidv4();
        const filename = file.originalname
          .split('.')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .substring(0, 50);

        // Process and upload each size in parallel
        const processingPromises = Object.values(ImageSize).map(async (size) => {
          const processed = await this.processImage(file, size);
          const sizePrefix = size ? `${size}/` : '';
          const key = `${this.s3Prefix}/${year}/${month}/${day}/${uuid}/${sizePrefix}${filename}.${processed.format}`;
          const url = await this.uploadToS3(key, processed.buffer, `image/${processed.format}`);
          return { size, url };
        });

        // Wait for all processing to complete
        const results = await Promise.all(processingPromises);

        // Map results to urls object
        results.forEach((result) => {
          urls[result.size] = result.url;
        });

        return {
          urls,
          type: fileType,
        };
      }

      // For non-image files, just upload the original
      const key = this.generateS3Key(file);
      const url = await this.uploadToS3(key, file.buffer, file.mimetype);

      return {
        urls: {
          [ImageSize.ORIGINAL]: url,
        } as Record<ImageSize, string>,
        type: fileType,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  async uploadMultipleFiles(files: MulterFile[]): Promise<
    Array<{
      urls: Record<ImageSize, string>;
      type: string;
    }>
  > {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error(`Error uploading multiple files: ${error.message}`);
      throw error;
    }
  }

  async create({ file, ticketId, noteId }: { file: FileDto; ticketId: string; noteId?: string }) {
    const { url, type } = file;
    if (!url.includes('amazonaws.com/')) {
      this.logger.error(`Invalid file URL format: ${url}`);
      throw new BadRequestException('Invalid file URL format. Only AWS S3 URLs are supported.');
    }

    try {
      const urlPath = url.split('amazonaws.com/')[1] || '';
      if (!urlPath) {
        throw new BadRequestException('Invalid S3 URL format');
      }

      const pathParts = urlPath.split('/');
      if (pathParts.length < 5) {
        throw new BadRequestException('Invalid S3 URL structure');
      }

      const filename = pathParts[pathParts.length - 1] || '';
      const size = pathParts[pathParts.length - 2] || 'original';
      const fileId = pathParts[pathParts.length - 3] || '';
      const year = pathParts[1] || '';
      const month = pathParts[2] || '';
      const day = pathParts[3] || '';
      if (!year || !month || !day || !fileId || !filename) {
        throw new BadRequestException('Missing required components in S3 URL');
      }

      const uploadDate = `${year}-${month}-${day}`;
      const fileExtension = filename.split('.').pop() || '';
      const fileType = type || this.determineFileTypeFromExtension(fileExtension);

      return this.filesRepository.create({
        fileId,
        path: url,
        fileType,
        filename,
        size,
        uploadDate,
        ticket: ticketId,
        note: noteId,
      });
    } catch (error) {
      this.logger.error(`Error parsing file URL: ${error.message}`);
      throw new BadRequestException(`Invalid file URL: ${error.message}`);
    }
  }

  private determineFileTypeFromExtension(extension: string): string {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac'];

    if (imageExtensions.includes(extension)) return FileType.IMAGE;
    if (documentExtensions.includes(extension)) return FileType.DOCUMENT;
    if (videoExtensions.includes(extension)) return FileType.VIDEO;
    if (audioExtensions.includes(extension)) return FileType.AUDIO;

    return FileType.OTHER;
  }

  async deleteFile(fileId: string) {
    const file = await this.filesRepository.findOneByCondition({ fileId });
    if (!file) {
      throw new BadRequestException('File not found');
    }
    return this.filesRepository.permanentlyDelete(file._id.toString());
  }
}
