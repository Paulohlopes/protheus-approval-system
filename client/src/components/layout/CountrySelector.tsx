import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Public,
  KeyboardArrowDown,
  Check,
  Star,
} from '@mui/icons-material';
import { useCountry } from '../../contexts/CountryContext';
import type { Country } from '../../types/country';

interface CountrySelectorProps {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  showCode?: boolean;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  variant = 'text',
  size = 'small',
  showCode = true,
}) => {
  const { countries, activeCountry, isLoading, setActiveCountry } = useCountry();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectCountry = (country: Country) => {
    setActiveCountry(country);
    handleClose();
  };

  // Get connection status icon/color
  const getStatusColor = (country: Country) => {
    switch (country.connectionStatus) {
      case 'connected':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Button disabled size={size} startIcon={<CircularProgress size={16} />}>
        Carregando...
      </Button>
    );
  }

  if (countries.length === 0) {
    return (
      <Tooltip title="Nenhum país configurado">
        <Button disabled size={size} startIcon={<Public />}>
          Sem país
        </Button>
      </Tooltip>
    );
  }

  if (countries.length === 1 && activeCountry) {
    // Only one country - show as static
    return (
      <Chip
        icon={<Public />}
        label={showCode ? `${activeCountry.name} (${activeCountry.code})` : activeCountry.name}
        size={size === 'large' ? 'medium' : 'small'}
        color={getStatusColor(activeCountry) as any}
        variant="outlined"
      />
    );
  }

  return (
    <>
      <Button
        id="country-selector-button"
        aria-controls={open ? 'country-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        variant={variant}
        size={size}
        startIcon={<Public />}
        endIcon={<KeyboardArrowDown />}
        sx={{
          textTransform: 'none',
          minWidth: 120,
        }}
      >
        {activeCountry ? (
          showCode ? `${activeCountry.code} - ${activeCountry.name}` : activeCountry.name
        ) : (
          'Selecionar País'
        )}
      </Button>

      <Menu
        id="country-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'country-selector-button',
        }}
        PaperProps={{
          sx: { minWidth: 250 },
        }}
      >
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Selecione o país/ERP
          </Typography>
        </MenuItem>
        <Divider />

        {countries.map((country) => (
          <MenuItem
            key={country.id}
            onClick={() => handleSelectCountry(country)}
            selected={activeCountry?.id === country.id}
          >
            <ListItemIcon>
              {activeCountry?.id === country.id ? (
                <Check color="primary" />
              ) : country.isDefault ? (
                <Star fontSize="small" color="action" />
              ) : null}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight={country.isDefault ? 600 : 400}>
                  {country.name}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {country.code} - Sufixo: {country.tableSuffix}
                </Typography>
              }
            />
            <Chip
              size="small"
              label={
                country.connectionStatus === 'connected'
                  ? 'OK'
                  : country.connectionStatus === 'failed'
                  ? 'Erro'
                  : '?'
              }
              color={getStatusColor(country) as any}
              sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default CountrySelector;
