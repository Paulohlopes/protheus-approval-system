import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  disabled?: boolean;
  target?: HTMLElement | Document;
}

export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { disabled = false, target = document } = options;
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    // Ignore shortcuts when user is typing in input fields
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
       activeElement.tagName === 'TEXTAREA' ||
       activeElement.getAttribute('contenteditable') === 'true' ||
       activeElement.getAttribute('role') === 'textbox')
    ) {
      return;
    }

    // Find matching shortcut
    const matchedShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
    });

    if (matchedShortcut) {
      if (matchedShortcut.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }
      matchedShortcut.callback();
    }
  }, [disabled]);

  useEffect(() => {
    const targetElement = target as HTMLElement | Document;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);

  return {
    shortcuts: shortcutsRef.current,
  };
};

// Hook específico para shortcuts comuns da aplicação
export const useAppShortcuts = (onShowHelp?: () => void) => {
  const shortcuts = [
    {
      key: 'r',
      ctrlKey: true,
      callback: () => window.location.reload(),
      description: 'Recarregar página',
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: () => {
        // Focus no campo de busca se existir
        const searchInput = document.querySelector('input[placeholder*="uscar"], input[aria-label*="usca"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Focar no campo de busca',
    },
    {
      key: 'Escape',
      callback: () => {
        // Fechar modais/diálogos abertos
        const closeButtons = document.querySelectorAll('[aria-label*="fechar"], [aria-label*="close"], .MuiDialog-root button[aria-label="Close"]');
        const lastCloseButton = closeButtons[closeButtons.length - 1] as HTMLButtonElement;
        if (lastCloseButton) {
          lastCloseButton.click();
        }
      },
      description: 'Fechar modal/diálogo',
      preventDefault: false,
    },
    {
      key: '/',
      callback: () => {
        // Focus no campo de busca
        const searchInput = document.querySelector('input[placeholder*="uscar"], input[aria-label*="usca"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Focar no campo de busca',
    },
    {
      key: '1',
      altKey: true,
      callback: () => {
        const dashboardLink = document.querySelector('a[href="/dashboard"], [role="button"][data-route="/dashboard"]') as HTMLElement;
        if (dashboardLink) {
          dashboardLink.click();
        } else {
          window.location.href = '/dashboard';
        }
      },
      description: 'Ir para Dashboard',
    },
    {
      key: '2',
      altKey: true,
      callback: () => {
        const documentsLink = document.querySelector('a[href="/documents"], [role="button"][data-route="/documents"]') as HTMLElement;
        if (documentsLink) {
          documentsLink.click();
        } else {
          window.location.href = '/documents';
        }
      },
      description: 'Ir para Documentos',
    },
    {
      key: '3',
      altKey: true,
      callback: () => {
        const purchaseLink = document.querySelector('a[href="/purchase-requests"], [role="button"][data-route="/purchase-requests"]') as HTMLElement;
        if (purchaseLink) {
          purchaseLink.click();
        } else {
          window.location.href = '/purchase-requests';
        }
      },
      description: 'Ir para Solicitações de Compra',
    },
    {
      key: '?',
      callback: () => {
        if (onShowHelp) {
          onShowHelp();
        }
      },
      description: 'Mostrar ajuda de atalhos',
    },
  ];

  return useKeyboardShortcuts(shortcuts);
};

// Componente para mostrar ajuda de shortcuts
export const formatShortcut = (shortcut: ShortcutConfig): string => {
  const parts = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
};