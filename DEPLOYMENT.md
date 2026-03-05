# Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables are set in `.env.local`
- [ ] Firebase security rules are configured
- [ ] Tested all features locally
- [ ] No sensitive data in codebase
- [ ] `.env.local` is in `.gitignore`
- [ ] Built project successfully: `npm run build`

## Deployment to Vercel (Recommended)

### Step 1: Prepare Code

```bash
# Ensure no uncommitted changes
git status

# Build locally to verify
npm run build

# Push to GitHub
git push origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Grant Vercel access to your repositories

### Step 3: Deploy

1. Click "New Project"
2. Select your repository from GitHub
3. Click "Import"
4. Configure project:
   - Framework: Next.js (auto-detected)
   - Root Directory: ./ (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### Step 4: Add Environment Variables

1. In Vercel dashboard, go to Settings → Environment Variables
2. Add each variable from `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_FIREBASE_DATABASE_URL
   ```
3. Click "Save"

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-5 minutes)
3. Your app will be live at `your-project.vercel.app`

### Step 6: Configure Domain (Optional)

1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records with Vercel's nameservers

## Deployment to Other Platforms

### Netlify

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Add environment variables in dashboard
4. Deploy

### AWS Amplify

1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

### Self-Hosted (Railway, Render, etc.)

1. Set up Node.js environment
2. Add environment variables
3. Run: `npm install && npm run build && npm start`
4. Configure reverse proxy (nginx/apache)

## Post-Deployment

### Verify Deployment

1. Visit deployed URL
2. Test sign up / login
3. Create test society
4. Add test financial year
5. Add test transactions
6. Verify all features work

### Monitor Performance

- Check Vercel Analytics (if using Vercel)
- Monitor Firebase usage
- Set up error tracking (optional: Sentry)

### Database Optimization

- Monitor Firestore read/write usage
- Set up indexes for frequently queried collections
- Archive old financial years if needed

## Troubleshooting Deployment

### Build Fails

- Check build logs in platform dashboard
- Verify TypeScript has no errors: `npx tsc --noEmit`
- Clear cache and rebuild

### Environment Variables Not Working

- Verify variable names match `.env.local`
- Ensure variables are marked as public (NEXT*PUBLIC*)
- Redeploy after adding variables

### Firebase Connection Issues

- Verify Firebase project allows your domain
- Check CORS settings in Firebase Console
- Ensure security rules allow access

### Slow Performance

- Upgrade Firebase plan if needed
- Enable caching in your deployment platform
- Optimize images and assets

## Rollback

### If Deployment Has Issues

1. Go to Vercel Deployments
2. Click "Rollback" on previous successful deployment
3. Or redeploy from specific commit

## Continuous Integration/Deployment

### Auto-Deploy on Push

Vercel automatically deploys on push to main branch.

### Branch Previews

Push to any branch to get preview URL (if connected to Vercel).

## Security Considerations

- [ ] Never commit `.env.local` or `.env` files
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Configure Firebase security rules
- [ ] Set up billing alerts in Firebase
- [ ] Monitor Firebase for unusual activity
- [ ] Regular security updates to dependencies

## Monitoring & Maintenance

### Weekly

- Check error logs
- Monitor database usage
- Review new user signups

### Monthly

- Update dependencies: `npm update`
- Review Firebase security rules
- Backup important data

### Quarterly

- Performance audit
- Security scan
- Cost analysis

## Scaling Considerations

### As User Base Grows

1. **Firebase**: Consider upgrading from free to Blaze plan
2. **Database**: Set up database replicas in multiple regions
3. **CDN**: Enable Vercel Pro for advanced caching
4. **Monitoring**: Implement proper error tracking

### Optimization Tips

- Implement pagination for large lists
- Add database indexes
- Cache frequently accessed data
- Optimize images and assets
- Consider API rate limiting

## Support & Help

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev

## Production Checklist

Before going live with real users:

- [ ] Security rules reviewed and tested
- [ ] Error handling implemented
- [ ] Logging enabled
- [ ] Backup strategy in place
- [ ] User data privacy policy ready
- [ ] Support email configured
- [ ] Performance tested under load
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested
- [ ] SSL certificate active
- [ ] Monitoring and alerts configured
- [ ] Disaster recovery plan documented
