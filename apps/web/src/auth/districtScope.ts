export function choosesDistrict(
  profile: { isSuperAdmin: boolean; districtIds: string[] } | null | undefined,
): boolean {
  return Boolean(profile?.isSuperAdmin || (profile?.districtIds.length ?? 0) > 1);
}
