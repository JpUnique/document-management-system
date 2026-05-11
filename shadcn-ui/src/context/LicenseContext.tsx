/**
 * License Context
 * Provides license state and validation throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { License, LicenseValidation } from '@/types/license';
import { validateLicense, activateLicense, getCurrentLicense } from '@/lib/licenseManager';

interface LicenseContextType {
  license: License | null;
  validation: LicenseValidation | null;
  isLicenseValid: boolean;
  isLoading: boolean;
  activateLicenseKey: (key: string) => Promise<LicenseValidation>;
  refreshLicense: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<License | null>(null);
  const [validation, setValidation] = useState<LicenseValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkLicense = () => {
    setIsLoading(true);
    const result = validateLicense();
    setValidation(result);
    
    if (result.isValid && result.license) {
      setLicense(result.license);
    } else {
      setLicense(null);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    checkLicense();
    
    // Check license every hour
    const interval = setInterval(checkLicense, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const activateLicenseKey = async (key: string): Promise<LicenseValidation> => {
    const result = activateLicense(key);
    
    if (result.isValid && result.license) {
      setLicense(result.license);
      setValidation(result);
    }
    
    return result;
  };

  const refreshLicense = () => {
    checkLicense();
  };

  return (
    <LicenseContext.Provider
      value={{
        license,
        validation,
        isLicenseValid: validation?.isValid || false,
        isLoading,
        activateLicenseKey,
        refreshLicense,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};