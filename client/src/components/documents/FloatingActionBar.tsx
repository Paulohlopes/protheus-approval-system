import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Zoom,
  Fab,
  Badge,
  Collapse,
  Divider,
  Stack,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Close,
  KeyboardArrowUp,
  KeyboardArrowDown,
  SelectAll,
  PlaylistAddCheck,
  FilterList,
  Speed,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionBarProps {
  selectedCount: number;
  totalPendingCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  visible: boolean;
  isProcessing?: boolean;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedCount,
  totalPendingCount,
  onApproveAll,
  onRejectAll,
  onClearSelection,
  onSelectAll,
  visible,
  isProcessing = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [minimized, setMinimized] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    if (selectedCount === 0) {
      setMinimized(false);
    }
  }, [selectedCount]);

  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === totalPendingCount && totalPendingCount > 0;

  if (!visible && selectedCount === 0) return null;

  return (
    <>
      {/* Barra Principal Flutuante */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 0 : 24,
              left: isMobile ? 0 : '50%',
              transform: isMobile ? 'none' : 'translateX(-50%)',
              zIndex: 1300,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Paper
              elevation={16}
              sx={{
                borderRadius: isMobile ? '16px 16px 0 0' : 4,
                overflow: 'hidden',
                background: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                backdropFilter: 'blur(20px)',
                minWidth: isMobile ? '100%' : minimized ? 200 : 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Header da barra */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => setMinimized(!minimized)}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PlaylistAddCheck sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {selectedCount} {selectedCount === 1 ? 'documento selecionado' : 'documentos selecionados'}
                  </Typography>
                </Stack>
                <IconButton
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinimized(!minimized);
                  }}
                >
                  {minimized ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              </Box>

              {/* Conteúdo da barra */}
              <Collapse in={!minimized}>
                <Box sx={{ p: 2 }}>
                  {/* Estatísticas */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Chip
                      label={`${selectedCount} de ${totalPendingCount} pendentes`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`${Math.round((selectedCount / totalPendingCount) * 100)}% selecionado`}
                      color="secondary"
                      variant="filled"
                      size="small"
                    />
                    {allSelected && (
                      <Chip
                        label="Todos selecionados"
                        color="success"
                        variant="filled"
                        size="small"
                        icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      />
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {/* Ações principais */}
                  <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={onApproveAll}
                      disabled={isProcessing}
                      fullWidth={isMobile}
                      sx={{
                        background: 'linear-gradient(135deg, #00c896 0%, #00d4aa 100%)',
                        fontWeight: 600,
                        py: 1.5,
                        boxShadow: '0 4px 12px rgba(0, 200, 150, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00d4aa 0%, #00c896 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(0, 200, 150, 0.4)',
                        },
                      }}
                    >
                      Aprovar Todos ({selectedCount})
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={onRejectAll}
                      disabled={isProcessing}
                      fullWidth={isMobile}
                      sx={{
                        borderWidth: 2,
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          borderWidth: 2,
                          background: alpha(theme.palette.error.main, 0.08),
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      Rejeitar Todos ({selectedCount})
                    </Button>
                  </Stack>

                  {/* Ações secundárias */}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="center">
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<SelectAll />}
                      onClick={onSelectAll}
                    >
                      {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      startIcon={<Close />}
                      onClick={onClearSelection}
                    >
                      Limpar Seleção
                    </Button>
                  </Stack>
                </Box>
              </Collapse>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB para ações rápidas quando não há seleção */}
      <AnimatePresence>
        {!hasSelection && totalPendingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 80 : 24,
              right: 24,
              zIndex: 1200,
            }}
          >
            <Tooltip title="Ações rápidas">
              <Fab
                color="primary"
                aria-label="quick actions"
                onClick={() => setShowQuickActions(!showQuickActions)}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Badge badgeContent={totalPendingCount} color="error">
                  <Speed />
                </Badge>
              </Fab>
            </Tooltip>

            {/* Menu de ações rápidas */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  style={{
                    position: 'absolute',
                    bottom: 70,
                    right: 0,
                  }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      minWidth: 200,
                    }}
                  >
                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<SelectAll />}
                        onClick={() => {
                          onSelectAll();
                          setShowQuickActions(false);
                        }}
                      >
                        Selecionar Todos
                      </Button>
                      <Button
                        fullWidth
                        size="small"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          onSelectAll();
                          setTimeout(onApproveAll, 100);
                          setShowQuickActions(false);
                        }}
                      >
                        Aprovar Todos
                      </Button>
                    </Stack>
                  </Paper>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de scroll to top */}
      <AnimatePresence>
        {hasSelection && (
          <Zoom in={true}>
            <Fab
              size="small"
              color="secondary"
              sx={{
                position: 'fixed',
                top: 100,
                right: 24,
                zIndex: 1100,
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <KeyboardArrowUp />
            </Fab>
          </Zoom>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingActionBar;