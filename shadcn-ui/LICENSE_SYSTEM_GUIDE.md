# 🔐 License Key System Guide

This guide explains how to use the license key system for your Document Management System.

## 📋 Overview

The license system provides:
- ✅ Secure 24-character license keys
- ✅ Yearly expiration tracking
- ✅ Admin tool for generating keys
- ✅ License activation UI
- ✅ Automatic validation on login
- ✅ License revocation capability

## 🎯 How It Works

### **For Administrators (Super Admin)**

#### 1. **Generate License Keys**

1. Login as admin (username: `admin`, password: `PdAdmin`)
2. Navigate to **License Management** from the sidebar
3. Click **"Generate New License"**
4. Fill in the form:
   - **Client Name**: Company or individual name
   - **Email**: Client's email address
   - **Duration**: Select 1, 2, 3, 5, or 10 years
5. Click **"Generate License"**
6. Copy the generated 24-character key
7. Send the key to your client

**License Key Format:**
```
XXXXXX-XXXXXX-XXXXXX-XXXXXX
```
Example: `A2B4C6-D8E9F2-G3H5J7-K8M9N4`

#### 2. **View All Licenses**

The License Management page shows:
- Client name and email
- License key (with copy button)
- Issue date and expiry date
- Status (Active, Expired, Revoked)
- Actions (Revoke button for active licenses)

#### 3. **Revoke a License**

1. Find the license in the table
2. Click the **trash icon** (🗑️) in the Actions column
3. Confirm the revocation
4. The license will be immediately revoked

### **For End Users (Clients)**

#### 1. **Activate License**

When you first access the application:

1. You'll see a license warning on the login page
2. Click **"Activate License"** or go to `/activate-license`
3. Enter your 24-character license key
4. Click **"Activate License"**
5. If valid, you'll be redirected to login

**Tips:**
- Hyphens are optional (they're added automatically)
- Keys are case-insensitive
- Spaces are ignored

#### 2. **Check License Status**

Your license is automatically validated:
- On every login attempt
- Every hour while using the app
- When accessing protected pages

#### 3. **License Expiration**

When your license expires:
- You'll see an error on login
- You cannot access the application
- Contact your administrator for renewal

## 🔧 Technical Details

### **Storage**

Licenses are stored in two places:

1. **License Database** (`docmanager_licenses_db`):
   - All generated licenses
   - Admin access only
   - Used for validation

2. **Active License** (`docmanager_license`):
   - Current user's activated license
   - Validated on login
   - Cleared on logout

### **License Object Structure**

```typescript
{
  key: string;              // 24-character license key
  clientName: string;       // Client's name
  email: string;            // Client's email
  issuedDate: string;       // ISO date string
  expiryDate: string;       // ISO date string
  status: 'active' | 'expired' | 'revoked';
  features?: string[];      // Optional feature flags
}
```

### **Validation Flow**

```
User attempts login
    ↓
Check if license exists
    ↓
Validate license key against database
    ↓
Check expiration date
    ↓
Check revocation status
    ↓
Allow/Deny login
```

## 🚀 Quick Start Guide

### **For Administrators:**

```bash
# 1. Login as admin
Username: admin
Password: PdAdmin

# 2. Go to License Management
Sidebar → License Management

# 3. Generate a license
Click "Generate New License"
Fill in client details
Copy the generated key

# 4. Send key to client
Email or securely share the key
```

### **For Clients:**

```bash
# 1. Go to activation page
Visit: /activate-license

# 2. Enter license key
Format: XXXXXX-XXXXXX-XXXXXX-XXXXXX

# 3. Activate
Click "Activate License"

# 4. Login
Use your credentials to login
```

## 📊 License Status Meanings

| Status | Description | User Impact |
|--------|-------------|-------------|
| **Active** | License is valid and not expired | Full access to application |
| **Expired** | License has passed expiry date | Cannot login, needs renewal |
| **Revoked** | Admin has revoked the license | Cannot login, contact admin |

## 🔒 Security Features

1. **Secure Key Generation**
   - 24 random characters
   - Excludes ambiguous characters (0, O, I, 1)
   - Cryptographically random

2. **Validation**
   - Keys validated against database
   - Expiration checked on every login
   - Hourly validation while active

3. **Admin-Only Management**
   - Only admins can generate keys
   - Only admins can revoke licenses
   - License database protected

## 🛠️ Troubleshooting

### **"Invalid license key" Error**

**Possible causes:**
- Key was typed incorrectly
- Key doesn't exist in database
- Extra spaces or characters

**Solution:**
- Copy-paste the key directly
- Remove any extra spaces
- Contact administrator to verify key

### **"License has expired" Error**

**Cause:** The license expiration date has passed

**Solution:**
- Contact administrator for renewal
- Administrator generates new license
- Activate new license key

### **"License has been revoked" Error**

**Cause:** Administrator revoked the license

**Solution:**
- Contact administrator
- Resolve any issues
- Request new license if appropriate

### **Cannot Access License Management**

**Cause:** Not logged in as admin

**Solution:**
- Login with admin credentials
- Only admin role can access license management

## 📝 Best Practices

### **For Administrators:**

1. **Keep Records**
   - Document which client has which key
   - Note expiration dates
   - Track renewal dates

2. **Regular Audits**
   - Review active licenses monthly
   - Revoke unused licenses
   - Clean up expired licenses

3. **Secure Distribution**
   - Send keys via secure channels
   - Don't share keys publicly
   - Use one key per client

### **For Clients:**

1. **Save Your Key**
   - Store key in secure location
   - Don't share with others
   - Keep backup copy

2. **Monitor Expiration**
   - Note your expiration date
   - Request renewal in advance
   - Don't wait until last minute

3. **Report Issues**
   - Contact admin immediately if key doesn't work
   - Report any suspicious activity
   - Keep admin contact information handy

## 🔄 License Renewal Process

1. **Client requests renewal** (before expiration)
2. **Admin generates new license** (1+ year duration)
3. **Admin sends new key to client**
4. **Client activates new key**
5. **Old license automatically replaced**

## 📞 Support

If you encounter any issues with the license system:

1. **Check this guide** for troubleshooting steps
2. **Contact your administrator** for license-related issues
3. **Verify your license status** in the License Management page (admin only)

## 🎓 Example Scenarios

### **Scenario 1: New Client Setup**

```
Admin:
1. Client purchases license
2. Generate license (1 year)
3. Send key: A2B4C6-D8E9F2-G3H5J7-K8M9N4
4. Provide login credentials

Client:
1. Visit /activate-license
2. Enter key: A2B4C6-D8E9F2-G3H5J7-K8M9N4
3. Click Activate
4. Login with credentials
```

### **Scenario 2: License Expiring Soon**

```
30 days before expiration:
- Client receives renewal notice
- Client requests renewal
- Admin generates new 1-year license
- Client activates new key
- Seamless transition
```

### **Scenario 3: Revoke Compromised License**

```
Admin:
1. Detect suspicious activity
2. Go to License Management
3. Find the license
4. Click revoke button
5. Confirm revocation

Result:
- User immediately locked out
- Cannot login with revoked key
- New key required for access
```

## 📚 Additional Resources

- **Branding Customization**: See `BRANDING_CUSTOMIZATION.md`
- **User Management**: See sidebar → User Management
- **System Documentation**: See `README.md`

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-26  
**Support:** Contact your system administrator