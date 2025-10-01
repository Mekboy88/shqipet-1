import React from "react";
import NavbarLeftContent from "./NavbarLeftContent";
import NavbarCenterSectionNoTooltip from "./NavbarCenterSectionNoTooltip";
import NavbarRightContent from "./NavbarRightContent";
const NavbarLayoutNoTooltip = () => {
  console.log('🏗️ NavbarLayoutNoTooltip rendering');
  return <nav className="flex items-center w-full h-14 relative py-0 px-2 sm:px-4 max-w-none mx-auto">
      {/* Left Section - Logo - Responsive width */}
      <div className="flex items-center flex-shrink-0" style={{
      width: 'clamp(180px, 20vw, 280px)'
    }}>
        <NavbarLeftContent />
      </div>
      
      {/* Center Section - Navigation - Fully flexible and centered */}
      <div className="flex-1 flex items-center justify-center min-w-0 ml-[320px] mr-[20px]">
        <NavbarCenterSectionNoTooltip />
      </div>
      
      {/* Right Section - Actions - Responsive width */}
      <div className="flex items-center justify-end flex-shrink-0" style={{
      width: 'clamp(180px, 20vw, 280px)'
    }}>
        <NavbarRightContent />
      </div>
    </nav>;
};
export default NavbarLayoutNoTooltip;