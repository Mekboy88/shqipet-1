
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProfileSettingsData } from '@/hooks/useProfileSettings';
import { Plus, Trash2, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomSocialLink {
  id: string;
  name: string;
  url: string;
  section: 'primary' | 'professional';
}

interface SocialLinksFormProps {
  userInfo: ProfileSettingsData;
  setUserInfo: React.Dispatch<React.SetStateAction<ProfileSettingsData>>;
  onSave?: (data: Partial<ProfileSettingsData>) => Promise<boolean>;
  saving?: boolean;
}

const SocialLinksForm: React.FC<SocialLinksFormProps> = ({ 
  userInfo, 
  setUserInfo, 
  onSave,
  saving = false 
}) => {
  const [primaryCustomLinks, setPrimaryCustomLinks] = useState<CustomSocialLink[]>([]);
  const [professionalCustomLinks, setProfessionalCustomLinks] = useState<CustomSocialLink[]>([]);
  const [isPrimaryAddDialogOpen, setIsPrimaryAddDialogOpen] = useState(false);
  const [isProfessionalAddDialogOpen, setIsProfessionalAddDialogOpen] = useState(false);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; type: 'built-in' | 'custom'; field?: string; id?: string; isPrimary?: boolean }>({ show: false, type: 'built-in' });
  const [copiedTooltip, setCopiedTooltip] = useState<string | null>(null);

  // Load custom social links from userInfo when it changes
  useEffect(() => {
    if (userInfo?.custom_social_links) {
      const primaryLinks = userInfo.custom_social_links.filter(link => 
        link.section === 'primary'
      ) as CustomSocialLink[];
      const professionalLinks = userInfo.custom_social_links.filter(link => 
        link.section === 'professional'
      ) as CustomSocialLink[];
      setPrimaryCustomLinks(primaryLinks);
      setProfessionalCustomLinks(professionalLinks);
    }
  }, [userInfo?.custom_social_links]);

  // Real-time synchronization
  useEffect(() => {
    if (!userInfo?.user_id) return;

    const channel = supabase
      .channel('social-links-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userInfo.user_id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          if (payload.new?.custom_social_links) {
            const newLinks = payload.new.custom_social_links as CustomSocialLink[];
            const primaryLinks = newLinks.filter((link: CustomSocialLink) => 
              link.section === 'primary'
            ) as CustomSocialLink[];
            const professionalLinks = newLinks.filter((link: CustomSocialLink) => 
              link.section === 'professional'
            ) as CustomSocialLink[];
            setPrimaryCustomLinks(primaryLinks);
            setProfessionalCustomLinks(professionalLinks);
            
            // Update userInfo to keep everything in sync
            setUserInfo(prev => ({
              ...prev,
              custom_social_links: newLinks
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userInfo?.user_id, setUserInfo]);

  // Save custom social links to database
  const saveCustomLinksToDatabase = async (allLinks: CustomSocialLink[]) => {
    if (!userInfo?.user_id) return false;

    try {
      const { error } = await supabase
        .schema('api')
        .from('profiles')
        .update({
          custom_social_links: allLinks,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userInfo.user_id);

      if (error) {
        console.error('Error saving custom social links:', error);
        toast.error('Failed to save social links');
        return false;
      }

      // Update local state
      setUserInfo(prev => ({
        ...prev,
        custom_social_links: allLinks
      }));

      return true;
    } catch (error) {
      console.error('Error saving custom social links:', error);
      toast.error('Failed to save social links');
      return false;
    }
  };

  // Built-in social platforms that can be added
  const availablePlatforms = [
    { key: 'facebook_url' as keyof ProfileSettingsData, name: 'Facebook', placeholder: 'https://facebook.com/yourprofile' },
    { key: 'twitter_url' as keyof ProfileSettingsData, name: 'Twitter', placeholder: 'https://twitter.com/yourhandle' },
    { key: 'instagram_url' as keyof ProfileSettingsData, name: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
    { key: 'linkedin_url' as keyof ProfileSettingsData, name: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile' },
    { key: 'youtube_url' as keyof ProfileSettingsData, name: 'YouTube', placeholder: 'https://youtube.com/channel/yourchannel' },
    { key: 'vkontakte_url' as keyof ProfileSettingsData, name: 'VKontakte', placeholder: 'https://vk.com/yourprofile' },
  ];

  // Get platforms that have values
  const activePlatforms = availablePlatforms.filter(platform => userInfo?.[platform.key]);
  
  // Get platforms that can still be added
  const availableToAdd = availablePlatforms.filter(platform => !userInfo?.[platform.key]);

  const getShqipetProfileUrl = (u: ProfileSettingsData) => {
    const base = 'https://shqipet.com/profile/';
    const usernameRaw = (u?.username || '').trim();
    const usernameClean = usernameRaw.replace(/^@+/, '');
    let url = (u?.profile_url || '').trim();

    // If the stored URL is a placeholder or missing, build from username
    if (!url || /your-username/i.test(url)) {
      if (usernameClean) return `${base}@${usernameClean}`;
      return '';
    }

    // Normalize to ensure it uses the correct base and includes exactly one "@"
    try {
      // If it's already a full URL
      if (url.startsWith('http')) {
        const parts = url.split('/profile/');
        if (parts.length > 1) {
          const raw = parts[1];
          const handle = '@' + raw.replace(/^@+/, ''); // ensure single leading "@"
          return `${base}${handle}`;
        }
        return url;
      }
      // If it's just a handle or username
      const handle = '@' + url.replace(/^@+/, '');
      return `${base}${handle}`;
    } catch {
      return usernameClean ? `${base}@${usernameClean}` : '';
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave({
        facebook_url: userInfo.facebook_url,
        twitter_url: userInfo.twitter_url,
        vkontakte_url: userInfo.vkontakte_url,
        linkedin_url: userInfo.linkedin_url,
        instagram_url: userInfo.instagram_url,
        youtube_url: userInfo.youtube_url
      });
    }
  };

  const handleInputChange = (field: keyof ProfileSettingsData, value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addPrimaryCustomLink = async () => {
    if (newSocialName.trim() && newSocialUrl.trim()) {
      const newLink: CustomSocialLink = {
        id: Date.now().toString(),
        name: newSocialName.trim(),
        url: newSocialUrl.trim(),
        section: 'primary'
      };
      
      const updatedPrimary = [...primaryCustomLinks, newLink];
      const allLinks = [...updatedPrimary, ...professionalCustomLinks];
      
      const success = await saveCustomLinksToDatabase(allLinks);
      if (success) {
        setPrimaryCustomLinks(updatedPrimary);
        setNewSocialName('');
        setNewSocialUrl('');
        setIsPrimaryAddDialogOpen(false);
        toast.success('Social link added successfully');
      }
    }
  };

  const addProfessionalCustomLink = async () => {
    if (newSocialName.trim() && newSocialUrl.trim()) {
      const newLink: CustomSocialLink = {
        id: Date.now().toString(),
        name: newSocialName.trim(),
        url: newSocialUrl.trim(),
        section: 'professional'
      };
      
      const updatedProfessional = [...professionalCustomLinks, newLink];
      const allLinks = [...primaryCustomLinks, ...updatedProfessional];
      
      const success = await saveCustomLinksToDatabase(allLinks);
      if (success) {
        setProfessionalCustomLinks(updatedProfessional);
        setNewSocialName('');
        setNewSocialUrl('');
        setIsProfessionalAddDialogOpen(false);
        toast.success('Social link added successfully');
      }
    }
  };

  const addBuiltInPlatform = (platformKey: keyof ProfileSettingsData, placeholder: string) => {
    setNewSocialName('');
    setNewSocialUrl('');
    // Instead of setting URL directly, we'll show the platform in the form for the user to fill
    setIsPrimaryAddDialogOpen(false);
    setIsProfessionalAddDialogOpen(false);
    // The platform will appear in activePlatforms once user adds a value
  };

  const deleteBuiltInSocialLink = (field: keyof ProfileSettingsData) => {
    handleInputChange(field, '');
    setDeleteConfirm({ show: false, type: 'built-in' });
  };

  const deleteCustomSocialLink = async (id: string, isPrimary: boolean = true) => {
    let updatedPrimary = primaryCustomLinks;
    let updatedProfessional = professionalCustomLinks;
    
    if (isPrimary) {
      updatedPrimary = primaryCustomLinks.filter(link => link.id !== id);
    } else {
      updatedProfessional = professionalCustomLinks.filter(link => link.id !== id);
    }
    
    const allLinks = [...updatedPrimary, ...updatedProfessional];
    const success = await saveCustomLinksToDatabase(allLinks);
    
    if (success) {
      if (isPrimary) {
        setPrimaryCustomLinks(updatedPrimary);
      } else {
        setProfessionalCustomLinks(updatedProfessional);
      }
      setDeleteConfirm({ show: false, type: 'custom' });
      toast.success('Social link deleted successfully');
    }
  };

  const updateCustomSocialLink = async (id: string, field: 'name' | 'url', value: string, isPrimary: boolean = true) => {
    let updatedPrimary = primaryCustomLinks;
    let updatedProfessional = professionalCustomLinks;
    
    if (isPrimary) {
      updatedPrimary = primaryCustomLinks.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      );
    } else {
      updatedProfessional = professionalCustomLinks.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      );
    }

    // Update local state immediately for smooth UX
    if (isPrimary) {
      setPrimaryCustomLinks(updatedPrimary);
    } else {
      setProfessionalCustomLinks(updatedProfessional);
    }
    
    // Debounce database save to avoid too many updates while typing
    const allLinks = [...updatedPrimary, ...updatedProfessional];
    await saveCustomLinksToDatabase(allLinks);
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (!text || !text.trim()) return;

    const show = () => {
      setCopiedTooltip(id);
      setTimeout(() => setCopiedTooltip(null), 2000);
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        show();
        return;
      }
      throw new Error('Clipboard API not available');
    } catch (err) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) show();
      } catch (fallbackErr) {
        console.error('Failed to copy text: ', fallbackErr);
      }
    }
  };

  const SocialInputWithDelete: React.FC<{ 
    id: string; 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string;
    onDelete: () => void;
    hasValue: boolean;
  }> = ({ id, label, value, onChange, placeholder, onDelete, hasValue }) => {
    const [showDelete, setShowDelete] = useState(false);

    return (
      <div 
        className="relative"
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
      >
        <Label htmlFor={id} className="text-sm font-medium text-gray-700 mb-2 block">
          {label}
        </Label>
        <div className="relative">
          <Input
            id={id}
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onClick={() => value && copyToClipboard(value, id)}
            className="w-full transition-all duration-200 hover:shadow-md focus:shadow-lg pr-16 cursor-pointer"
            placeholder={placeholder}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {value && (
              <button
                type="button"
                onClick={() => copyToClipboard(value, id)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Copy size={16} />
              </button>
            )}
            {showDelete && hasValue && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          {copiedTooltip === id && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-2 px-3 rounded-md z-[700] pointer-events-none shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
              Copied!
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-black"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PrimaryInput: React.FC<{ 
    label: string; 
    value: string; 
    placeholder: string;
  }> = ({ label, value, placeholder }) => {
    const inputId = 'shqipet-profile';
    
    return (
      <div className="relative">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          {label}
        </Label>
        <div className="relative">
          <Input
            type="url"
            value={value && value.trim() ? value : (placeholder && placeholder.includes('@') && !/your-username/i.test(placeholder) ? placeholder : '')}
            readOnly
            onClick={() => {
              const toCopy = (value && value.trim()) ? value : (placeholder && placeholder.includes('@') && !/your-username/i.test(placeholder) ? placeholder : '');
              if (toCopy) copyToClipboard(toCopy, inputId);
            }}
            className="w-full transition-all duration-200 hover:shadow-md focus:shadow-lg pr-16 cursor-pointer"
            placeholder={placeholder}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              type="button"
              onClick={() => {
                const toCopy = (value && value.trim()) ? value : (placeholder && placeholder.includes('@') && !/your-username/i.test(placeholder) ? placeholder : '');
                if (toCopy) copyToClipboard(toCopy, inputId);
              }}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Copy profile link"
            >
              <Copy size={16} />
            </button>
          </div>
          {copiedTooltip === inputId && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-2 px-3 rounded-md z-[700] pointer-events-none shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
              Copied!
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-black"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Primary Social Networks Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
                Primary Social Networks
              </h3>
              
              <div className="space-y-6">
                {/* Primary Platform Profile - Always visible, cannot be deleted */}
                <PrimaryInput
                  label="Shqipet Profile"
                  value={getShqipetProfileUrl(userInfo)}
                  placeholder={`https://shqipet.com/profile/${userInfo?.username && userInfo.username.trim() ? '@' + userInfo.username.trim().replace(/^@+/, '') : 'your-username'}`}
                />

                {/* Active built-in platforms for left column */}
                {activePlatforms.slice(0, Math.ceil(activePlatforms.length / 2)).map((platform) => (
                  <SocialInputWithDelete
                    key={platform.key}
                    id={platform.key}
                    label={`${platform.name} Profile`}
                    value={(userInfo?.[platform.key] as string) || ''}
                    onChange={(value) => handleInputChange(platform.key, value)}
                    placeholder={platform.placeholder}
                    onDelete={() => setDeleteConfirm({ show: true, type: 'built-in', field: platform.key })}
                    hasValue={!!(userInfo?.[platform.key])}
                  />
                ))}

                {/* Custom social links for left column */}
                {primaryCustomLinks.map((link) => (
                  <div key={link.id} className="space-y-2">
                    <div className="relative group">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {link.name}
                      </Label>
                      <div className="relative">
                        <Input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateCustomSocialLink(link.id, 'url', e.target.value, true)}
                          onClick={() => link.url && copyToClipboard(link.url, `custom-${link.id}`)}
                          className="w-full transition-all duration-200 hover:shadow-md focus:shadow-lg pr-16 cursor-pointer"
                          placeholder="Enter URL"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                          {link.url && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(link.url, `custom-${link.id}`)}
                              className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <Copy size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ show: true, type: 'custom', id: link.id, isPrimary: true })}
                            className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {copiedTooltip === `custom-${link.id}` && (
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-2 px-3 rounded-md z-[700] pointer-events-none shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                            Copied!
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-black"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new social media button */}
                <Dialog open={isPrimaryAddDialogOpen} onOpenChange={setIsPrimaryAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                    >
                      <Plus size={16} className="mr-2" />
                      Create new social media profile
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Professional & Other Networks Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-3">
                Professional & Other Networks
              </h3>
              
              <div className="space-y-6">
                {/* Active built-in platforms for right column */}
                {activePlatforms.slice(Math.ceil(activePlatforms.length / 2)).map((platform) => (
                  <SocialInputWithDelete
                    key={platform.key}
                    id={platform.key}
                    label={`${platform.name} Profile`}
                    value={(userInfo?.[platform.key] as string) || ''}
                    onChange={(value) => handleInputChange(platform.key, value)}
                    placeholder={platform.placeholder}
                    onDelete={() => setDeleteConfirm({ show: true, type: 'built-in', field: platform.key })}
                    hasValue={!!(userInfo?.[platform.key])}
                  />
                ))}

                {/* Custom social links for right column */}
                {professionalCustomLinks.map((link) => (
                  <div key={link.id} className="space-y-2">
                    <div className="relative group">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {link.name}
                      </Label>
                      <div className="relative">
                        <Input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateCustomSocialLink(link.id, 'url', e.target.value, false)}
                          onClick={() => link.url && copyToClipboard(link.url, `custom-right-${link.id}`)}
                          className="w-full transition-all duration-200 hover:shadow-md focus:shadow-lg pr-16 cursor-pointer"
                          placeholder="Enter URL"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                          {link.url && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(link.url, `custom-right-${link.id}`)}
                              className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              <Copy size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ show: true, type: 'custom', id: link.id, isPrimary: false })}
                            className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {copiedTooltip === `custom-right-${link.id}` && (
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-2 px-3 rounded-md z-[700] pointer-events-none shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                            Copied!
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-black"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new social media button */}
                <Dialog open={isProfessionalAddDialogOpen} onOpenChange={setIsProfessionalAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                    >
                      <Plus size={16} className="mr-2" />
                      Create new social media profile
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Social Media Dialog - Primary */}
      <Dialog open={isPrimaryAddDialogOpen} onOpenChange={setIsPrimaryAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Social Media Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="social-name" className="text-sm font-medium text-gray-700 mb-2 block">
                Social Media Name
              </Label>
              <Input
                id="social-name"
                value={newSocialName}
                onChange={(e) => setNewSocialName(e.target.value)}
                placeholder="e.g., TikTok, Discord, Pinterest"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="social-url" className="text-sm font-medium text-gray-700 mb-2 block">
                Profile URL
              </Label>
              <Input
                id="social-url"
                type="url"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="https://example.com/yourprofile"
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPrimaryAddDialogOpen(false);
                  setNewSocialName('');
                  setNewSocialUrl('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={addPrimaryCustomLink}
                disabled={!newSocialName.trim() || !newSocialUrl.trim()}
              >
                Add Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Social Media Dialog - Professional */}
      <Dialog open={isProfessionalAddDialogOpen} onOpenChange={setIsProfessionalAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Social Media Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="social-name-pro" className="text-sm font-medium text-gray-700 mb-2 block">
                Social Media Name
              </Label>
              <Input
                id="social-name-pro"
                value={newSocialName}
                onChange={(e) => setNewSocialName(e.target.value)}
                placeholder="e.g., LinkedIn, GitHub, Behance"
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="social-url-pro" className="text-sm font-medium text-gray-700 mb-2 block">
                Profile URL
              </Label>
              <Input
                id="social-url-pro"
                type="url"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="https://example.com/yourprofile"
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsProfessionalAddDialogOpen(false);
                  setNewSocialName('');
                  setNewSocialUrl('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={addProfessionalCustomLink}
                disabled={!newSocialName.trim() || !newSocialUrl.trim()}
              >
                Add Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, type: 'built-in' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete this social media profile? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirm({ show: false, type: 'built-in' })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteConfirm.type === 'built-in' && deleteConfirm.field) {
                  deleteBuiltInSocialLink(deleteConfirm.field as keyof ProfileSettingsData);
                } else if (deleteConfirm.type === 'custom' && deleteConfirm.id) {
                  deleteCustomSocialLink(deleteConfirm.id, deleteConfirm.isPrimary ?? true);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SocialLinksForm;
