import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import LoginLogo from '@/components/auth/LoginLogo';

const LandingPublic: React.FC = () => {
  return (
    <div className="h-screen w-screen fixed inset-0 flex flex-col md:flex-row overflow-hidden">
      {/* Left side with rich red gradient background - hidden on small screens */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-start px-8 lg:px-16 bg-gradient-to-r from-red-500 via-red-600 to-red-900 relative">
        {/* Metallic highlight overlay for glossy effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 via-transparent to-red-950/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/10 to-transparent"></div>
      </div>
      
      {/* Right side login form with logo at the top - responsive width */}
      <div className="w-full md:w-[480px] lg:w-[510px] bg-white flex flex-col">
        <div className="pt-6 md:pt-8 px-4 md:px-8">
          <LoginLogo />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LandingPublic;
