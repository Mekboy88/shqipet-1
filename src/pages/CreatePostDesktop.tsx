import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CollapsibleAIChat from '@/components/create-post/ai-chat/CollapsibleAIChat';
import FloatingAIButton from '@/components/create-post/FloatingAIButton';
import PostIntentSection from '@/components/create-post/PostIntentSection';
import PostInsightsPanel from '@/components/create-post/PostInsightsPanel';
import AISmartSummary from '@/components/create-post/AISmartSummary';
import { Camera, Video, Mic, MapPin, BarChart3, Tag, Link2, Palette, EyeOff, Heart, Share2, Shield, Clock, Globe, Settings2, ChevronDown, Sparkles, Brain, Lightbulb, TrendingUp, Calendar, Languages, Info, Save, Eye, Send, X, Mic2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
        is_sponsored: false
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
  const AnonymousIcon = () => (
    <svg viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6">
      <path d="M179.335,226.703c22.109,0.219,37.484,21.172,44.047,27.047c1.578,1.828,3.875,2.984,6.469,2.984 c4.766,0,8.641-3.859,8.641-8.641c0-2.656-1.219-5.031-3.125-6.609l0.016-0.031c-5-4.781-20.547-25.688-55.734-25.688 s-43.609,26.406-44.5,29.594c-0.016,0.156-0.094,0.297-0.094,0.453c0,1.359,1.078,2.438,2.438,2.438 c1.094,0,1.844-0.875,2.266-1.813C142.491,241.047,150.382,226.406,179.335,226.703z"/>
      <path d="M331.554,216.813c-35.188,0-50.734,20.875-55.734,25.656l0.016,0.047c-1.906,1.578-3.125,3.922-3.125,6.594 c0,4.781,3.875,8.641,8.625,8.641c2.609,0,4.938-1.156,6.516-2.969c6.531-5.891,21.906-26.828,44.016-27.063 c28.953-0.281,36.844,14.344,39.578,19.75c0.422,0.922,1.172,1.797,2.281,1.797c1.344,0,2.422-1.094,2.422-2.422 c0-0.172-0.063-0.328-0.094-0.469C375.163,243.188,366.741,216.813,331.554,216.813z"/>
      <path d="M331.054,370.563l-36.141-2.063l-17.172-10.781c0,0-10.031,5.922-12.328,7.297h-9.094h-9.094 c-2.297-1.375-12.297-7.297-12.297-7.297l-0.375,0.234c-0.266-0.25-0.438-0.563-0.75-0.797c-3.25-2.344-5.047-4.656-4.906-6.313 c0.297-3.438,6.609-8.219,11.063-10.391l4.141-1.953v-50.094c0-9.156-6.094-18.391-17.594-26.688 c-12.266-8.844-30.875-16.375-41.094-12.953c-3.781,1.25-5.797,5.297-4.547,9.078c1.188,3.781,5.344,5.875,9.109,4.688 c3.156-0.953,16.75,2.641,28.5,11.313c6.969,5.109,11.094,10.547,11.094,14.563v41.266c-5.438,3.375-14.25,10.281-15.125,19.859 c-0.375,4.25,0.719,10.313,7.297,16.469l-4,2.5l-36.156,2.063c0,0-36.203-28.922-40.297-34.813l24.578,58.234 c0,0,64.594,0.906,67.234,0.609c12.313-10.016,23.219-21.391,23.219-21.391s10.906,11.375,23.203,21.391 c2.656,0.297,67.25-0.609,67.25-0.609l24.563-58.234C367.257,341.641,331.054,370.563,331.054,370.563z"/>
      <path d="M181.772,319.344c20.031,0,32.766-16.594,32.766-22.219s-12.734-22.203-32.766-22.203 s-32.781,16.578-32.781,22.203S161.741,319.344,181.772,319.344z"/>
      <path d="M325.335,319.344c20.031,0,32.781-16.594,32.781-22.219s-12.75-22.203-32.781-22.203 s-32.766,16.578-32.766,22.203S305.304,319.344,325.335,319.344z"/>
      <path d="M482.46,167.234l-88.891-22.219c0,0-11-76.734-12.781-89.219c-1.766-12.453-12.484-46.344-51.703-46.344 H182.897c-39.188,0-49.906,33.891-51.703,46.344c-1.734,12.484-12.75,89.219-12.75,89.219l-88.922,22.219 c-37.766,8.906-39.344,34.719-4.453,34.719c10.688,0,38.25,0,70.734,0c-14.891,42.609-48.75,141.25-73.266,227.125L69.022,419 v58.594l46.484-22.219l18.188,42.438l21.406-42.844c28.813,31.219,65.484,47.578,101.219,47.578 c36.109,0,72.266-14.031,100.656-43.172l19.25,38.438l18.188-42.438l46.469,22.219V419l46.484,10.078 c-24.547-85.875-58.375-184.516-73.266-227.125c33.391,0,61.906,0,72.813,0C521.819,201.953,520.257,176.141,482.46,167.234z M387.46,297.5c0,120.625-61.375,176.75-124.359,180.484l28.359-43.953h-36.406h-36.422l28.219,43.734 c-60.625-5.938-121.688-68.625-121.703-180.656c-1.297-40.516,4.797-72.406,17.969-95.156c57.219,0,112.891,0,112.891,0 s56.063,0,113.5,0C382.694,224.672,388.788,256.594,387.46,297.5z"/>
    </svg>
  );

  const mediaTools = [{
    icon: Camera,
    label: 'Photo',
    color: 'text-blue-500'
  }, {
    icon: Video,
    label: 'Video',
    color: 'text-purple-500'
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
    icon: AnonymousIcon,
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
            <Avatar size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-lg">{displayName || "User"}</p>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-48 h-8 text-sm border-red-200/40 hover:border-red-300/50 focus:border-red-300/60 focus:ring-0 focus:shadow-[0_0_20px_rgba(239,68,68,0.08)] transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">🌐 Public</SelectItem>
                  <SelectItem value="friends">👥 Friends</SelectItem>
                  <SelectItem value="followers">👤 Followers</SelectItem>
                  <SelectItem value="onlyme">🔒 Only Me</SelectItem>
                  <SelectItem value="anonymous">🕵️ Anonymous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <span className="text-sm text-muted-foreground"> Anonymous</span>
            </div>
          </div>

          {/* Text Editor */}
          <div className="flex-1 mb-6 relative">
            {!postContent && <div className="absolute left-4 top-1 flex items-center gap-2 pointer-events-none text-lg text-muted-foreground leading-tight">
                <span>Çdo moment është një fillim i ri</span>
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5 text-gray-600 flex-shrink-0">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path>
                  <path d="M11.315 10.014a.5.5 0 0 1 .548.736A4.498 4.498 0 0 1 7.965 13a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .548-.736h.005l.017.005.067.015.252.055c.215.046.515.108.857.169.693.124 1.522.242 2.152.242.63 0 1.46-.118 2.152-.242a26.58 26.58 0 0 0 1.109-.224l.067-.015.017-.004.005-.002zM4.756 4.566c.763-1.424 4.02-.12.952 3.434-4.496-1.596-2.35-4.298-.952-3.434zm6.488 0c1.398-.864 3.544 1.838-.952 3.434-3.067-3.554.19-4.858.952-3.434z"></path>
                </svg>
              </div>}
            <Textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="" className="min-h-[200px] text-lg resize-none border border-red-200/55 rounded-[14px] px-4 transition-all duration-200 ease-out hover:border-red-300/60 focus-visible:border-red-300/70 focus-visible:ring-0 focus-visible:shadow-[0_0_20px_rgba(239,68,68,0.08)]" style={{
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

          {/* Media Toolbar */}
          <div className="border-t border-border pt-4 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Add to your post</p>
            <div className="flex flex-wrap gap-3">
              {mediaTools.map((tool, idx) => <motion.button key={idx} whileHover={{
              scale: 1.1
            }} whileTap={{
              scale: 0.95
            }} className={`flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-accent transition-all ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                  <span className="text-xs text-muted-foreground">{tool.label}</span>
                </motion.button>)}
            </div>
          </div>

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar size="md" />
                  <div>
                    <p className="font-semibold">{isAnonymous ? "Anonymous User" : displayName}</p>
                    <p className="text-sm text-muted-foreground">{visibility}</p>
                  </div>
                </div>
                <p className="text-lg whitespace-pre-wrap">{postContent || "No content yet..."}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowPreview(false)}>Edit Again</Button>
                  <Button variant="default" onClick={handlePublish} className="bg-primary hover:bg-primary/90">
                    <Send className="w-4 h-4 mr-2" />
                    Publish Now
                  </Button>
                </div>
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
      <CollapsibleAIChat onUseText={text => setPostContent(prev => prev + '\n\n' + text)} hideToggleButton={true} isExpanded={showAIChat} onToggleChange={setShowAIChat} />

      {/* Post Insights Panel - Shows when AI is closed */}
      <PostInsightsPanel isVisible={!showAIChat} />
    </div>;
};
export default CreatePostDesktop;