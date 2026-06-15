import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DatePickerMaxHint from '@/components/ui/DatePickerMaxHint';

// Guards that the `actionBar` slot actually renders custom content inside the
// open DatePicker popup — this is how the "why are these dates disabled" hint
// reaches the user (ProjectStartCard + project Settings rely on it).
describe('DatePicker actionBar hint', () => {
  it('renders the max-date hint inside the open popup', () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          open
          value={new Date(2026, 4, 4)}
          maxDate={new Date(2026, 4, 5)}
          slots={{ actionBar: () => <DatePickerMaxHint limitLabel="May 5, 2026" /> }}
        />
      </LocalizationProvider>,
    );

    expect(screen.getByText(/are unavailable/i)).toBeInTheDocument();
    expect(screen.getByText('May 5, 2026')).toBeInTheDocument();
  });
});
