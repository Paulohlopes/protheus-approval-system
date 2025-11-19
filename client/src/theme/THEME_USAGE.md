# Theme Constants Usage Guide

This document explains how to use the standardized theme constants in the Protheus Approval System.

## Custom Spacing

Use `theme.customSpacing` for consistent spacing throughout the application:

```tsx
import { useTheme } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // Use spacing constants
        padding: theme.customSpacing.md / 8, // 2 (16px / 8 = 2)
        margin: theme.customSpacing.lg / 8,  // 3 (24px / 8 = 3)
        gap: theme.customSpacing.sm / 8,     // 1 (8px / 8 = 1)
      }}
    >
      Content
    </Box>
  );
};
```

### Available Spacing Values:
- `xs: 4` (0.5 spacing units)
- `sm: 8` (1 spacing unit)
- `md: 16` (2 spacing units)
- `lg: 24` (3 spacing units)
- `xl: 32` (4 spacing units)
- `xxl: 48` (6 spacing units)

> **Note**: MUI uses 8px as the base spacing unit. Divide by 8 when using in `sx` prop.

## Status Colors

Use `theme.statusColors` for document approval states:

```tsx
import { useTheme } from '@mui/material';

const StatusCard = ({ status }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: theme.statusColors.pending.bg,
        borderColor: theme.statusColors.pending.light,
        color: theme.statusColors.pending.dark,
      }}
    >
      Status: {status}
    </Box>
  );
};
```

### Available Status Colors:

Each status has four variants: `main`, `light`, `dark`, and `bg` (background):

#### Approved (Green)
```tsx
theme.statusColors.approved.main  // #2e7d32 (light mode) / #10b981 (dark mode)
theme.statusColors.approved.light // #4caf50 (light mode) / #34d399 (dark mode)
theme.statusColors.approved.dark  // #1b5e20 (light mode) / #059669 (dark mode)
theme.statusColors.approved.bg    // rgba(46, 125, 50, 0.08) (light mode)
```

#### Pending (Orange/Yellow)
```tsx
theme.statusColors.pending.main   // #ed6c02 (light mode) / #f59e0b (dark mode)
theme.statusColors.pending.light  // #ff9800 (light mode) / #fbbf24 (dark mode)
theme.statusColors.pending.dark   // #e65100 (light mode) / #d97706 (dark mode)
theme.statusColors.pending.bg     // rgba(237, 108, 2, 0.08) (light mode)
```

#### Rejected (Red)
```tsx
theme.statusColors.rejected.main  // #d32f2f (light mode) / #ef4444 (dark mode)
theme.statusColors.rejected.light // #ef5350 (light mode) / #f87171 (dark mode)
theme.statusColors.rejected.dark  // #c62828 (light mode) / #dc2626 (dark mode)
theme.statusColors.rejected.bg    // rgba(211, 47, 47, 0.08) (light mode)
```

#### Blocked (Gray)
```tsx
theme.statusColors.blocked.main   // #757575 (light mode) / #6b7280 (dark mode)
theme.statusColors.blocked.light  // #9e9e9e (light mode) / #9ca3af (dark mode)
theme.statusColors.blocked.dark   // #424242 (light mode) / #4b5563 (dark mode)
theme.statusColors.blocked.bg     // rgba(117, 117, 117, 0.08) (light mode)
```

## Complete Example

```tsx
import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';

const DocumentStatusCard = ({ document, isPending }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: theme.customSpacing.md / 8,  // 2 spacing units
        border: 2,
        borderColor: isPending
          ? theme.statusColors.pending.light
          : theme.statusColors.approved.main,
        borderRadius: theme.customSpacing.md / 8,
        bgcolor: isPending
          ? theme.statusColors.pending.bg
          : 'background.paper',
      }}
    >
      <CardContent sx={{ p: theme.customSpacing.lg / 8 }}>
        <Typography variant="h6" gutterBottom>
          {document.title}
        </Typography>
        <Box
          sx={{
            mt: theme.customSpacing.sm / 8,
            p: theme.customSpacing.sm / 8,
            bgcolor: isPending
              ? theme.statusColors.pending.bg
              : theme.statusColors.approved.bg,
            borderRadius: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isPending
                ? theme.statusColors.pending.dark
                : theme.statusColors.approved.dark
            }}
          >
            Status: {isPending ? 'Pending Approval' : 'Approved'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DocumentStatusCard;
```

## When to Use MUI Palette vs Custom Status Colors

### Use MUI Palette (`theme.palette`) when:
- Working with generic UI elements (buttons, chips, alerts)
- Using Material-UI color props (`color="success"`, `color="warning"`, etc.)
- Need semantic colors that MUI components understand

### Use Custom Status Colors (`theme.statusColors`) when:
- Styling document approval states specifically
- Need background colors with transparency for status indicators
- Want consistent status colors across light/dark modes
- Creating custom status visualizations

## Migration Guide

### Before (Hardcoded):
```tsx
<Box sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}>
  Pending
</Box>
```

### After (Theme Constants):
```tsx
const theme = useTheme();
<Box sx={{
  bgcolor: theme.statusColors.pending.bg,
  color: theme.statusColors.pending.dark
}}>
  Pending
</Box>
```

## Benefits

1. **Consistency**: All components use the same colors and spacing
2. **Maintainability**: Update colors/spacing in one place (theme.ts)
3. **Dark Mode Support**: Automatic color switching between light/dark modes
4. **Type Safety**: TypeScript autocomplete for theme properties
5. **Accessibility**: Pre-defined colors meet WCAG contrast requirements
