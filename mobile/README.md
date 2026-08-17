# LoadYar Mobile App

Offline-first React Native mobile application for the LoadYar Transport Management System. Drivers can view trips, update status, track expenses, and manage delivery checklists with full offline support.

## Tech Stack

- **Framework:** React Native (Expo 50.0)
- **Language:** TypeScript
- **State Management:** Zustand
- **Navigation:** React Navigation
- **Storage:** AsyncStorage (key-value), SQLite (relational - future)
- **HTTP:** Axios with offline-first queueing
- **Date Handling:** Day.js

## Architecture

### Offline-First Design

1. **Local Storage:** AsyncStorage for immediate data access
2. **Sync Queue:** Failed requests queued with retry logic (max 3 attempts)
3. **Auto-Sync:** Automatic sync when connection restored
4. **Caching:** GET requests cached locally, returned if offline

### State Management (Zustand)

Two main stores:

- **`useAuthStore`**: Handles login, tenant selection, session restoration
- **`useTripsStore`**: Manages trip CRUD, filtering, and status updates

### Services

- **`storageService`**: Abstraction over AsyncStorage for auth, user context, sync queue
- **`apiClient`**: Axios wrapper with offline-first behavior, auto-sync, caching

## Project Structure

```
mobile/
├── App.tsx                         # Entry point
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── src/
│   ├── navigation/
│   │   └── RootNavigator.tsx       # Navigation structure (Auth → Main with tabs)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx     # Username + password login
│   │   │   └── TenantSelectScreen.tsx # Workspace selection
│   │   └── main/
│   │       ├── TripsScreen.tsx     # Trips list with filtering & offline sync
│   │       ├── TripDetailScreen.tsx # Trip detail + status update
│   │       ├── ProfileScreen.tsx    # User profile & logout
│   │       └── SettingsScreen.tsx   # Sync settings, clear cache, app info
│   ├── store/
│   │   ├── auth.ts                 # Auth state + login/logout/selectTenant
│   │   └── trips.ts                # Trips state + CRUD operations
│   ├── services/
│   │   ├── storage.ts              # AsyncStorage abstraction
│   │   └── api.ts                  # Axios + offline-first + sync queue
│   └── components/
│       └── SyncIndicator.tsx       # Reusable sync status badge
└── README.md                       # This file
```

## Setup & Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd mobile
npm install
```

### Environment Variables

Create `.env` if using environment-specific API URLs:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Run on Mobile/Emulator

```bash
# Start Expo dev server (shows QR code)
npm start

# Android emulator
npm run android

# iOS simulator (macOS only)
npm run ios

# Web (for testing, limited feature support)
npm run web
```

### TypeScript

App uses strict TypeScript mode. Check types:

```bash
npx tsc --noEmit
```

## Key Features

### 1. Authentication

- **Login Screen:** Username + password with error handling and rate limiting (backend enforced)
- **Tenant Selection:** Multi-tenant support with workspace switcher
- **Session Restoration:** Auto-login if token still valid on app launch
- **Logout:** Clears token, user context, and sync queue

### 2. Trip Management

- **List with Filters:** All trips grouped by status (Booked, In Transit, Delivered, Closed)
- **Details View:** Bilty #, freight amount, consignee, carrier/driver info
- **Status Updates:** Mark trip as next status (booked → in_transit → delivered → closed)
- **Offline Support:** Trips cached locally, status updates queued if offline

### 3. Offline-First Sync

- **Auto-Queue:** POST/PATCH/DELETE auto-queued if offline
- **Cache GET:** Successful GET responses cached to AsyncStorage
- **Manual Sync:** "Sync Now" button in Settings
- **Auto-Sync on Online:** Queued operations resume when connection restored
- **Retry Logic:** Max 3 retries before removing failed operations
- **Sync Indicator:** Shows pending changes count and last sync time

### 4. Profile & Settings

- **Profile:** User name, role, workspace info
- **Settings:**
  - Auto-Sync toggle (queues changes automatically when online)
  - Offline Mode toggle (work with cached data only)
  - Manual Sync button
  - Clear offline data option
  - App version, build info

## API Integration

All API calls go through `apiClient` which handles:

1. **Auto Token Injection:** Bearer token from storage added to all requests
2. **Offline Detection:** Falls back to cache or queue based on request type
3. **Sync Queue:** Stores failed operations with status tracking
4. **Retry Logic:** Retries up to 3 times before removal

### Backend Endpoints Used

```
POST   /auth/login              → { access_token, user, tenant }
GET    /auth/tenants            → Tenant[]
GET    /trips                   → Trip[]
GET    /trips/status/:status    → Trip[]
GET    /trips/:id               → Trip
POST   /trips                   → Trip
PATCH  /trips/:id               → Trip
```

## Development Workflow

### Adding a New Screen

1. Create screen file in `src/screens/{folder}/ScreenName.tsx`
2. Add to navigator in `RootNavigator.tsx`
3. Use Zustand store (or create new one) for state
4. Import `apiClient` or `storageService` for backend/storage access

### Adding a New Zustand Store

```typescript
import { create } from 'zustand';

interface MyState {
  items: any[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
}

export const useMyStore = create<MyState>((set) => ({
  items: [],
  isLoading: false,
  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/items');
      set({ items: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
```

### Testing Offline Behavior

1. **Android Emulator:** Dev menu → Network tab → toggle network
2. **iOS Simulator:** Simulator → Features → Network Link Conditioner
3. **Manual:** Call `apiClient.setOnline(false)` to simulate offline mode

## Performance Considerations

- **Lazy Load Screens:** Each tab navigator loads screens on-demand
- **Minimal Re-renders:** Zustand only updates components that subscribe to changed fields
- **Debounce Sync:** Sync only triggered on app foreground, manual button, or network change
- **Cache Expiry:** GET cache stored but never auto-expired (user manually clears)

## Future Enhancements

- GPS tracking and real-time location updates
- Driver checklist integration (28-item inspection form)
- Expense tracking and receipt photos (WhatsApp integration)
- Push notifications (delivery status, new trips assigned)
- SQLite migration for relational data (SQLite too large for current offline queue)
- Biometric authentication (fingerprint/face unlock)

## Troubleshooting

### App Won't Connect to Backend

- Verify `EXPO_PUBLIC_API_URL` environment variable
- Check backend is running on correct port (default: 3001)
- On Android emulator, use `10.0.2.2` instead of `localhost`

### Sync Queue Stuck

- Clear cache in Settings → "Clear Offline Data"
- Check backend is accessible: `curl http://localhost:3001/api/v1/health`
- Check bearer token hasn't expired (auto-logout and re-login)

### TypeScript Errors

Run `npx tsc --noEmit` to see all type issues, then fix in source files.

## Contributing

- Follow TypeScript strict mode
- Use Zustand for state, not React Context
- Prefer stateless (functional) components
- Keep screens under 400 LOC; extract to components
- Test offline behavior on real device or emulator

---

**Version:** 1.0.0  
**Last Updated:** 2026-08-17  
**Status:** Week 7 Mobile App Foundation Complete
