
import React from 'react';
import { Logo } from '@/components/common/Logo';
import { useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';

const LoginLogo = () => {
  const location = useLocation();
  const isLoginPage = location.pathname.includes('/login');
  
  // Generate QR code data for mobile login
  const qrCodeData = `shqipet://auth/login?timestamp=${Date.now()}`;

  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <div className="flex items-center mb-4">
        <div className="mr-3 h-16 w-16">
          <img 
            src="/lovable-uploads/ba308a67-0663-462f-8a64-8109e2c3b1d6.png" 
            alt="Albanian Eagle" 
            className="h-full w-full object-contain logo-eagle"
            style={{
              filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))",
              WebkitFilter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))"
            }}
          />
        </div>
        <Logo size="xl" className="text-5xl font-cinzel whitespace-nowrap" />
        <div className="ml-3 h-16 w-16">
          <img 
            src="/lovable-uploads/ba308a67-0663-462f-8a64-8109e2c3b1d6.png" 
            alt="Albanian Eagle" 
            className="h-full w-full object-contain logo-eagle"
            style={{
              filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))",
              WebkitFilter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))"
            }}
          />
        </div>
      </div>

      {/* QR Code for Mobile Login */}
      {isLoginPage && (
        <div className="w-full mt-6 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border inline-block">
            <QRCode 
              value={qrCodeData}
              size={160}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto">
            <p className="font-medium text-foreground mb-1">
              Hyr në llogari
            </p>
            <p>
              Për t'u identifikuar në llogarinë tuaj, ju lutemi skanoni kodin QR me aplikacionin Shqipet në celularin tuaj.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginLogo;
