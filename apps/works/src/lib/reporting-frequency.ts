import { ForbiddenException } from '@nestjs/common';
import { AuthzService, type AuthContext } from '@ddwmd/common';
import { KpiFrequency } from '../generated/prisma';

export function assertCanSetReportingFrequency(authz: AuthzService, auth: AuthContext): void {
  if (!authz.hasPermission(auth, 'frequency:manage')) {
    throw new ForbiddenException('Only the Deputy Commissioner or an administrator can set reporting frequency.');
  }
}

/** Returns the requested cadence, or undefined so the database default (monthly) applies. */
export function acceptedReportingFrequency(
  authz: AuthzService,
  auth: AuthContext,
  requested: KpiFrequency | undefined,
): KpiFrequency | undefined {
  if (requested === undefined) {
    return undefined;
  }
  assertCanSetReportingFrequency(authz, auth);
  return requested;
}
