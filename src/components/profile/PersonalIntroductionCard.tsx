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
                  <p className="text-gray-600 text-sm ml-7 font-medium">{data.profession}</p>
                </div>
              )}

              {/* Education/School */}
              {data.school && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <svg fill="#52525b" version="1.1" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" enableBackground="new 0 0 300 300">
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M89.398,38.617c0-16.908,13.714-30.601,30.606-30.601c16.9,0,30.609,13.696,30.609,30.601 c0,16.891-13.709,30.631-30.609,30.631C103.113,69.248,89.398,55.509,89.398,38.617z M246,91.896V292H30V140h12v76h73v12H42v52 h104.064L146,207H82c-22,0-31.928-16.618-30.148-32.766l8.86-78.583c1.78-16.147,16.319-27.791,32.461-26.015 c9.309,1.026,16.898,6.18,21.91,13.28c3.049,4.319,12.956,16.95,12.956,16.95l34.363-18.481l-1.41-2.639 c-0.937-1.754-0.276-3.936,1.479-4.874c1.754-0.935,3.936-0.276,4.874,1.479l1.408,2.634c6.385-3.275,14.24-0.859,17.654,5.487 c3.424,6.366,1.084,14.285-5.213,17.788l4.99,9.336l79.605-43.052l5.711,10.561L246,91.896z M234,280V162h-69v-26.298 l-22.037,11.918l-5.711-10.561l42.595-23.036l-4.993-9.342l-44.037,23.683c-1.978,1.066-4.124,1.578-6.248,1.578 c-2.943,0-5.844-0.984-8.199-2.846L110.743,177h45.507c10.908,0,19.75,8.842,19.75,19.75V280H234z"></path>
                      </g>
                    </svg>
                    School
                  </h4>
                  <p className="text-gray-600 text-sm ml-7 font-medium">{data.school}</p>
                </div>
              )}

              {/* City */}
              {data.city_location && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2 21.25C1.58579 21.25 1.25 21.5858 1.25 22C1.25 22.4142 1.58579 22.75 2 22.75H22C22.4142 22.75 22.75 22.4142 22.75 22C22.75 21.5858 22.4142 21.25 22 21.25H21H18.5H17V16C17 14.1144 17 13.1716 16.4142 12.5858C15.8284 12 14.8856 12 13 12H11C9.11438 12 8.17157 12 7.58579 12.5858C7 13.1716 7 14.1144 7 16V21.25H5.5H3H2ZM9.25 15C9.25 14.5858 9.58579 14.25 10 14.25H14C14.4142 14.25 14.75 14.5858 14.75 15C14.75 15.4142 14.4142 15.75 14 15.75H10C9.58579 15.75 9.25 15.4142 9.25 15ZM9.25 18C9.25 17.5858 9.58579 17.25 10 17.25H14C14.4142 17.25 14.75 17.5858 14.75 18C14.75 18.4142 14.4142 18.75 14 18.75H10C9.58579 18.75 9.25 18.4142 9.25 18Z" fill="#1C274C"></path>
                        <g opacity="0.5">
                          <path d="M8 4.5C8.94281 4.5 9.41421 4.5 9.70711 4.79289C10 5.08579 10 5.55719 10 6.5L9.99999 8.29243C10.1568 8.36863 10.2931 8.46469 10.4142 8.58579C10.8183 8.98987 10.9436 9.56385 10.9825 10.5V12C9.10855 12 8.16976 12.0018 7.58579 12.5858C7 13.1716 7 14.1144 7 16V21.25H3V12C3 10.1144 3 9.17157 3.58579 8.58579C3.70688 8.46469 3.84322 8.36864 4 8.29243V6.5C4 5.55719 4 5.08579 4.29289 4.79289C4.58579 4.5 5.05719 4.5 6 4.5H6.25V3C6.25 2.58579 6.58579 2.25 7 2.25C7.41421 2.25 7.75 2.58579 7.75 3V4.5H8Z" fill="#1C274C"></path>
                          <path d="M20.6439 5.24676C20.2877 4.73284 19.66 4.49743 18.4045 4.02663C15.9493 3.10592 14.7216 2.64555 13.8608 3.2421C13 3.83864 13 5.14974 13 7.77195V12C14.8856 12 15.8284 12 16.4142 12.5858C17 13.1716 17 14.1144 17 16V21.25H21V7.77195C21 6.4311 21 5.76068 20.6439 5.24676Z" fill="#1C274C"></path>
                        </g>
                      </g>
                    </svg>
                    City you live
                  </h4>
                  <p className="text-gray-600 text-sm ml-7 font-medium">{data.city_location}</p>
                </div>
              )}

              {/* Languages */}
              {data.languages && data.languages.length > 0 && (
                <div className="flex-none">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in flex items-center gap-2" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>
                    <svg viewBox="0 0 24 24" id="meteor-icon-kit__solid-language-alt" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path fillRule="evenodd" clipRule="evenodd" d="M5.5 2.5V2C5.5 1.17157 6.17157 0.5 7 0.5C7.82843 0.5 8.5 1.17157 8.5 2V2.5H9.9742C9.9901 2.49975 10.0061 2.49974 10.0221 2.5H12C12.8284 2.5 13.5 3.17157 13.5 4C13.5 4.82843 12.8284 5.5 12 5.5H11.2512C10.7379 7.82318 9.75127 9.98263 8.30067 11.9736C9.27943 12.9992 10.4353 13.9118 11.7719 14.7138C12.4823 15.14 12.7126 16.0614 12.2864 16.7717C11.8602 17.4821 10.9388 17.7125 10.2284 17.2862C8.75981 16.4051 7.46579 15.399 6.34922 14.2699C5.33326 15.3069 4.1736 16.2908 2.87186 17.2206C2.19774 17.7021 1.26091 17.546 0.7794 16.8719C0.297886 16.1977 0.454024 15.2609 1.12814 14.7794C2.38555 13.8813 3.48271 12.9379 4.42182 11.9481C3.69705 10.8985 3.09174 9.76779 2.60746 8.55709C2.29979 7.78791 2.67391 6.91496 3.44309 6.60729C4.21226 6.29961 5.08522 6.67374 5.39289 7.44291C5.67512 8.14848 6.00658 8.8209 6.38782 9.46053C7.19463 8.20649 7.78489 6.88692 8.16216 5.5H2C1.17157 5.5 0.5 4.82843 0.5 4C0.5 3.17157 1.17157 2.5 2 2.5H5.5ZM16.4912 16.5H18.5088L17.5 13.5856L16.4912 16.5ZM15.4527 19.5L14.4175 22.4907C14.1465 23.2735 13.2922 23.6885 12.5093 23.4175C11.7265 23.1465 11.3115 22.2922 11.5825 21.5093L16.0825 8.50933C16.5484 7.16356 18.4516 7.16356 18.9175 8.50933L23.4175 21.5093C23.6885 22.2922 23.2735 23.1465 22.4907 23.4175C21.7078 23.6885 20.8535 23.2735 20.5825 22.4907L19.5473 19.5H15.4527Z" fill="#758CA3"></path>
                      </g>
                    </svg>
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-1 ml-7">
                    {data.languages.map(language => (
                      <Badge key={language} variant="secondary" className="text-xs text-gray-600">
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
                    <svg viewBox="0 0 2050 2050" data-name="Layer 2" id="Layer_2" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-5 h-5"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>{`.cls-1{fill:#f8881b;}.cls-2{fill:#f89a3e;}.cls-3{fill:#f08013;}.cls-4{fill:#67baeb;}.cls-5{fill:#46a1f8;}.cls-6{fill:#f4c23f;}.cls-7{fill:#fad564;}.cls-8{fill:#f4a93f;}.cls-9{fill:#de3226;}.cls-10{fill:#b11a31;}.cls-11{fill:#83d0fb;}.cls-12{fill:#f44533;}`}</style></defs><title></title><path className="cls-1" d="M1084.6,461.6a146,146,0,0,1-92.4,184.6,144.5,144.5,0,0,1-28.5,6.4l61.9,185.7L826.7,904.5a143.8,143.8,0,0,0-5.6-69.7C795.7,758.3,713,717,636.5,742.4a146.1,146.1,0,0,0-55,243.8l-198.8,66.2L214.8,548.3a146.2,146.2,0,0,1,92.6-185L811.5,195.4l61.8,185.7a146.3,146.3,0,0,1,211.3,80.5Z"></path><path className="cls-2" d="M1084.6,461.6a146,146,0,0,0-86.7-90.4,146.1,146.1,0,0,1-53.6,245.2,143.5,143.5,0,0,1-28.4,6.4l61.8,185.7L826.9,858.7a143.5,143.5,0,0,1-.2,45.8l198.9-66.2L963.7,652.6a144.5,144.5,0,0,0,28.5-6.4A146,146,0,0,0,1084.6,461.6Z"></path><path className="cls-3" d="M303.5,604.1a146.2,146.2,0,0,1,92.6-185l441-146.9-25.6-76.8L307.4,363.3a146.2,146.2,0,0,0-92.6,185l167.9,504.1,63-21Z"></path><path className="cls-4" d="M1842.7,1177H1636.9a146,146,0,1,1-278.9,60.3,144.7,144.7,0,0,1,13-60.3H1165.1V981.3a146,146,0,1,0,0-286.2V499.4h531.3a146.3,146.3,0,0,1,146.3,146.3Z"></path><path className="cls-5" d="M1215.3,1012.8a186.5,186.5,0,0,0,36.1,3.6A181.6,181.6,0,0,0,1433,834.8c0-100.3-81.3-181.5-181.6-181.5a186.5,186.5,0,0,0-36.1,3.5V499.4h-50.2V695.1a145.9,145.9,0,1,1,0,286.2V1177h50.2Z"></path><path className="cls-6" d="M958.6,1515.8a146,146,0,0,0,145.9,146,144.3,144.3,0,0,0,60.6-13.2v206H633.8a146.3,146.3,0,0,1-146.3-146.3V1177H697.1a146,146,0,1,1,258.4,0h209.6v206a144.3,144.3,0,0,0-60.6-13.2A146,146,0,0,0,958.6,1515.8Z"></path><path className="cls-7" d="M955.5,1177a146,146,0,0,0-257.7-137.3,146.1,146.1,0,0,1,206.3,192h209.5v138.4a143.1,143.1,0,0,1,51.5,12.9V1177Z"></path><path className="cls-8" d="M704.5,1789.4a146.3,146.3,0,0,1-146.3-146.3V1177H487.5v531.3a146.3,146.3,0,0,0,146.3,146.3h531.3v-65.2Z"></path><path className="cls-9" d="M1842.7,1177v531.3a146.3,146.3,0,0,1-146.3,146.3H1165.1v-206a144.3,144.3,0,0,1-60.6,13.2,146,146,0,0,1,0-292,144.3,144.3,0,0,1,60.6,13.2V1177H1371a146,146,0,1,0,278.9,60.3,146.3,146.3,0,0,0-13-60.3Z"></path><path className="cls-10" d="M1529.3,1381.1a150.9,150.9,0,0,0,25.4,2.2A146.1,146.1,0,0,0,1687.6,1177h-50.7a146.3,146.3,0,0,1,13,60.3C1649.9,1309.2,1597.8,1369,1529.3,1381.1Z"></path><path className="cls-10" d="M1215.9,1383V1177h-50.8v193.2A144.6,144.6,0,0,1,1215.9,1383Z"></path><path className="cls-10" d="M1009.3,1515.8A146,146,0,0,1,1129.9,1372a151.8,151.8,0,0,0-25.4-2.2,146,146,0,0,0,0,292,151.8,151.8,0,0,0,25.4-2.2C1061.4,1647.5,1009.3,1587.7,1009.3,1515.8Z"></path><path className="cls-10" d="M1165.1,1661.4v193.2h50.8v-206A144.6,144.6,0,0,1,1165.1,1661.4Z"></path><rect className="cls-11" height="329.42" rx="55.9" ry="55.9" width="111.8" x="1730.9" y="723"></rect><rect className="cls-12" height="277.54" rx="55.9" ry="55.9" width="111.8" x="1730.9" y="1438.9"></rect></g></svg>
                    Hobbies & Interests
                  </h4>
                  <div className="ml-7">
                    <div className="flex flex-wrap gap-1">
                      {(showAllHobbies ? data.hobbies : data.hobbies.slice(0, 5)).map(hobby => {
                        const hobbyData = getHobbyByName(hobby);
                        return (
                          <Badge key={hobby} variant="secondary" className="text-xs text-gray-600">
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
                  <Quote className="w-5 h-5 text-gray-600" />
                  Favorite Quote
                </h4>
                <p className="text-gray-600 italic text-sm ml-7 font-medium">"{data.favorite_quote}"</p>
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