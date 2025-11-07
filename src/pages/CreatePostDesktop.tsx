import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CollapsibleAIChat from '@/components/create-post/ai-chat/CollapsibleAIChat';
import FloatingAIButton from '@/components/create-post/FloatingAIButton';
import PostIntentSection from '@/components/create-post/PostIntentSection';
import PostInsightsPanel from '@/components/create-post/PostInsightsPanel';
import AISmartSummary from '@/components/create-post/AISmartSummary';
import CreatePostFilePreview from '@/components/create-post/CreatePostFilePreview';
import AnonymousIcon from '@/components/icons/AnonymousIcon';
import OnlyMeIcon from '@/components/icons/OnlyMeIcon';
import FollowersIcon from '@/components/icons/FollowersIcon';
import FriendsIcon from '@/components/icons/FriendsIcon';
import PublicIcon from '@/components/icons/PublicIcon';
import PhotoIcon from '@/components/icons/PhotoIcon';
import VideoIcon from '@/components/icons/VideoIcon';
import { Mic, MapPin, BarChart3, Tag, Link2, Palette, Heart, Share2, Shield, Clock, Globe, Settings2, ChevronDown, Sparkles, Brain, Lightbulb, TrendingUp, Calendar, Languages, Info, Save, Eye, Send, X, Mic2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AnonymousSwitch } from '@/components/create-post/AnonymousSwitch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Avatar from '@/components/Avatar';
import { useUniversalUser } from '@/hooks/useUniversalUser';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
const CreatePostDesktop: React.FC = () => {
  const {
    displayName
  } = useUniversalUser();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [postContent, setPostContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [previousVisibility, setPreviousVisibility] = useState('public');
  const [autoSave, setAutoSave] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [autoAI, setAutoAI] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [expiration, setExpiration] = useState('permanent');
  const [tone, setTone] = useState('friendly');
  const [contentWarning, setContentWarning] = useState(false);
  const [aiScan, setAiScan] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [postIntent, setPostIntent] = useState('emotion');
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showTip) {
      const timer = setTimeout(() => setShowTip(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showTip]);
  useEffect(() => {
    if (autoSave && postContent) {
      const timer = setTimeout(() => {
        console.log('Auto-saving draft...');
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [postContent, autoSave]);
  
  // Sync anonymous switch with visibility dropdown
  useEffect(() => {
    if (isAnonymous) {
      // Save current visibility before switching to anonymous
      if (visibility !== 'anonymous') {
        setPreviousVisibility(visibility);
      }
      setVisibility('anonymous');
    } else {
      // Restore previous visibility when turning off anonymous
      if (visibility === 'anonymous') {
        setVisibility(previousVisibility);
      }
    }
  }, [isAnonymous]);
  
  // Sync visibility dropdown with anonymous switch
  useEffect(() => {
    if (visibility === 'anonymous') {
      setIsAnonymous(true);
    } else {
      setIsAnonymous(false);
    }
  }, [visibility]);
  
  const charCount = postContent.length;
  const isOptimal = charCount > 0 && charCount <= 150;
  const handlePublish = async () => {
    if (!postContent.trim()) {
      toast({
        title: "Error",
        description: "Please write something before publishing.",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to publish posts.",
        variant: "destructive"
      });
      return;
    }
    setIsPublishing(true);
    try {
      const {
        data,
        error
      } = await supabase.from('posts').insert({
        user_id: user.id,
        content: {
          text: postContent,
          tone,
          contentWarning
        },
        visibility,
        post_type: 'regular',
        is_sponsored: false,
        is_anonymous: isAnonymous
      }).select().single();
      if (error) throw error;
      toast({
        title: "Post Published!",
        description: "Your post has been shared successfully."
      });
      setPostContent('');
      setShowPreview(false);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };
  const handlePhotoClick = () => {
    console.log('📸 Photo button clicked');
    photoInputRef.current?.click();
  };

  const handleVideoClick = () => {
    console.log('🎥 Video button clicked');
    videoInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📸 Photos selected:', files.length, files);
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...files];
      console.log('📸 Total files after adding photos:', newFiles.length);
      return newFiles;
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('🎥 Videos selected:', files.length, files);
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...files];
      console.log('🎥 Total files after adding videos:', newFiles.length);
      return newFiles;
    });
  };

  const handleRemoveFile = (index: number) => {
    console.log('🗑️ Removing file at index:', index);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mediaTools = [{
    icon: PhotoIcon,
    label: 'Photo',
    color: 'text-blue-500',
    onClick: handlePhotoClick
  }, {
    icon: VideoIcon,
    label: 'Video',
    color: 'text-purple-500',
    onClick: handleVideoClick
  }, {
    icon: Mic,
    label: 'Audio',
    color: 'text-red-500'
  }, {
    icon: MapPin,
    label: 'Location',
    color: 'text-green-500'
  }, {
    icon: BarChart3,
    label: 'Poll',
    color: 'text-orange-500'
  }, {
    icon: Tag,
    label: 'Tag',
    color: 'text-pink-500'
  }, {
    icon: Link2,
    label: 'Link',
    color: 'text-indigo-500'
  }, {
    icon: Palette,
    label: 'Background',
    color: 'text-yellow-500'
  }, {
    icon: () => <AnonymousIcon />,
    label: 'Anonymous',
    color: 'text-gray-500'
  }];
  const aiFeatures = [{
    icon: Sparkles,
    label: 'Improve Writing',
    action: () => toast({
      title: "✨ Improving writing..."
    })
  }, {
    icon: Brain,
    label: 'Fix Grammar & Spelling',
    action: () => toast({
      title: "🧠 Checking grammar..."
    })
  }, {
    icon: Lightbulb,
    label: 'Generate Captions',
    action: () => toast({
      title: "💡 Generating captions..."
    })
  }, {
    icon: Tag,
    label: 'Suggest Hashtags',
    action: () => toast({
      title: "🔥 Finding hashtags..."
    })
  }, {
    icon: TrendingUp,
    label: 'Optimize Engagement',
    action: () => toast({
      title: "🎯 Analyzing engagement..."
    })
  }, {
    icon: Clock,
    label: 'Best Time to Post',
    action: () => toast({
      title: "🕓 Calculating best time..."
    })
  }, {
    icon: Shield,
    label: 'Detect Sensitive/Duplicate',
    action: () => toast({
      title: "🚫 Scanning content..."
    })
  }, {
    icon: Globe,
    label: 'Translate Automatically',
    action: () => toast({
      title: "🌍 Translating..."
    })
  }, {
    icon: Eye,
    label: 'Convert to Story',
    action: () => toast({
      title: "🧩 Converting to story..."
    })
  }, {
    icon: Mic2,
    label: 'Voice-Over Preview',
    action: () => toast({
      title: "🗣️ Generating voice-over..."
    })
  }];
  return <div className="min-h-screen w-full bg-background pt-14">
      <Helmet>
        <title>Create Post | Shqipet</title>
        <meta name="description" content="Compose a new Shqipet post with media, AI assistance, and privacy settings." />
        <link rel="canonical" href="/create-post" />
      </Helmet>
      <h1 className="sr-only">Create Post – Shqipet</h1>

      {/* Main 2-Column Layout (Left Sidebar + Center) */}
      <div className="w-full min-h-[calc(100vh-56px)] grid grid-cols-[280px_1fr] gap-4 p-4 pr-[420px]">
        {/* Left Sidebar - Post Settings */}
        <motion.div initial={{
        opacity: 0,
        x: -40
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.4
      }} className="bg-card/80 backdrop-blur-xl shadow-md rounded-3xl border border-border p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-6 text-foreground">Post Settings</h2>
          
          <div className="space-y-3">
            {/* Comments & Privacy */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-accent transition-all">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="10" y1="12" x2="19" y2="12"></line>
                      <line x1="10" y1="16" x2="14" y2="16"></line>
                      <path d="M11,4c-4.4,0-8,3.6-8,8v12v5l0,0c3.7-3.2,8.4-5,13.3-5H21c4.4,0,8-3.6,8-8v-4c0-4.4-3.6-8-8-8H11z"></path>
                    </svg>
                    <span className="font-medium text-sm">Comments & Privacy</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Comments</span>
                  <Switch checked={allowComments} onCheckedChange={setAllowComments} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Reactions ❤️ 👍 😂 😮</span>
                  <Switch checked={allowReactions} onCheckedChange={setAllowReactions} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Sharing/Repost</span>
                  <Switch checked={allowSharing} onCheckedChange={setAllowSharing} />
                </div>
                <div>
                  <label className="text-sm font-medium">Visible to</label>
                  <Select defaultValue="everyone">
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="onlyme">Only Me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Publishing Options */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-accent transition-all">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-sm">Publishing Options</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">Publish Now</Button>
                  <Button size="sm" variant="outline" className="flex-1">Schedule</Button>
                </div>
                <div>
                  <label className="text-sm font-medium">Expiration</label>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24h (Story Mode)</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Cross-post to</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Marketplace
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Groups
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      Pages
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Language & AI Tone */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-accent transition-all">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    <span className="font-medium text-sm">Language & AI Tone</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Translate</span>
                  <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
                </div>
                <div>
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Moderation & Security */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-accent transition-all">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium text-sm">Moderation & Security</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Warning</span>
                  <Switch checked={contentWarning} onCheckedChange={setContentWarning} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Content Scan</span>
                  <Switch checked={aiScan} onCheckedChange={setAiScan} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Draft & Auto-Save */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-accent transition-all">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span className="font-medium text-sm">Draft & Auto-Save</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Save</span>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Restore Draft
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Engagement Analytics */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-accent transition-all">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium text-sm">Engagement Analytics</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Predicted Reach</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-3/4"></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hashtag Effectiveness</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-2/3"></div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </motion.div>

        {/* Center Column - Editor */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.96,
        y: 40
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.1
      }} className="bg-card/80 backdrop-blur-xl shadow-md rounded-3xl border border-border focus-within:border-red-400/80 transition-all p-8 overflow-y-auto flex flex-col">
          {/* Header with Avatar & Visibility */}
          <div className="flex items-center gap-4 mb-6">
            {isAnonymous ? (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <AnonymousIcon className="w-7 h-7 text-gray-600" />
              </div>
            ) : (
              <Avatar size="lg" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">{isAnonymous ? "Anonymous" : (displayName || "User")}</p>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-48 h-8 text-sm border-red-200/40 hover:border-red-300/50 focus:border-red-300/60 focus:ring-0 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)] transition-all duration-200">
                  {visibility === 'public' ? (
                    <div className="flex items-center gap-2">
                      <PublicIcon className="w-4 h-4 text-gray-600" />
                      <span>Public</span>
                    </div>
                  ) : visibility === 'anonymous' ? (
                    <div className="flex items-center gap-2">
                      <AnonymousIcon className="w-4 h-4 text-gray-600" />
                      <span>Anonymous</span>
                    </div>
                  ) : visibility === 'onlyme' ? (
                    <div className="flex items-center gap-2">
                      <OnlyMeIcon className="w-4 h-4 text-gray-600" />
                      <span>Only Me</span>
                    </div>
                  ) : visibility === 'followers' ? (
                    <div className="flex items-center gap-2">
                      <FollowersIcon className="w-4 h-4 text-gray-600" />
                      <span>Followers</span>
                    </div>
                  ) : visibility === 'friends' ? (
                    <div className="flex items-center gap-2">
                      <FriendsIcon className="w-4 h-4 text-gray-600" />
                      <span>Friends</span>
                    </div>
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public" icon={<PublicIcon className="w-4 h-4 text-gray-600" />}>
                    <span>Public</span>
                  </SelectItem>
                  <SelectItem value="friends" icon={<FriendsIcon className="w-4 h-4 text-gray-600" />}>
                    <span>Friends</span>
                  </SelectItem>
                  <SelectItem value="followers" icon={<FollowersIcon className="w-4 h-4 text-gray-600" />}>
                    <span>Followers</span>
                  </SelectItem>
                  <SelectItem value="onlyme" icon={<OnlyMeIcon className="w-4 h-4 text-gray-600" />}>
                    <span>Only Me</span>
                  </SelectItem>
                  <SelectItem value="anonymous" icon={<AnonymousIcon className="w-4 h-4 text-gray-600" />}>
                    <span>Anonymous</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AnonymousSwitch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                onIcon={<AnonymousIcon className="w-5 h-5 text-gray-600" />}
                offIcon={
                  visibility === 'public' ? (
                    <PublicIcon className="w-5 h-5 text-gray-600" />
                  ) : visibility === 'friends' ? (
                    <FriendsIcon className="w-5 h-5 text-gray-600" />
                  ) : visibility === 'followers' ? (
                    <FollowersIcon className="w-5 h-5 text-gray-600" />
                  ) : visibility === 'onlyme' ? (
                    <OnlyMeIcon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <PublicIcon className="w-5 h-5 text-gray-600" />
                  )
                }
              />
              <span className="text-sm text-muted-foreground"> Anonymous</span>
            </div>
          </div>

          {/* Text Editor */}
          <div className="flex-1 mb-6 relative">
            {!postContent && <div className="absolute left-4 top-1 flex items-center gap-2 pointer-events-none text-lg text-muted-foreground leading-tight z-10">
                <span>{isAnonymous ? "Edhe vetë platforma Shqipet nuk e di botuesin" : "Çdo moment është një fillim i ri"}</span>
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5 text-gray-600 flex-shrink-0">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path>
                  <path d="M11.315 10.014a.5.5 0 0 1 .548.736A4.498 4.498 0 0 1 7.965 13a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .548-.736h.005l.017.005.067.015.252.055c.215.046.515.108.857.169.693.124 1.522.242 2.152.242.63 0 1.46-.118 2.152-.242a26.58 26.58 0 0 0 1.109-.224l.067-.015.017-.004.005-.002zM4.756 4.566c.763-1.424 4.02-.12.952 3.434-4.496-1.596-2.35-4.298-.952-3.434zm6.488 0c1.398-.864 3.544 1.838-.952 3.434-3.067-3.554.19-4.858.952-3.434z"></path>
                </svg>
              </div>}
            <div className="relative">
              {/* Anonymous watermark inside textarea boundaries */}
              {isAnonymous && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden rounded-[14px]">
                  <AnonymousIcon className="w-48 h-48 text-gray-400 opacity-10" />
                </div>
              )}
              <Textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="" className="min-h-[200px] text-lg resize-none border border-red-200/55 rounded-[14px] px-4 transition-all duration-200 ease-out hover:border-red-300/60 focus-visible:border-red-300/70 focus-visible:ring-0 focus-visible:shadow-[0_0_20px_rgba(239,68,68,0.08)] relative z-10 bg-transparent" style={{
              backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    transparent 0px,
                    transparent 25px,
                    rgba(239, 68, 68, 0.10) 25px,
                    rgba(239, 68, 68, 0.10) 26px
                  )`,
              lineHeight: '26px',
              paddingTop: '4px',
              paddingBottom: '4px',
              caretColor: 'rgba(239, 68, 68, 0.6)',
              verticalAlign: 'baseline'
            }} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {charCount} characters {isOptimal && <span className="text-green-600 font-medium">✓ Optimal</span>}
              </span>
              <Button variant="ghost" size="sm">
                <Mic2 className="w-4 h-4 mr-2" />
                Voice Input
              </Button>
            </div>
          </div>

          {/* AI Buttons Row */}
          <div className="flex items-center justify-center gap-4 -mt-4 mb-4">
            <FloatingAIButton />
            <PostIntentSection selectedIntent={postIntent} onSelectIntent={setPostIntent} />
            
            {/* AI Chat Toggle Button */}
            {!showAIChat && <motion.button onClick={() => setShowAIChat(true)} className="relative group" whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
                {/* Pulsing Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-200 to-purple-300 opacity-75 blur-md animate-pulse" />
                
                {/* Main Button */}
                <div className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-200 to-purple-300 rounded-full shadow-lg">
                  <MessageSquare className="w-5 h-5 text-foreground animate-pulse" />
                  <span className="font-semibold text-foreground text-sm">Shqipet AI</span>
                </div>
              </motion.button>}
          </div>

          {/* AI Smart Summary */}
          <AISmartSummary content={postContent} />

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-muted-foreground mb-2">
                📎 {selectedFiles.length} file(s) attached
              </div>
              <CreatePostFilePreview 
                files={selectedFiles} 
                onRemoveFile={handleRemoveFile} 
              />
            </div>
          )}
          
          {/* Debug info */}
          {selectedFiles.length === 0 && (
            <div className="text-xs text-muted-foreground mb-2">
              No files selected yet
            </div>
          )}

          {/* Media Toolbar */}
          <div className="border-t border-border pt-4 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Add to your post</p>
            <div className="flex flex-wrap gap-3">
              {mediaTools.map((tool, idx) => <motion.button key={idx} onClick={tool.onClick} whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} className={`flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-accent transition-all ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                  <span className="text-xs text-muted-foreground">{tool.label}</span>
                </motion.button>)}
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleVideoChange}
          />

          {/* Preview Button */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mb-4">
                <svg className="w-64 h-64" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <path d="M64.32 103.32c-34.03 0-53.56-33.13-56.94-39.38c3.07-6.27 20.91-39.26 56.94-39.26s53.87 32.98 56.94 39.26c-3.38 6.25-22.92 39.38-56.94 39.38z" fill="#fafafa" />
                  <path d="M64.32 27.12c15.81 0 29.84 6.42 41.7 19.09c6.63 7.08 10.73 14.26 12.49 17.67c-4.51 7.99-23.05 36.99-54.19 36.99c-14.88 0-28.63-6.45-40.89-19.17c-6.89-7.15-11.37-14.41-13.3-17.82c1.75-3.41 5.86-10.6 12.49-17.67c11.86-12.67 25.89-19.09 41.7-19.09m0-4.88C22.56 22.24 4.66 64 4.66 64s20.25 41.76 59.66 41.76S123.97 64 123.97 64s-17.9-41.76-59.65-41.76z" fill="#b0bec5" />
                  <path d="M64.32 37c26.97 0 45.47 16.51 53.66 27.71c.96 1.31 1.99-4.99 1.12-6.36c-7.84-12.26-25.41-32.91-54.77-32.91S17.38 46.1 9.54 58.36c-.88 1.37.3 6.83 1.41 5.64c8.54-9.17 26.39-27 53.37-27z" fill="#b0bec5" />
                  <circle cx="64.32" cy="60.79" r="33.15" fill="#9c7a63" />
                  <path d="M64.32 37c10.87 0 20.36 2.68 28.36 6.62c-5.81-9.58-16.34-15.97-28.36-15.97c-12.28 0-23 6.69-28.72 16.61C43.61 40.04 53.18 37 64.32 37z" fill="#806451" />
                  <circle cx="64.32" cy="60.79" r="15.43" fill="#212121" />
                  <circle cx="88.86" cy="59.37" r="7.72" fill="#d9baa5" />
                  <path d="M7.21 67.21c-.52 0-1.05-.13-1.54-.4a3.207 3.207 0 0 1-1.27-4.35c.85-1.55 21.28-40.21 59.92-40.21s58.47 37.89 59.29 39.41c.84 1.56.27 3.5-1.29 4.35c-1.56.84-3.5.27-4.35-1.29c-.18-.34-18.88-33.86-53.66-33.86c-34.79 0-54.11 34.34-54.3 34.69a3.185 3.185 0 0 1-2.8 1.66z" fill="#616161" />
                </svg>
                Preview Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
              <DialogHeader>
                <DialogTitle>Post Preview</DialogTitle>
              </DialogHeader>
              
              {/* Render post exactly as it would appear in feed */}
              <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
                {/* Post Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isAnonymous ? (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <AnonymousIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <Avatar size="md" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{isAnonymous ? "Anonymous" : displayName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <svg className="w-4 h-4" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M350.907,241.75c-0.016,0-0.04,0-0.056,0l-67.206,0.322c-6.068-13.137-20.863-20.33-35.218-16.25 c-3.678,1.048-6.952,2.79-9.827,4.968l-105.782-92.774c-2.548-2.25-6.492-2-8.734,0.573c-2.258,2.572-2,6.484,0.572,8.742 l105.788,92.782c-3.692,6.67-4.857,14.742-2.609,22.653c0.774,2.718,2.006,5.162,3.423,7.452l-73.587,81.065 c-3.064,3.371-2.814,8.597,0.565,11.661c1.58,1.436,3.564,2.145,5.548,2.145c2.242,0,4.484-0.911,6.113-2.71l73.572-81.04 c6.404,3.145,13.901,4.121,21.302,2.016c8.815-2.508,15.452-8.766,18.956-16.508l67.234-0.323 c6.847-0.032,12.363-5.605,12.331-12.443C363.262,247.258,357.722,241.75,350.907,241.75z"></path>
                            <path d="M256,0C114.839,0,0,114.847,0,256c0,141.161,114.839,256,256,256s256-114.839,256-256 C512,114.847,397.161,0,256,0z M411.611,342.814c-1.26,2.266-2.57,4.492-3.913,6.67l26.645,16.484 c-17.686,28.573-42.028,52.597-70.865,69.895l-16.044-26.887c-2.226,1.33-4.478,2.605-6.762,3.838l14.865,27.597 C325.907,456.468,292,465.597,256,465.597c-37.008,0-71.782-9.678-101.992-26.581l15.182-27.403 c-2.234-1.25-4.436-2.54-6.603-3.863l-16.397,26.686c-28.595-17.662-52.643-41.984-69.964-70.815l26.863-16.088 c-1.327-2.218-2.605-4.468-3.831-6.742l-27.593,14.895C55.558,326.024,46.403,292.064,46.403,256 c0-36.758,9.542-71.322,26.238-101.395l8.51,4.186l18.871,11.048l0.698-1.242c1.125-1.992,2.276-3.952,3.462-5.879l-26.696-16.403 c17.643-28.613,41.956-52.677,70.768-70.016l16.081,26.863c2.226-1.33,4.486-2.613,6.762-3.855L156.18,71.734 c29.696-16.145,63.706-25.331,99.82-25.331c36.905,0,71.593,9.621,101.746,26.444l-4.843,8.548l-10.089,19 c2.166,1.21,4.29,2.452,6.391,3.734l16.339-26.734c28.631,17.621,52.722,41.927,70.089,70.734l-26.861,16.097 c1.345,2.234,2.629,4.492,3.865,6.774l27.55-14.96c16.202,29.726,25.417,63.79,25.417,99.96c0,36.831-9.581,71.444-26.331,101.548 L411.611,342.814z"></path>
                          </svg>
                          <span>Just now</span>
                          <span>•</span>
                          {visibility === 'public' && <PublicIcon className="w-3 h-3" />}
                          {visibility === 'anonymous' && <AnonymousIcon className="w-3 h-3" />}
                          {visibility === 'onlyme' && <OnlyMeIcon className="w-3 h-3" />}
                          {visibility === 'followers' && <FollowersIcon className="w-3 h-3" />}
                          {visibility === 'friends' && <FriendsIcon className="w-3 h-3" />}
                          <span className="capitalize">{visibility}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Text Content */}
                {postContent && (
                  <div className="px-4 pb-4">
                    <p className="text-foreground whitespace-pre-wrap">{postContent}</p>
                  </div>
                )}

                {/* Post Media */}
                {selectedFiles.length > 0 && (
                  <div className="w-full">
                    <CreatePostFilePreview 
                      files={selectedFiles}
                      onRemoveFile={() => {}}
                    />
                  </div>
                )}

                {/* Placeholder if no content */}
                {!postContent && selectedFiles.length === 0 && (
                  <div className="px-4 pb-4">
                    <p className="text-muted-foreground italic">No content yet...</p>
                  </div>
                )}

                {/* Separator */}
                <div className="px-4">
                  <div className="border-t border-border" />
                </div>

                {/* Post Actions (Like, Comment, Share) - Exact match to feed */}
                <div className="px-4 py-3">
                  <div className="flex justify-around">
                    {/* Like Button */}
                    <button className="flex items-center justify-between rounded-md p-2 w-full transition-colors duration-200 text-gray-600 hover:text-red-600 hover:bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <svg 
                          className="w-6 h-6"
                          viewBox="0 0 489.543 489.543" 
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                        >
                          <path d="M270.024,0c-22.6,0-15,48.3-15,48.3s-48.3,133.2-94.5,168.7c-9.9,10.4-16.1,21.9-20,31.3l0,0l0,0 c-0.9,2.3-1.7,4.5-2.4,6.5c-3.1,6.3-9.7,16-23.8,24.5l46.2,200.9c0,0,71.5,9.3,143.2,7.8c28.7,2.3,59.1,2.5,83.3-2.7 c82.2-17.5,61.6-74.8,61.6-74.8c44.3-33.3,19.1-74.9,19.1-74.9c39.4-41.1,0.7-75.6,0.7-75.6s21.3-33.2-6.2-58.3 c-34.3-31.4-127.4-10.5-127.4-10.5l0,0c-6.5,1.1-13.4,2.5-20.8,4.3c0,0-32.2,15,0-82.7C346.324,15.1,292.624,0,270.024,0z"/>
                          <path d="M127.324,465.7l-35-166.3c-2-9.5-11.6-17.3-21.3-17.3h-66.8l-0.1,200.8h109.1C123.024,483,129.324,475.2,127.324,465.7z"/>
                        </svg>
                        <span className="font-medium text-sm">Pëlqej</span>
                      </div>
                    </button>

                    {/* Comment Button */}
                    {allowComments && (
                      <button className="flex items-center justify-between text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md p-2 w-full transition-colors duration-200">
                        <div className="flex items-center space-x-2">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                              <path d="M4.32698 6.63803L5.21799 7.09202L4.32698 6.63803ZM4.7682 20.2318L4.06109 19.5247H4.06109L4.7682 20.2318ZM18.362 16.673L18.816 17.564L18.816 17.564L18.362 16.673ZM19.673 15.362L20.564 15.816L20.564 15.816L19.673 15.362ZM19.673 6.63803L20.564 6.18404L20.564 6.18404L19.673 6.63803ZM18.362 5.32698L18.816 4.43597L18.816 4.43597L18.362 5.32698ZM5.63803 5.32698L6.09202 6.21799L5.63803 5.32698ZM7.70711 17.2929L7 16.5858L7.70711 17.2929ZM5 9.8C5 8.94342 5.00078 8.36113 5.03755 7.91104C5.07337 7.47262 5.1383 7.24842 5.21799 7.09202L3.43597 6.18404C3.18868 6.66937 3.09012 7.18608 3.04419 7.74817C2.99922 8.2986 3 8.97642 3 9.8H5ZM5 12V9.8H3V12H5ZM3 12V17H5V12H3ZM3 17V19.9136H5V17H3ZM3 19.9136C3 21.2054 4.56185 21.8524 5.4753 20.9389L4.06109 19.5247C4.40757 19.1782 5 19.4236 5 19.9136H3ZM5.4753 20.9389L8.41421 18L7 16.5858L4.06109 19.5247L5.4753 20.9389ZM15.2 16H8.41421V18H15.2V16ZM17.908 15.782C17.7516 15.8617 17.5274 15.9266 17.089 15.9624C16.6389 15.9992 16.0566 16 15.2 16V18C16.0236 18 16.7014 18.0008 17.2518 17.9558C17.8139 17.9099 18.3306 17.8113 18.816 17.564L17.908 15.782ZM18.782 14.908C18.5903 15.2843 18.2843 15.5903 17.908 15.782L18.816 17.564C19.5686 17.1805 20.1805 16.5686 20.564 15.816L18.782 14.908ZM19 12.2C19 13.0566 18.9992 13.6389 18.9624 14.089C18.9266 14.5274 18.8617 14.7516 18.782 14.908L20.564 15.816C20.8113 15.3306 20.9099 14.8139 20.9558 14.2518C21.0008 13.7014 21 13.0236 21 12.2H19ZM19 9.8V12.2H21V9.8H19ZM18.782 7.09202C18.8617 7.24842 18.9266 7.47262 18.9624 7.91104C18.9992 8.36113 19 8.94342 19 9.8H21C21 8.97642 21.0008 8.2986 20.9558 7.74817C20.9099 7.18608 20.8113 6.66937 20.564 6.18404L18.782 7.09202ZM17.908 6.21799C18.2843 6.40973 18.5903 6.71569 18.782 7.09202L20.564 6.18404C20.1805 5.43139 19.5686 4.81947 18.816 4.43597L17.908 6.21799ZM15.2 6C16.0566 6 16.6389 6.00078 17.089 6.03755C17.5274 6.07337 17.7516 6.1383 17.908 6.21799L18.816 4.43597C18.3306 4.18868 17.8139 4.09012 17.2518 4.04419C16.7014 3.99922 16.0236 4 15.2 4V6ZM8.8 6H15.2V4H8.8V6ZM6.09202 6.21799C6.24842 6.1383 6.47262 6.07337 6.91104 6.03755C7.36113 6.00078 7.94342 6 8.8 6V4C7.97642 4 7.2986 3.99922 6.74817 4.04419C6.18608 4.09012 5.66937 4.18868 5.18404 4.43597L6.09202 6.21799ZM5.21799 7.09202C5.40973 6.71569 5.71569 6.40973 6.09202 6.21799L5.18404 4.43597C4.43139 4.81947 3.81947 5.43139 3.43597 6.18404L5.21799 7.09202ZM8.41421 18V16C7.88378 16 7.37507 16.2107 7 16.5858L8.41421 18Z" fill="currentColor"></path>
                              <path d="M8 9L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                              <path d="M8 13L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                            </g>
                          </svg>
                          <span className="font-medium text-sm">Komentoni</span>
                        </div>
                      </button>
                    )}

                    {/* Share Button */}
                    {allowSharing && (
                      <button className="flex items-center justify-between text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md p-2 w-full transition-colors duration-200">
                        <div className="flex items-center space-x-2">
                          <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enableBackground="new 0 0 52 52" xmlSpace="preserve" className="w-6 h-6">
                            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                              <g>
                                <path d="M41,15.9h7.8c0.4,0,0.7-0.5,0.4-0.9l-8.3-8.3c-0.4-0.3-0.9,0-0.9,0.4v7.8C40,15.5,40.4,15.9,41,15.9z M49,19.9H38c-1.1,0-2-0.9-2-2v-11c0-0.6-0.4-1-1-1H21.5c-0.8,0-1.5,0.7-1.5,1.5v4c0,0.4,0.2,0.8,0.4,1.1l5.6,5.6 c0.8,0.8,1.4,1.9,1.6,3.1c0.2,1.6-0.3,3.1-1.4,4.3L24.6,27c-0.5,0.5-1,0.8-1.6,1.1c0.7,0.3,1.5,0.5,2.3,0.6 c2.6,0.2,4.7,2.4,4.7,5.1V36c0,1.4-0.7,2.8-1.7,3.7c-1,1-2.5,1.4-3.9,1.3c-1.1-0.1-2.1-0.3-3.2-0.5c-0.6-0.2-1.2,0.3-1.2,1v3.1 c0,0.8,0.7,1.5,1.5,1.5h27c0.8,0,1.5-0.7,1.5-1.5V21C50,20.4,49.6,20,49,19.9z M26,35.8v-2.2c0-0.6-0.5-1-1.1-1.1 c-5.4-0.5-9.9-5.1-9.9-10.8v-1.2c0-0.6,0.8-1,1.2-0.5l4,4c0.4,0.4,1.1,0.4,1.5,0l1.5-1.5c0.4-0.4,0.4-1.1,0-1.5l-9.7-9.7 c-0.4-0.4-1.1-0.4-1.5,0l-9.7,9.7c-0.4,0.4-0.4,1.1,0,1.5l1.5,1.5c0.4,0.4,1.1,0.5,1.5,0.1l4.2-4c0.5-0.5,1.4-0.1,1.4,0.5v1.9 c0,7.2,6.3,13.8,13.9,14.4C25.5,36.9,26,36.4,26,35.8z"></path>
                              </g>
                            </g>
                          </svg>
                          <span className="font-medium text-sm">Shpërndaj</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>Edit Again</Button>
                <Button onClick={handlePublish} className="bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 text-foreground font-semibold">
                  <Send className="w-4 h-4 mr-2" />
                  Publish Now
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Publish Button */}
          <Button onClick={handlePublish} disabled={isPublishing || !postContent.trim()} size="lg" className="w-full bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 text-foreground font-semibold text-lg h-14 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl">
            <Send className="w-5 h-5 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish Post'}
          </Button>
        </motion.div>
      </div>

      {/* Collapsible AI Chat Sidebar */}
      <CollapsibleAIChat onUseText={text => setPostContent(prev => prev ? prev + '\n' + text : text)} hideToggleButton={true} isExpanded={showAIChat} onToggleChange={setShowAIChat} />

      {/* Post Insights Panel - Shows when AI is closed */}
      <PostInsightsPanel isVisible={!showAIChat} />
    </div>;
};
export default CreatePostDesktop;