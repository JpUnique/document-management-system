/**
 * License Management Types
 */

export interface License {
  key: string;
  clientName: string;
  email: string;
  issuedDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'revoked';
  features?: string[];
}

export interface LicenseValidation {
  isValid: boolean;
  license?: License;
  error?: string;
  daysRemaining?: number;
}

export interface GenerateLicenseParams {
  clientName: string;
  email: string;
  durationYears: number;
  features?: string[];
}