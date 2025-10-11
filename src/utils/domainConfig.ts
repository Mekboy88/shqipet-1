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