import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { userFacingMessage } from '../../../lib/errors';

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }
  const { summary, details } = userFacingMessage(error);
  return (
    <Alert severity="error">
      {summary}
      {details.length ? ` ${details.join(' ')}` : ''}
    </Alert>
  );
}

export function fieldState<T extends FieldValues>(form: UseFormReturn<T>, name: Path<T>) {
  const message = form.getFieldState(name, form.formState).error?.message;
  const text = typeof message === 'string' ? message : undefined;
  return {
    ...form.register(name),
    error: Boolean(text),
    ...(text ? { helperText: text } : {}),
  };
}

export function selectError<T extends FieldValues>(form: UseFormReturn<T>, name: Path<T>): string | undefined {
  const message = form.getFieldState(name, form.formState).error?.message;
  return typeof message === 'string' ? message : undefined;
}

type FormDialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
  error?: unknown;
};

export function FormDialog({ title, open, onClose, onSubmit, children, submitLabel = 'Save', error }: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <ErrorAlert error={error} />
          {children}
        </DialogContent>
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
