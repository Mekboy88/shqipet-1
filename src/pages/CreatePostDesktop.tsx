import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CollapsibleAIChat from '@/components/create-post/ai-chat/CollapsibleAIChat';
import FloatingAIButton from '@/components/create-post/FloatingAIButton';
import PostIntentSection from '@/components/create-post/PostIntentSection';

import AISmartSummary from '@/components/create-post/AISmartSummary';
import { 
  Camera, Video, Mic, MapPin, BarChart3, Tag, Link2, Palette, 
  EyeOff, Heart, Share2, Shield, Clock, Globe,
  Settings2, ChevronDown, Sparkles, Brain, Lightbulb, TrendingUp,
  Calendar, Languages, Info, Save, Eye, Send, X, Mic2, MessageSquare
} from 'lucide-react';
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
  const { displayName } = useUniversalUser();
  const { user } = useAuth();
  const { toast } = useToast();
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
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to publish posts.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: {
            text: postContent,
            tone,
            contentWarning,
          },
          visibility,
          post_type: 'regular',
          is_sponsored: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Post Published!",
        description: "Your post has been shared successfully.",
      });

      setPostContent('');
      setShowPreview(false);
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const mediaTools = [
    { icon: Camera, label: 'Photo', color: 'text-blue-500' },
    { icon: Video, label: 'Video', color: 'text-purple-500' },
    { icon: Mic, label: 'Audio', color: 'text-red-500' },
    { icon: MapPin, label: 'Location', color: 'text-green-500' },
    { icon: BarChart3, label: 'Poll', color: 'text-orange-500' },
    { icon: Tag, label: 'Tag', color: 'text-pink-500' },
    { icon: Link2, label: 'Link', color: 'text-indigo-500' },
    { icon: Palette, label: 'Background', color: 'text-yellow-500' },
    { icon: EyeOff, label: 'Anonymous', color: 'text-gray-500' },
  ];

  const aiFeatures = [
    { icon: Sparkles, label: 'Improve Writing', action: () => toast({ title: "✨ Improving writing..." }) },
    { icon: Brain, label: 'Fix Grammar & Spelling', action: () => toast({ title: "🧠 Checking grammar..." }) },
    { icon: Lightbulb, label: 'Generate Captions', action: () => toast({ title: "💡 Generating captions..." }) },
    { icon: Tag, label: 'Suggest Hashtags', action: () => toast({ title: "🔥 Finding hashtags..." }) },
    { icon: TrendingUp, label: 'Optimize Engagement', action: () => toast({ title: "🎯 Analyzing engagement..." }) },
    { icon: Clock, label: 'Best Time to Post', action: () => toast({ title: "🕓 Calculating best time..." }) },
    { icon: Shield, label: 'Detect Sensitive/Duplicate', action: () => toast({ title: "🚫 Scanning content..." }) },
    { icon: Globe, label: 'Translate Automatically', action: () => toast({ title: "🌍 Translating..." }) },
    { icon: Eye, label: 'Convert to Story', action: () => toast({ title: "🧩 Converting to story..." }) },
    { icon: Mic2, label: 'Voice-Over Preview', action: () => toast({ title: "🗣️ Generating voice-over..." }) },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 pt-14">
      <Helmet>
        <title>Create Post | Shqipet</title>
        <meta name="description" content="Compose a new Shqipet post with media, AI assistance, and privacy settings." />
        <link rel="canonical" href="/create-post" />
      </Helmet>
      <h1 className="sr-only">Create Post – Shqipet</h1>

      {/* Main 2-Column Layout (Left Sidebar + Center) */}
      <div className="w-full min-h-[calc(100vh-56px)] grid grid-cols-[280px_1fr] gap-4 p-4 pr-[420px]">
        {/* Left Sidebar - Post Settings */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/70 backdrop-blur-xl shadow-md rounded-3xl border border-gray-200/60 p-6 overflow-y-auto"
        >
          <h2 className="text-xl font-bold mb-6 text-gray-800">Post Settings</h2>
          
          <div className="space-y-3">
            {/* Comments & Privacy */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-2">
                    <svg 
                      className="w-4 h-4" 
                      viewBox="0 0 32 32" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="10" y1="12" x2="19" y2="12"></line>
                      <line x1="10" y1="16" x2="14" y2="16"></line>
                      <path d="M11,4c-4.4,0-8,3.6-8,8v12v5l0,0c3.7-3.2,8.4-5,13.3-5H21c4.4,0,8-3.6,8-8v-4c0-4.4-3.6-8-8-8H11z"></path>
                    </svg>
                    <span className="font-medium text-sm">Comments & Privacy</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-white/30 rounded-lg">
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
                <div className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-sm">Publishing Options</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-white/30 rounded-lg">
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
                <div className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    <span className="font-medium text-sm">Language & AI Tone</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-white/30 rounded-lg">
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
                <div className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium text-sm">Moderation & Security</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-white/30 rounded-lg">
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
                <div className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span className="font-medium text-sm">Draft & Auto-Save</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-white/30 rounded-lg">
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
                <div className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium text-sm">Engagement Analytics</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 p-3 bg-white/30 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Predicted Reach</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-3/4"></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Hashtag Effectiveness</p>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-2/3"></div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </motion.div>

        {/* Center Column - Editor */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl shadow-md rounded-3xl border border-gray-200/60 focus-within:border-red-400/80 transition-all p-8 overflow-y-auto flex flex-col"
        >
          {/* Header with Avatar & Visibility */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar size="lg" />
            <div className="flex-1">
              <p className="font-semibold text-lg">{displayName || "User"}</p>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-48 h-8 text-sm">
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
            <div className="flex items-center gap-2">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <span className="text-sm text-gray-600">🕵️ Anonymous</span>
            </div>
          </div>

          {/* Text Editor */}
          <div className="flex-1 mb-6">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Shkruaj çfarë ndjen, mendon apo dëshiron të ndash me Shqipet…"
              className="min-h-[200px] text-lg resize-none border border-red-200/40 rounded-[14px] px-4 transition-all duration-200 ease-out hover:border-red-300/50 focus-visible:border-red-300/60 focus-visible:ring-0 focus-visible:shadow-[0_0_20px_rgba(239,68,68,0.08)]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  to bottom,
                  transparent 0px,
                  transparent 25px,
                  rgba(239, 68, 68, 0.04) 25px,
                  rgba(239, 68, 68, 0.04) 26px
                )`,
                lineHeight: '26px',
                paddingTop: '4px',
                paddingBottom: '4px',
                caretColor: 'rgba(239, 68, 68, 0.6)',
                verticalAlign: 'baseline'
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {charCount} characters {isOptimal && <span className="text-green-600 font-medium">✓ Optimal</span>}
              </span>
              <Button variant="ghost" size="sm">
                <Mic2 className="w-4 h-4 mr-2" />
                Voice Input
              </Button>
            </div>
          </div>

          {/* AI Buttons Row */}
          <div className="flex justify-center gap-4 -mt-4 mb-4">
            <FloatingAIButton />
            <PostIntentSection selectedIntent={postIntent} onSelectIntent={setPostIntent} />
            
            {/* AI Chat Toggle Button */}
            {!showAIChat && (
              <motion.button
                onClick={() => setShowAIChat(true)}
                className="relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Pulsing Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-teal-600 opacity-75 blur-md animate-pulse" />
                
                {/* Main Button */}
                <div className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-full shadow-lg">
                  <MessageSquare className="w-5 h-5 text-white animate-pulse" />
                  <span className="font-semibold text-white text-sm">AI Chat</span>
                </div>
              </motion.button>
            )}
          </div>

          {/* AI Smart Summary */}
          <AISmartSummary content={postContent} />

          {/* Media Toolbar */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Add to your post</p>
            <div className="flex flex-wrap gap-3">
              {mediaTools.map((tool, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-all ${tool.color}`}
                >
                  <tool.icon className="w-6 h-6" />
                  <span className="text-xs text-gray-600">{tool.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preview Button */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mb-4">
                <Eye className="w-4 h-4 mr-2" />
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
                    <p className="text-sm text-gray-500">{visibility}</p>
                  </div>
                </div>
                <p className="text-lg whitespace-pre-wrap">{postContent || "No content yet..."}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowPreview(false)}>Edit Again</Button>
                  <Button variant="default" onClick={handlePublish} className="bg-red-500 hover:bg-red-600">
                    <Send className="w-4 h-4 mr-2" />
                    Publish Now
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !postContent.trim()}
            size="lg"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-lg h-14 rounded-xl shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish Post'}
          </Button>
        </motion.div>
      </div>

      {/* Collapsible AI Chat Sidebar */}
      <CollapsibleAIChat 
        onUseText={(text) => setPostContent(prev => prev + '\n\n' + text)} 
        hideToggleButton={true}
        isExpanded={showAIChat}
        onToggleChange={setShowAIChat}
      />
    </div>
  );
};

export default CreatePostDesktop;
