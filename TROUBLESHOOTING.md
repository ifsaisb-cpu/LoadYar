# 🔧 Troubleshooting Guide

**Last Updated:** Aug 19, 2026  
**Based on:** Real deployment challenges and solutions

---

## 📋 Common Issues & Solutions

### 1. **CORS Error: Multiple values in Access-Control-Allow-Origin header**

**Error:**
```
Access-Control-Allow-Origin header contains multiple values 
'http://localhost:3000,https://app.loadyar.pk'
```

**Cause:** Backend CORS config returning comma-separated origins as single header value.

**Solution:** Use callback function to validate each origin individually
```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);  // Return single origin
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

**File:** `backend/src/main.ts` (lines 21-34)

---

### 2. **Frontend Styling: Dark/Inverted Colors**

**Error:** Page displays with dark background, black text on dark (unreadable)

**Cause:** Tailwind CSS applying system dark mode but colors not configured.

**Solution:** 
1. Set `darkMode: 'class'` in `tailwind.config.js`
2. Add explicit light mode colors to body in `index.css`

```css
body {
  @apply bg-white text-gray-900;
}
```

**Files:** 
- `frontend/tailwind.config.js` (line 4)
- `frontend/src/index.css` (line 20)

---

### 3. **PostCSS Not Processing Tailwind Directives**

**Error:** CSS not being applied, page unstyled

**Cause:** Missing `postcss.config.cjs` file

**Solution:** Create `postcss.config.cjs`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Also:** Install dependencies:
```bash
npm install autoprefixer postcss --save-dev
```

**File:** `frontend/postcss.config.cjs`

---

### 4. **GitHub Actions: Missing @nestjs/config Package**

**Error:**
```
TS2307: Cannot find module '@nestjs/config' or its corresponding type declarations
```

**Cause:** Package in `app.module.ts` but not in `package.json`

**Solution:** Add to dependencies:
```bash
npm install @nestjs/config
```

**File:** `backend/package.json` (dependencies section)

---

### 5. **DigitalOcean Build Failure: No Build Command Defined**

**Error:**
```
Build failed
Node version not specified in package.json
A module may be missing from dependencies
```

**Cause:** Auto-detection from GitHub couldn't handle separate backend/frontend structure

**Solution:** Manually configure build commands for each service:
- Backend: `cd backend && npm install && npm run build`
- Frontend: `cd frontend && npm install && npm run build`

**Note:** DigitalOcean auto-detect works for single-folder projects only.

---

### 6. **Vercel Deployment Failure**

**Error:** Build succeeded (1455 modules transformed) but deployment marked failed

**Cause:** Domain configuration issue, not app code

**Solution:** Use preview URL instead of production domain:
- `https://load-yar-git-main-tari5.vercel.app/`

**Alternative:** Use local deployment with Cloudflare Tunnel for faster, simpler launch

---

### 7. **Windows Defender Blocking ngrok/Tunneling Tools**

**Error:** Windows Security warning when running ngrok

**Solution:** Add to Windows Defender Firewall exceptions:
1. Windows Defender Firewall → Allow an app through firewall
2. Change settings → Allow another app
3. Browse for `ngrok.exe`, add it
4. Click OK

**Alternative:** Use `npx localtunnel --port 3001` (no installation needed)

---

## 🔄 Deployment Issues & Solutions

### Issue: Cloud Deployments Keep Failing

**What we tried:**
1. ❌ DigitalOcean App Platform - Build configuration too complex
2. ❌ Vercel - Works but production domain issues
3. ✅ **Local + Cloudflare Tunnel** - Simplest, fastest, most reliable

**Why local deployment works:**
- Code is proven to work on development machine
- No build/configuration uncertainties
- Can test end-to-end before going public
- Simple one-command tunnel via Cloudflare
- Perfect for MVP/Day 1 launch

---

## 🧪 Testing Checklist Before Launch

- [ ] Backend starts: `npm run start:prod` in `backend/` folder
- [ ] Backend responds: `curl http://localhost:3001/health`
- [ ] Frontend starts: `npm run preview` in `frontend/` folder
- [ ] Frontend loads: `http://localhost:5173` in browser
- [ ] API calls work: Dashboard loads data from backend
- [ ] Styling correct: White background, proper colors
- [ ] CORS working: No 403/CORS errors in console
- [ ] WebSocket connecting: Real-time updates working

---

## 📊 Performance & Optimization

**If Performance is Slow:**

1. **Check database connection:**
   ```bash
   # Verify PostgreSQL is running
   psql -U postgres -d loadyar_db -c "SELECT 1;"
   ```

2. **Check backend logs:**
   ```
   Look for slow queries (>500ms)
   Check for connection pool exhaustion
   ```

3. **Check frontend:**
   ```
   DevTools Network tab - look for slow API calls
   Check for unoptimized images/assets
   Profile with DevTools Performance tab
   ```

---

## 🔐 Security Verification

Before production launch, verify:

- [ ] JWT secret is strong (not default)
- [ ] CORS origins whitelist only trusted domains
- [ ] Database password is strong
- [ ] No console.log() with sensitive data
- [ ] Rate limiting enabled (3 failed attempts = 15 min lockout)
- [ ] HTTPS/TLS enabled for production URL
- [ ] No hardcoded API keys/secrets in code

---

## 📞 Emergency Contacts

**If deployment fails on launch day:**

1. **Check logs first:**
   - Backend: `npm run start:prod` output
   - Frontend: Browser console (F12)
   - Network: `curl http://localhost:3001/health`

2. **Restart services:**
   - Stop: Ctrl+C in terminals
   - Wait 3 seconds
   - Start: Re-run `npm run start:prod` and `npm run preview`

3. **Last resort:**
   - Revert to previous git commit
   - Check LAUNCH.md step-by-step

---

## 📚 Git History

All troubleshooting is documented in git commits:

```bash
git log --oneline
```

Key commits:
- `a6046e4` - Add launch guide
- `0afa85a` - Fix GitHub Actions workflow  
- `f3d6404` - Fix styling (light mode + CORS)
- `91ae765` - Add package-lock.json
```

---

**Remember:** You've solved everything before. Trust the process! 💪
