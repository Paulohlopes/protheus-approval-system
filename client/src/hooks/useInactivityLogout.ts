import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { config } from '../config/environment';
import { toast } from '../utils/toast';

// Default inactivity timeout: 30 minutes
const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Warning before logout: 5 minutes
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000;

interface UseInactivityLogoutOptions {
  timeout?: number;
  warningTime?: number;
  enabled?: boolean;
}

export const useInactivityLogout = (options: UseInactivityLogoutOptions = {}) => {
  const {
    timeout = config.security?.inactivityTimeout || DEFAULT_INACTIVITY_TIMEOUT,
    warningTime = WARNING_BEFORE_LOGOUT,
    enabled = true,
  } = options;

  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownWarning = useRef(false);

  const clearTimers = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }
    hasShownWarning.current = false;
  }, []);

  const handleLogout = useCallback(async () => {
    console.log('useInactivityLogout - Auto-logout due to inactivity');
    clearTimers();

    try {
      await logout();
      toast.info('Sessão encerrada por inatividade');
      navigate('/login');
    } catch (error) {
      console.error('Error during auto-logout:', error);
      navigate('/login');
    }
  }, [logout, navigate, clearTimers]);

  const showWarning = useCallback(() => {
    if (!hasShownWarning.current) {
      hasShownWarning.current = true;
      const minutesRemaining = Math.ceil(warningTime / 60000);
      toast.warning(
        `Sua sessão expirará em ${minutesRemaining} minutos por inatividade. Mova o mouse ou pressione uma tecla para continuar.`,
        { duration: 10000 }
      );
    }
  }, [warningTime]);

  const resetTimers = useCallback(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    clearTimers();

    // Set warning timer (timeout - warningTime before logout)
    const warningDelay = Math.max(timeout - warningTime, 0);
    if (warningDelay > 0) {
      warningTimer.current = setTimeout(() => {
        showWarning();
      }, warningDelay);
    }

    // Set logout timer
    inactivityTimer.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  }, [enabled, isAuthenticated, timeout, warningTime, clearTimers, showWarning, handleLogout]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      clearTimers();
      return;
    }

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle reset to avoid too frequent calls
    let lastReset = Date.now();
    const throttleMs = 1000; // Only reset timers at most once per second

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > throttleMs) {
        lastReset = now;
        resetTimers();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [enabled, isAuthenticated, resetTimers, clearTimers]);

  // Also check token expiration periodically
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    const checkInterval = setInterval(() => {
      // Re-check auth state from tokenManager
      useAuthStore.getState().checkAuth();

      // If no longer authenticated, redirect to login
      if (!useAuthStore.getState().isAuthenticated) {
        clearTimers();
        toast.info('Sessão expirada. Faça login novamente.');
        navigate('/login');
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(checkInterval);
    };
  }, [enabled, isAuthenticated, navigate, clearTimers]);

  return {
    resetTimers,
    clearTimers,
  };
};

export default useInactivityLogout;
