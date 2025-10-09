import React, { useState, useCallback, useMemo } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
} from '@mui/material';
import { Language as LanguageIcon, Check } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../locales';
import CountryFlag from './CountryFlag';

const LanguageSelector: React.FC = React.memo(() => {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLanguageChange = useCallback((lang: typeof languages[0]['code']) => {
    setLanguage(lang);
    handleClose();
  }, [setLanguage, handleClose]);

  const currentLanguage = useMemo(() =>
    languages.find(lang => lang.code === language),
    [language]
  );

  return (
    <>
      <Tooltip title="Language / Idioma">
        <IconButton
          onClick={handleClick}
          size="large"
          sx={{
            color: 'inherit',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {currentLanguage?.countryCode && (
              <CountryFlag country={currentLanguage.countryCode} size={24} />
            )}
            <LanguageIcon fontSize="small" />
          </Box>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={language === lang.code}
          >
            <ListItemIcon>
              <CountryFlag country={lang.countryCode} size={24} />
            </ListItemIcon>
            <ListItemText primary={lang.name} />
            {language === lang.code && (
              <Check fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;