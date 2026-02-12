'use client';

import * as React from 'react';
import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
  ListSubheader,
  type SelectProps as MuiSelectProps,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';

// Context to pass value and onChange down
interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({});

// Main Select component - maps onValueChange to onChange
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, defaultValue, children }) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
};

// SelectGroup - maps to MUI ListSubheader
const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// SelectValue - placeholder component (MUI handles this differently)
const SelectValue: React.FC<{ placeholder?: string }> = () => {
  return null;
};

// SelectTrigger - the actual MUI Select component
const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  Omit<MuiSelectProps, 'value' | 'onChange'> & { children?: React.ReactNode }
>(({ children, ...props }, ref) => {
  const { value, onValueChange } = React.useContext(SelectContext);

  const handleChange = (event: any) => {
    onValueChange?.(event.target.value);
  };

  // Extract the actual select items from children
  const selectItems = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === SelectContent
  );

  return (
    <FormControl fullWidth size="small" ref={ref}>
      <MuiSelect
        value={value || ''}
        onChange={handleChange}
        IconComponent={ChevronDown}
        {...props}
      >
        {selectItems}
      </MuiSelect>
    </FormControl>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

// SelectContent - wrapper for MenuItem children
const SelectContent = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; position?: string }
>(({ children, ...props }, ref) => {
  return <>{children}</>;
});
SelectContent.displayName = 'SelectContent';

// SelectLabel - maps to MUI ListSubheader
const SelectLabel = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ children, ...props }, ref) => (
  <ListSubheader {...props}>{children}</ListSubheader>
));
SelectLabel.displayName = 'SelectLabel';

// SelectItem - maps to MUI MenuItem
const SelectItem = React.forwardRef<
  HTMLLIElement,
  { value: string; children: React.ReactNode; disabled?: boolean }
>(({ value, children, disabled, ...props }, ref) => (
  <MenuItem value={value} disabled={disabled} {...props}>
    {children}
  </MenuItem>
));
SelectItem.displayName = 'SelectItem';

// SelectSeparator - not commonly used in MUI, but can be a divider
const SelectSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>((props, ref) => (
  <li>
    <hr ref={ref} style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} {...props} />
  </li>
));
SelectSeparator.displayName = 'SelectSeparator';

// Scroll buttons not needed in MUI (handled automatically)
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
