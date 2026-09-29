import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportingFrequencyControl } from './ReportingFrequencyControl';

describe('ReportingFrequencyControl', () => {
  it('shows the cadence as text when the user cannot change it', () => {
    render(<ReportingFrequencyControl value="QUARTERLY" canEdit={false} onChange={() => undefined} />);
    expect(screen.getByText('Reporting frequency: Quarterly')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('lets an authorised user choose monthly, quarterly, or yearly', () => {
    const onChange = vi.fn();
    render(<ReportingFrequencyControl value="MONTHLY" canEdit onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Yearly' }));
    expect(onChange).toHaveBeenCalledWith('YEARLY');
  });
});
