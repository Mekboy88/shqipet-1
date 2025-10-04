import React from "react";
import NavbarLeftContent from "./NavbarLeftContent";
import NavbarRightContent from "./NavbarRightContent";

const MinimalNavbar: React.FC = () => {
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
        
        {/* Right Section - Avatar Dropdown */}
        <div className="flex items-center justify-end flex-shrink-0">
          <NavbarRightContent />
        </div>
      </nav>
    </header>
  );
};

export default MinimalNavbar;
