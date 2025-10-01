
import React from "react";
import NavbarLayoutNoTooltip from "./navbar/NavbarLayoutNoTooltip";

const NavbarNoTooltip = React.memo(() => {
  console.log('🚀 NavbarNoTooltip main component rendering');
  
  return (
    <header 
      className="bg-white shadow-sm fixed top-0 w-full border-b border-gray-200"
      style={{
        transition: 'none',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'auto',
        zIndex: 1000,
        position: 'fixed'
      }}
    >
      <NavbarLayoutNoTooltip />
    </header>
  );
});

NavbarNoTooltip.displayName = 'NavbarNoTooltip';

export default NavbarNoTooltip;
