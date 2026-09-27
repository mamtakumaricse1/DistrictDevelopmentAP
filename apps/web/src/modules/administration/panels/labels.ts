import type { DepartmentRecord, DistrictRecord, LocationRecord } from '../../../services/api/admin';

export function districtName(districts: DistrictRecord[], id: string | null | undefined): string {
  if (!id) {
    return 'All districts';
  }
  return districts.find((district) => district.id === id)?.name ?? id;
}

export function departmentName(departments: DepartmentRecord[], id: string | null | undefined): string {
  if (!id) {
    return '—';
  }
  return departments.find((department) => department.id === id)?.name ?? id;
}

export function locationName(locations: LocationRecord[], id: string | null | undefined): string {
  if (!id) {
    return '—';
  }
  return locations.find((location) => location.id === id)?.name ?? id;
}
