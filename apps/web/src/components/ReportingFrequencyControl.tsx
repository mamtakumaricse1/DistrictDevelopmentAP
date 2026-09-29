import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { REPORTING_FREQUENCIES, frequencyLabel, type ReportingFrequency } from '../lib/frequency';

type ReportingFrequencyControlProps = {
  value: string | null | undefined;
  canEdit: boolean;
  pending?: boolean;
  onChange: (frequency: ReportingFrequency) => void;
};

export function ReportingFrequencyControl({ value, canEdit, pending = false, onChange }: ReportingFrequencyControlProps) {
  const current = (REPORTING_FREQUENCIES as readonly string[]).includes(value ?? '')
    ? (value as ReportingFrequency)
    : 'MONTHLY';

  if (!canEdit) {
    return <Typography variant="body2">Reporting frequency: {frequencyLabel(current)}</Typography>;
  }

  return (
    <FormControl size="small" sx={{ minWidth: 220 }} disabled={pending}>
      <InputLabel id="reporting-frequency">Reporting frequency</InputLabel>
      <Select
        labelId="reporting-frequency"
        label="Reporting frequency"
        value={current}
        onChange={(event) => onChange(event.target.value as ReportingFrequency)}
      >
        {REPORTING_FREQUENCIES.map((frequency) => (
          <MenuItem key={frequency} value={frequency}>
            {frequencyLabel(frequency)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
