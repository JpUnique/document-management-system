/**
 * License Management System
 * Handles license key generation, validation, and storage
 */

import { License, LicenseValidation, GenerateLicenseParams } from '@/types/license';

const LICENSE_STORAGE_KEY = 'docmanager_license';
const LICENSES_DB_KEY = 'docmanager_licenses_db';

/**
 * Generate a secure 24-character license key
 * Always returns UPPERCASE keys for consistency
 */
export const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters (already uppercase)
  let key = '';
  
  for (let i = 0; i < 24; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    key += chars[randomIndex];
    
    // Add hyphens every 6 characters for readability (optional)
    if ((i + 1) % 6 === 0 && i < 23) {
      key += '-';
    }
  }
  
  console.log('🔑 Generated license key:', key);
  return key.toUpperCase(); // Ensure uppercase
};

/**
 * Generate a new license
 */
export const generateLicense = (params: GenerateLicenseParams): License => {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setFullYear(expiryDate.getFullYear() + params.durationYears);
  
  const license: License = {
    key: generateLicenseKey(),
    clientName: params.clientName,
    email: params.email,
    issuedDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    status: 'active',
    features: params.features || ['all'],
  };
  
  return license;
};

/**
 * Save license to database (admin use)
 */
export const saveLicenseToDatabase = (license: License): void => {
  try {
    console.log('💾 saveLicenseToDatabase called');
    console.log('  Input license:', license);
    
    // Ensure the license key is uppercase before saving
    const normalizedLicense = {
      ...license,
      key: license.key.toUpperCase()
    };
    
    console.log('  Normalized license key:', normalizedLicense.key);
    
    const licensesStr = localStorage.getItem(LICENSES_DB_KEY) || '[]';
    console.log('  Current localStorage value:', licensesStr);
    
    const licenses: License[] = JSON.parse(licensesStr);
    console.log('  Parsed licenses array length:', licenses.length);
    
    console.log('💾 Saving license to database...');
    console.log('  Original key:', license.key);
    console.log('  Normalized key:', normalizedLicense.key);
    console.log('  Current licenses in DB:', licenses.length);
    
    // Check if license key already exists (case-insensitive)
    const existingIndex = licenses.findIndex(l => 
      l.key.replace(/[-\s]/g, '').toUpperCase() === normalizedLicense.key.replace(/[-\s]/g, '').toUpperCase()
    );
    
    if (existingIndex >= 0) {
      console.log('  Updating existing license at index:', existingIndex);
      licenses[existingIndex] = normalizedLicense;
    } else {
      console.log('  Adding new license');
      licenses.push(normalizedLicense);
    }
    
    localStorage.setItem(LICENSES_DB_KEY, JSON.stringify(licenses));
    console.log('✅ License saved successfully. Total licenses:', licenses.length);
    
    // Verify it was saved
    const verifyStr = localStorage.getItem(LICENSES_DB_KEY);
    const verifyLicenses = JSON.parse(verifyStr || '[]');
    console.log('🔍 Verification - licenses in DB after save:', verifyLicenses.length);
    verifyLicenses.forEach((lic: License, idx: number) => {
      console.log(`  License ${idx + 1}: ${lic.key} (${lic.clientName})`);
    });
  } catch (error) {
    console.error('❌ Failed to save license to database:', error);
    throw new Error('Failed to save license');
  }
};

/**
 * Get all licenses from database (admin use)
 */
export const getAllLicenses = (): License[] => {
  try {
    const licensesStr = localStorage.getItem(LICENSES_DB_KEY) || '[]';
    return JSON.parse(licensesStr);
  } catch (error) {
    console.error('Failed to load licenses:', error);
    return [];
  }
};

/**
 * Activate a license (user use)
 */
export const activateLicense = (licenseKey: string): LicenseValidation => {
  try {
    // Remove hyphens and spaces for validation, convert to uppercase
    const cleanKey = licenseKey.replace(/[-\s]/g, '').toUpperCase();
    
    console.log('🔍 Activating license...');
    console.log('  Input key:', licenseKey);
    console.log('  Cleaned key:', cleanKey);
    console.log('  Key length:', cleanKey.length);
    
    // Get all licenses from database
    const licenses = getAllLicenses();
    console.log('  Total licenses in DB:', licenses.length);
    
    if (licenses.length === 0) {
      console.error('❌ No licenses found in database!');
      return {
        isValid: false,
        error: 'No licenses found in the system. Please contact your administrator.',
      };
    }
    
    // Log all license keys for debugging
    licenses.forEach((lic, idx) => {
      const licClean = lic.key.replace(/[-\s]/g, '').toUpperCase();
      console.log(`  License ${idx + 1}: "${lic.key}" -> cleaned: "${licClean}" (match: ${licClean === cleanKey})`);
    });
    
    const license = licenses.find(l => l.key.replace(/[-\s]/g, '').toUpperCase() === cleanKey);
    
    if (!license) {
      console.error('❌ License not found in database');
      return {
        isValid: false,
        error: 'Invalid license key. Please check your key and try again.',
      };
    }
    
    console.log('✅ License found:', license.clientName);
    
    // Check if license is expired
    const now = new Date();
    const expiryDate = new Date(license.expiryDate);
    
    if (now > expiryDate) {
      license.status = 'expired';
      saveLicenseToDatabase(license);
      
      return {
        isValid: false,
        error: 'This license has expired. Please contact support to renew.',
      };
    }
    
    // Check if license is revoked
    if (license.status === 'revoked') {
      return {
        isValid: false,
        error: 'This license has been revoked. Please contact support.',
      };
    }
    
    // License is valid, save to local storage
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license));
    
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isValid: true,
      license,
      daysRemaining,
    };
  } catch (error) {
    console.error('License activation error:', error);
    return {
      isValid: false,
      error: 'An error occurred during license activation.',
    };
  }
};

/**
 * Validate current license
 */
export const validateLicense = (): LicenseValidation => {
  try {
    const licenseStr = localStorage.getItem(LICENSE_STORAGE_KEY);
    
    if (!licenseStr) {
      return {
        isValid: false,
        error: 'No license found. Please activate your license.',
      };
    }
    
    const license: License = JSON.parse(licenseStr);
    const now = new Date();
    const expiryDate = new Date(license.expiryDate);
    
    // Check if expired
    if (now > expiryDate) {
      return {
        isValid: false,
        license,
        error: 'Your license has expired. Please renew to continue using the application.',
      };
    }
    
    // Check if revoked
    if (license.status === 'revoked') {
      return {
        isValid: false,
        license,
        error: 'Your license has been revoked. Please contact support.',
      };
    }
    
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isValid: true,
      license,
      daysRemaining,
    };
  } catch (error) {
    console.error('License validation error:', error);
    return {
      isValid: false,
      error: 'Failed to validate license.',
    };
  }
};

/**
 * Revoke a license (admin use)
 */
export const revokeLicense = (licenseKey: string): boolean => {
  try {
    const licenses = getAllLicenses();
    const license = licenses.find(l => l.key === licenseKey);
    
    if (!license) {
      return false;
    }
    
    license.status = 'revoked';
    saveLicenseToDatabase(license);
    return true;
  } catch (error) {
    console.error('Failed to revoke license:', error);
    return false;
  }
};

/**
 * Get current license info
 */
export const getCurrentLicense = (): License | null => {
  try {
    const licenseStr = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!licenseStr) return null;
    return JSON.parse(licenseStr);
  } catch (error) {
    console.error('Failed to get current license:', error);
    return null;
  }
};

/**
 * Clear current license (logout/deactivate)
 */
export const clearLicense = (): void => {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
};