# Logo Customization Guide

## Current Logo Location
The logo is located at: `/public/assets/images/logo.png`

## How to Replace the Logo

### Method 1: Replace the File Directly
1. Navigate to `/workspace/shadcn-ui/public/assets/images/`
2. Replace `logo.png` with your new logo file
3. Keep the same filename: `logo.png`
4. Recommended size: 64x64 pixels or larger (square format works best)
5. Supported formats: PNG (with transparency), JPG, SVG

### Method 2: Use a Different File
1. Upload your logo to `/public/assets/images/`
2. Update the logo path in these files:

**File 1: `/src/components/layout/Sidebar.tsx`**
- Line 130: Change `<img src="/assets/images/logo.png" ...` to your new path

**File 2: `/src/pages/Login.tsx`**
- Line 59: Change `<img src="/assets/images/logo.png" ...` to your new path

**File 3: `/index.html`**
- Line 6: Change the favicon link if desired

### Method 3: Use an External URL
You can also use a logo from an external URL:
```tsx
<img src="https://your-domain.com/your-logo.png" alt="Logo" />
```

## Logo Usage Locations
The logo appears in:
1. **Sidebar** - Top left corner (32x32px display size)
2. **Login Page** - Center top (64x64px display size)
3. **Favicon** - Browser tab icon

## Quick Logo Update Command
If you have a new logo file, you can copy it using:
```bash
cp /path/to/your/new-logo.png /workspace/shadcn-ui/public/assets/images/logo.png
```

## Tips
- Use PNG format with transparent background for best results
- Keep file size under 100KB for faster loading
- Square aspect ratio (1:1) works best
- Higher resolution (256x256 or 512x512) allows for better quality at different sizes