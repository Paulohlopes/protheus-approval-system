import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import { Language as LanguageIcon, Check } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../locales';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: typeof languages[0]['code']) => {
    setLanguage(lang);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === language);

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
            <Typography sx={{ fontSize: '1.2rem' }}>
              {currentLanguage?.flag}
            </Typography>
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
              <Typography sx={{ fontSize: '1.5rem' }}>
                {lang.flag}
              </Typography>
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
};

export default LanguageSelector;