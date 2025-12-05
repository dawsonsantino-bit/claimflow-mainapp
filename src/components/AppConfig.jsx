export const APP_ENV = "DEV"; // Change to "PROD" for production

export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  PDF_MAX_SIZE: 20 * 1024 * 1024,   // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
  ALLOWED_PDF_TYPES: ['application/pdf']
};

export const isDev = () => APP_ENV === "DEV";