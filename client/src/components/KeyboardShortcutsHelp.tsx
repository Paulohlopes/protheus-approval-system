import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Close,
  Keyboard,
  Help,
} from '@mui/icons-material';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';

interface ShortcutCategory {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: 'Navegação',
    shortcuts: [
      { keys: 'Alt + 1', description: 'Ir para Dashboard' },
      { keys: 'Alt + 2', description: 'Ir para Documentos' },
      { keys: 'Alt + 3', description: 'Ir para Solicitações de Compra' },
    ],
  },
  {
    title: 'Busca',
    shortcuts: [
      { keys: 'Ctrl + K', description: 'Focar no campo de busca' },
      { keys: '/', description: 'Busca rápida' },
    ],
  },
  {
    title: 'Ações Gerais',
    shortcuts: [
      { keys: 'Ctrl + R', description: 'Recarregar página' },
      { keys: 'Escape', description: 'Fechar modal/diálogo' },
      { keys: '?', description: 'Mostrar esta ajuda' },
    ],
  },
  {
    title: 'Documentos',
    shortcuts: [
      { keys: 'A', description: 'Aprovar documento selecionado' },
      { keys: 'R', description: 'Rejeitar documento selecionado' },
      { keys: 'Enter', description: 'Confirmar ação' },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = React.memo(({
  open,
  onClose
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Keyboard color="primary" />
            <Typography variant="h6" component="span">
              Atalhos do Teclado
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Use estes atalhos para navegar mais rapidamente pelo sistema.
        </Typography>

        {shortcutCategories.map((category, index) => (
          <Box key={category.title} sx={{ mb: index < shortcutCategories.length - 1 ? 3 : 0 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontSize: '1rem', fontWeight: 600 }}>
              {category.title}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {category.shortcuts.map((shortcut, shortcutIndex) => (
                <Box
                  key={shortcutIndex}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {shortcut.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {shortcut.keys.split(' + ').map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <Chip
                          label={key}
                          size="small"
                          variant="outlined"
                          sx={{
                            minWidth: 32,
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                        {keyIndex < shortcut.keys.split(' + ').length - 1 && (
                          <Typography
                            variant="caption"
                            sx={{ 
                              alignSelf: 'center', 
                              color: 'text.secondary',
                              mx: 0.5,
                              fontSize: '0.7rem'
                            }}
                          >
                            +
                          </Typography>
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>

            {index < shortcutCategories.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.main', color: 'info.contrastText', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Help fontSize="small" />
            <strong>Dica:</strong> Os atalhos não funcionam quando você está digitando em um campo de texto.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

KeyboardShortcutsHelp.displayName = 'KeyboardShortcutsHelp';

// Hook para o botão de ajuda
export const useShortcutsHelp = () => {
  const [open, setOpen] = useState(false);

  const showHelp = () => setOpen(true);
  const hideHelp = () => setOpen(false);

  return {
    open,
    showHelp,
    hideHelp,
    ShortcutsHelpDialog: () => (
      <KeyboardShortcutsHelp open={open} onClose={hideHelp} />
    ),
  };
};