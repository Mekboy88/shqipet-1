
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CookiesToggleSectionProps {
  cookiePreferences: {
    thirdPartyCookies: boolean;
    externalCookies: boolean;
  };
  onToggleChange: (type: 'thirdPartyCookies' | 'externalCookies') => void;
}

const CookiesToggleSection: React.FC<CookiesToggleSectionProps> = ({ 
  cookiePreferences, 
  onToggleChange 
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    thirdPartyHow: false,
    thirdPartyAllow: false,
    thirdPartyDecline: false,
    externalHow: false,
    externalAllow: false,
    externalDecline: false,
    externalCategories: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Third Party Cookies Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Our cookies on other apps and websites</h4>
            <p className="text-sm text-gray-600">
              Allow Shqipet to use cookies on other companies' websites and apps to personalize your ads and experiences.
            </p>
          </div>
          
          <Switch
            checked={cookiePreferences.thirdPartyCookies}
            onCheckedChange={() => onToggleChange('thirdPartyCookies')}
          />
        </div>
        
        <div className="space-y-2 ml-2 mt-3">
          {/* How we use these cookies */}
          <Collapsible open={openSections.thirdPartyHow}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('thirdPartyHow')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.thirdPartyHow ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              How we use these cookies
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <p>
                We use these cookies for personalizing content, tailoring ads, analytics, 
                measurement, security, integrity, and improving user experience across our partner sites.
              </p>
            </CollapsibleContent>
          </Collapsible>
          
          {/* If you allow these cookies */}
          <Collapsible open={openSections.thirdPartyAllow}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('thirdPartyAllow')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.thirdPartyAllow ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              If you allow these cookies
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <p>
                You will receive personalized content and ads tailored to your interests 
                and improved user experiences across Shqipet and partner sites.
              </p>
            </CollapsibleContent>
          </Collapsible>
          
          {/* If you don't allow these cookies */}
          <Collapsible open={openSections.thirdPartyDecline}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('thirdPartyDecline')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.thirdPartyDecline ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              If you don't allow these cookies
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <p>
                You may still use Shqipet, but content and ads may not be personalized 
                to your interests when visiting other websites and applications.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      
      {/* External Company Cookies Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Cookies from other companies</h4>
            <p className="text-sm text-gray-600">
              Allow cookies from other companies to enhance your experiences and show you relevant content outside Shqipet.
            </p>
          </div>
          
          <Switch
            checked={cookiePreferences.externalCookies}
            onCheckedChange={() => onToggleChange('externalCookies')}
          />
        </div>
        
        <div className="space-y-2 ml-2 mt-3">
          {/* Choose cookies by category */}
          <Collapsible open={openSections.externalCategories}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('externalCategories')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.externalCategories ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              Choose cookies by category
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p>Analytics</p>
                  <Switch checked={cookiePreferences.externalCookies} disabled={!cookiePreferences.externalCookies} />
                </div>
                <div className="flex items-center justify-between">
                  <p>Advertising</p>
                  <Switch checked={cookiePreferences.externalCookies} disabled={!cookiePreferences.externalCookies} />
                </div>
                <div className="flex items-center justify-between">
                  <p>Functional</p>
                  <Switch checked={cookiePreferences.externalCookies} disabled={!cookiePreferences.externalCookies} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          {/* How we use these cookies */}
          <Collapsible open={openSections.externalHow}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('externalHow')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.externalHow ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              How we use these cookies
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <p>
                These cookies help provide enhanced features like maps and videos, and show 
                you personalized content from our partner companies based on your browsing habits.
              </p>
            </CollapsibleContent>
          </Collapsible>
          
          {/* If you allow these cookies */}
          <Collapsible open={openSections.externalAllow}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('externalAllow')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.externalAllow ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              If you allow these cookies
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <p>
                You'll enjoy enhanced features like interactive maps, videos, and personalized 
                recommendations from our partners based on your interests.
              </p>
            </CollapsibleContent>
          </Collapsible>
          
          {/* If you don't allow these cookies */}
          <Collapsible open={openSections.externalDecline}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('externalDecline')}
              className="flex items-center text-gray-700 hover:text-gray-900 text-sm"
            >
              {openSections.externalDecline ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              If you don't allow these cookies
            </CollapsibleTrigger>
            <CollapsibleContent className="text-sm text-gray-600 pl-6 pt-2">
              <p>
                Certain enhanced features might not be available, and content from our partners 
                may not be personalized to your interests.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default CookiesToggleSection;
