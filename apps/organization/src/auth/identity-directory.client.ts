import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { internalPut } from '@ddwmd/common';

@Injectable()
export class IdentityDirectoryClient {
  private readonly logger = new Logger(IdentityDirectoryClient.name);

  constructor(private readonly config: ConfigService) {}

  async syncIssuer(input: {
    districtId: string;
    districtCode: string;
    realm?: string | null;
    issuer?: string | null;
    isActive?: boolean;
  }): Promise<void> {
    if (!input.issuer || !input.realm) {
      return;
    }
    const identityUrl = this.config.get<string>('IDENTITY_URL') ?? 'http://127.0.0.1:3001';
    const internalKey = this.config.get<string>('INTERNAL_API_KEY') ?? 'dev-internal-key';
    try {
      await internalPut(identityUrl, '/api/v1/internal/issuers', internalKey, {
        districtId: input.districtId,
        districtCode: input.districtCode,
        realm: input.realm,
        issuer: input.issuer,
        isActive: input.isActive ?? true,
      });
    } catch (error) {
      this.logger.warn(
        `Could not sync issuer for district ${input.districtCode}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
