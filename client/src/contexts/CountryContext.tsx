import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import type { Country } from '../types/country';

interface CountryContextType {
  countries: Country[];
  activeCountry: Country | null;
  isLoading: boolean;
  error: string | null;
  setActiveCountry: (country: Country) => void;
  refreshCountries: () => Promise<void>;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const STORAGE_KEY = 'activeCountryId';

interface CountryProviderProps {
  children: ReactNode;
}

// Direct API URL (bypasses auth interceptors)
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

export const CountryProvider: React.FC<CountryProviderProps> = ({ children }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [activeCountry, setActiveCountryState] = useState<Country | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load countries from backend (using direct axios to bypass auth interceptors)
  const refreshCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use direct axios call to bypass auth interceptors (this is a public endpoint)
      const response = await axios.get<Country[]>(`${BACKEND_API_URL}/countries`, {
        params: { activeOnly: true },
      });
      setCountries(response.data);
      return response.data;
    } catch (err: any) {
      console.error('Error loading countries:', err);
      // Don't show error for 401 - just means no countries available yet
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Erro ao carregar países');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize - load countries and set active
  useEffect(() => {
    const initialize = async () => {
      const loadedCountries = await refreshCountries();

      if (loadedCountries.length === 0) {
        return;
      }

      // Try to restore saved country from localStorage
      const savedCountryId = localStorage.getItem(STORAGE_KEY);
      if (savedCountryId) {
        const savedCountry = loadedCountries.find(c => c.id === savedCountryId);
        if (savedCountry) {
          setActiveCountryState(savedCountry);
          return;
        }
      }

      // Fall back to default country
      const defaultCountry = loadedCountries.find(c => c.isDefault);
      if (defaultCountry) {
        setActiveCountryState(defaultCountry);
        localStorage.setItem(STORAGE_KEY, defaultCountry.id);
        return;
      }

      // Fall back to first country
      if (loadedCountries.length > 0) {
        setActiveCountryState(loadedCountries[0]);
        localStorage.setItem(STORAGE_KEY, loadedCountries[0].id);
      }
    };

    initialize();
  }, [refreshCountries]);

  // Set active country and persist to localStorage
  const setActiveCountry = useCallback((country: Country) => {
    setActiveCountryState(country);
    localStorage.setItem(STORAGE_KEY, country.id);
  }, []);

  const value: CountryContextType = {
    countries,
    activeCountry,
    isLoading,
    error,
    setActiveCountry,
    refreshCountries,
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = (): CountryContextType => {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};

export default CountryContext;
