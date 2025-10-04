import React from "react";
import NavbarLeftContent from "./NavbarLeftContent";
import NavbarRightContent from "./NavbarRightContent";

interface MinimalNavbarProps {
  professionalControls?: React.ReactNode;
}

const MinimalNavbar: React.FC<MinimalNavbarProps> = ({ professionalControls }) => {
  return (
    <header 
      className="bg-white shadow-sm fixed top-0 w-full border-b border-gray-200"
      style={{
        zIndex: 1000,
        position: 'fixed'
      }}
    >
      <nav className="flex items-center justify-between w-full h-14 px-4 max-w-none mx-auto">
        {/* Left Section - Logo */}
        <div className="flex items-center flex-shrink-0">
          <NavbarLeftContent />
        </div>
        
        {/* Middle Section - Professional Presentation Controls (only when provided) */}
        {professionalControls && (
          <div className="flex items-center justify-center flex-1 gap-2">
            {professionalControls}
          </div>
        )}
        
        {/* Right Section - Avatar Dropdown */}
        <div className="flex items-center justify-end flex-shrink-0">
          <NavbarRightContent />
        </div>
      </nav>
    </header>
  );
};

export default MinimalNavbar;
