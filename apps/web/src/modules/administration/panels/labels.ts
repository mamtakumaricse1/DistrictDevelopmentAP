import type { DistrictRecord } from '../../../services/api/admin';

export function districtName(districts: DistrictRecord[], id: string | null | undefined): string {
  if (!id) {
    return 'All districts';
  }
  return districts.find((district) => district.id === id)?.name ?? id;
}
