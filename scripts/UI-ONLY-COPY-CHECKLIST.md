# UI-Only Copy Checklist
## Copy This Project's UI to Another Project (NO Database)

---

## ✅ FILES TO COPY (Safe - Pure UI)

### Core UI Structure
- ✅ `src/pages/` - **ALL page files** (79 pages total)
- ✅ `src/components/` - **ALL component files**
- ✅ `src/hooks/use-mobile.tsx` - Mobile responsive hook
- ✅ `src/hooks/use-toast.ts` - Toast notifications
- ✅ `src/lib/utils.ts` - Utility functions
- ✅ `src/index.css` - **CRITICAL** Design system & styles
- ✅ `tailwind.config.ts` - **CRITICAL** Design tokens
- ✅ `public/` - All images and assets
- ✅ `src/App.tsx` - Main routing file
- ✅ `src/main.tsx` - Entry point

### Component Categories (All Safe)
- ✅ `src/components/ui/` - Shadcn UI components
- ✅ `src/components/layout/` - Layout components
- ✅ `src/components/feed/` - Feed UI
- ✅ `src/components/profile/` - Profile UI
- ✅ `src/components/admin/` - Admin UI
- ✅ `src/components/settings/` - Settings UI
- ✅ `src/components/auth/` - Auth forms (UI only, see notes below)

---

## ❌ FILES TO EXCLUDE (Database/Backend)

### Supabase Integration (SKIP ALL)
- ❌ `src/integrations/supabase/` - **ENTIRE FOLDER**
- ❌ `supabase/` - **ENTIRE FOLDER**
- ❌ `.env` - Contains database credentials
- ❌ `supabase/config.toml` - Supabase config

### Backend Services (SKIP ALL)
- ❌ `src/services/dynamicTokenManager.ts`
- ❌ `src/utils/auth/authGuard.ts`
- ❌ `src/utils/auth/immediateLogoutService.ts`
- ❌ `src/contexts/AuthContext.tsx` - Uses database auth
- ❌ `src/contexts/ProfileSettingsContext.tsx` - Uses database
- ❌ Any file with `supabase` imports

---

## ⚠️ FILES TO MODIFY (Remove Database Logic)

### Auth Components (Copy but Clean)
Files: `src/components/auth/*`, `src/pages/auth/*`
- ✅ Copy the UI/forms
- ❌ Remove all `supabase` imports
- ❌ Remove `signIn`, `signUp`, `signOut` calls
- ✅ Keep form validation & UI states
- 🔧 Replace with your new backend API calls

### Profile Pages (Copy but Clean)
Files: `src/pages/profile/*`, `src/components/profile/*`
- ✅ Copy all UI components
- ❌ Remove database queries (`.from()`, `.select()`, etc.)
- ✅ Keep static layouts and styling
- 🔧 Replace with your new data fetching

### Admin Pages (Copy but Clean)
Files: `src/pages/admin/*`, `src/components/admin/*`
- ✅ Copy all UI/tables/forms
- ❌ Remove all Supabase queries
- ✅ Keep dashboard layouts
- 🔧 Replace with your new admin API

### Other Data-Connected Pages
- `src/pages/Feed.tsx` - Remove post queries
- `src/pages/Messages.tsx` - Remove message queries
- `src/pages/Events.tsx` - Remove event queries
- `src/pages/Groups.tsx` - Remove group queries

---

## 🔧 STEP-BY-STEP COPY PROCESS

### Step 1: Export Project
```bash
# Method A: GitHub
1. Click GitHub button → Connect to GitHub
2. Clone repository
3. cd your-project-folder

# Method B: Download ZIP
1. Settings → Export Project → Download ZIP
2. Extract to folder
```

### Step 2: Copy Core Files
```bash
# Copy these folders AS-IS
cp -r src/components/ ../new-project/src/
cp -r src/pages/ ../new-project/src/
cp -r public/ ../new-project/
cp src/index.css ../new-project/src/
cp tailwind.config.ts ../new-project/
cp src/App.tsx ../new-project/src/
cp src/main.tsx ../new-project/src/
```

### Step 3: Clean Database References
```bash
# In new project, search and remove:
1. Find all: import.*supabase
2. Find all: from '@/integrations/supabase'
3. Find all: supabase.from(
4. Find all: supabase.auth
5. Delete found imports and calls
```

### Step 4: Install Dependencies
```bash
# In new project, keep these UI dependencies:
- @radix-ui/* (all Radix components)
- framer-motion
- lucide-react
- tailwindcss
- class-variance-authority
- clsx
- tailwind-merge

# REMOVE these (database-related):
- @supabase/supabase-js
- @tanstack/react-query (if only used for Supabase)
```

### Step 5: Replace Auth Context
Create new `src/contexts/AuthContext.tsx`:
```typescript
// Simple UI-only version (no database)
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState(null);
  
  // Add your new backend auth here
  const signIn = async (email: string, password: string) => {
    // Your API call
  };
  
  return (
    <AuthContext.Provider value={{ user, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 📋 QUICK CHECKLIST

Before copying:
- [ ] Backed up new project
- [ ] Have new backend API ready (optional)
- [ ] Understand which pages need data

During copy:
- [ ] Copied `src/components/` folder
- [ ] Copied `src/pages/` folder  
- [ ] Copied `public/` assets
- [ ] Copied `src/index.css`
- [ ] Copied `tailwind.config.ts`
- [ ] **SKIPPED** `src/integrations/supabase/`
- [ ] **SKIPPED** `supabase/` folder

After copy:
- [ ] Removed all `import { supabase }` statements
- [ ] Removed all database queries
- [ ] Replaced AuthContext with new version
- [ ] Updated data fetching with new backend
- [ ] Tested routing (App.tsx)
- [ ] Verified design system loads (index.css)

---

## 🎨 WHAT YOU GET (UI Only)

### ✅ Preserved
- All page layouts and designs
- All UI components (buttons, forms, cards, etc.)
- Complete design system (colors, fonts, spacing)
- All animations and transitions
- Routing structure
- Responsive layouts
- All images and icons

### ❌ Not Included
- User authentication
- Database queries
- Real-time updates
- File uploads to storage
- Backend logic
- Edge functions

---

## 💡 TIPS

1. **Start Small**: Copy one page at a time, test, then continue
2. **Mock Data**: Create `src/data/mockData.ts` for testing UI with fake data
3. **Keep Design System**: `index.css` and `tailwind.config.ts` are CRITICAL
4. **Router First**: Ensure App.tsx routing works before adding data
5. **Components Last**: Get pages working, then refine components

---

## 🆘 COMMON ISSUES

**Error: Cannot find module '@/integrations/supabase'**
- ✅ Remove the import line completely
- ✅ Remove the function that uses it

**Error: useAuth is not defined**
- ✅ Create new AuthContext (see Step 5)
- ✅ Or remove auth-protected routes temporarily

**Styles not working**
- ✅ Ensure `index.css` is copied
- ✅ Ensure `tailwind.config.ts` is copied
- ✅ Check `@` path alias in vite.config.ts

**Pages are blank**
- ✅ Check for removed data queries causing errors
- ✅ Use mock data for testing
- ✅ Check browser console for errors

---

## 📞 SUMMARY

**Total UI Files**: ~200+ files (pages + components)
**Total Size**: UI code only (no database)
**Estimated Time**: 1-2 hours for full copy + cleanup
**Complexity**: Medium (requires removing database code)

**Best For**: 
- Reusing UI in new project with different backend
- Creating design system template
- Starting new project with proven UI

**Not For**:
- Full project duplication (use remix/fork instead)
- Keeping all functionality (this is UI only)
