import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Users, Lock, X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/relaxedSupabase';
import { toast } from 'sonner';
import { LanguageSelectionDialog } from './LanguageSelectionDialog';
import HobbiesSelectionDialog from './HobbiesSelectionDialog';
import { getHobbyEmoji } from '@/data/hobbies';


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

  useEffect(() => {
    loadData();
    
    // Subscribe to realtime changes for immediate updates
    const channel = supabase
      .channel('profile-intro-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_settings',
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
      // Force-relaxed typing to avoid deep generic instantiation issues
      const res: any = await (supabase as any)
        .from('profile_settings' as any)
        .select('*' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      const profileData = res?.data as any;
      const error = res?.error as any;

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile data:', error);
        return;
      }

      const loadedData: PersonalIntroData = {
        bio: profileData?.bio || '',
        bio_visibility: profileData?.bio_visibility || 'public',
        profession: profileData?.profession || profileData?.working_at || '',
        profession_visibility: profileData?.profession_visibility || 'public',
        company: profileData?.company || profileData?.company_website || '',
        company_visibility: profileData?.company_visibility || 'public',
        relationship_status: profileData?.relationship_status || '',
        relationship_visibility: profileData?.relationship_visibility || 'public',
        relationship_user_id: profileData?.relationship_user_id || '',
        languages: profileData?.languages || [],
        languages_visibility: profileData?.languages_visibility || 'public',
        hobbies: profileData?.hobbies || [],
        hobbies_visibility: profileData?.hobbies_visibility || 'public',
        favorite_quote: profileData?.favorite_quote || '',
        favorite_quote_visibility: profileData?.favorite_quote_visibility || 'public',
        school: profileData?.school || '',
        school_visibility: profileData?.school_visibility || 'public',
        location: profileData?.location || '',
        location_visibility: profileData?.location_visibility || 'public',
        city_location: profileData?.city_location || '',
        public_phone: profileData?.public_phone || '',
        public_phone_visibility: profileData?.public_phone_visibility || 'public',
        public_email: profileData?.public_email || '',
        public_email_visibility: profileData?.public_email_visibility || 'public',
        contact_website: profileData?.contact_website || '',
        contact_website_visibility: profileData?.contact_website_visibility || 'public',
      };

      setData(loadedData);
      setOriginalData(loadedData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async () => {
    if (!user || !hasChanges) return;

    try {
      setSaving(true);
      
      const upsertRes: any = await (supabase as any)
        .from('profile_settings' as any)
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      const error = upsertRes?.error as any;

      if (error) {
        console.error('Error saving profile:', error);
        return;
      }

      // Also update profiles table for key fields with proper mapping
      const profileUpdate: any = {};
      if (data.bio !== undefined) profileUpdate.bio = data.bio;
      if (data.bio_visibility !== undefined) profileUpdate.bio_visibility = data.bio_visibility;
      if (data.profession !== undefined) {
        profileUpdate.profession = data.profession;
        profileUpdate.working_at = data.profession; // Map to working_at field
      }
      if (data.profession_visibility !== undefined) profileUpdate.profession_visibility = data.profession_visibility;
      if (data.company !== undefined) {
        profileUpdate.company = data.company;
        profileUpdate.company_website = data.company; // Map to company_website field
      }
      if (data.company_visibility !== undefined) profileUpdate.company_visibility = data.company_visibility;
      if (data.relationship_status !== undefined) profileUpdate.relationship_status = data.relationship_status;
      if (data.relationship_visibility !== undefined) profileUpdate.relationship_visibility = data.relationship_visibility;
      if (data.relationship_user_id !== undefined) profileUpdate.relationship_user_id = data.relationship_user_id;
      if (data.languages !== undefined) profileUpdate.languages = data.languages;
      if (data.languages_visibility !== undefined) profileUpdate.languages_visibility = data.languages_visibility;
      if (data.hobbies !== undefined) profileUpdate.hobbies = data.hobbies;
      if (data.hobbies_visibility !== undefined) profileUpdate.hobbies_visibility = data.hobbies_visibility;
      if (data.favorite_quote !== undefined) profileUpdate.favorite_quote = data.favorite_quote;
      if (data.favorite_quote_visibility !== undefined) profileUpdate.favorite_quote_visibility = data.favorite_quote_visibility;
      if (data.school !== undefined) profileUpdate.school = data.school;
      if (data.school_visibility !== undefined) profileUpdate.school_visibility = data.school_visibility;
      if (data.location !== undefined) profileUpdate.location = data.location;
      if (data.location_visibility !== undefined) profileUpdate.location_visibility = data.location_visibility;
      if (data.city_location !== undefined) profileUpdate.city_location = data.city_location;
      if (data.public_phone !== undefined) profileUpdate.public_phone = data.public_phone;
      if (data.public_phone_visibility !== undefined) profileUpdate.public_phone_visibility = data.public_phone_visibility;
      if (data.public_email !== undefined) profileUpdate.public_email = data.public_email;
      if (data.public_email_visibility !== undefined) profileUpdate.public_email_visibility = data.public_email_visibility;
      if (data.contact_website !== undefined) profileUpdate.contact_website = data.contact_website;
      if (data.contact_website_visibility !== undefined) profileUpdate.contact_website_visibility = data.contact_website_visibility;

      if (Object.keys(profileUpdate).length > 0) {
        profileUpdate.updated_at = new Date().toISOString();
        
        await (supabase as any)
          .from('profiles' as any)
          .update(profileUpdate as any)
          .eq('id', user.id);
      }

      setOriginalData({ ...data });
    } catch (error) {
      console.error('Error saving profile:', error);
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
    const hasData = data.bio || data.profession || data.company || data.relationship_status || 
                   (data.languages && data.languages.length > 0) || 
                   (data.hobbies && data.hobbies.length > 0) || 
                   data.favorite_quote || data.school || data.location;

    return (
      <Card className="p-6">
        <div className="flex items-start gap-6 mb-4">
          <h3 className="text-xl font-black text-black/20 animate-fade-in flex-shrink-0" style={{
            WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
          }}>Prezantim Personal</h3>
          
          {!hasData ? (
            <div className="text-gray-500 flex-1">
              No introduction added yet
            </div>
          ) : (
            <div className="flex-1">
              {/* First Row - Info Items aligned with title */}
              <div className="flex flex-wrap gap-0">
                {/* Profession & Company - Show on own profile or if public/friends */}
                {(data.profession || data.company) && (
                  <div className="flex-none mr-4">
                    <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                    }}>Work</h4>
                    <div className="text-gray-600 text-sm">
                      {data.profession && (
                        <p>{data.profession}</p>
                      )}
                      {data.company && (
                        <p className="text-xs text-gray-500">at {data.company}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Relationship Status - Show on own profile or if public/friends */}
                {data.relationship_status && (
                  <div className="flex-none mr-4">
                    <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                    }}>Relationship</h4>
                    <p className="text-gray-600 text-sm">{data.relationship_status}</p>
                  </div>
                )}

                {/* Education/School - Show on own profile or if public/friends */}
                {data.school && (
                  <div className="flex-none mr-4">
                    <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                    }}>Education</h4>
                    <p className="text-gray-600 text-sm">{data.school}</p>
                  </div>
                )}

                {/* Location - Show on own profile or if public/friends */}
                {data.location && (
                  <div className="flex-none">
                    <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                    }}>Location</h4>
                    <p className="text-gray-600 text-sm">{data.location}</p>
                  </div>
                )}
              </div>

              {/* Second Row - Languages and Hobbies */}
              <div className="flex flex-wrap gap-0 mt-4">
                {/* Languages - Show on own profile or if public/friends */}
                {data.languages && data.languages.length > 0 && (
                  <div className="flex-1 min-w-[200px] mr-4">
                    <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                    }}>Languages</h4>
                    <div className="flex flex-wrap gap-1">
                      {data.languages.map(language => (
                        <Badge key={language} variant="secondary" className="text-xs">
                          <span className="text-sm mr-1">{getLanguageFlag(language)}</span>
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hobbies - Show on own profile or if public/friends */}
                {data.hobbies && data.hobbies.length > 0 && (
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                    }}>Hobbies & Interests</h4>
                    <div className="flex flex-wrap gap-1">
                      {data.hobbies.map(hobby => (
                        <Badge key={hobby} variant="secondary" className="text-xs">
                          <span className="text-sm mr-1">{getHobbyEmoji(hobby)}</span>
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Third Row - Favorite Quote */}
              {data.favorite_quote && (
                <div className="w-full mt-4">
                  <h4 className="text-lg font-black mb-1 text-black/20 animate-fade-in" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>Favorite Quote</h4>
                  <p className="text-gray-600 italic text-sm">"{data.favorite_quote}"</p>
                </div>
              )}

              {/* Bio/Personal Introduction - Full Width at Bottom */}
              {data.bio && (
                <div className="w-full mt-4">
                  <h4 className="text-lg font-black mb-2 text-black/20 animate-fade-in" style={{
                    WebkitTextStroke: '0.5px rgba(0,0,0,0.08)'
                  }}>About Me</h4>
                  <p className="text-gray-600 leading-relaxed">{data.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Personal Introduction</h3>
      </div>

      <div className="space-y-6">

        {/* Education & Work Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          <div className="p-4 rounded-lg">
            <div className="mb-2">
              <Label htmlFor="intro-location">Location</Label>
            </div>
            <Input
              id="intro-location"
              value={data.location || ''}
              onChange={e => setData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter a location"
              className={smokeFocusStyles}
            />
          </div>

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
        </div>


        {/* Profession */}
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

        {/* Company */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label htmlFor="company">Company / Workplace</Label>
          </div>
          <Input
            id="company"
            value={data.company || ''}
            onChange={e => setData(prev => ({ ...prev, company: e.target.value }))}
            placeholder="Apple, Google, etc."
            className={smokeFocusStyles}
          />
        </div>

        {/* Relationship */}
        <div className="p-4 rounded-lg">
          <div className="mb-2">
            <Label>Relationship Status</Label>
          </div>
          <Select 
            value={data.relationship_status || ''} 
            onValueChange={value => setData(prev => ({ ...prev, relationship_status: value }))}
          >
            <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none">
              <SelectValue placeholder="Select relationship status" />
            </SelectTrigger>
            <SelectContent>
              {relationshipOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {data.hobbies?.map(hobby => (
                <Badge key={hobby} variant="secondary" className="flex items-center gap-1">
                  <span className="text-sm">{getHobbyEmoji(hobby)}</span>
                  {hobby}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeHobby(hobby)}
                  />
                </Badge>
              ))}
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