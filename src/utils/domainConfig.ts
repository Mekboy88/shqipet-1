// Domain constants
export const PRIMARY_DOMAINS = ['shqipet.com', 'www.shqipet.com'];
export const MOBILE_SUBDOMAIN = 'm.shqipet.com';

// Dynamic domain config - detects actual domain
export const getDomainConfig = () => {
  const hostname = window?.location?.hostname || 'localhost';
  const origin = window?.location?.origin || 'http://localhost:3000';
  
  const isCustomDomain = hostname === 'shqipet.com' || hostname === 'www.shqipet.com';
  const isPrimary = hostname === 'shqipet.com';
  
  return {
    domain: hostname,
    isCustomDomain,
    baseUrl: origin,
    supabaseUrl: ''
  };
};

// Domain helpers for mobile subdomain redirect
export const isPrimaryDomain = () => {
  if (typeof window === 'undefined') return false;
  return PRIMARY_DOMAINS.includes(window.location.hostname);
};

export const isMobileSubdomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === MOBILE_SUBDOMAIN;
};

export const buildUrlFor = (host: string) => {
  if (typeof window === 'undefined') return `https://${host}`;
  const { pathname, search, hash } = window.location;
  return `https://${host}${pathname}${search}${hash}`;
};

export const shouldRedirectToPrimary = () => {
  const hostname = window?.location?.hostname;
  // Redirect www.shqipet.com to shqipet.com
  if (hostname === 'www.shqipet.com') {
    return `https://shqipet.com${window.location.pathname}${window.location.search}`;
  }
  return null;
};

export const isDomainAccessible = async () => true;

export const isOnCustomDomain = () => {
  const hostname = window?.location?.hostname || 'localhost';
  return hostname === 'shqipet.com' || hostname === 'www.shqipet.com';
};

export const isOnPrimaryDomain = () => {
  const hostname = window?.location?.hostname || 'localhost';
  return hostname === 'shqipet.com';
};