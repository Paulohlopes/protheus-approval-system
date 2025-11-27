/**
 * Secure Storage Utility
 * Provides secure token storage with encryption and session management
 */

import { config, logger } from '../config/environment';

interface StorageOptions {
  encrypt?: boolean;
  sessionOnly?: boolean;
  expiresIn?: number; // in milliseconds
}

interface StorageItem {
  value: string;
  encrypted: boolean;
  expiresAt?: number;
  timestamp: number;
}

class SecureStorage {
  private readonly storagePrefix = 'ps_'; // Protheus System prefix
  
  /**
   * Simple encryption for client-side token storage
   * Note: This is obfuscation, not real encryption. For production,
   * consider using Web Crypto API or server-side session tokens
   */
  private simpleEncrypt(text: string): string {
    // Simple XOR cipher with rotating key
    const key = 'ProtheusSecureKey2024';
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const textChar = text.charCodeAt(i);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    
    return btoa(result); // Base64 encode
  }

  private simpleDecrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted); // Base64 decode
      const key = 'ProtheusSecureKey2024';
      let result = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = decoded.charCodeAt(i);
        result += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      return result;
    } catch (error) {
      logger.warn('Failed to decrypt storage item:', error);
      return '';
    }
  }

  /**
   * Store item securely
   */
  setItem(
    key: string, 
    value: string, 
    options: StorageOptions = {}
  ): boolean {
    try {
      const {
        encrypt = true,
        sessionOnly = false,
        expiresIn = config.security.sessionTimeout
      } = options;

      const storageItem: StorageItem = {
        value: encrypt ? this.simpleEncrypt(value) : value,
        encrypted: encrypt,
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
        timestamp: Date.now()
      };

      const storage = sessionOnly ? sessionStorage : localStorage;
      const storageKey = this.storagePrefix + key;
      
      storage.setItem(storageKey, JSON.stringify(storageItem));
      
      logger.debug(`Stored item: ${key} (encrypted: ${encrypt}, session: ${sessionOnly})`);
      return true;
    } catch (error) {
      logger.error('Failed to store item:', key, error);
      return false;
    }
  }

  /**
   * Retrieve item securely
   */
  getItem(key: string): string | null {
    try {
      const storageKey = this.storagePrefix + key;
      
      // Try localStorage first, then sessionStorage
      let item = localStorage.getItem(storageKey);
      if (!item) {
        item = sessionStorage.getItem(storageKey);
      }
      
      if (!item) {
        return null;
      }

      const storageItem: StorageItem = JSON.parse(item);
      
      // Check expiration
      if (storageItem.expiresAt && Date.now() > storageItem.expiresAt) {
        this.removeItem(key);
        logger.debug(`Expired item removed: ${key}`);
        return null;
      }

      // Decrypt if needed
      const value = storageItem.encrypted 
        ? this.simpleDecrypt(storageItem.value)
        : storageItem.value;

      return value || null;
    } catch (error) {
      logger.warn('Failed to retrieve item:', key, error);
      this.removeItem(key); // Remove corrupted item
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    const storageKey = this.storagePrefix + key;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    logger.debug(`Removed item: ${key}`);
  }

  /**
   * Clear all app-specific storage
   */
  clear(): void {
    const keys: string[] = [];
    
    // Collect localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keys.push(key);
      }
    }
    
    // Collect sessionStorage keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keys.push(key);
      }
    }
    
    // Remove all found keys
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    logger.info(`Cleared ${keys.length} storage items`);
  }

  /**
   * Check if item exists and is valid
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Get item metadata
   */
  getItemInfo(key: string): { exists: boolean; encrypted: boolean; expiresAt?: number; age: number } | null {
    try {
      const storageKey = this.storagePrefix + key;
      
      let item = localStorage.getItem(storageKey);
      if (!item) {
        item = sessionStorage.getItem(storageKey);
      }
      
      if (!item) {
        return null;
      }

      const storageItem: StorageItem = JSON.parse(item);
      
      return {
        exists: true,
        encrypted: storageItem.encrypted,
        expiresAt: storageItem.expiresAt,
        age: Date.now() - storageItem.timestamp
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean expired items
   */
  cleanExpired(): number {
    let cleanedCount = 0;
    const now = Date.now();
    const keys: string[] = [];
    
    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          if (item.expiresAt && now > item.expiresAt) {
            keys.push(key);
          }
        } catch (error) {
          keys.push(key); // Remove corrupted items too
        }
      }
    }
    
    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        try {
          const item = JSON.parse(sessionStorage.getItem(key) || '');
          if (item.expiresAt && now > item.expiresAt) {
            keys.push(key);
          }
        } catch (error) {
          keys.push(key); // Remove corrupted items too
        }
      }
    }
    
    // Remove expired/corrupted items
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      cleanedCount++;
    });
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned ${cleanedCount} expired storage items`);
    }
    
    return cleanedCount;
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

// Auto-cleanup expired items on startup
secureStorage.cleanExpired();

// Periodic cleanup (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    secureStorage.cleanExpired();
  }, 5 * 60 * 1000);
}

/**
 * Enhanced Token Manager using Secure Storage
 */
export const tokenManager = {
  // Token keys
  ACCESS_TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_TYPE_KEY: 'token_type',
  USER_KEY: 'user',

  /**
   * Get access token
   */
  getToken(): string | null {
    return secureStorage.getItem(this.ACCESS_TOKEN_KEY);
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return secureStorage.getItem(this.REFRESH_TOKEN_KEY);
  },

  /**
   * Get token type
   */
  getTokenType(): string | null {
    return secureStorage.getItem(this.TOKEN_TYPE_KEY);
  },

  /**
   * Get user data
   */
  getUser(): any | null {
    const userStr = secureStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      logger.warn('Failed to parse user data:', error);
      this.removeUser();
      return null;
    }
  },

  /**
   * Store tokens securely
   * @param accessToken - The access token
   * @param refreshToken - The refresh token (optional)
   * @param user - User data (optional)
   * @param tokenType - Token type (default: 'Bearer')
   * @param expiresIn - Token expiration time in milliseconds (optional, uses server value or default)
   */
  setTokens(
    accessToken: string,
    refreshToken?: string,
    user?: any,
    tokenType: string = 'Bearer',
    expiresIn?: number
  ): boolean {
    // Use server-provided expiration or fall back to config default
    const tokenExpiry = expiresIn || config.security.sessionTimeout;

    console.log('tokenManager.setTokens - Saving tokens:', {
      accessToken: accessToken?.substring(0, 10) + '...',
      refreshToken: refreshToken?.substring(0, 10) + '...',
      user,
      tokenType,
      expiresIn: tokenExpiry,
      expiresAt: new Date(Date.now() + tokenExpiry).toISOString()
    });

    const results = [
      secureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken, {
        encrypt: true,
        expiresIn: tokenExpiry
      }),
      secureStorage.setItem(this.TOKEN_TYPE_KEY, tokenType, {
        encrypt: false,
        expiresIn: tokenExpiry
      })
    ];

    if (refreshToken) {
      results.push(
        secureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken, {
          encrypt: true,
          expiresIn: tokenExpiry * 2 // Longer expiry for refresh token
        })
      );
    }

    if (user) {
      results.push(
        secureStorage.setItem(this.USER_KEY, JSON.stringify(user), {
          encrypt: true,
          expiresIn: tokenExpiry
        })
      );
    }

    const success = results.every(result => result);
    console.log('tokenManager.setTokens - Results:', results, 'Success:', success);
    return success;
  },

  /**
   * Remove all tokens
   */
  removeTokens(): void {
    secureStorage.removeItem(this.ACCESS_TOKEN_KEY);
    secureStorage.removeItem(this.REFRESH_TOKEN_KEY);
    secureStorage.removeItem(this.TOKEN_TYPE_KEY);
    secureStorage.removeItem(this.USER_KEY);
    logger.info('All tokens removed from secure storage');
  },

  /**
   * Remove user data only
   */
  removeUser(): void {
    secureStorage.removeItem(this.USER_KEY);
  },

  /**
   * Check if user is authenticated (has valid access token)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const tokenType = this.getTokenType();
    return !!(token && tokenType);
  },

  /**
   * Check if token is about to expire
   */
  isTokenExpiringSoon(): boolean {
    const tokenInfo = secureStorage.getItemInfo(this.ACCESS_TOKEN_KEY);
    if (!tokenInfo || !tokenInfo.expiresAt) {
      return false;
    }

    const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
    return timeUntilExpiry < config.security.tokenRefreshThreshold;
  },

  /**
   * Get token info for debugging
   */
  getTokenInfo(): any {
    return {
      hasAccessToken: secureStorage.hasItem(this.ACCESS_TOKEN_KEY),
      hasRefreshToken: secureStorage.hasItem(this.REFRESH_TOKEN_KEY),
      hasUser: secureStorage.hasItem(this.USER_KEY),
      tokenType: this.getTokenType(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      accessTokenInfo: secureStorage.getItemInfo(this.ACCESS_TOKEN_KEY)
    };
  }
};

export default secureStorage;