import { useState, useEffect, useRef } from 'react';

interface LiveRegionOptions {
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  clearDelay?: number; // tempo em ms para limpar a mensagem automaticamente
}

export const useLiveRegion = (options: LiveRegionOptions = {}) => {
  const {
    politeness = 'polite',
    atomic = true,
    relevant = 'all',
    clearDelay = 5000
  } = options;

  const [message, setMessage] = useState<string>('');
  const clearTimeoutRef = useRef<NodeJS.Timeout>();

  const announce = (text: string) => {
    // Limpar timeout anterior se existir
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }

    // Definir nova mensagem
    setMessage(text);

    // Agendar limpeza automática se especificada
    if (clearDelay > 0) {
      clearTimeoutRef.current = setTimeout(() => {
        setMessage('');
      }, clearDelay);
    }
  };

  const clear = () => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    setMessage('');
  };

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const liveRegionProps = {
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
    role: 'status',
    style: {
      position: 'absolute' as const,
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    },
  };

  return {
    message,
    announce,
    clear,
    liveRegionProps,
  };
};