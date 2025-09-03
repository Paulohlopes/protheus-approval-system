import React from 'react';
import {
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  ViewComfy,
  ViewCompact,
  ViewStream,
} from '@mui/icons-material';

export type DensityMode = 'comfortable' | 'compact' | 'spacious';

interface DensityToggleProps {
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
  label?: string;
}

export const DensityToggle: React.FC<DensityToggleProps> = React.memo(({
  density,
  onDensityChange,
  label = 'Densidade',
}) => {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newDensity: DensityMode | null) => {
    if (newDensity) {
      onDensityChange(newDensity);
    }
  };

  const getDensityConfig = (mode: DensityMode) => {
    switch (mode) {
      case 'spacious':
        return {
          icon: <ViewStream />,
          tooltip: 'Espaçoso - Mais espaço entre os elementos',
          label: 'Espaçoso',
        };
      case 'comfortable':
        return {
          icon: <ViewComfy />,
          tooltip: 'Confortável - Densidade padrão',
          label: 'Confortável',
        };
      case 'compact':
        return {
          icon: <ViewCompact />,
          tooltip: 'Compacto - Mais informações em menos espaço',
          label: 'Compacto',
        };
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
        {label}
      </Typography>
      <ToggleButtonGroup
        value={density}
        exclusive
        onChange={handleChange}
        size="small"
        aria-label="densidade de visualização"
      >
        {(['spacious', 'comfortable', 'compact'] as DensityMode[]).map((mode) => {
          const config = getDensityConfig(mode);
          return (
            <ToggleButton
              key={mode}
              value={mode}
              aria-label={`densidade ${config.label.toLowerCase()}`}
            >
              <Tooltip title={config.tooltip}>
                {config.icon}
              </Tooltip>
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </Box>
  );
});

DensityToggle.displayName = 'DensityToggle';

// Hook para gerenciar densidade
export const useDensity = (storageKey: string = 'app-density') => {
  const [density, setDensity] = React.useState<DensityMode>(() => {
    const stored = localStorage.getItem(storageKey) as DensityMode;
    return stored && ['comfortable', 'compact', 'spacious'].includes(stored) ? stored : 'comfortable';
  });

  const handleDensityChange = React.useCallback((newDensity: DensityMode) => {
    setDensity(newDensity);
    localStorage.setItem(storageKey, newDensity);
  }, [storageKey]);

  const getDensityStyles = React.useMemo(() => {
    switch (density) {
      case 'spacious':
        return {
          cardSpacing: 3,
          cardPadding: 3,
          textSpacing: 2,
          chipSize: 'medium' as const,
          avatarSize: 48,
        };
      case 'compact':
        return {
          cardSpacing: 1,
          cardPadding: 2,
          textSpacing: 1,
          chipSize: 'small' as const,
          avatarSize: 32,
        };
      case 'comfortable':
      default:
        return {
          cardSpacing: 2,
          cardPadding: 2.5,
          textSpacing: 1.5,
          chipSize: 'small' as const,
          avatarSize: 40,
        };
    }
  }, [density]);

  return {
    density,
    setDensity: handleDensityChange,
    styles: getDensityStyles,
  };
};