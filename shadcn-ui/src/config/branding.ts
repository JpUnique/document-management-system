/**
 * Branding Configuration
 * 
 * Customize your application's branding here.
 * All changes in this file will be reflected throughout the entire application.
 */

export const BRANDING = {
  // Application Name
  appName: 'DocManager Pro',
  appNameShort: 'DocManager',
  
  // Company/Organization
  companyName: 'Your Company Name',
  
  // Logo Configuration
  logo: {
    // Path to your logo file (place in public/ folder)
    // Default: /favicon.svg
    path: '/favicon.svg',
    
    // Logo dimensions
    width: 40,
    height: 40,
    
    // Alternative text for accessibility
    alt: 'DocManager Pro Logo',
  },
  
  // Color Scheme (Tailwind CSS classes)
  colors: {
    primary: 'blue', // Options: blue, purple, green, red, orange, etc.
    accent: 'indigo',
  },
  
  // Metadata for SEO
  metadata: {
    title: 'DocManager Pro - Document Management System',
    description: 'Professional document management system with secure storage and collaboration features',
    author: 'Your Company Name',
  },
  
  // Footer Information
  footer: {
    copyright: `© ${new Date().getFullYear()} Your Company Name. All rights reserved.`,
    version: '1.0.0',
  },
  
  // Contact Information (optional)
  contact: {
    email: 'support@yourcompany.com',
    website: 'https://yourcompany.com',
  },
};

// Helper function to get full logo URL
export const getLogoUrl = () => {
  return BRANDING.logo.path;
};

// Helper function to get app title
export const getAppTitle = (pageTitle?: string) => {
  if (pageTitle) {
    return `${pageTitle} - ${BRANDING.appName}`;
  }
  return BRANDING.appName;
};