import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseServiceUrls } from '@ddwmd/common';

@Injectable()
export class GatewayService {
  private readonly counters = new Map<string, number>();

  constructor(private readonly config: ConfigService) {}

  identityUrls(): string[] {
    return this.urls('IDENTITY_URL', 'http://127.0.0.1:3001');
  }

  organizationUrls(): string[] {
    return this.urls('ORGANIZATION_URL', 'http://127.0.0.1:3002');
  }

  worksUrls(): string[] {
    return this.urls('WORKS_URL', 'http://127.0.0.1:3003');
  }

  governanceUrls(): string[] {
    return this.urls('GOVERNANCE_URL', 'http://127.0.0.1:3004');
  }

  notifyUrls(): string[] {
    return this.urls('NOTIFY_URL', 'http://127.0.0.1:3005');
  }

  identityUrl(): string {
    return this.next('identity', this.identityUrls());
  }

  organizationUrl(): string {
    return this.next('organization', this.organizationUrls());
  }

  worksUrl(): string {
    return this.next('works', this.worksUrls());
  }

  governanceUrl(): string {
    return this.next('governance', this.governanceUrls());
  }

  notifyUrl(): string {
    return this.next('notify', this.notifyUrls());
  }

  targetsFor(path: string): string[] {
    const normalized = path.replace(/^\/api\/v1\/?/, '');
    if (
      normalized.startsWith('auth') ||
      normalized.startsWith('users') ||
      normalized.startsWith('roles') ||
      normalized.startsWith('permissions')
    ) {
      return this.identityUrls();
    }
    if (normalized.startsWith('notifications')) {
      return this.notifyUrls();
    }
    if (
      normalized.startsWith('meetings') ||
      normalized.startsWith('actions') ||
      normalized.startsWith('reports/actions') ||
      normalized.startsWith('governance')
    ) {
      return this.governanceUrls();
    }
    if (normalized.startsWith('reports/departments') || normalized.startsWith('reports/locations')) {
      return this.organizationUrls();
    }
    if (
      normalized.startsWith('projects') ||
      normalized.startsWith('schemes') ||
      normalized.startsWith('imports') ||
      normalized.startsWith('documents') ||
      normalized.startsWith('dashboard') ||
      normalized.startsWith('reports')
    ) {
      return this.worksUrls();
    }
    return this.organizationUrls();
  }

  targetFor(path: string): string {
    const key = this.routeKey(path);
    return this.next(key, this.targetsFor(path));
  }

  private urls(envKey: string, fallback: string): string[] {
    return parseServiceUrls(this.config.get<string>(envKey), fallback);
  }

  private next(key: string, urls: string[]): string {
    const n = this.counters.get(key) ?? 0;
    this.counters.set(key, n + 1);
    return urls[n % urls.length];
  }

  private routeKey(path: string): string {
    const normalized = path.replace(/^\/api\/v1\/?/, '');
    if (normalized.startsWith('auth') || normalized.startsWith('users') || normalized.startsWith('roles') || normalized.startsWith('permissions')) {
      return 'identity';
    }
    if (normalized.startsWith('notifications')) {
      return 'notify';
    }
    if (
      normalized.startsWith('meetings') ||
      normalized.startsWith('actions') ||
      normalized.startsWith('reports/actions') ||
      normalized.startsWith('governance')
    ) {
      return 'governance';
    }
    if (normalized.startsWith('reports/departments') || normalized.startsWith('reports/locations')) {
      return 'organization';
    }
    if (
      normalized.startsWith('projects') ||
      normalized.startsWith('schemes') ||
      normalized.startsWith('imports') ||
      normalized.startsWith('documents') ||
      normalized.startsWith('dashboard') ||
      normalized.startsWith('reports')
    ) {
      return 'works';
    }
    return 'organization';
  }
}
