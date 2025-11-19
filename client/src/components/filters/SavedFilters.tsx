import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Stack,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  BookmarkBorder,
  Bookmark,
  Delete,
  Edit,
  MoreVert,
  Add,
  FilterList,
  Star,
  StarBorder,
} from '@mui/icons-material';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  isFavorite?: boolean;
  createdAt: string;
}

interface SavedFiltersProps {
  currentFilters: Record<string, any>;
  onApplyPreset: (filters: Record<string, any>) => void;
  onSave?: (preset: FilterPreset) => void;
}

const SavedFilters: React.FC<SavedFiltersProps> = ({
  currentFilters,
  onApplyPreset,
  onSave,
}) => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null);

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
  }, []);

  // Save presets to localStorage
  const saveToStorage = (updatedPresets: FilterPreset[]) => {
    localStorage.setItem('filterPresets', JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    saveToStorage(updated);

    if (onSave) {
      onSave(newPreset);
    }

    setPresetName('');
    setDialogOpen(false);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    saveToStorage(updated);
    setMenuAnchor(null);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = presets.map((p) =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    saveToStorage(updated);
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters);
  };

  const getActiveFiltersCount = (filters: Record<string, any>): number => {
    return Object.values(filters).filter((v) => {
      if (typeof v === 'string') return v.trim() !== '';
      if (Array.isArray(v)) return v.length > 0;
      return v != null;
    }).length;
  };

  const favoritePresets = presets.filter((p) => p.isFavorite);
  const regularPresets = presets.filter((p) => !p.isFavorite);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Filtros Salvos
        </Typography>
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          variant="outlined"
        >
          Salvar Filtro Atual
        </Button>
      </Stack>

      {/* Favorite Presets */}
      {favoritePresets.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Favoritos
          </Typography>
          <List dense sx={{ mb: 2 }}>
            {favoritePresets.map((preset) => (
              <ListItem
                key={preset.id}
                disablePadding
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleToggleFavorite(preset.id)}
                    >
                      <Star fontSize="small" color="warning" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        setSelectedPreset(preset);
                        setMenuAnchor(e.currentTarget);
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </>
                }
              >
                <ListItemButton onClick={() => handleApplyPreset(preset)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FilterList fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={preset.name}
                    secondary={`${getActiveFiltersCount(preset.filters)} filtros ativos`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
        </>
      )}

      {/* Regular Presets */}
      {regularPresets.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Todos os Filtros
          </Typography>
          <List dense>
            {regularPresets.map((preset) => (
              <ListItem
                key={preset.id}
                disablePadding
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleToggleFavorite(preset.id)}
                    >
                      <StarBorder fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        setSelectedPreset(preset);
                        setMenuAnchor(e.currentTarget);
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </>
                }
              >
                <ListItemButton onClick={() => handleApplyPreset(preset)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FilterList fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={preset.name}
                    secondary={`${getActiveFiltersCount(preset.filters)} filtros ativos`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {presets.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <BookmarkBorder sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Nenhum filtro salvo ainda
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Salve suas combinações de filtros favoritas
          </Typography>
        </Box>
      )}

      {/* Save Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Salvar Filtro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome do Filtro"
            placeholder="Ex: Documentos Urgentes"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            sx={{ mt: 1 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSavePreset();
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {getActiveFiltersCount(currentFilters)} filtros serão salvos
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSavePreset} variant="contained" disabled={!presetName.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedPreset) {
              handleDeletePreset(selectedPreset.id);
            }
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SavedFilters;
