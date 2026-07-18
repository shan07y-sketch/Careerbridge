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
  /** Absolute filesystem path (or provider-specific readable stream source) for a stored file, used for downloads/previews. */
  getAbsolutePath(storagePath: string): string;
  fileExists(storagePath: string): boolean;
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

  getAbsolutePath(storagePath: string): string {
    return path.join(this.uploadDir, storagePath);
  }

  fileExists(storagePath: string): boolean {
    return fs.existsSync(this.getAbsolutePath(storagePath));
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

  static getAbsolutePath(storagePath: string): string {
    return this.provider.getAbsolutePath(storagePath);
  }

  static fileExists(storagePath: string): boolean {
    return this.provider.fileExists(storagePath);
  }

  /** Storage path is the part of fileUrl after '/uploads/' -- centralizing this parsing here removes the last places that reached into StorageService's internal URL convention directly. */
  static extractStoragePath(fileUrl: string): string | null {
    const marker = '/uploads/';
    const idx = fileUrl.indexOf(marker);
    return idx === -1 ? null : fileUrl.slice(idx + marker.length);
  }
}
