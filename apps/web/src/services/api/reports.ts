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
  downloadProjects: async () => {
    saveBlob(await apiDownload('/reports/projects.csv'), 'projects.csv');
  },
  downloadActions: async () => {
    saveBlob(await apiDownload('/reports/actions.csv'), 'actions.csv');
  },
};
