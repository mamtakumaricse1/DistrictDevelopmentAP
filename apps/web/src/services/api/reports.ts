import { apiDownload } from './client';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const reportsApi = {
  downloadDepartments: async () => {
    saveBlob(await apiDownload('/reports/departments.csv'), 'departments.csv');
  },
  downloadSchemes: async () => {
    saveBlob(await apiDownload('/reports/schemes.csv'), 'schemes.csv');
  },
  downloadKpis: async () => {
    saveBlob(await apiDownload('/reports/kpis.csv'), 'kpis.csv');
  },
  downloadProgress: async () => {
    saveBlob(await apiDownload('/reports/progress.csv'), 'progress.csv');
  },
  downloadLocations: async () => {
    saveBlob(await apiDownload('/reports/locations.csv'), 'locations.csv');
  },
  downloadProjects: async () => {
    saveBlob(await apiDownload('/reports/projects.csv'), 'projects.csv');
  },
  downloadBeneficiaries: async () => {
    saveBlob(await apiDownload('/reports/beneficiaries.csv'), 'beneficiaries.csv');
  },
  downloadActions: async () => {
    saveBlob(await apiDownload('/reports/actions.csv'), 'actions.csv');
  },
  downloadDepartmentTemplate: async () => {
    saveBlob(await apiDownload('/imports/templates/department.csv'), 'department-progress.csv');
  },
};
