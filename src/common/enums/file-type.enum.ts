export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

export const FILE_TYPE_MIME_MAP: Record<FileType, string[]> = {
  [FileType.IMAGE]: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  [FileType.DOCUMENT]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  [FileType.VIDEO]: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'],
  [FileType.AUDIO]: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  [FileType.OTHER]: [],
};

export const FILE_SIZE_LIMITS: Record<FileType, number> = {
  [FileType.IMAGE]: 5 * 1024 * 1024, // 5MB
  [FileType.DOCUMENT]: 10 * 1024 * 1024, // 10MB
  [FileType.VIDEO]: 100 * 1024 * 1024, // 100MB
  [FileType.AUDIO]: 20 * 1024 * 1024, // 20MB
  [FileType.OTHER]: 5 * 1024 * 1024, // 5MB
};
