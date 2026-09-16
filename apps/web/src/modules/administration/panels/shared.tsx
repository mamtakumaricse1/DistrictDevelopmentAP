import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { ReactNode } from 'react';
import { ApiError } from '../../../services/api/client';

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }
  const message = error instanceof Error ? error.message : 'The request failed.';
  const details =
    error instanceof ApiError
      ? error.details.filter((item): item is string => typeof item === 'string')
      : [];
  return (
    <Alert severity="error">
      {message}
      {details.length ? ` ${details.join(' ')}` : ''}
    </Alert>
  );
}

type FormDialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
};

export function FormDialog({ title, open, onClose, onSubmit, children, submitLabel = 'Save' }: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>{children}</DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
