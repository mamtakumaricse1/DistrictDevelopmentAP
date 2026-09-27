import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { PageHeader } from '../../components/PageHeader';
import { reportsApi } from '../../services/api/reports';
import { schemesApi } from '../../services/api/schemes';

const SHEETS = [
  { label: 'Sheet 1 — Department master', run: reportsApi.downloadDepartments, file: 'departments.csv' },
  { label: 'Sheet 2 — Scheme master', run: reportsApi.downloadSchemes, file: 'schemes.csv' },
  { label: 'Sheet 3 — KPI master', run: reportsApi.downloadKpis, file: 'kpis.csv' },
  { label: 'Sheet 4 — Progress', run: reportsApi.downloadProgress, file: 'progress.csv' },
  { label: 'Sheet 5 — Location', run: reportsApi.downloadLocations, file: 'locations.csv' },
  { label: 'Sheet 6 — Project', run: reportsApi.downloadProjects, file: 'projects.csv' },
  { label: 'Sheet 7 — Beneficiary', run: reportsApi.downloadBeneficiaries, file: 'beneficiaries.csv' },
  { label: 'Sheet 8 — Issues', run: reportsApi.downloadActions, file: 'actions.csv' },
] as const;

export function ReportsPage() {
  const { isDepartmentScoped, isCitizen, hasPermission } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description={
          isCitizen
            ? 'Download published district sheets. Import is not available on the public view.'
            : isDepartmentScoped
              ? 'Export and import only your department’s sheets. CSV rows for other departments are ignored.'
              : 'Eight master sheets from the DC brief, plus a standard department Excel/CSV template.'
        }
      />
      <Stack spacing={2} maxWidth={560}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Typography variant="body2" color="text.secondary">
          {isCitizen
            ? 'Open data for citizens. Figures match what departments have submitted.'
            : isDepartmentScoped
              ? 'Download the template, fill this month’s figures, then validate and import.'
              : 'Separate tables — not one huge spreadsheet. Departments submit the common template instead of free-form Excel.'}
        </Typography>
        {hasPermission('progress:submit') ? (
          <Alert severity="info">
            Use “Validate and import department CSV” to submit this month’s scheme progress.
          </Alert>
        ) : null}
        {SHEETS.map((sheet) => (
          <Button key={sheet.file} variant={sheet.file === 'projects.csv' ? 'contained' : 'outlined'} sx={{ alignSelf: 'flex-start' }} onClick={() => void run(sheet.run)}>
            {sheet.label}
          </Button>
        ))}
        {hasPermission('progress:submit') ? (
          <>
            <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => void run(reportsApi.downloadDepartmentTemplate)}>
              Download department data template
            </Button>
            {importMessage ? <Alert severity="info">{importMessage}</Alert> : null}
            <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
              Validate and import department CSV
              <input
                hidden
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void run(async () => {
                    const csv = await file.text();
                    if (csv.trim().length < 20) {
                      throw new Error('CSV is empty or too short.');
                    }
                    const check = await schemesApi.validateImport(csv);
                    if (!check.valid) {
                      throw new Error(check.issues.join(' '));
                    }
                    const result = await schemesApi.importProgress(csv);
                    setImportMessage(`Imported ${result.imported} rows from ${check.rows} validated lines.`);
                  });
                }}
              />
            </Button>
          </>
        ) : null}
      </Stack>
    </>
  );
}
