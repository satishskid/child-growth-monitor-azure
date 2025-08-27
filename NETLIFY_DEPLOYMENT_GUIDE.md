# Child Growth Monitor PWA - Netlify Deployment Guide

## 🚀 Complete Deployment & Authentication Setup

This guide provides step-by-step instructions for deploying the Child Growth Monitor PWA to Netlify with progressive authentication setup.

## 📋 Prerequisites

- Netlify account (free at netlify.com)
- Auth0 account (free at auth0.com) - for Phase 2
- The PWA zip files (already created in `/web-app/` directory)

## 🎯 Deployment Strategy

### Phase 1: Basic Deployment with Password Protection (Week 1)
### Phase 2: Professional Auth0 Integration (Week 2)
### Phase 3: Advanced User Management (Ongoing)

---

## 📦 Phase 1: Netlify Deployment with Password Protection

### Step 1: Deploy to Netlify

1. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign up for free account or log in

2. **Deploy Your PWA**
   - Click "Add new site" → "Deploy manually"
   - Drag and drop the `child-growth-monitor-mobile-pwa-complete.zip` file
   - **OR** extract the zip and drag the `dist/` folder
   - Wait for deployment to complete

3. **Configure Site Settings**
   ```
   Site Name: child-growth-monitor-[your-org]
   Custom Domain: (optional) your-domain.com
   ```

4. **Test Deployment**
   - Click on the generated URL (e.g., `https://amazing-site-123456.netlify.app`)
   - Verify PWA loads correctly
   - Test "Add to Home Screen" on mobile

### Step 2: Enable Password Protection

1. **Access Site Settings**
   - Go to Site Dashboard
   - Click "Site settings" → "Access control"

2. **Enable Password Protection**
   ```
   ✅ Enable "Visitor access"
   ✅ Select "Password protection"
   ✅ Set a strong password (e.g., "HealthWorker2025!")
   ✅ Save settings
   ```

3. **Test Password Protection**
   - Visit your site URL
   - Verify password prompt appears
   - Test login with the password
   - Confirm PWA works after authentication

### Step 3: Distribute to Users

1. **Create User Instructions**
   ```
   Site URL: https://your-site.netlify.app
   Password: [your-password]
   
   Instructions:
   1. Open the URL on your mobile device
   2. Enter the password when prompted
   3. Tap "Add to Home Screen" when offered
   4. Use the app offline after installation
   ```

2. **Create QR Code** (Optional)
   - Use any QR code generator
   - Create QR code for your site URL
   - Print on cards for easy distribution

### Step 4: Monitor Usage

1. **Analytics Dashboard**
   - Netlify Dashboard → Analytics
   - Monitor page views and user activity
   - Track PWA installation rates

2. **Access Logs**
   - Functions → View logs
   - Monitor authentication attempts
   - Track usage patterns

---

## 🔐 Phase 2: Auth0 Integration (Professional Authentication)

### Step 1: Create Auth0 Account

1. **Sign Up**
   - Go to [auth0.com](https://auth0.com)
   - Create free account
   - Choose region closest to your users

2. **Create Application**
   ```
   Application Type: Single Page Application
   Name: Child Growth Monitor PWA
   Technology: JavaScript
   ```

3. **Configure Application Settings**
   ```
   Allowed Callback URLs:
   https://your-site.netlify.app,
   https://your-site.netlify.app/callback
   
   Allowed Logout URLs:
   https://your-site.netlify.app
   
   Allowed Web Origins:
   https://your-site.netlify.app
   
   Allowed Origins (CORS):
   https://your-site.netlify.app
   ```

### Step 2: Configure Netlify Environment Variables

1. **Get Auth0 Credentials**
   ```
   Domain: your-tenant.auth0.com
   Client ID: [copy from Auth0 dashboard]
   Client Secret: [copy from Auth0 dashboard]
   ```

2. **Add to Netlify**
   - Site Dashboard → Site settings → Environment variables
   - Add the following variables:
   ```
   AUTH0_DOMAIN=your-tenant.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_CALLBACK_URL=https://your-site.netlify.app/callback
   ```

### Step 3: Update Site Configuration

1. **Create `_redirects` File**
   ```
   # Protect entire site with Auth0
   /*    /.netlify/functions/auth    200
   /public/*    /public/:splat    200
   ```

2. **Create `netlify.toml` Configuration**
   ```toml
   [build]
     publish = "dist"
   
   [context.production.environment]
     NODE_ENV = "production"
   
   [[redirects]]
     from = "/api/auth/*"
     to = "/.netlify/functions/auth/:splat"
     status = 200
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
     conditions = {Role = ["user", "admin"]}
   ```

### Step 4: Deploy Auth0 Integration

1. **Disable Password Protection**
   - Site settings → Access control
   - Disable password protection
   - Save changes

2. **Redeploy Site**
   - Trigger new deployment
   - Monitor build logs for errors
   - Test Auth0 login flow

### Step 5: User Management with Auth0

1. **Create Users**
   ```
   Auth0 Dashboard → User Management → Users
   → Create User
   
   Email: healthworker@organization.com
   Password: [temporary password]
   Send verification email: ✅
   ```

2. **Bulk User Import** (Optional)
   ```
   Auth0 Dashboard → User Management → Users
   → Import Users
   
   Upload CSV with:
   email,email_verified,name
   worker1@org.com,true,Health Worker 1
   worker2@org.com,true,Health Worker 2
   ```

3. **Set User Roles**
   ```
   Create Roles:
   - admin: Full access, user management
   - health_worker: PWA access, data collection
   - supervisor: View reports, monitor usage
   
   Assign roles to users in Auth0 dashboard
   ```

---

## 👥 Phase 3: Advanced User Management

### User Lifecycle Management

1. **Onboarding New Users**
   ```
   1. Create user in Auth0 dashboard
   2. Send invitation email
   3. User sets permanent password
   4. Assign appropriate role
   5. Monitor first login
   ```

2. **Revoking Access**
   ```
   Immediate:
   - Auth0 Dashboard → Users → Block User
   
   Permanent:
   - Delete user account
   - Remove from all roles
   ```

3. **Regular Access Reviews**
   ```
   Monthly:
   - Review active users
   - Remove inactive accounts
   - Update roles as needed
   - Monitor login patterns
   ```

### Monitoring & Analytics

1. **Auth0 Logs**
   ```
   Monitor:
   - Successful logins
   - Failed login attempts
   - Password reset requests
   - Suspicious activity
   ```

2. **Netlify Analytics**
   ```
   Track:
   - Page views
   - User sessions
   - Geographic distribution
   - Device types
   ```

### Security Best Practices

1. **Multi-Factor Authentication**
   ```
   Auth0 Dashboard → Security → Multi-factor Auth
   Enable for admin users
   Optional for health workers
   ```

2. **Session Management**
   ```
   Configure:
   - Session timeout: 8 hours
   - Idle timeout: 2 hours
   - Remember me: 30 days
   ```

3. **IP Restrictions** (Optional)
   ```
   Auth0 Dashboard → Security → Attack Protection
   Configure IP allowlists for sensitive environments
   ```

---

## 🚨 Troubleshooting

### Common Issues

1. **PWA Not Installing**
   ```
   Check:
   - HTTPS enabled (required for PWA)
   - manifest.json accessible
   - Service worker registered
   - Icons properly sized
   ```

2. **Auth0 Login Fails**
   ```
   Verify:
   - Callback URLs match exactly
   - Environment variables set correctly
   - CORS settings configured
   - Domain spelling correct
   ```

3. **Camera Not Working**
   ```
   Ensure:
   - HTTPS connection (required for camera)
   - Camera permissions granted
   - Browser supports getUserMedia
   - Good lighting conditions
   ```

### Support Resources

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Auth0 Docs**: [auth0.com/docs](https://auth0.com/docs)
- **PWA Guide**: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps)

---

## 📊 Success Metrics

### Phase 1 Success Criteria
- ✅ PWA deployed and accessible
- ✅ Password protection working
- ✅ Mobile installation successful
- ✅ Offline functionality confirmed

### Phase 2 Success Criteria
- ✅ Auth0 integration complete
- ✅ Individual user accounts created
- ✅ Role-based access working
- ✅ User management operational

### Phase 3 Success Criteria
- ✅ Regular access reviews implemented
- ✅ Security monitoring active
- ✅ User lifecycle processes defined
- ✅ Analytics and reporting functional

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** with a small group of users
2. **Gather feedback** on user experience
3. **Monitor usage patterns** and performance
4. **Scale gradually** to full user base
5. **Implement regular security reviews**
6. **Plan for updates** and maintenance

---

**Deployment Status**: Ready for Phase 1  
**Last Updated**: January 2025  
**Version**: 2.0 with Video BMI Analysis

**Support Contact**: [Your contact information]