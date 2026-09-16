import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class LocalStorageService {
  constructor(private readonly config: ConfigService) {}

  maxBytes(): number {
    return Number(this.config.get('UPLOAD_MAX_BYTES') ?? 10 * 1024 * 1024);
  }

  root(): string {
    return this.config.get<string>('STORAGE_ROOT') ?? './storage';
  }

  assertFile(file: { mimetype: string; size: number; originalname: string }) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only PDF and JPEG/PNG/WebP images are allowed.');
    }
    if (file.size > this.maxBytes()) {
      throw new BadRequestException('The file is larger than the configured upload limit.');
    }
  }

  async save(input: {
    districtId: string;
    projectId: string;
    originalName: string;
    buffer: Buffer;
  }): Promise<{ storageKey: string }> {
    const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
    const storageKey = path.posix.join(input.districtId, input.projectId, `${randomUUID()}-${safeName}`);
    const fullPath = this.absolute(storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.buffer);
    return { storageKey };
  }

  absolute(storageKey: string): string {
    const resolved = path.resolve(this.root(), storageKey);
    const root = path.resolve(this.root());
    if (!resolved.startsWith(root)) {
      throw new BadRequestException('Invalid storage key.');
    }
    return resolved;
  }

  open(storageKey: string) {
    return createReadStream(this.absolute(storageKey));
  }
}
