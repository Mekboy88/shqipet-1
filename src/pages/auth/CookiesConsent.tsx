
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Info, HelpCircle, Settings, Check, X, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Logo } from '@/components/common/Logo';
import CookiesToggleSection from '@/components/auth/cookies/CookiesToggleSection';
const CookiesConsent = () => {
  const navigate = useNavigate();
  const [cookiePreferences, setCookiePreferences] = useState({
    strictlyNecessary: true,
    functional: false,
    analytics: false,
    advertising: false,
    thirdPartyCookies: false,
    externalCookies: false
  });

useEffect(() => {
  // Only allow access if user just registered (prevent showing before login)
  const isNewUser = localStorage.getItem('isNewUser');
  if (!isNewUser) {
    console.log('🚫 Cookie consent: Not a new user, redirecting to login');
    navigate('/auth/login', { replace: true });
    return;
  }

  // Initialize from saved preferences for cross-platform sync and set SEO title/meta
  try {
    const saved = localStorage.getItem('cookiePreferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCookiePreferences(prev => ({ ...prev, ...parsed }));
    }
  } catch {}
  document.title = 'Cookies Consent | Shqipet';
  const metaDesc = 'Manage cookie preferences: functional, analytics, advertising, third-party and external cookies.';
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = metaDesc;
}, [navigate]);

const handleToggleChange = (type: 'thirdPartyCookies' | 'externalCookies') => {
  setCookiePreferences((prev) => ({
    ...prev,
    [type]: !prev[type]
  }));
};

  const handlePreferenceToggle = (key: 'functional' | 'analytics' | 'advertising') => {
    setCookiePreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAllowAll = () => {
    setCookiePreferences({
      strictlyNecessary: true,
      functional: true,
      analytics: true,
      advertising: true,
      thirdPartyCookies: true,
      externalCookies: true
    });
    
    // Save the preferences (in a real app, store these in localStorage or a database)
    savePreferences({
      strictlyNecessary: true,
      functional: true,
      analytics: true,
      advertising: true,
      thirdPartyCookies: true,
      externalCookies: true
    });
    
    toast.success('All cookies have been allowed');
    navigate('/welcome');
  };

  const handleDeclineOptional = () => {
    setCookiePreferences({
      strictlyNecessary: true,
      functional: false,
      analytics: false,
      advertising: false,
      thirdPartyCookies: false,
      externalCookies: false
    });
    
    // Save the preferences (in a real app, store these in localStorage or a database)
    savePreferences({
      strictlyNecessary: true,
      functional: false,
      analytics: false,
      advertising: false,
      thirdPartyCookies: false,
      externalCookies: false
    });
    
    toast.success('Optional cookies have been declined');
    navigate('/welcome');
  };

const savePreferences = (preferences: typeof cookiePreferences) => {
  // 1. Store the preferences in localStorage (shared across web and mobile)
  localStorage.setItem('cookiePreferences', JSON.stringify(preferences));

  // 2. Mark consent captured so banners don’t reappear
  localStorage.setItem('cookieConsent', 'true');
  localStorage.setItem('consentTimestamp', new Date().toISOString());

  // 3. Clear the new user flag (cookies consent completed)
  localStorage.removeItem('isNewUser');

  // 4. Send to backend or analytics if needed (stubbed)
  console.log('Cookie preferences saved:', preferences);
  console.log('Consent logged at:', new Date().toISOString());
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-cookies-start)/0.28)] via-[hsl(var(--gradient-cookies-mid)/0.24)] to-[hsl(var(--gradient-cookies-end)/0.32)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-5xl space-y-6 relative">
        {/* Logo header (same as login) */}
        <header className="flex justify-center -mt-10 md:-mt-14">
          <div className="flex items-center -mt-12 md:-mt-20 mb-2 px-3 py-2">
            <div className="mr-3 h-16 w-16">
              <img
                src="/lovable-uploads/ba308a67-0663-462f-8a64-8109e2c3b1d6.png"
                alt="Albanian Eagle"
                className="h-full w-full object-contain logo-eagle opacity-25"
              />
            </div>
            <Logo size="xl" className="text-5xl font-cinzel whitespace-nowrap opacity-25" />
            <div className="ml-3 h-16 w-16">
              <img
                src="/lovable-uploads/ba308a67-0663-462f-8a64-8109e2c3b1d6.png"
                alt="Albanian Eagle"
                className="h-full w-full object-contain logo-eagle opacity-25"
              />
            </div>
          </div>
        </header>
        {/* Top cookie banner */}
        <div className="bg-white rounded-xl shadow-md shadow-inner ring-1 ring-black/5 p-4 relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <img src="/icons/cookie-custom.svg" alt="Cookie consent icon" className="w-8 h-8 absolute left-4 top-4" aria-hidden />
          <div className="flex items-start gap-3 pl-12">
            <div className="flex-1">
              <h2 className="text-base font-semibold">We use cookies to improve your experience</h2>
              <p className="text-sm text-gray-600">This website uses cookies to enhance site navigation, analyze usage, and assist in our marketing efforts. You can manage your preferences or accept all cookies.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => document.getElementById('manage-cookies')?.scrollIntoView({ behavior: 'smooth' })}>Customise</Button>
            <Button variant="outline" onClick={handleDeclineOptional}>Reject all</Button>
            <Button onClick={handleAllowAll}>Accept all</Button>
          </div>
        </div>

        {/* Main preferences panel */}
        <div className="bg-white rounded-xl shadow-md shadow-inner ring-1 ring-black/5 p-6 relative">
          {/* Edge-only shade via inner shadow and ring */}
          <button aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>

          <div id="manage-cookies" className="mb-6">
            <h3 className="text-lg font-medium">Manage Cookie preferences</h3>
            <p className="text-sm text-gray-600">This website uses cookies to enhance site navigation, analyze usage, and assist in our marketing efforts. You can manage your preferences or accept all cookies. See our Cookie Policy and Privacy Policy for more details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* Preferences list */}
            <div className="md:col-span-3 space-y-4">
              {/* Strictly necessary */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Strictly necessary Cookies</h4>
                    <p className="text-sm text-gray-600">These cookies are essential for the website to function and cannot be switched off in our systems.</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock className="w-4 h-4" />
                    <Switch checked disabled aria-readonly />
                  </div>
                </div>
              </div>

              {/* Functional */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Functional Cookies</h4>
                    <p className="text-sm text-gray-600">Enable enhanced functionality and personalization, such as remembering your preferences.</p>
                  </div>
                  <Switch
                    checked={cookiePreferences.functional}
                    onCheckedChange={() => handlePreferenceToggle('functional')}
                  />
                </div>
              </div>

              {/* Analytics */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600">Help us understand how visitors interact with the website by collecting and reporting information anonymously.</p>
                  </div>
                  <Switch
                    checked={cookiePreferences.analytics}
                    onCheckedChange={() => handlePreferenceToggle('analytics')}
                  />
                </div>
              </div>

              {/* Advertising */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Advertising Cookies</h4>
                    <p className="text-sm text-gray-600">Used to deliver advertisements more relevant to you and your interests.</p>
                  </div>
                  <Switch
                    checked={cookiePreferences.advertising}
                    onCheckedChange={() => handlePreferenceToggle('advertising')}
                  />
                </div>
              </div>

              {/* Third-party & External cookie controls (kept in sync with mobile) */}
              <CookiesToggleSection
                cookiePreferences={{
                  thirdPartyCookies: cookiePreferences.thirdPartyCookies,
                  externalCookies: cookiePreferences.externalCookies
                }}
                onToggleChange={handleToggleChange}
              />
            </div>

            {/* Illustration placeholder */}
            <aside className="hidden md:block md:col-span-3">
              <div className="w-full h-full min-h-[600px] rounded-lg overflow-hidden">
                <img
                  src="/lovable-uploads/1f82b6a2-ffe7-4772-a798-4d4bfda635d7.png"
                  alt="Shqipet cookies consent illustration thumbs up"
                  className="w-full h-full object-fill"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </aside>
          </div>

          {/* Bottom action bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-6 mt-6 border-t">
            <Button variant="secondary" onClick={handleDeclineOptional}>Reject All</Button>
            <Button variant="outline" onClick={handleAllowAll}>Accept all</Button>
            <Button variant="gradient" onClick={() => { savePreferences(cookiePreferences); toast.success('Preferences saved'); navigate('/welcome'); }}>Confirm Choices</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesConsent;
