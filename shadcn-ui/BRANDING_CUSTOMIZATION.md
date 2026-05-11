# 🎨 Branding Customization Guide

This guide explains how to customize the logo, app name, and branding for your Document Management System.

## 📋 Quick Start

All branding settings are centralized in one file: **`src/config/branding.ts`**

## 🔧 How to Customize

### 1. **Change Application Name**

Edit `/workspace/shadcn-ui/src/config/branding.ts`:

```typescript
export const BRANDING = {
  // Application Name
  appName: 'Your App Name',           // Full name (e.g., "MyDocs Pro")
  appNameShort: 'YourApp',            // Short name for sidebar (e.g., "MyDocs")
  
  // Company/Organization
  companyName: 'Your Company Name',   // Your company name
  ...
}
```

### 2. **Replace Logo**

**Option A: Use Your Own Logo File**

1. Place your logo file in the `public/` folder (e.g., `public/my-logo.png`)
2. Update the logo path in `src/config/branding.ts`:

```typescript
logo: {
  path: '/my-logo.png',              // Path relative to public/ folder
  width: 40,                         // Logo width in pixels
  height: 40,                        // Logo height in pixels
  alt: 'Your Company Logo',          // Alternative text
},
```

**Option B: Use the Default Logo**

The default logo is at `/favicon.svg`. You can replace this file with your own logo.

**Supported Logo Formats:**
- SVG (recommended - scalable)
- PNG (with transparency)
- JPG/JPEG
- WebP

### 3. **Change Color Scheme**

Update the primary colors in `src/config/branding.ts`:

```typescript
colors: {
  primary: 'blue',    // Options: blue, purple, green, red, orange, pink, indigo
  accent: 'indigo',   // Accent color for highlights
},
```

### 4. **Update Metadata (SEO)**

Change the page title and description:

```typescript
metadata: {
  title: 'Your App - Document Management',
  description: 'Your custom description here',
  author: 'Your Company Name',
},
```

### 5. **Customize Footer**

Update footer information:

```typescript
footer: {
  copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
  version: '1.0.0',
},
```

### 6. **Add Contact Information**

```typescript
contact: {
  email: 'support@yourcompany.com',
  website: 'https://yourcompany.com',
},
```

## 📁 Files That Use Branding

The branding configuration is automatically applied to:

- ✅ **Sidebar** - Logo and app name
- ✅ **Login Page** - App name and logo
- ✅ **Browser Tab** - Title and favicon
- ✅ **All Pages** - Consistent branding throughout

## 🎯 Example: Complete Customization

Here's a complete example for a company called "TechCorp":

```typescript
export const BRANDING = {
  appName: 'TechCorp DocHub',
  appNameShort: 'DocHub',
  companyName: 'TechCorp Solutions',
  
  logo: {
    path: '/techcorp-logo.svg',
    width: 40,
    height: 40,
    alt: 'TechCorp DocHub Logo',
  },
  
  colors: {
    primary: 'purple',
    accent: 'pink',
  },
  
  metadata: {
    title: 'TechCorp DocHub - Enterprise Document Management',
    description: 'Secure enterprise document management for TechCorp',
    author: 'TechCorp Solutions',
  },
  
  footer: {
    copyright: `© ${new Date().getFullYear()} TechCorp Solutions. All rights reserved.`,
    version: '2.0.0',
  },
  
  contact: {
    email: 'support@techcorp.com',
    website: 'https://techcorp.com',
  },
};
```

## 🚀 Apply Changes

After making changes:

1. **Save the file** (`src/config/branding.ts`)
2. **Rebuild the project**:
   ```bash
   cd /workspace/shadcn-ui
   pnpm run build
   ```
3. **Deploy**:
   ```bash
   # The deployment will be handled automatically
   ```

## 📝 Notes

- **Logo Recommendations:**
  - Use SVG format for best quality at any size
  - Keep logo simple and recognizable
  - Ensure good contrast with background
  - Recommended size: 40x40px to 64x64px

- **Color Scheme:**
  - Choose colors that match your brand
  - Ensure good contrast for accessibility
  - Test on both light and dark backgrounds

- **Favicon:**
  - The favicon (browser tab icon) uses the same logo
  - Place your favicon at `public/favicon.svg` or `public/favicon.png`

## 🆘 Troubleshooting

**Logo not showing?**
- Check the file path is correct (relative to `public/` folder)
- Verify the image file exists
- Clear browser cache (Ctrl+Shift+Delete)

**Colors not changing?**
- Make sure you're using valid Tailwind color names
- Rebuild the project after changes
- Hard refresh the browser (Ctrl+F5)

**Changes not visible?**
- Clear browser cache
- Rebuild: `pnpm run build`
- Redeploy the application

## 📞 Need Help?

If you encounter any issues with customization, please contact support or refer to the main documentation.