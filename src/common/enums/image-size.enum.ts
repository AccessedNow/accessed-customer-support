export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ORIGINAL = 'original',
}

export interface ImageSizeConfig {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'webp' | 'png';
}

export const IMAGE_SIZE_CONFIG: Record<ImageSize, ImageSizeConfig> = {
  [ImageSize.THUMBNAIL]: {
    width: 150,
    height: 150,
    quality: 75,
    format: 'webp',
  },
  [ImageSize.SMALL]: {
    width: 320,
    height: 320,
    quality: 80,
    format: 'webp',
  },
  [ImageSize.MEDIUM]: {
    width: 640,
    height: 640,
    quality: 85,
    format: 'webp',
  },
  [ImageSize.LARGE]: {
    width: 1024,
    height: 1024,
    quality: 90,
    format: 'webp',
  },
  [ImageSize.ORIGINAL]: {
    width: null,
    height: null,
    quality: 100,
    format: 'jpeg',
  },
};
