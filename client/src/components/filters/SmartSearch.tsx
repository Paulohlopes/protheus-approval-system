import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Autocomplete,
  Chip,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Search,
  Clear,
  History,
  TrendingUp,
} from '@mui/icons-material';

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (value: string) => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  value,
  onChange,
  placeholder = 'Buscar documentos...',
  suggestions = [],
  onSearch,
}) => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save to history when search is performed
  const addToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setSearchHistory((prev) => {
      // Remove duplicate and add to beginning
      const filtered = prev.filter((term) => term !== searchTerm);
      const updated = [searchTerm, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = (searchValue: string) => {
    onChange(searchValue);
    if (searchValue.trim()) {
      addToHistory(searchValue);
      if (onSearch) {
        onSearch(searchValue);
      }
    }
  };

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  const combinedSuggestions = useMemo(() => [
    ...searchHistory.map((term) => ({ label: term, type: 'history' as const })),
    ...suggestions.map((term) => ({ label: term, type: 'suggestion' as const })),
  ], [searchHistory, suggestions]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Autocomplete
        freeSolo
        options={combinedSuggestions}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
        inputValue={value}
        onInputChange={(_, newValue) => onChange(newValue)}
        onChange={(_, newValue) => {
          if (typeof newValue === 'string') {
            handleSearch(newValue);
          } else if (newValue) {
            handleSearch(newValue.label);
          }
        }}
        renderOption={(props, option) => (
          <ListItem {...props} key={option.label}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {option.type === 'history' ? (
                <History fontSize="small" color="action" />
              ) : (
                <TrendingUp fontSize="small" color="primary" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={option.type === 'history' ? 'Busca recente' : 'Sugestão'}
            />
          </ListItem>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {value && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClear} edge="end">
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        PaperComponent={({ children }) => (
          <Paper>
            {children}
            {searchHistory.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label="Limpar histórico"
                    size="small"
                    onClick={clearHistory}
                    onDelete={clearHistory}
                    deleteIcon={<Clear />}
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>
              </>
            )}
          </Paper>
        )}
      />
    </Box>
  );
};

export default React.memo(SmartSearch);
