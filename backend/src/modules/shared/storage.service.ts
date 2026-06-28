import fs from 'fs';
import path from 'path';

export interface FileUploadPayload {
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File): Promise<FileUploadPayload>;
  deleteFile(storagePath: string): Promise<void>;
}

export class LocalDiskStorageProvider implements IStorageProvider {
  private uploadDir = path.join(__dirname, '../../../uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<FileUploadPayload> {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    const targetPath = path.join(this.uploadDir, uniqueName);
    
    fs.writeFileSync(targetPath, file.buffer);

    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: uniqueName
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    const targetPath = path.join(this.uploadDir, storagePath);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
}

export class StorageService {
  private static provider: IStorageProvider = new LocalDiskStorageProvider();

  static setProvider(newProvider: IStorageProvider) {
    this.provider = newProvider;
  }

  static async saveFile(file: Express.Multer.File): Promise<FileUploadPayload> {
    return this.provider.saveFile(file);
  }

  static async deleteFile(storagePath: string): Promise<void> {
    return this.provider.deleteFile(storagePath);
  }
}
