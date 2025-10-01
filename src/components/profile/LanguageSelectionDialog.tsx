import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetPortal } from '@/components/ui/sheet';
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Alphabetically sorted world languages with more countries
const worldLanguages: Language[] = [
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Shqip', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'am', name: 'Amharikisht', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ar', name: 'Arabisht', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hy', name: 'Armenisht', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbajxhanisht', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'eu', name: 'Baskisht', nativeName: 'Euskera', flag: '🇪🇸' },
  { code: 'be', name: 'Bjellorusisht', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengalisht', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'bs', name: 'Boshnjakisht', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'bg', name: 'Bullgarisht', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'my', name: 'Burmisht', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'ca', name: 'Katalanisht', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'zh', name: 'Kinezisht', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hr', name: 'Kroatisht', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'cs', name: 'Çekisht', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Danisht', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'nl', name: 'Holandisht', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'Anglisht', nativeName: 'English', flag: '🇺🇸' },
  { code: 'et', name: 'Estonisht', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'fi', name: 'Finlandisht', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'fr', name: 'Frëngjisht', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'gl', name: 'Galicianisht', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'ka', name: 'Gjeorgjisht', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'de', name: 'Gjermanisht', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', name: 'Greqisht', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujaratisht', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitianisht', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausisht', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'he', name: 'Hebraisht', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindisht', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hu', name: 'Hungarisht', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'is', name: 'Islandisht', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'id', name: 'Indonezisht', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ga', name: 'Irlandisht', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'it', name: 'Italisht', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japonisht', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'kn', name: 'Kannadisht', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakisht', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'km', name: 'Khmerisht', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'ko', name: 'Koreanisht', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ku', name: 'Kurdisht', nativeName: 'Kurdî', flag: '🇮🇶' },
  { code: 'ky', name: 'Kirgizisht', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'lo', name: 'Laoisht', nativeName: 'ລາວ', flag: '🇱🇦' },
  { code: 'la', name: 'Latinisht', nativeName: 'Latina', flag: '🇻🇦' },
  { code: 'lv', name: 'Letonisht', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lituanisht', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lb', name: 'Luksemburgisht', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'mk', name: 'Maqedonisht', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasisht', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malajisht', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalamisht', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltisht', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'mi', name: 'Maorisht', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathisht', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolisht', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'ne', name: 'Nepalisht', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'no', name: 'Norvegjisht', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'or', name: 'Odiaisht', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ps', name: 'Pashtunisht', nativeName: 'پښتو', flag: '🇦🇫' },
  { code: 'fa', name: 'Persianisht', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'pl', name: 'Polonisht', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'pt', name: 'Portugalisht', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'pa', name: 'Punxhabisht', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ro', name: 'Rumanisht', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'ru', name: 'Rusisht', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'sm', name: 'Samoanisht', nativeName: 'Gagana Samoa', flag: '🇼🇸' },
  { code: 'gd', name: 'Skotisht Gaelisht', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbisht', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'st', name: 'Sesothoisht', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shonaisht', nativeName: 'chiShona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhisht', nativeName: 'سنڌي', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhalisht', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'sk', name: 'Sllovakisht', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Sllovenisht', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'so', name: 'Somalisht', nativeName: 'Soomaali', flag: '🇸🇴' },
  { code: 'es', name: 'Spanjisht', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'su', name: 'Sundanisht', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahilisht', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'sv', name: 'Suedisht', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'tg', name: 'Taxhikisht', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamilisht', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatarisht', nativeName: 'Татарча', flag: '🇷🇺' },
  { code: 'te', name: 'Telugisht', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'th', name: 'Tajlandisht', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'ti', name: 'Tigrinjaisht', nativeName: 'ትግርኛ', flag: '🇪🇷' },
  { code: 'to', name: 'Tongaisht', nativeName: 'Lea Fakatonga', flag: '🇹🇴' },
  { code: 'tr', name: 'Turqisht', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'tk', name: 'Turkmenisht', nativeName: 'Türkmençe', flag: '🇹🇲' },
  { code: 'uk', name: 'Ukrainisht', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ur', name: 'Urdisht', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'ug', name: 'Ujgurisht', nativeName: 'ئۇيغۇرچە', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbekisht', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'vi', name: 'Vietnamisht', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'cy', name: 'Uellsisht', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosaisht', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Jidisht', nativeName: 'ייִדיש', flag: '🇮🇱' },
  { code: 'yo', name: 'Jorubaisht', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'zu', name: 'Zuluisht', nativeName: 'isiZulu', flag: '🇿🇦' }
].sort((a, b) => a.name.localeCompare(b.name));

interface LanguageSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguages: string[];
  onLanguageToggle: (language: string) => void;
}

export const LanguageSelectionDialog: React.FC<LanguageSelectionDialogProps> = ({
  isOpen,
  onClose,
  selectedLanguages,
  onLanguageToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = worldLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (language: Language) => {
    onLanguageToggle(language.name);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* Custom Portal without overlay */}
      <SheetPortal>
        <SheetPrimitive.Content
          className="fixed top-[57px] right-0 z-[10003] h-[calc(100vh-57px)] w-full sm:max-w-lg border-0 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right animate-fade-in"
        >
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-semibold">Zgjidh Gjuhë</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Kërko gjuhë..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Languages */}
          {selectedLanguages.length > 0 && (
            <div className="space-y-2 flex-shrink-0 mt-4">
              <h4 className="text-sm font-medium text-gray-700">Gjuhë të Zgjedhura ({selectedLanguages.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map(lang => {
                  const languageData = worldLanguages.find(wl => wl.name === lang);
                  return (
                    <Badge 
                      key={lang} 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border border-primary/30 cursor-pointer"
                      onClick={() => onLanguageToggle(lang)}
                    >
                      {languageData?.flag} {lang}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrollable Languages List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Të Gjitha Gjuhët</h4>
            <div className="grid grid-cols-2 gap-2">
              {filteredLanguages.map(language => {
                const isSelected = selectedLanguages.includes(language.name);
                return (
                  <div
                    key={language.code}
                    onClick={() => handleLanguageSelect(language)}
                    className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                      isSelected 
                        ? 'bg-primary/10 text-primary border-primary/30' 
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm">{language.flag}</span>
                    <span className="text-xs font-medium flex-1 truncate">{language.name}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-primary ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fixed Footer Button */}
          <div className="border-t pt-0 pb-8 flex-shrink-0 bg-white">
            <Button onClick={onClose} className="w-full mt-1">
              Përfundo ({selectedLanguages.length} të zgjedhura)
            </Button>
          </div>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
};