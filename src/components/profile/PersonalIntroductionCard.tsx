import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Users, Lock, X, Plus, School, MapPin, Briefcase, Languages, Heart, Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/relaxedSupabase';
import { toast } from 'sonner';
import { LanguageSelectionDialog } from './LanguageSelectionDialog';
import HobbiesSelectionDialog from './HobbiesSelectionDialog';
import { getHobbyEmoji, getHobbyByName } from '@/data/hobbies';


// Helper function to get flag for language
const getLanguageFlag = (languageName: string): string => {
  const languagesByName: Record<string, string> = {
    'Afrikaans': '🇿🇦',
    'Shqip': '🇦🇱',
    'Amharikisht': '🇪🇹',
    'Arabisht': '🇸🇦',
    'Armenisht': '🇦🇲',
    'Azerbajxhanisht': '🇦🇿',
    'Baskisht': '🇪🇸',
    'Bjellorusisht': '🇧🇾',
    'Bengalisht': '🇧🇩',
    'Boshnjakisht': '🇧🇦',
    'Bullgarisht': '🇧🇬',
    'Burmisht': '🇲🇲',
    'Katalanisht': '🇪🇸',
    'Kinezisht': '🇨🇳',
    'Kroatisht': '🇭🇷',
    'Çekisht': '🇨🇿',
    'Danisht': '🇩🇰',
    'Holandisht': '🇳🇱',
    'Anglisht': '🇺🇸',
    'Estonisht': '🇪🇪',
    'Finlandisht': '🇫🇮',
    'Frëngjisht': '🇫🇷',
    'Galicianisht': '🇪🇸',
    'Gjeorgjisht': '🇬🇪',
    'Gjermanisht': '🇩🇪',
    'Greqisht': '🇬🇷',
    'Gujaratisht': '🇮🇳',
    'Haitianisht': '🇭🇹',
    'Hausisht': '🇳🇬',
    'Hebraisht': '🇮🇱',
    'Hindisht': '🇮🇳',
    'Hungarisht': '🇭🇺',
    'Islandisht': '🇮🇸',
    'Indonezisht': '🇮🇩',
    'Irlandisht': '🇮🇪',
    'Italisht': '🇮🇹',
    'Japonisht': '🇯🇵',
    'Kannadisht': '🇮🇳',
    'Kazakisht': '🇰🇿',
    'Khmerisht': '🇰🇭',
    'Koreanisht': '🇰🇷',
    'Kurdisht': '🇮🇶',
    'Kirgizisht': '🇰🇬',
    'Laoisht': '🇱🇦',
    'Latinisht': '🇻🇦',
    'Letonisht': '🇱🇻',
    'Lituanisht': '🇱🇹',
    'Luksemburgisht': '🇱🇺',
    'Maqedonisht': '🇲🇰',
    'Malagasisht': '🇲🇬',
    'Malajisht': '🇲🇾',
    'Malayalamisht': '🇮🇳',
    'Maltisht': '🇲🇹',
    'Maorisht': '🇳🇿',
    'Marathisht': '🇮🇳',
    'Mongolisht': '🇲🇳',
    'Nepalisht': '🇳🇵',
    'Norvegjisht': '🇳🇴',
    'Odiaisht': '🇮🇳',
    'Pashtunisht': '🇦🇫',
    'Persianisht': '🇮🇷',
    'Polonisht': '🇵🇱',
    'Portugalisht': '🇵🇹',
    'Punxhabisht': '🇮🇳',
    'Rumanisht': '🇷🇴',
    'Rusisht': '🇷🇺',
    'Samoanisht': '🇼🇸',
    'Skotisht Gaelisht': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Serbisht': '🇷🇸',
    'Sesothoisht': '🇱🇸',
    'Shonaisht': '🇿🇼',
    'Sindhisht': '🇵🇰',
    'Sinhalisht': '🇱🇰',
    'Sllovakisht': '🇸🇰',
    'Sllovenisht': '🇸🇮',
    'Somalisht': '🇸🇴',
    'Spanjisht': '🇪🇸',
    'Sundanisht': '🇮🇩',
    'Swahilisht': '🇰🇪',
    'Suedisht': '🇸🇪',
    'Taxhikisht': '🇹🇯',
    'Tamilisht': '🇮🇳',
    'Tatarisht': '🇷🇺',
    'Telugisht': '🇮🇳',
    'Tajlandisht': '🇹🇭',
    'Tigrinjaisht': '🇪🇷',
    'Tongaisht': '🇹🇴',
    'Turqisht': '🇹🇷',
    'Turkmenisht': '🇹🇲',
    'Ukrainisht': '🇺🇦',
    'Urdisht': '🇵🇰',
    'Ujgurisht': '🇨🇳',
    'Uzbekisht': '🇺🇿',
    'Vietnamisht': '🇻🇳',
    'Uellsisht': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'Xhosaisht': '🇿🇦',
    'Jidisht': '🇮🇱',
    'Jorubaisht': '🇳🇬',
    'Zuluisht': '🇿🇦'
  };
  
  return languagesByName[languageName] || '🌍';
};

interface VisibilityOption {
  value: 'public' | 'friends' | 'private';
  label: string;
  icon: React.ElementType;
}

interface PersonalIntroData {
  bio?: string;
  bio_visibility?: string;
  profession?: string;
  profession_visibility?: string;
  company?: string;
  company_visibility?: string;
  relationship_status?: string;
  relationship_visibility?: string;
  relationship_user_id?: string;
  languages?: string[];
  languages_visibility?: string;
  hobbies?: string[];
  hobbies_visibility?: string;
  favorite_quote?: string;
  favorite_quote_visibility?: string;
  school?: string;
  school_visibility?: string;
  location?: string;
  location_visibility?: string;
  city_location?: string;
  public_phone?: string;
  public_phone_visibility?: string;
  public_email?: string;
  public_email_visibility?: string;
  contact_website?: string;
  contact_website_visibility?: string;
}

const visibilityOptions: VisibilityOption[] = [
  { value: 'public', label: 'Public', icon: Eye },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'private', label: 'Private', icon: Lock },
];

const relationshipOptions = [
  'Single',
  'In a relationship',
  'Engaged', 
  'Married',
  'It\'s complicated'
];

const languageOptions = [
  'English', 'Albanian', 'French', 'German', 'Spanish', 'Italian', 
  'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Arabic'
];

const hobbyOptions = [
  '⚽ Football', '🎨 Art', '💻 Coding', '📚 Reading', '🎵 Music', 
  '🎬 Movies', '🏃 Running', '🍳 Cooking', '📸 Photography', '✈️ Travel',
  '🎮 Gaming', '🏊 Swimming', '🎯 Darts', '♟️ Chess', '🧩 Puzzles'
];

interface PersonalIntroductionCardProps {
  isDisplayMode?: boolean;
}

export const PersonalIntroductionCard: React.FC<PersonalIntroductionCardProps> = ({ 
  isDisplayMode = false 
}) => {
  const smokeFocusStyles = "focus:ring-1 focus:ring-gray-300/50 focus:border-gray-400 focus:shadow-sm focus:shadow-gray-200/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300/50 focus-visible:ring-offset-0";
  const { user } = useAuth();
  const [data, setData] = useState<PersonalIntroData>({});
  const [originalData, setOriginalData] = useState<PersonalIntroData>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [isHobbiesDialogOpen, setIsHobbiesDialogOpen] = useState(false);
  const [showAllHobbies, setShowAllHobbies] = useState(false);

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime changes for immediate updates
    const channel = supabase
      .channel('personal-intro-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'personal_introduction',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        loadData(); // Reload data when changes occur
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const changed = JSON.stringify(data) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [data, originalData]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Fetch from personal_introduction table
      const res: any = await (supabase as any)
        .from('personal_introduction' as any)
        .select('*' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      const introData = res?.data as any;
      const error = res?.error as any;

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading personal introduction:', error);
        return;
      }

      const hobbiesArray = Array.isArray(introData?.hobbies)
        ? introData.hobbies
        : (typeof introData?.hobbies === 'string'
            ? introData.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []);

      const languagesArray = Array.isArray(introData?.languages)
        ? introData.languages
        : (typeof introData?.languages === 'string'
            ? introData.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
            : []);

      const loadedData: PersonalIntroData = {
        school: introData?.school || '',
        city_location: introData?.city || '',
        profession: introData?.profession || '',
        languages: languagesArray,
        hobbies: hobbiesArray,
        favorite_quote: introData?.favorite_quote || '',
      };

      setData(loadedData);
      setOriginalData(loadedData);
    } catch (error) {
      console.error('Error loading personal introduction:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async () => {
    if (!user || !hasChanges) return;

    try {
      setSaving(true);
      
      // Prepare data for personal_introduction table
      const introData = {
        user_id: user.id,
        school: data.school || null,
        city: data.city_location || null,
        profession: data.profession || null,
        languages: data.languages || [],
        hobbies: data.hobbies || [],
        favorite_quote: data.favorite_quote || null,
        updated_at: new Date().toISOString()
      };

      const upsertRes: any = await (supabase as any)
        .from('personal_introduction' as any)
        .upsert(introData, {
          onConflict: 'user_id'
        });
      const error = upsertRes?.error as any;

      if (error) {
        console.error('Error saving personal introduction:', error);
        toast.error('Failed to save changes');
        return;
      }

      setOriginalData({ ...data });
      toast.success('Changes saved automatically');
    } catch (error) {
      console.error('Error saving personal introduction:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save effect with debounce
  useEffect(() => {
    if (!hasChanges) return;
    
    const timeoutId = setTimeout(() => {
      autoSave();
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(timeoutId);
  }, [data, hasChanges]);

  const VisibilitySelect: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {visibilityOptions.map(option => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );

  const addLanguage = () => {
    if (newLanguage && !data.languages?.includes(newLanguage)) {
      setData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage]
      }));
      setNewLanguage('');
    }
  };

  const handleLanguageToggle = (language: string) => {
    if (data.languages?.includes(language)) {
      removeLanguage(language);
    } else {
      setData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), language]
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages?.filter(l => l !== language) || []
    }));
  };

  const addHobby = () => {
    if (newHobby && !data.hobbies?.includes(newHobby)) {
      setData(prev => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), newHobby]
      }));
      setNewHobby('');
    }
  };

  const handleHobbyToggle = (hobby: { name: string }) => {
    const hobbyName = hobby.name;
    if (data.hobbies?.includes(hobbyName)) {
      removeHobby(hobbyName);
    } else {
      setData(prev => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), hobbyName]
      }));
    }
  };

  const removeHobby = (hobby: string) => {
    setData(prev => ({
      ...prev,
      hobbies: prev.hobbies?.filter(h => h !== hobby) || []
    }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  // Display mode - show actual data or empty message
  if (isDisplayMode) {
    // Check if any data exists
    const hasData = data.profession || data.school || data.city_location || 
                   (data.languages && data.languages.length > 0) || 
                   (data.hobbies && data.hobbies.length > 0) || 
                   data.favorite_quote;

    return (
      <Card className="p-6">
        <h3 className="text-xl font-black text-black/20 animate-fade-in mb-4" style={{
          WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
        }}>Prezantim Personal</h3>
        
        {!hasData ? (
          <div className="text-gray-500">
            No introduction added yet
          </div>
        ) : (
          <div className="space-y-4">
            {/* All Items in a flowing layout */}
            <div className="flex flex-wrap gap-4">
              {/* Profession/Job Title */}
              {data.profession && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <svg viewBox="0 0 1024 1024" className="w-5 h-5" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M852.8 901.6h-688c-66.4 0-120-53.6-120-120V368.8c0-66.4 53.6-120 120-120h688c66.4 0 120 53.6 120 120v413.6c0 65.6-53.6 119.2-120 119.2z" fill="#D6AB7F"></path>
                        <path d="M146.4 687.2h730.4c35.2 0 68-11.2 95.2-31.2V368c0-66.4-53.6-120-120-120h-688c-66.4 0-120 53.6-120 120v283.2c29.6 23.2 64.8 36 102.4 36z" fill="#0D1014"></path>
                        <path d="M852.8 909.6h-688c-70.4 0-128-57.6-128-128V368.8c0-70.4 57.6-128 128-128h688c70.4 0 128 57.6 128 128v413.6c0 69.6-57.6 127.2-128 127.2z m-688-652.8c-61.6 0-112 50.4-112 112v413.6c0 61.6 50.4 112 112 112h688c61.6 0 112-50.4 112-112V368.8c0-61.6-50.4-112-112-112h-688z" fill="#6A576D"></path>
                        <path d="M508.8 729.6c-22.4 0-40-17.6-40-40v-45.6h80v45.6c0 21.6-17.6 40-40 40z" fill="#FFFFFF"></path>
                        <path d="M508.8 737.6c-26.4 0-48-21.6-48-48V640c0-4.8 3.2-8 8-8h80c4.8 0 8 3.2 8 8v49.6c0 26.4-21.6 48-48 48z m-32-90.4v41.6c0 17.6 14.4 32 32 32s32-14.4 32-32v-41.6h-64z" fill="#6A576D"></path>
                        <path d="M247.2 214.4H148.8c-62.4 0-113.6 50.4-114.4 113.6L32 523.2c-0.8 64 50.4 116 114.4 116h730.4c64 0 115.2-52 114.4-116l-2.4-196c-0.8-62.4-52-113.6-114.4-113.6H247.2" fill="#938993"></path>
                        <path d="M877.6 647.2H146.4c-32.8 0-64-12.8-87.2-36.8C36 587.2 24 556 24 523.2l2.4-196c0.8-67.2 56-120.8 122.4-120.8h726.4c67.2 0 121.6 54.4 122.4 120.8l2.4 196c0 32.8-12 64-35.2 88-23.2 23.2-54.4 36-87.2 36zM148.8 222.4c-58.4 0-105.6 47.2-106.4 105.6L40 523.2c0 28.8 10.4 56 30.4 76 20 20.8 47.2 32 76 32h730.4c28.8 0 56-11.2 76-32s31.2-47.2 30.4-76l-2.4-196c-0.8-58.4-48.8-105.6-106.4-105.6H148.8z" fill="#6A576D"></path>
                        <path d="M509.6 505.6h-1.6c-37.6 0-68 31.2-68 67.2v70.4h137.6v-70.4c0.8-36-29.6-67.2-68-67.2z" fill="#EC7BB0"></path>
                        <path d="M577.6 647.2H440c-2.4 0-4-0.8-5.6-2.4-1.6-1.6-2.4-3.2-2.4-5.6l0.8-66.4c0-41.6 34.4-75.2 76-75.2h1.6c41.6 0 76 33.6 76 75.2l-0.8 66.4c0 4.8-3.2 8-8 8z m-129.6-16h121.6v-58.4c0-32.8-27.2-59.2-60-59.2h-1.6c-32.8 0-60 26.4-60 59.2v58.4zM680.8 222.4c-4.8 0-8-3.2-8-8 0-26.4-6.4-45.6-19.2-58.4-25.6-25.6-76.8-25.6-136-25.6h-17.6c-59.2 0-110.4 0-136 25.6-12.8 12.8-19.2 32-19.2 58.4 0 4.8-3.2 8-8 8s-8-3.2-8-8c0-31.2 8-53.6 24-69.6 30.4-30.4 84-30.4 147.2-30.4h17.6c62.4 0 116.8 0 147.2 30.4 16 16 24 38.4 24 69.6 0 4-4 8-8 8z" fill="#6A576D"></path>
                      </g>
                    </svg>
                    Profession
                  </h4>
                  <p className="text-gray-600 text-sm ml-7">{data.profession}</p>
                </div>
              )}

              {/* Education/School */}
              {data.school && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <School className="w-5 h-5" />
                    School
                  </h4>
                  <p className="text-gray-600 text-sm ml-7">{data.school}</p>
                </div>
              )}

              {/* City */}
              {data.city_location && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <MapPin className="w-5 h-5" />
                    City you live
                  </h4>
                  <p className="text-gray-600 text-sm ml-7">{data.city_location}</p>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <Languages className="w-5 h-5" />
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-1 ml-7">
                    {data.languages.map(language => (
                      <Badge key={language} variant="secondary" className="text-xs">
                        <span className="text-sm mr-1">{getLanguageFlag(language)}</span>
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Hobbies */}
              {data.hobbies && data.hobbies.length > 0 && (
                <div className="flex-none w-full">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <Heart className="w-5 h-5" />
                    Hobbies & Interests
                  </h4>
                  <div className="ml-7">
                    <div className="flex flex-wrap gap-1">
                      {(showAllHobbies ? data.hobbies : data.hobbies.slice(0, 5)).map(hobby => {
                        const hobbyData = getHobbyByName(hobby);
                        return (
                          <Badge key={hobby} variant="secondary" className="text-xs">
                            <span className="text-sm mr-1">{hobbyData?.emoji || '🎯'}</span>
                            {hobby}
                          </Badge>
                        );
                      })}
                    </div>
                    {data.hobbies.length > 5 && (
                      <button
                        onClick={() => setShowAllHobbies(!showAllHobbies)}
                        className="text-sm text-primary hover:underline mt-2"
                      >
                        {showAllHobbies ? 'See less' : `See more (${data.hobbies.length - 5} more)`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Favorite Quote - Full width */}
            {data.favorite_quote && (
              <div className="w-full">
                <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                }}>
                  <Quote className="w-5 h-5" />
                  Favorite Quote
                </h4>
                <p className="text-gray-600 italic text-sm ml-7">"{data.favorite_quote}"</p>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">

      <div className="space-y-6">

        {/* School */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label htmlFor="intro-school">School</Label>
          </div>
          <Input
            id="intro-school"
            value={data.school || ''}
            onChange={e => setData(prev => ({ ...prev, school: e.target.value }))}
            placeholder="Enter your school name"
            className={smokeFocusStyles}
          />
        </div>

        {/* City you live */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label htmlFor="intro-cityLocation">City you live</Label>
          </div>
          <Input
            id="intro-cityLocation"
            value={data.city_location || ''}
            onChange={e => setData(prev => ({ ...prev, city_location: e.target.value }))}
            placeholder="Enter the city where you live"
            className={smokeFocusStyles}
          />
        </div>

        {/* Profession / Job Title */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label htmlFor="profession">Profession / Job Title</Label>
          </div>
          <Input
            id="profession"
            value={data.profession || ''}
            onChange={e => setData(prev => ({ ...prev, profession: e.target.value }))}
            placeholder="Software Engineer, Teacher, etc."
            className={smokeFocusStyles}
          />
        </div>

        {/* Languages */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label>Languages</Label>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsLanguageDialogOpen(true)}
                variant="outline" 
                className="flex-1 justify-start text-gray-500 focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:outline-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add languages
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.languages?.map(language => (
                <Badge key={language} variant="secondary" className="flex items-center gap-1">
                  <span className="text-sm">{getLanguageFlag(language)}</span>
                  {language}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeLanguage(language)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Hobbies */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label>Hobbies & Interests</Label>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsHobbiesDialogOpen(true)}
                variant="outline" 
                className="flex-1 justify-start text-gray-500 focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:outline-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add hobbies & interests
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.hobbies?.map(hobby => {
                const hobbyData = getHobbyByName(hobby);
                return (
                  <Badge key={hobby} variant="secondary" className="flex items-center gap-1">
                    <span className="text-sm">{hobbyData?.emoji || '🎯'}</span>
                    {hobby}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeHobby(hobby)}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* Favorite Quote */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label htmlFor="quote">Favorite Quote</Label>
          </div>
          <Input
            id="quote"
            value={data.favorite_quote || ''}
            onChange={e => setData(prev => ({ ...prev, favorite_quote: e.target.value }))}
            placeholder="Enter your favorite quote..."
            className={smokeFocusStyles}
          />
        </div>

        {/* Auto-save indicator */}
        {saving && (
          <div className="flex justify-center pt-4">
            <span className="text-sm text-gray-500">Saving changes...</span>
          </div>
        )}
      </div>

      {/* Language Selection Dialog */}
      <LanguageSelectionDialog
        isOpen={isLanguageDialogOpen}
        onClose={() => setIsLanguageDialogOpen(false)}
        selectedLanguages={data.languages || []}
        onLanguageToggle={handleLanguageToggle}
      />

      {/* Hobbies Selection Dialog */}
      <HobbiesSelectionDialog
        isOpen={isHobbiesDialogOpen}
        onClose={() => setIsHobbiesDialogOpen(false)}
        selectedHobbies={data.hobbies || []}
        onHobbyToggle={handleHobbyToggle}
      />
    </Card>
  );
};