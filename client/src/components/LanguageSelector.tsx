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
      <Tooltip title="Idioma / Language">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color: 'text.secondary',
            px: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {currentLanguage?.countryCode && (
              <CountryFlag country={currentLanguage.countryCode} size={18} />
            )}
            <LanguageIcon fontSize="small" sx={{ fontSize: '1.1rem' }} />
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
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={language === lang.code}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 1,
              mx: 0.5,
              my: 0.25,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CountryFlag country={lang.countryCode} size={20} />
            </ListItemIcon>
            <ListItemText
              primary={lang.name}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: language === lang.code ? 500 : 400,
              }}
            />
            {language === lang.code && (
              <Check fontSize="small" sx={{ ml: 1, color: 'primary.main', fontSize: '1rem' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;