import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Globe, Lock, Users, Bold, Italic, Quote, Code, AtSign, Hash, ChevronDown, Image, Link2, BarChart3, FileUp, AudioLines, Calendar as CalendarIcon, Smile, MapPin, Video, Camera, Mic, Type, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Underline, Strikethrough, Superscript, Subscript, Indent, Outdent, MinusSquare, PlusSquare, FileText, Heading1, Heading2, Heading3, Code2, RotateCw, Square, Circle, Triangle, Star, Heart, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Sparkles, Eye, Settings2, Lightbulb } from 'lucide-react';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { useAuth } from '@/contexts/AuthContext';
import { usePostsData } from '@/contexts/posts/usePostsData';
import { useS3FileUpload } from '@/hooks/useS3FileUpload';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Avatar from '@/components/Avatar';
import PollCreationModal from './PollCreationModal';
import LocationPickerModal from './LocationPickerModal';
import ShqipetAIAssistant from './ShqipetAIAssistant';
import LinkPreviewGenerator from '@/components/create-post/features/LinkPreviewGenerator';
import ContentWarningSlidingWindow from '@/components/create-post/sliding-windows/ContentWarningSlidingWindow';
import PostExpirationSlidingWindow from '@/components/create-post/sliding-windows/PostExpirationSlidingWindow';
import CrossPlatformSlidingWindow from '@/components/create-post/sliding-windows/CrossPlatformSlidingWindow';
import AudienceTargetingSlidingWindow from '@/components/create-post/sliding-windows/AudienceTargetingSlidingWindow';
import VoiceToTextSlidingWindow from '@/components/create-post/sliding-windows/VoiceToTextSlidingWindow';
import TranslationSlidingWindow from '@/components/create-post/sliding-windows/TranslationSlidingWindow';
import ContentModerationSlidingWindow from '@/components/create-post/sliding-windows/ContentModerationSlidingWindow';
import TextFormattingSlidingWindow from '@/components/create-post/sliding-windows/TextFormattingSlidingWindow';
import PhotoPreviewSlidingWindow from '@/components/create-post/sliding-windows/PhotoPreviewSlidingWindow';
import DuplicatePostWarning from '@/components/create-post/features/DuplicatePostWarning';
import BackgroundRemovalTool from '@/components/create-post/features/BackgroundRemovalTool';
import { Clock } from 'lucide-react';
import { WarningIcon } from '@/components/icons/WarningIcon';
import { PostExpirationIcon } from '@/components/icons/PostExpirationIcon';
import { CrossPlatformIcon } from '@/components/icons/CrossPlatformIcon';
import { AudienceTargetingIcon } from '@/components/icons/AudienceTargetingIcon';
import { VoiceToTextIcon } from '@/components/icons/VoiceToTextIcon';
import { TranslationIcon } from '@/components/icons/TranslationIcon';
import { ContentModerationIcon } from '@/components/icons/ContentModerationIcon';
import type { PollData, LocationData } from '@/contexts/posts/types';
import '@/components/feed/animations.css';
import { usePublishingProgress } from '@/contexts/PublishingProgressContext';

interface CreatePostFormProps {
  onClose: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onClose }) => {
  const { user, userProfile } = useAuth();
  const { addPost } = usePostsData();
  const { startPublishing } = usePublishingProgress();

  const getDisplayName = () => {
    const first = user?.user_metadata?.first_name || userProfile?.first_name || '';
    const last = user?.user_metadata?.last_name || userProfile?.last_name || '';
    if (first && last) return `${first} ${last}`;
    return first || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const userName = getDisplayName();

  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [whoCanComment, setWhoCanComment] = useState('Everyone');
  const [privacy, setPrivacy] = useState('Public');
  const [allowComments, setAllowComments] = useState(true);
  const [postNow, setPostNow] = useState(true);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const { uploadFile: s3UploadFile } = useS3FileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // New feature states
  const [linkPreviews, setLinkPreviews] = useState<any[]>([]);
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [postExpiration, setPostExpiration] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [audienceSettings, setAudienceSettings] = useState<any>({
    privacy: 'public',
    excludedUsers: [],
    specificUsers: []
  });
  const [translationSettings, setTranslationSettings] = useState<any>({
    autoTranslate: false,
    targetLanguages: [],
    showOriginal: true
  });
  const [translatedContent, setTranslatedContent] = useState<{[key: string]: string}>({});

  // Sliding window states
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showContentGuidance, setShowContentGuidance] = useState(true);
  
  // Auto-open photo preview when files are selected, but close when other windows open
  useEffect(() => {
    if (selectedFiles.length > 0) {
      // Only auto-open if no other window is currently open
      if (!activeWindow) {
        setActiveWindow('photoPreview');
      }
    } else if (selectedFiles.length === 0 && activeWindow === 'photoPreview') {
      setActiveWindow(null);
    }
  }, [selectedFiles.length]);
  
  // Close photo preview when other windows open
  useEffect(() => {
    if (activeWindow && activeWindow !== 'photoPreview') {
      // Photo preview is closed when other windows open
    }
  }, [activeWindow]);

  const openWindow = (windowName: string) => {
    setActiveWindow(windowName);
  };

  const closeWindow = () => {
    setActiveWindow(null);
  };

  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [showFormattingModal, setShowFormattingModal] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 });

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const prevContent = postContent;
    setPostContent(value);
    
    // Check if user just typed @
    if (value.length > prevContent.length && value.endsWith('@')) {
      setShowMentionModal(true);
      setMentionQuery('');
      return;
    }
    
    // Check for @ mentions while typing
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ')) {
      const queryAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!queryAfterAt.includes(' ') && queryAfterAt.length <= 20) {
        setMentionQuery(queryAfterAt);
        if (!showMentionModal) {
          setShowMentionModal(true);
        }
      }
    } else {
      if (showMentionModal) {
        setShowMentionModal(false);
        setMentionQuery('');
      }
    }
  };

  const insertMentionFromDropdown = (username: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = postContent.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeMention = postContent.slice(0, lastAtIndex);
      const afterCursor = postContent.slice(cursorPosition);
      const newContent = beforeMention + `@${username} ` + afterCursor;
      
      setPostContent(newContent);
      setShowMentionDropdown(false);
      setMentionQuery('');
      
      // Focus back and position cursor after the mention
      setTimeout(() => {
        const newPosition = lastAtIndex + username.length + 2;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const insertMentionFromModal = (username: string) => {
    let newContent;
    if (mentionQuery && showMentionModal) {
      // Replace the partial query after @
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const cursorPosition = textarea.selectionStart || 0;
        const textBeforeCursor = postContent.slice(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex !== -1) {
          const beforeMention = postContent.slice(0, lastAtIndex);
          const afterCursor = postContent.slice(cursorPosition);
          newContent = beforeMention + `@${username} ` + afterCursor;
        } else {
          newContent = postContent + `@${username} `;
        }
      } else {
        newContent = postContent + `@${username} `;
      }
    } else {
      // Just append the mention
      newContent = postContent + (postContent && !postContent.endsWith(' ') ? ' ' : '') + `@${username} `;
    }
    
    setPostContent(newContent);
    setShowMentionModal(false);
    setMentionQuery('');
    
    // Focus back to textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newContent.length, newContent.length);
      }
    }, 0);
  };

  const insertHashtagToContent = (hashtag: string) => {
    const newContent = postContent + (postContent && !postContent.endsWith(' ') ? ' ' : '') + `#${hashtag}`;
    setPostContent(newContent);
    setShowHashtagModal(false);
    
    // Focus back to textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newContent.length, newContent.length);
      }
    }, 0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 handleFileSelect called');
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      console.log('📁 No files selected in handleFileSelect');
      return;
    }

    console.log('📁 Files selected in handleFileSelect:', files.map(f => ({ 
      name: f.name, 
      type: f.type, 
      size: `${(f.size / 1024 / 1024).toFixed(2)}MB` 
    })));

    try {
      // Validate and filter files
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach(file => {
        // Check file type
        if (!file.type.match(/^(image|video)\//)) {
          invalidFiles.push(`${file.name} (invalid type)`);
          return;
        }
        
        // Check file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large)`);
          return;
        }
        
        validFiles.push(file);
      });

      // Update state with valid files
      if (validFiles.length > 0) {
        setSelectedFiles(prev => {
          const newFiles = [...prev, ...validFiles];
          console.log('✅ Updated selected files in handleFileSelect:', newFiles.map(f => f.name));
          return newFiles;
        });
        
        // Show success toast
        toast.success(`✅ ${validFiles.length} file(s) selected`, {
          description: validFiles.map(f => f.name).join(', '),
          duration: 3000
        });
      }
      
      // Show error for invalid files
      if (invalidFiles.length > 0) {
        console.warn('❌ Invalid files rejected in handleFileSelect:', invalidFiles);
        toast.error(`❌ ${invalidFiles.length} file(s) rejected`, {
          description: 'Files must be images/videos under 100MB',
          duration: 5000
        });
      }

    } catch (error) {
      console.error('❌ Error in handleFileSelect:', error);
      toast.error('Failed to process selected files. Please try again.');
    }
    
    // Reset input value to allow selecting same files again
    e.target.value = '';
  };

  const handleCreatePost = async () => {
    console.log('🔘 PUBLISH POST BUTTON CLICKED!', {
      postContent: postContent.trim(),
      selectedFilesCount: selectedFiles.length,
      pollData: !!pollData,
      locationData: !!locationData,
      user: !!user
    });

    if (!postContent.trim() && selectedFiles.length === 0 && !pollData && !locationData) {
      toast.error('Please add content, select files, create a poll, or add a location to your post.');
      console.log('❌ Validation failed: No content provided');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to post.');
      console.log('❌ Validation failed: No user logged in');
      return;
    }
    
    console.log('✅ All validation passed, proceeding with post creation...');
    setIsSubmitting(true);

    // Quick option: If there's text content and user wants to skip file uploads
    if (postContent.trim() && selectedFiles.length > 0) {
      toast.info(`📝 Posting with image upload. Click "Skip Images" if upload fails.`, {
        duration: 3000,
        action: {
          label: "Skip Images & Post Now",
          onClick: () => {
            setSelectedFiles([]);
            toast.dismiss();
            setTimeout(() => handleCreatePost(), 100);
          }
        }
      });
    }

    // Declare fileUrls outside try block so it's accessible in catch
    let fileUrls: string[] = [];

    try {
      
      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        console.log('🚀 UPLOAD PROCESS STARTING - Files to upload:', selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
        
        // Show upload progress toast
        const uploadToast = toast.loading(`🔄 Uploading ${selectedFiles.length} file(s)...`, {
          duration: 30000 // Longer timeout
        });
        
        // FIX 3: Wait for upload completion before proceeding
        try {
          // Upload files sequentially to avoid overwhelming the server
          fileUrls = [];
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            console.log(`📤 Step ${i + 1}: Starting upload for ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            
            try {
              console.log(`🔄 Calling uploadToWasabi for: ${file.name}`);
              const result = await s3UploadFile(file);
              
              if (!result || typeof result !== 'string') {
                throw new Error(`Invalid upload response for ${file.name}: ${JSON.stringify(result)}`);
              }
              
              fileUrls.push(result);
              console.log(`✅ Step ${i + 1}: File uploaded successfully:`, {
                fileName: file.name,
                url: result
              });
              
              // Update progress toast
              toast.loading(`🔄 Uploaded ${i + 1}/${selectedFiles.length} files...`, {
                id: uploadToast
              });
              
            } catch (fileError) {
              console.error(`❌ Step ${i + 1}: Upload failed for ${file.name}:`, {
                error: fileError,
                message: fileError instanceof Error ? fileError.message : String(fileError),
                stack: fileError instanceof Error ? fileError.stack : undefined
              });
              toast.dismiss(uploadToast);
              
              // FIX 4: Better error handling and user feedback
              throw new Error(`Upload failed for "${file.name}": ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
            }
          }
          
          console.log('🎉 ALL FILES UPLOADED SUCCESSFULLY:', {
            totalFiles: selectedFiles.length,
            urls: fileUrls
          });
          
          // Dismiss loading toast
          toast.dismiss(uploadToast);
          
        } catch (uploadError) {
          console.error('💥 UPLOAD PROCESS FAILED:', {
            error: uploadError,
            message: uploadError instanceof Error ? uploadError.message : String(uploadError),
            selectedFiles: selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
            completedUploads: fileUrls.length,
            stack: uploadError instanceof Error ? uploadError.stack : undefined
          });
          
          // FIX 4: Clear error messages with actionable options
          toast.error(`❌ Upload Error: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`, {
            description: `Failed after ${fileUrls.length}/${selectedFiles.length} files uploaded.`,
            duration: 10000,
            action: {
              label: "Post text only",
              onClick: () => {
                setSelectedFiles([]);
                setTimeout(() => handleCreatePost(), 100);
              }
            }
          });
          
          throw uploadError; // Re-throw to be caught by outer try-catch
        }
      } else {
        console.log('📁 No files selected for upload');
      }

      const postType = pollData ? 'poll' : locationData ? 'location' : 'regular';
      const content: any = { 
        text: postContent.trim() || undefined, 
        images: fileUrls.length ? fileUrls : undefined 
      };
      
      if (pollData) {
        const now = new Date();
        const endDate = new Date(now.getTime() + pollData.duration * 60 * 60 * 1000);
        
        content.poll = {
          ...pollData,
          createdAt: now.toISOString(),
          endDate: endDate.toISOString(),
          totalVotes: 0,
          options: pollData.options.map(opt => ({
            ...opt,
            votes: 0,
            voters: []
          }))
        };
      }

      if (locationData) {
        content.location = locationData;
      }

      console.log('📝 Creating post with content:', content);

      console.log('🚀 Starting post creation process...');
      
      // Start the publishing progress but keep modal open until completion
      startPublishing(postContent.trim() || 'New post', false, []);

      // Continue with actual post creation - FIX 3: Only after successful uploads
      console.log('📤 Creating post in database with data:', {
        user: { name: userName, image: '', verified: false },
        content,
        postType,
        mediaUrls: fileUrls
      });
      
      try {
        await addPost({
          user: { name: userName, image: '', verified: false },
          time: 'just now',
          visibility: 'public',
          isSponsored: false,
          postType,
          content,
        });
        
        console.log('✅ Post creation completed successfully');
        
        // Clear the form after successful post creation
        setPostContent('');
        setSelectedFiles([]);
        setPollData(null);
        setLocationData(null);
        
        // Show success message
        toast.success('✅ Post published successfully!', {
          description: `Your ${fileUrls.length > 0 ? 'post with images' : 'text post'} has been shared`,
          duration: 4000
        });
        
        // Close modal after successful creation
        onClose();
        
      } catch (dbError) {
        console.error('❌ Database insert failed:', {
          error: dbError,
          message: dbError instanceof Error ? dbError.message : String(dbError),
          content,
          fileUrls
        });
        
        // FIX 4: Show database errors
        toast.error('❌ Failed to save post to database', {
          description: dbError instanceof Error ? dbError.message : 'Database error occurred',
          duration: 8000
        });
        
        throw dbError;
      }
      
    } catch (error: any) {
      // FIX 4: Comprehensive error handling and logging
      console.error('❌ Post creation failed:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        postContent: postContent.trim(),
        selectedFiles: selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
        fileUrls
      });
      
      // Show user-friendly error message
      toast.error('❌ Failed to create post', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        duration: 8000
      });
    } finally {
      // FIX 4: Always reset submitting state
      setIsSubmitting(false);
    }
  };

  const handleCreatePoll = (newPollData: Omit<PollData, 'createdAt' | 'endDate' | 'totalVotes'>) => {
    setPollData(newPollData as PollData);
    setShowPollModal(false);
    toast.success('Poll added to your post!');
  };

  const handleSelectLocation = (location: LocationData) => {
    setLocationData(location);
    setShowLocationModal(false);
    toast.success('Location added to your post!');
  };

  const removePoll = () => {
    setPollData(null);
    toast.success('Poll removed from post');
  };

  const removeLocation = () => {
    setLocationData(null);
    toast.success('Location removed from post');
  };

  const handleEmojiSelect = (emoji: string) => {
    setPostContent(prev => prev + emoji);
  };

  const handleAIContentInsert = (content: string) => {
    setPostContent(content);
    setShowAIAssistant(false);
  };

  const insertFormatting = (formatType: string, formatText: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPosition = textarea.selectionStart || 0;
      const selectionEnd = textarea.selectionEnd || 0;
      const textBefore = postContent.slice(0, cursorPosition);
      const textAfter = postContent.slice(selectionEnd);
      const selectedText = postContent.slice(cursorPosition, selectionEnd);
      
      let newContent = '';
      let newPosition = cursorPosition;
      
      switch (formatType) {
        case 'wrap':
          // For formatting that wraps around selected text (bold, italic, etc.)
          if (selectedText) {
            // If text is selected, wrap it
            if (formatText === '**') {
              newContent = textBefore + '**' + selectedText + '**' + textAfter;
              newPosition = cursorPosition + 2;
            } else if (formatText === '*') {
              newContent = textBefore + '*' + selectedText + '*' + textAfter;
              newPosition = cursorPosition + 1;
            } else if (formatText === '__') {
              newContent = textBefore + '<u>' + selectedText + '</u>' + textAfter;
              newPosition = cursorPosition + 3;
            } else if (formatText === '~~') {
              newContent = textBefore + '~~' + selectedText + '~~' + textAfter;
              newPosition = cursorPosition + 2;
            } else if (formatText === '`') {
              newContent = textBefore + '`' + selectedText + '`' + textAfter;
              newPosition = cursorPosition + 1;
            } else if (formatText === '```') {
              newContent = textBefore + '```\n' + selectedText + '\n```' + textAfter;
              newPosition = cursorPosition + 4;
            } else if (formatText === '<sup>') {
              newContent = textBefore + '<sup>' + selectedText + '</sup>' + textAfter;
              newPosition = cursorPosition + 5;
            } else if (formatText === '<sub>') {
              newContent = textBefore + '<sub>' + selectedText + '</sub>' + textAfter;
              newPosition = cursorPosition + 5;
            } else if (formatText === '<u>') {
              newContent = textBefore + '<u>' + selectedText + '</u>' + textAfter;
              newPosition = cursorPosition + 3;
            } else if (formatText === '"') {
              newContent = textBefore + '"' + selectedText + '"' + textAfter;
              newPosition = cursorPosition + 1;
            } else {
              newContent = textBefore + formatText + selectedText + formatText + textAfter;
              newPosition = cursorPosition + formatText.length;
            }
          } else {
            // If no text selected, insert markers and position cursor between them
            if (formatText === '**') {
              newContent = textBefore + '****' + textAfter;
              newPosition = cursorPosition + 2;
            } else if (formatText === '*') {
              newContent = textBefore + '**' + textAfter;
              newPosition = cursorPosition + 1;
            } else if (formatText === '__' || formatText === '<u>') {
              newContent = textBefore + '<u></u>' + textAfter;
              newPosition = cursorPosition + 3;
            } else if (formatText === '~~') {
              newContent = textBefore + '~~~~' + textAfter;
              newPosition = cursorPosition + 2;
            } else if (formatText === '`') {
              newContent = textBefore + '``' + textAfter;
              newPosition = cursorPosition + 1;
            } else if (formatText === '```') {
              newContent = textBefore + '```\n\n```' + textAfter;
              newPosition = cursorPosition + 4;
            } else if (formatText === '<sup>') {
              newContent = textBefore + '<sup></sup>' + textAfter;
              newPosition = cursorPosition + 5;
            } else if (formatText === '<sub>') {
              newContent = textBefore + '<sub></sub>' + textAfter;
              newPosition = cursorPosition + 5;
            } else if (formatText === '"') {
              newContent = textBefore + '""' + textAfter;
              newPosition = cursorPosition + 1;
            } else {
              newContent = textBefore + formatText + formatText + textAfter;
              newPosition = cursorPosition + formatText.length;
            }
          }
          break;
        case 'prefix':
          // For line prefixes (headers, lists, quotes)
          const isStartOfLine = cursorPosition === 0 || textBefore.endsWith('\n');
          let prefixText = '';
          
          if (formatText.includes('#')) {
            // Headers
            prefixText = isStartOfLine ? formatText : '\n' + formatText;
          } else if (formatText === '• ') {
            // Bullet list
            prefixText = isStartOfLine ? '• ' : '\n• ';
          } else if (formatText === '1. ') {
            // Numbered list - find the highest number
            const listItemRegex = /^(\d+)\.\s/gm;
            const matches = textBefore.match(listItemRegex);
            let nextNumber = 1;
            if (matches) {
              const numbers = matches.map(match => parseInt(match.match(/(\d+)/)?.[1] || '1'));
              nextNumber = Math.max(...numbers) + 1;
            }
            prefixText = isStartOfLine ? `${nextNumber}. ` : `\n${nextNumber}. `;
          } else if (formatText === '> ') {
            // Quote
            prefixText = isStartOfLine ? '> ' : '\n> ';
          } else if (formatText === '- [ ] ') {
            // Checklist
            prefixText = isStartOfLine ? '- [ ] ' : '\n- [ ] ';
          } else if (formatText === '- [x] ') {
            // Done item
            prefixText = isStartOfLine ? '- [x] ' : '\n- [x] ';
          } else if (formatText === '○ ') {
            // Circle list
            prefixText = isStartOfLine ? '○ ' : '\n○ ';
          } else if (formatText === '■ ') {
            // Square list
            prefixText = isStartOfLine ? '■ ' : '\n■ ';
          } else if (formatText === '    ') {
            // Indent
            prefixText = '    ';
          } else if (formatText.includes('align')) {
            // Alignment
            prefixText = isStartOfLine ? formatText + '\n' : '\n' + formatText + '\n';
          } else if (formatText === '---') {
            // Horizontal rule
            prefixText = isStartOfLine ? '---\n' : '\n---\n';
          } else {
            prefixText = isStartOfLine ? formatText : '\n' + formatText;
          }
          
          newContent = textBefore + prefixText + textAfter;
          newPosition = cursorPosition + prefixText.length;
          break;
        case 'insert':
          // For symbols and special characters
          newContent = textBefore + formatText + textAfter;
          newPosition = cursorPosition + formatText.length;
          break;
        default:
          newContent = textBefore + formatText + textAfter;
          newPosition = cursorPosition + formatText.length;
      }
      
      setPostContent(newContent);
      setShowFormattingModal(false);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40" 
        onClick={() => !isSubmitting && onClose()} 
      />
      
      {/* Sliding Window Container */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="w-full max-w-6xl mx-auto bg-white shadow-xl border-x border-b border-border overflow-hidden">
          
          {/* Top Handle Bar */}
          <div className="h-1 bg-gradient-to-r from-primary/80 via-accent to-primary/80" />
          
          {/* Drag Indicator */}
          <div className="flex justify-center py-2 bg-muted/30">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-border">
            <div className="flex items-center gap-4">
              {!isAnonymous ? (
                <Avatar size="lg" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg 
                    version="1.1" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 512 512" 
                    className="w-8 h-8 fill-gray-600"
                  >
                    <path d="M179.335,226.703c22.109,0.219,37.484,21.172,44.047,27.047c1.578,1.828,3.875,2.984,6.469,2.984 c4.766,0,8.641-3.859,8.641-8.641c0-2.656-1.219-5.031-3.125-6.609l0.016-0.031c-5-4.781-20.547-25.688-55.734-25.688 s-43.609,26.406-44.5,29.594c-0.016,0.156-0.094,0.297-0.094,0.453c0,1.359,1.078,2.438,2.438,2.438 c1.094,0,1.844-0.875,2.266-1.813C142.491,241.047,150.382,226.406,179.335,226.703z"/>
                    <path d="M331.554,216.813c-35.188,0-50.734,20.875-55.734,25.656l0.016,0.047c-1.906,1.578-3.125,3.922-3.125,6.594 c0,4.781,3.875,8.641,8.625,8.641c2.609,0,4.938-1.156,6.516-2.969c6.531-5.891,21.906-26.828,44.016-27.063 c28.953-0.281,36.844,14.344,39.578,19.75c0.422,0.922,1.172,1.797,2.281,1.797c1.344,0,2.422-1.094,2.422-2.422 c0-0.172-0.063-0.328-0.094-0.469C375.163,243.188,366.741,216.813,331.554,216.813z"/>
                    <path d="M331.054,370.563l-36.141-2.063l-17.172-10.781c0,0-10.031,5.922-12.328,7.297h-9.094h-9.094 c-2.297-1.375-12.297-7.297-12.297-7.297l-0.375,0.234c-0.266-0.25-0.438-0.563-0.75-0.797c-3.25-2.344-5.047-4.656-4.906-6.313 c0.297-3.438,6.609-8.219,11.063-10.391l4.141-1.953v-50.094c0-9.156-6.094-18.391-17.594-26.688 c-12.266-8.844-30.875-16.375-41.094-12.953c-3.781,1.25-5.797,5.297-4.547,9.078c1.188,3.781,5.344,5.875,9.109,4.688 c3.156-0.953,16.75,2.641,28.5,11.313c6.969,5.109,11.094,10.547,11.094,14.563v41.266c-5.438,3.375-14.25,10.281-15.125,19.859 c-0.375,4.25,0.719,10.313,7.297,16.469l-4,2.5l-36.156,2.063c0,0-36.203-28.922-40.297-34.813l24.578,58.234 c0,0,64.594,0.906,67.234,0.609c12.313-10.016,23.219-21.391,23.219-21.391s10.906,11.375,23.203,21.391 c2.656,0.297,67.25-0.609,67.25-0.609l24.563-58.234C367.257,341.641,331.054,370.563,331.054,370.563z"/>
                    <path d="M181.772,319.344c20.031,0,32.766-16.594,32.766-22.219s-12.734-22.203-32.766-22.203 s-32.781,16.578-32.781,22.203S161.741,319.344,181.772,319.344z"/>
                    <path d="M325.335,319.344c20.031,0,32.781-16.594,32.781-22.219s-12.75-22.203-32.781-22.203 s-32.766,16.578-32.766,22.203S305.304,319.344,325.335,319.344z"/>
                    <path d="M482.46,167.234l-88.891-22.219c0,0-11-76.734-12.781-89.219c-1.766-12.453-12.484-46.344-51.703-46.344 H182.897c-39.188,0-49.906,33.891-51.703,46.344c-1.734,12.484-12.75,89.219-12.75,89.219l-88.922,22.219 c-37.766,8.906-39.344,34.719-4.453,34.719c10.688,0,38.25,0,70.734,0c-14.891,42.609-48.75,141.25-73.266,227.125L69.022,419 v58.594l46.484-22.219l18.188,42.438l21.406-42.844c28.813,31.219,65.484,47.578,101.219,47.578 c36.109,0,72.266-14.031,100.656-43.172l19.25,38.438l18.188-42.438l46.469,22.219V419l46.484,10.078 c-24.547-85.875-58.375-184.516-73.266-227.125c33.391,0,61.906,0,72.813,0C521.819,201.953,520.257,176.141,482.46,167.234z M387.46,297.5c0,120.625-61.375,176.75-124.359,180.484l28.359-43.953h-36.406h-36.422l28.219,43.734 c-60.625-5.938-121.688-68.625-121.703-180.656c-1.297-40.516,4.797-72.406,17.969-95.156c57.219,0,112.891,0,112.891,0 s56.063,0,113.5,0C382.694,224.672,388.788,256.594,387.46,297.5z"/>
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Create Post</h2>
                <p className="text-sm text-foreground/70">
                  {privacy === 'Public' ? 'Share your thoughts with the world' : 
                   privacy === 'Friends' ? 'Share your thoughts with friends' : 
                   'Keep your thoughts private'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {isAnonymous ? (
                    <span className="text-xs text-orange-600 font-medium">
                      Your post is anonymous - no one will see your identity, not even the platform Shqipet
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-foreground/60">
                        {privacy === 'Public' ? 'Public post' : 
                         privacy === 'Friends' ? 'Friends only' : 
                         'Only me'}
                      </span>
                      <span className="text-xs text-foreground/60">•</span>
                      <span className="text-xs text-foreground/60">
                        {privacy === 'Public' ? 'Anyone can see this' : 
                         privacy === 'Friends' ? 'Only your friends can see this' : 
                         'Only you can see this'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Anonymous Icon - Clickable */}
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`p-2 rounded-lg transition-colors ${
                  isAnonymous 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={isAnonymous ? 'Disable anonymous mode' : 'Enable anonymous mode'}
              >
                <svg 
                  version="1.1" 
                  id="_x32_" 
                  xmlns="http://www.w3.org/2000/svg" 
                  xmlnsXlink="http://www.w3.org/1999/xlink" 
                  viewBox="0 0 512 512" 
                  xmlSpace="preserve" 
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <g>
                    <path d="M179.335,226.703c22.109,0.219,37.484,21.172,44.047,27.047c1.578,1.828,3.875,2.984,6.469,2.984 c4.766,0,8.641-3.859,8.641-8.641c0-2.656-1.219-5.031-3.125-6.609l0.016-0.031c-5-4.781-20.547-25.688-55.734-25.688 s-43.609,26.406-44.5,29.594c-0.016,0.156-0.094,0.297-0.094,0.453c0,1.359,1.078,2.438,2.438,2.438 c1.094,0,1.844-0.875,2.266-1.813C142.491,241.047,150.382,226.406,179.335,226.703z"></path>
                    <path d="M331.554,216.813c-35.188,0-50.734,20.875-55.734,25.656l0.016,0.047c-1.906,1.578-3.125,3.922-3.125,6.594 c0,4.781,3.875,8.641,8.625,8.641c2.609,0,4.938-1.156,6.516-2.969c6.531-5.891,21.906-26.828,44.016-27.063 c28.953-0.281,36.844,14.344,39.578,19.75c0.422,0.922,1.172,1.797,2.281,1.797c1.344,0,2.422-1.094,2.422-2.422 c0-0.172-0.063-0.328-0.094-0.469C375.163,243.188,366.741,216.813,331.554,216.813z"></path>
                    <path d="M331.054,370.563l-36.141-2.063l-17.172-10.781c0,0-10.031,5.922-12.328,7.297h-9.094h-9.094 c-2.297-1.375-12.297-7.297-12.297-7.297l-0.375,0.234c-0.266-0.25-0.438-0.563-0.75-0.797c-3.25-2.344-5.047-4.656-4.906-6.313 c0.297-3.438,6.609-8.219,11.063-10.391l4.141-1.953v-50.094c0-9.156-6.094-18.391-17.594-26.688 c-12.266-8.844-30.875-16.375-41.094-12.953c-3.781,1.25-5.797,5.297-4.547,9.078c1.188,3.781,5.344,5.875,9.109,4.688 c3.156-0.953,16.75,2.641,28.5,11.313c6.969,5.109,11.094,10.547,11.094,14.563v41.266c-5.438,3.375-14.25,10.281-15.125,19.859 c-0.375,4.25,0.719,10.313,7.297,16.469l-4,2.5l-36.156,2.063c0,0-36.203-28.922-40.297-34.813l24.578,58.234 c0,0,64.594,0.906,67.234,0.609c12.313-10.016,23.219-21.391,23.219-21.391s10.906,11.375,23.203,21.391 c2.656,0.297,67.25-0.609,67.25-0.609l24.563-58.234C367.257,341.641,331.054,370.563,331.054,370.563z"></path>
                    <path d="M181.772,319.344c20.031,0,32.766-16.594,32.766-22.219s-12.734-22.203-32.766-22.203 s-32.781,16.578-32.781,22.203S161.741,319.344,181.772,319.344z"></path>
                    <path d="M325.335,319.344c20.031,0,32.781-16.594,32.781-22.219s-12.75-22.203-32.781-22.203 s-32.766,16.578-32.766,22.203S305.304,319.344,325.335,319.344z"></path>
                    <path d="M482.46,167.234l-88.891-22.219c0,0-11-76.734-12.781-89.219c-1.766-12.453-12.484-46.344-51.703-46.344 H182.897c-39.188,0-49.906,33.891-51.703,46.344c-1.734,12.484-12.75,89.219-12.75,89.219l-88.922,22.219 c-37.766,8.906-39.344,34.719-4.453,34.719c10.688,0,38.25,0,70.734,0c-14.891,42.609-48.75,141.25-73.266,227.125L69.022,419 v58.594l46.484-22.219l18.188,42.438l21.406-42.844c28.813,31.219,65.484,47.578,101.219,47.578 c36.109,0,72.266-14.031,100.656-43.172l19.25,38.438l18.188-42.438l46.469,22.219V419l46.484,10.078 c-24.547-85.875-58.375-184.516-73.266-227.125c33.391,0,61.906,0,72.813,0C521.819,201.953,520.257,176.141,482.46,167.234z M387.46,297.5c0,120.625-61.375,176.75-124.359,180.484l28.359-43.953h-36.406h-36.422l28.219,43.734 c-60.625-5.938-121.688-68.625-121.703-180.656c-1.297-40.516,4.797-72.406,17.969-95.156c57.219,0,112.891,0,112.891,0 s56.063,0,113.5,0C382.694,224.672,388.788,256.594,387.46,297.5z"></path>
                  </g>
                </svg>
              </button>
              
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="w-[120px] bg-white border-border hover:border-muted-foreground focus:ring-0 focus:ring-offset-0 focus:outline-none">
                  <div className="flex items-center gap-2">
                    {privacy === 'Public' ? (
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 64 64" 
                        fill="currentColor" 
                        className="inline-block"
                      >
                        <path d="M32,0C15.776,0,2.381,12.077,0.292,27.729c-0.002,0.016-0.004,0.031-0.006,0.047 c-0.056,0.421-0.106,0.843-0.146,1.269c-0.019,0.197-0.029,0.396-0.045,0.594c-0.021,0.28-0.044,0.56-0.058,0.842 C0.014,30.983,0,31.49,0,32c0,17.673,14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M33.362,58.502 c-0.72,0.787-1.901,1.414-2.675,0.67c-0.653-0.644-0.099-1.44,0-2.353c0.125-1.065-0.362-2.345,0.666-2.676 c0.837-0.259,1.468,0.322,2.009,1.012C34.187,56.175,34.239,57.526,33.362,58.502z M43.446,49.87 c-1.18,0.608-2.006,0.494-3.323,0.673c-2.454,0.309-4.394,1.52-6.333,0c-0.867-0.695-0.978-1.451-1.65-2.341 c-1.084-1.364-1.355-3.879-3.01-3.322c-1.058,0.356-1.026,1.415-1.654,2.335c-0.81,1.156-0.607,2.793-2.005,2.993 c-0.974,0.138-1.499-0.458-2.321-1c-0.922-0.614-1.104-1.348-2.002-1.993c-0.934-0.689-1.69-0.693-2.654-1.334 c-0.694-0.463-0.842-1.304-1.673-1.334c-0.751-0.022-1.289,0.346-1.664,0.996c-0.701,1.214-0.942,4.793-2.988,4.665 c-1.516-0.103-4.758-3.509-5.994-4.327c-0.405-0.273-0.78-0.551-1.158-0.763c-1.829-3.756-2.891-7.952-2.997-12.385 c0.614-0.515,1.239-0.769,1.819-1.493c0.927-1.13,0.481-2.507,1.673-3.335c0.886-0.604,1.602-0.507,2.669-0.658 c1.529-0.222,2.491-0.422,3.988,0c1.459,0.409,2.016,1.246,3.326,1.992c1.415,0.81,2.052,1.766,3.66,2.001 c1.166,0.165,1.966-0.901,2.988-0.337c0.824,0.458,1.406,1.066,1.341,2.001c-0.1,1.218-2.522,0.444-2.659,1.662 c-0.183,1.558,2.512-0.194,3.992,0.33c0.974,0.355,2.241,0.294,2.325,1.334c0.081,1.156-1.608,0.837-2.657,1.335 c-1.162,0.541-1.771,0.996-3.004,1.329c-1.125,0.298-2.312-0.628-2.987,0.329c-0.53,0.742-0.343,1.489,0,2.335 c0.787,1.931,3.349,1.352,5.322,0.657c1.383-0.488,1.641-1.726,2.997-2.329c1.438-0.641,2.554-1.335,3.981-0.663 c1.178,0.556,0.849,2.05,2.006,2.663c1.253,0.668,2.432-0.729,3.663,0c0.957,0.569,0.887,1.521,1.655,2.327 c0.894,0.942,1.41,1.702,2.668,2c1.286,0.299,2.072-1.071,3.327-0.671c0.965,0.315,1.755,0.68,1.987,1.672 C46.465,48.634,44.744,49.198,43.446,49.87z M45.839,33.841c-1.154,1.16-2.156,1.539-3.771,1.893c-1.433,0.315-3.443,1.438-3.772,0 c-0.251-1.148,1.029-1.558,1.893-2.359c0.959-0.895,1.854-0.983,2.826-1.892c0.87-0.802,0.756-2.031,1.893-2.359 c1.109-0.32,2.182-0.019,2.825,0.947C48.652,31.438,47.006,32.681,45.839,33.841z M59.989,29.319 c-0.492,0.508-0.462,1.044-0.965,1.542c-0.557,0.539-1.331,0.307-1.738,0.968c-0.358,0.577-0.13,1.057-0.194,1.735 c-0.041,0.387-1.924,1.256-2.313,0.385c-0.214-0.481,0.281-0.907,0-1.353c-0.263-0.401-0.555-0.195-0.899,0.181 c-0.359,0.388-0.772,0.958-1.221,1.172c-0.589,0.273-0.196-2.25-0.395-3.088c-0.146-0.663,0.01-1.08,0.198-1.736 c0.25-0.91,0.938-1.206,1.155-2.125c0.194-0.806,0.033-1.295,0-2.123c-0.039-0.906-0.015-1.427-0.188-2.314 c-0.192-0.937-0.252-1.525-0.771-2.316c-0.418-0.624-0.694-1.001-1.354-1.352c-0.16-0.088-0.31-0.146-0.452-0.191 c-0.34-0.113-0.659-0.128-1.098-0.193c-0.888-0.132-1.522,0.432-2.314,0c-0.462-0.255-0.606-0.575-0.96-0.967 c-0.404-0.434-0.511-0.789-0.967-1.158c-0.341-0.276-0.552-0.437-0.965-0.581c-0.79-0.263-1.342-0.082-2.126,0.196 c-0.77,0.268-1.058,0.707-1.739,1.155c-0.522,0.303-0.893,0.371-1.348,0.774c-0.276,0.242-1.59,1.177-2.127,1.155 c-0.544-0.021-0.851-0.343-1.338-0.382c-0.065-0.008-0.13-0.008-0.204,0c0,0,0,0-0.005,0c-0.473,0.036-0.696,0.269-1.146,0.382 c-1.107,0.276-1.812-0.115-2.905,0.197c-0.712,0.2-0.993,0.766-1.73,0.771c-0.841,0.005-1.125-0.743-1.932-0.968 c-0.442-0.118-0.702-0.129-1.157-0.19c-0.749-0.108-1.178-0.119-1.926-0.191H24.86c-0.016,0.006-0.591,0.058-0.688,0 c-0.422-0.286-0.722-0.521-1.244-0.773c-0.575-0.283-0.919-0.428-1.547-0.584l0.026-0.381c0,0,0-0.847-0.121-1.207 c-0.115-0.361-0.24-0.361,0-1.086c0.248-0.722,0.679-1.182,0.679-1.182c0.297-0.228,0.516-0.305,0.769-0.58 c0.51-0.539,0.717-0.998,0.774-1.739c0.067-0.972-1.205-1.367-0.97-2.316c0.209-0.826,0.904-0.98,1.547-1.543 c0.779-0.67,1.468-0.758,2.12-1.542c0.501-0.593,0.911-0.965,0.97-1.738c0.053-0.657-0.23-1.068-0.57-1.538 C28.356,2.175,30.157,2,32,2c14.919,0,27.29,10.893,29.605,25.158c-0.203,0.352-0.001,0.796-0.27,1.193 C60.979,28.894,60.436,28.85,59.989,29.319z"/>
                      </svg>
                    ) : privacy === 'Friends' ? (
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 -64 640 640" 
                        fill="currentColor" 
                        className="inline-block"
                      >
                        <path d="M192 256c61.9 0 112-50.1 112-112S253.9 32 192 32 80 82.1 80 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C51.6 288 0 339.6 0 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zM480 256c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96zm48 32h-3.8c-13.9 4.8-28.6 8-44.2 8s-30.3-3.2-44.2-8H432c-20.4 0-39.2 5.9-55.7 15.4 24.4 26.3 39.7 61.2 39.7 99.8v38.4c0 2.2-.5 4.3-.6 6.4H592c26.5 0 48-21.5 48-48 0-61.9-50.1-112-112-112z"/>
                      </svg>
                    ) : (
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 43.028 43.028" 
                        fill="currentColor" 
                        className="inline-block"
                      >
                        <path d="M39.561,33.973l-0.145,0.172c-4.774,5.729-11.133,8.884-17.902,8.884c-6.77,0-13.128-3.154-17.903-8.884l-0.144-0.172 l0.034-0.225c0.922-6.014,4.064-10.844,8.847-13.605l0.34-0.196l0.271,0.284c2.259,2.369,5.297,3.674,8.554,3.674 s6.295-1.306,8.554-3.674l0.271-0.284l0.34,0.196c4.783,2.762,7.925,7.592,8.848,13.605L39.561,33.973z M21.514,21.488 c5.924,0,10.744-4.82,10.744-10.744S27.438,0,21.514,0S10.77,4.82,10.77,10.744S15.59,21.488,21.514,21.488z M32.612,29.778h-2.027 v-2.024c0-0.959-0.777-1.738-1.736-1.738s-1.736,0.779-1.736,1.738v2.024h-2.027c-0.959,0-1.736,0.778-1.736,1.737 s0.777,1.736,1.736,1.736h2.027v2.025c0,0.959,0.776,1.736,1.735,1.736s1.735-0.777,1.735-1.736V33.25h2.027 c0.959,0,1.736-0.777,1.736-1.736S33.571,29.778,32.612,29.778z"/>
                      </svg>
                    )}
                    <span>{privacy}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">
                    <div className="flex items-center gap-2">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 64 64" 
                        fill="currentColor" 
                        className="inline-block"
                      >
                        <path d="M32,0C15.776,0,2.381,12.077,0.292,27.729c-0.002,0.016-0.004,0.031-0.006,0.047 c-0.056,0.421-0.106,0.843-0.146,1.269c-0.019,0.197-0.029,0.396-0.045,0.594c-0.021,0.28-0.044,0.56-0.058,0.842 C0.014,30.983,0,31.49,0,32c0,17.673,14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M33.362,58.502 c-0.72,0.787-1.901,1.414-2.675,0.67c-0.653-0.644-0.099-1.44,0-2.353c0.125-1.065-0.362-2.345,0.666-2.676 c0.837-0.259,1.468,0.322,2.009,1.012C34.187,56.175,34.239,57.526,33.362,58.502z M43.446,49.87 c-1.18,0.608-2.006,0.494-3.323,0.673c-2.454,0.309-4.394,1.52-6.333,0c-0.867-0.695-0.978-1.451-1.65-2.341 c-1.084-1.364-1.355-3.879-3.01-3.322c-1.058,0.356-1.026,1.415-1.654,2.335c-0.81,1.156-0.607,2.793-2.005,2.993 c-0.974,0.138-1.499-0.458-2.321-1c-0.922-0.614-1.104-1.348-2.002-1.993c-0.934-0.689-1.69-0.693-2.654-1.334 c-0.694-0.463-0.842-1.304-1.673-1.334c-0.751-0.022-1.289,0.346-1.664,0.996c-0.701,1.214-0.942,4.793-2.988,4.665 c-1.516-0.103-4.758-3.509-5.994-4.327c-0.405-0.273-0.78-0.551-1.158-0.763c-1.829-3.756-2.891-7.952-2.997-12.385 c0.614-0.515,1.239-0.769,1.819-1.493c0.927-1.13,0.481-2.507,1.673-3.335c0.886-0.604,1.602-0.507,2.669-0.658 c1.529-0.222,2.491-0.422,3.988,0c1.459,0.409,2.016,1.246,3.326,1.992c1.415,0.81,2.052,1.766,3.66,2.001 c1.166,0.165,1.966-0.901,2.988-0.337c0.824,0.458,1.406,1.066,1.341,2.001c-0.1,1.218-2.522,0.444-2.659,1.662 c-0.183,1.558,2.512-0.194,3.992,0.33c0.974,0.355,2.241,0.294,2.325,1.334c0.081,1.156-1.608,0.837-2.657,1.335 c-1.162,0.541-1.771,0.996-3.004,1.329c-1.125,0.298-2.312-0.628-2.987,0.329c-0.53,0.742-0.343,1.489,0,2.335 c0.787,1.931,3.349,1.352,5.322,0.657c1.383-0.488,1.641-1.726,2.997-2.329c1.438-0.641,2.554-1.335,3.981-0.663 c1.178,0.556,0.849,2.05,2.006,2.663c1.253,0.668,2.432-0.729,3.663,0c0.957,0.569,0.887,1.521,1.655,2.327 c0.894,0.942,1.41,1.702,2.668,2c1.286,0.299,2.072-1.071,3.327-0.671c0.965,0.315,1.755,0.68,1.987,1.672 C46.465,48.634,44.744,49.198,43.446,49.87z M45.839,33.841c-1.154,1.16-2.156,1.539-3.771,1.893c-1.433,0.315-3.443,1.438-3.772,0 c-0.251-1.148,1.029-1.558,1.893-2.359c0.959-0.895,1.854-0.983,2.826-1.892c0.87-0.802,0.756-2.031,1.893-2.359 c1.109-0.32,2.182-0.019,2.825,0.947C48.652,31.438,47.006,32.681,45.839,33.841z M59.989,29.319 c-0.492,0.508-0.462,1.044-0.965,1.542c-0.557,0.539-1.331,0.307-1.738,0.968c-0.358,0.577-0.13,1.057-0.194,1.735 c-0.041,0.387-1.924,1.256-2.313,0.385c-0.214-0.481,0.281-0.907,0-1.353c-0.263-0.401-0.555-0.195-0.899,0.181 c-0.359,0.388-0.772,0.958-1.221,1.172c-0.589,0.273-0.196-2.25-0.395-3.088c-0.146-0.663,0.01-1.08,0.198-1.736 c0.25-0.91,0.938-1.206,1.155-2.125c0.194-0.806,0.033-1.295,0-2.123c-0.039-0.906-0.015-1.427-0.188-2.314 c-0.192-0.937-0.252-1.525-0.771-2.316c-0.418-0.624-0.694-1.001-1.354-1.352c-0.16-0.088-0.31-0.146-0.452-0.191 c-0.34-0.113-0.659-0.128-1.098-0.193c-0.888-0.132-1.522,0.432-2.314,0c-0.462-0.255-0.606-0.575-0.96-0.967 c-0.404-0.434-0.511-0.789-0.967-1.158c-0.341-0.276-0.552-0.437-0.965-0.581c-0.79-0.263-1.342-0.082-2.126,0.196 c-0.77,0.268-1.058,0.707-1.739,1.155c-0.522,0.303-0.893,0.371-1.348,0.774c-0.276,0.242-1.59,1.177-2.127,1.155 c-0.544-0.021-0.851-0.343-1.338-0.382c-0.065-0.008-0.13-0.008-0.204,0c0,0,0,0-0.005,0c-0.473,0.036-0.696,0.269-1.146,0.382 c-1.107,0.276-1.812-0.115-2.905,0.197c-0.712,0.2-0.993,0.766-1.73,0.771c-0.841,0.005-1.125-0.743-1.932-0.968 c-0.442-0.118-0.702-0.129-1.157-0.19c-0.749-0.108-1.178-0.119-1.926-0.191H24.86c-0.016,0.006-0.591,0.058-0.688,0 c-0.422-0.286-0.722-0.521-1.244-0.773c-0.575-0.283-0.919-0.428-1.547-0.584l0.026-0.381c0,0,0-0.847-0.121-1.207 c-0.115-0.361-0.24-0.361,0-1.086c0.248-0.722,0.679-1.182,0.679-1.182c0.297-0.228,0.516-0.305,0.769-0.58 c0.51-0.539,0.717-0.998,0.774-1.739c0.067-0.972-1.205-1.367-0.97-2.316c0.209-0.826,0.904-0.98,1.547-1.543 c0.779-0.67,1.468-0.758,2.12-1.542c0.501-0.593,0.911-0.965,0.97-1.738c0.053-0.657-0.23-1.068-0.57-1.538 C28.356,2.175,30.157,2,32,2c14.919,0,27.29,10.893,29.605,25.158c-0.203,0.352-0.001,0.796-0.27,1.193 C60.979,28.894,60.436,28.85,59.989,29.319z"/>
                      </svg>
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="Friends">
                    <div className="flex items-center gap-2">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 -64 640 640" 
                        fill="currentColor" 
                        className="inline-block"
                      >
                        <path d="M192 256c61.9 0 112-50.1 112-112S253.9 32 192 32 80 82.1 80 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C51.6 288 0 339.6 0 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zM480 256c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96zm48 32h-3.8c-13.9 4.8-28.6 8-44.2 8s-30.3-3.2-44.2-8H432c-20.4 0-39.2 5.9-55.7 15.4 24.4 26.3 39.7 61.2 39.7 99.8v38.4c0 2.2-.5 4.3-.6 6.4H592c26.5 0 48-21.5 48-48 0-61.9-50.1-112-112-112z"/>
                      </svg>
                      Friends
                    </div>
                  </SelectItem>
                  <SelectItem value="Private">
                    <div className="flex items-center gap-2">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 43.028 43.028" 
                        fill="currentColor" 
                        className="inline-block"
                      >
                        <path d="M39.561,33.973l-0.145,0.172c-4.774,5.729-11.133,8.884-17.902,8.884c-6.77,0-13.128-3.154-17.903-8.884l-0.144-0.172 l0.034-0.225c0.922-6.014,4.064-10.844,8.847-13.605l0.34-0.196l0.271,0.284c2.259,2.369,5.297,3.674,8.554,3.674 s6.295-1.306,8.554-3.674l0.271-0.284l0.34,0.196c4.783,2.762,7.925,7.592,8.848,13.605L39.561,33.973z M21.514,21.488 c5.924,0,10.744-4.82,10.744-10.744S27.438,0,21.514,0S10.77,4.82,10.77,10.744S15.59,21.488,21.514,21.488z M32.612,29.778h-2.027 v-2.024c0-0.959-0.777-1.738-1.736-1.738s-1.736,0.779-1.736,1.738v2.024h-2.027c-0.959,0-1.736,0.778-1.736,1.737 s0.777,1.736,1.736,1.736h2.027v2.025c0,0.959,0.776,1.736,1.735,1.736s1.735-0.777,1.735-1.736V33.25h2.027 c0.959,0,1.736-0.777,1.736-1.736S33.571,29.778,32.612,29.778z"/>
                      </svg>
                      Only me
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10 hover:bg-muted"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col h-[600px]">
            
            {/* Main Compose Area */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left - Content */}
              <div className="flex-1 flex flex-col">
                
                {/* Text Editor */}
                <div className="flex-1 px-8 py-6 relative">
                  {/* Content Guidance Tips - Dismissible */}
                  {showContentGuidance && postContent.length === 0 && (
                    <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-sm space-y-2">
                          <p className="font-medium text-foreground">Tips for engaging posts:</p>
                          <ul className="text-muted-foreground space-y-1 text-xs">
                            <li>• Start with a clear hook to grab attention</li>
                            <li>• Keep captions short and impactful (150 chars is optimal)</li>
                            <li>• Use emojis, @mentions, and #hashtags</li>
                            <li>• End with a call-to-action</li>
                          </ul>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowContentGuidance(false)}
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Character Count - Moved to top */}
                  <div className="absolute top-2 right-8 z-10">
                    <span className={`text-sm font-medium ${postContent.length > 1800 ? 'text-destructive' : postContent.length > 150 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {postContent.length}/2000
                      {postContent.length > 0 && postContent.length <= 150 && (
                        <span className="ml-2 text-xs text-primary">✓ Optimal</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="relative w-full h-full">
                    {/* Large Anonymous Icon Background - Centered as wallpaper */}
                    {isAnonymous && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <svg 
                          version="1.1" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 512 512" 
                          className="w-96 h-96 fill-gray-100 opacity-20"
                        >
                          <path d="M179.335,226.703c22.109,0.219,37.484,21.172,44.047,27.047c1.578,1.828,3.875,2.984,6.469,2.984 c4.766,0,8.641-3.859,8.641-8.641c0-2.656-1.219-5.031-3.125-6.609l0.016-0.031c-5-4.781-20.547-25.688-55.734-25.688 s-43.609,26.406-44.5,29.594c-0.016,0.156-0.094,0.297-0.094,0.453c0,1.359,1.078,2.438,2.438,2.438 c1.094,0,1.844-0.875,2.266-1.813C142.491,241.047,150.382,226.406,179.335,226.703z"/>
                          <path d="M331.554,216.813c-35.188,0-50.734,20.875-55.734,25.656l0.016,0.047c-1.906,1.578-3.125,3.922-3.125,6.594 c0,4.781,3.875,8.641,8.625,8.641c2.609,0,4.938-1.156,6.516-2.969c6.531-5.891,21.906-26.828,44.016-27.063 c28.953-0.281,36.844,14.344,39.578,19.75c0.422,0.922,1.172,1.797,2.281,1.797c1.344,0,2.422-1.094,2.422-2.422 c0-0.172-0.063-0.328-0.094-0.469C375.163,243.188,366.741,216.813,331.554,216.813z"/>
                          <path d="M331.054,370.563l-36.141-2.063l-17.172-10.781c0,0-10.031,5.922-12.328,7.297h-9.094h-9.094 c-2.297-1.375-12.297-7.297-12.297-7.297l-0.375,0.234c-0.266-0.25-0.438-0.563-0.75-0.797c-3.25-2.344-5.047-4.656-4.906-6.313 c0.297-3.438,6.609-8.219,11.063-10.391l4.141-1.953v-50.094c0-9.156-6.094-18.391-17.594-26.688 c-12.266-8.844-30.875-16.375-41.094-12.953c-3.781,1.25-5.797,5.297-4.547,9.078c1.188,3.781,5.344,5.875,9.109,4.688 c3.156-0.953,16.75,2.641,28.5,11.313c6.969,5.109,11.094,10.547,11.094,14.563v41.266c-5.438,3.375-14.25,10.281-15.125,19.859 c-0.375,4.25,0.719,10.313,7.297,16.469l-4,2.5l-36.156,2.063c0,0-36.203-28.922-40.297-34.813l24.578,58.234 c0,0,64.594,0.906,67.234,0.609c12.313-10.016,23.219-21.391,23.219-21.391s10.906,11.375,23.203,21.391 c2.656,0.297,67.25-0.609,67.25-0.609l24.563-58.234C367.257,341.641,331.054,370.563,331.054,370.563z"/>
                          <path d="M181.772,319.344c20.031,0,32.766-16.594,32.766-22.219s-12.734-22.203-32.766-22.203 s-32.781,16.578-32.781,22.203S161.741,319.344,181.772,319.344z"/>
                          <path d="M325.335,319.344c20.031,0,32.781-16.594,32.781-22.219s-12.75-22.203-32.781-22.203 s-32.766,16.578-32.766,22.203S305.304,319.344,325.335,319.344z"/>
                          <path d="M482.46,167.234l-88.891-22.219c0,0-11-76.734-12.781-89.219c-1.766-12.453-12.484-46.344-51.703-46.344 H182.897c-39.188,0-49.906,33.891-51.703,46.344c-1.734,12.484-12.75,89.219-12.75,89.219l-88.922,22.219 c-37.766,8.906-39.344,34.719-4.453,34.719c10.688,0,38.25,0,70.734,0c-14.891,42.609-48.75,141.25-73.266,227.125L69.022,419 v58.594l46.484-22.219l18.188,42.438l21.406-42.844c28.813,31.219,65.484,47.578,101.219,47.578 c36.109,0,72.266-14.031,100.656-43.172l19.25,38.438l18.188-42.438l46.469,22.219V419l46.484,10.078 c-24.547-85.875-58.375-184.516-73.266-227.125c33.391,0,61.906,0,72.813,0C521.819,201.953,520.257,176.141,482.46,167.234z M387.46,297.5c0,120.625-61.375,176.75-124.359,180.484l28.359-43.953h-36.406h-36.422l28.219,43.734 c-60.625-5.938-121.688-68.625-121.703-180.656c-1.297-40.516,4.797-72.406,17.969-95.156c57.219,0,112.891,0,112.891,0 s56.063,0,113.5,0C382.694,224.672,388.788,256.594,387.46,297.5z"/>
                        </svg>
                      </div>
                    )}
                    
                    <textarea
                      placeholder={isAnonymous ? "What's on your mind, Anonymous?" : `What's on your mind, ${userName}?`}
                      className="w-full h-full resize-none border-0 text-xl placeholder:text-muted-foreground focus:ring-0 focus:outline-none bg-transparent pr-16 relative z-10"
                      value={postContent}
                      onChange={handleTextareaChange}
                      maxLength={2000}
                      aria-label="Post content"
                    />
                  </div>
                </div>

                {/* Location Preview */}
                {locationData && (
                  <div className="px-8 pb-4">
                    <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">Location</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeLocation}
                          className="text-orange-600 hover:text-orange-700 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium text-foreground">{locationData.name}</h3>
                        <p className="text-sm text-muted-foreground">{locationData.address}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>📍 {locationData.coordinates[1].toFixed(4)}, {locationData.coordinates[0].toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Poll Preview */}
                {pollData && (
                  <div className="px-8 pb-4">
                    <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">Poll</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removePoll}
                          className="text-purple-600 hover:text-purple-700 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-medium text-foreground">{pollData.question}</h3>
                        <div className="space-y-2">
                          {pollData.options.map((option, index) => (
                            <div key={option.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
                              <div className={`w-4 h-4 border-2 border-purple-400 ${pollData.allowMultiple ? 'rounded' : 'rounded-full'}`} />
                              <span className="text-sm text-foreground">{option.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pollData.allowMultiple ? 'Multiple selections allowed' : 'Single selection'}</span>
                          <span>Duration: {pollData.duration === 1 ? '1 hour' : pollData.duration < 24 ? `${pollData.duration} hours` : pollData.duration === 24 ? '1 day' : `${pollData.duration / 24} days`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Link Preview Generator */}
                <LinkPreviewGenerator 
                  content={postContent}
                  onPreviewChange={setLinkPreviews}
                />

                {/* Duplicate Post Warning */}
                <DuplicatePostWarning content={postContent} />

                {/* File Previews */}
                {selectedFiles.length > 0 && (
                  <div className="px-8 pb-4">
                    {/* File Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                          <FileUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                          </span>
                          <div className="text-xs text-muted-foreground">
                            Total size: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)}MB
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openWindow('photoPreview')}
                          className="text-muted-foreground hover:text-primary text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log('🗑️ Clearing all selected files');
                            setSelectedFiles([]);
                            toast.info('All files removed');
                          }}
                          className="text-muted-foreground hover:text-destructive text-xs"
                        >
                          Clear all
                        </Button>
                      </div>
                    </div>
                    
                    {/* File Grid */}
                    <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                          {/* File Preview */}
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <div className="relative w-full h-full">
                              <video
                                src={URL.createObjectURL(file)}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="bg-black/60 rounded-full p-2">
                                  <Video className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <FileUp className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* File Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-xs truncate">{file.name}</div>
                            <div className="text-xs text-gray-300">
                              {(file.size / 1024 / 1024).toFixed(2)}MB
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log(`🗑️ Removing file: ${file.name}`);
                              setSelectedFiles(prev => prev.filter((_, index) => index !== i));
                              toast.info(`Removed ${file.name}`);
                            }}
                            className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toolbar - Simplified and grouped */}
                <div className="px-8 py-5 border-t border-border bg-background">
                  <div className="flex items-center justify-between gap-4">
                    
                    {/* Quick Action Tools - Larger and more accessible */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowFormattingModal(true)}
                        className="relative group text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 ease-out hover:scale-105 active:scale-95 border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 rounded-lg backdrop-blur-sm"
                      >
                        <Type className="h-16 w-16 transition-transform duration-200 group-hover:rotate-12" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </Button>
                      <div className="w-px h-6 bg-border mx-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setShowMentionModal(true);
                          setMentionQuery('');
                        }}
                        className="relative group text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 ease-out hover:scale-105 active:scale-95 border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 rounded-lg backdrop-blur-sm"
                      >
                        <AtSign className="h-16 w-16 transition-transform duration-200 group-hover:rotate-12" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowHashtagModal(true)}
                        className="relative group text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 ease-out hover:scale-105 active:scale-95 border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 rounded-lg backdrop-blur-sm"
                      >
                        <Hash className="h-16 w-16 transition-transform duration-200 group-hover:rotate-12" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </Button>
                    </div>

                    {/* Media Tools */}
                    <div className="flex items-center gap-8 justify-start -ml-8">
                      <div
                        onClick={() => {
                          console.log('📸 Photo/Video button clicked - triggering file input');
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center cursor-pointer group"
                      >
                        <svg
                          width="52"
                          height="52"
                          viewBox="0 0 512.1 512.1"
                          className="mr-2 transition-transform duration-200 group-hover:rotate-12"
                          fill="currentColor"
                        >
                          <path fill="#38454F" d="M344.3,119.25v-52.8c0-14.8-12-26.7-26.7-26.7h-96.9c-14.8,0-26.7,12-26.7,26.7v52.7H63.6 c-35.1,0.1-63.6,28.6-63.6,63.7v265.4c0,13.3,10.8,24.1,24.1,24.1H488c13.3,0,24.1-10.8,24.1-24.1v-282.6 c0-25.6-20.8-46.4-46.4-46.4C465.7,119.25,344.3,119.25,344.3,119.25z"/>
                          <path fill="#50508A" d="M424.1,295.55c0,83-67.3,150.3-150.3,150.3s-150.3-67.3-150.3-150.3s67.3-150.3,150.3-150.3 C356.8,145.35,424.1,212.65,424.1,295.55"/>
                          <path fill="#283238" d="M273.8,452.85c-86.7,0-157.3-70.5-157.3-157.3c0-86.7,70.5-157.3,157.3-157.3 c86.7,0,157.3,70.5,157.3,157.3C431.1,382.35,360.5,452.85,273.8,452.85z M273.8,152.35c-79,0-143.3,64.3-143.3,143.3 s64.3,143.3,143.3,143.3s143.3-64.3,143.3-143.3C417.1,216.55,352.8,152.35,273.8,152.35z"/>
                          <path fill="#434C6D" d="M388.8,295.55c0,63.5-51.5,114.9-114.9,114.9s-115-51.4-115-114.9s51.5-114.9,114.9-114.9 S388.8,232.15,388.8,295.55"/>
                          <g>
                            <path fill="#ECBA16" d="M238.3,75.05c0,4.9-4,8.8-8.8,8.8s-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8S238.3,70.25,238.3,75.05"/>
                            <path fill="#ECBA16" d="M238.3,101.55c0,4.9-4,8.8-8.8,8.8s-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8S238.3,96.65,238.3,101.55"/>
                            <path fill="#ECBA16" d="M264.8,75.05c0,4.9-4,8.8-8.8,8.8s-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8S264.8,70.25,264.8,75.05"/>
                            <path fill="#ECBA16" d="M264.8,101.55c0,4.9-4,8.8-8.8,8.8s-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8S264.8,96.65,264.8,101.55"/>
                            <path fill="#ECBA16" d="M291.3,75.05c0,4.9-4,8.8-8.8,8.8c-4.9,0-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8 C287.4,66.25,291.3,70.25,291.3,75.05"/>
                            <path fill="#ECBA16" d="M291.3,101.55c0,4.9-4,8.8-8.8,8.8c-4.9,0-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8 C287.4,92.75,291.3,96.65,291.3,101.55"/>
                            <path fill="#ECBA16" d="M317.8,75.05c0,4.9-4,8.8-8.8,8.8s-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8S317.8,70.25,317.8,75.05"/>
                            <path fill="#ECBA16" d="M317.8,101.55c0,4.9-4,8.8-8.8,8.8s-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8S317.8,96.65,317.8,101.55"/>
                          </g>
                          <path fill="#283238" d="M70.6,295.55c0-27.9,5.6-54.4,15.8-78.6c7.1-17,10.7-35.2,10.7-53.7c0-23-17.9-41.8-40.3-43.7 c-32,3.5-56.8,30.5-56.8,63.3v265.4c0,13.3,10.8,24.1,24.1,24.1H53c24.3,0,44.1-19.9,44.1-44.1v-0.4c0-18.4-3.5-36.7-10.7-53.7 C76.3,349.95,70.6,323.45,70.6,295.55"/>
                          <path fill="#283238" d="M123.6,119.25H79.4c-9.7,0-17.7-7.9-17.7-17.7s7.9-17.7,17.7-17.7h44.1c9.7,0,17.7,7.9,17.7,17.7 S133.3,119.25,123.6,119.25"/>
                          <path fill="#CBD4D8" d="M441.4,101.55h-70.6c-4.9,0-8.8-4-8.8-8.8c0-4.9,4-8.8,8.8-8.8h70.6c4.9,0,8.8,4,8.8,8.8 C450.2,97.65,446.3,101.55,441.4,101.55"/>
                          <path fill="#283238" d="M459,198.65h-17.7c-14.6,0-26.5-11.9-26.5-26.5s11.9-26.5,26.5-26.5H459c14.6,0,26.5,11.9,26.5,26.5 C485.5,186.75,473.6,198.65,459,198.65"/>
                          <path fill="#434C6D" d="M293.8,331.05h-40.3c-13.2,0-24-10.8-24-24v-22.7c0-13.2,10.8-24,24-24h40.3c13.2,0,24,10.8,24,24 v22.7C317.8,320.25,307,331.05,293.8,331.05"/>
                          <path fill="#7383BF" d="M395.8,295.55c0-32.9-13.1-62.7-34.3-84.7c-0.3-0.5-0.8-0.9-1.2-1.2c-21.8-21.9-51.9-35.6-85.1-36 c-0.1,0-0.2,0-0.3,0c-0.3,0-0.7,0-1,0c-32.9,0-62.7,13.1-84.7,34.3c-0.5,0.4-0.9,0.8-1.3,1.3c-22.2,22.1-36,52.7-36,86.4 c0,32.9,13.1,62.7,34.3,84.7c0.4,0.5,0.8,0.9,1.2,1.2c21.8,21.9,51.9,35.6,85.1,36c0.1,0,0.1,0,0.2,0h0.1c0.3,0,0.7,0,1,0 c32.9,0,62.8-13.1,84.7-34.3c0.5-0.3,0.9-0.7,1.2-1.2C382,359.95,395.8,329.35,395.8,295.55z M208.5,381.45 c25.4-4.9,48-20.8,61-43.3h19.1c4.4,23.4-2.6,47.8-18.8,65.4C246.8,402.55,225.6,394.55,208.5,381.45z M339.2,209.75 c-25.5,4.9-48.2,20.9-61.2,43.7h-18.9c-4.6-23.5,2.4-48.1,18.7-65.7C300.9,188.55,322.1,196.65,339.2,209.75z M293.8,324.05h-27.1 c-0.9-0.2-1.9-0.2-2.8,0h-10.5c-5.4,0-10.2-2.6-13.4-6.5c-0.3-0.5-0.6-0.9-0.9-1.3c-1.7-2.6-2.7-5.8-2.7-9.1v-22.7 c0-9.4,7.6-17,17-17h27.2c0.5,0.1,1,0.2,1.5,0.2s1-0.1,1.4-0.2h10.3c9.4,0,17,7.6,17,17v22.7 C310.8,316.45,303.2,324.05,293.8,324.05z M294.6,253.45c13.4-18.5,35.1-30.3,58.3-31.3c12.7,13.7,22,30.7,26.2,49.6 c-19.1-10.7-41.7-14.1-63.4-9.3C310.3,257.15,302.9,253.65,294.6,253.45z M245.1,254.65c-8.3,2.3-15.2,8.1-19.2,15.6 c-15.4-13.6-24.7-33-25.5-53.7c15.9-14.8,36.3-24.9,58.9-27.9C246.3,207.85,241.1,231.55,245.1,254.65z M252.8,338.05 c-13.5,18.3-35,30-58,30.9c-12.7-13.7-22-30.8-26.2-49.7c13.4,7.5,28.5,11.4,43.9,11.4c6.3,0,12.7-0.7,19-2 C236.8,334.35,244.4,337.85,252.8,338.05z M302.6,336.85c8.2-2.4,15-8.1,18.8-15.6c15.6,13.5,25,32.8,25.8,53.5 c-15.9,14.8-36.3,24.9-58.9,27.9C301.3,383.45,306.5,359.75,302.6,336.85z M324.8,306.05v-21.6c0-3.2-0.5-6.2-1.4-9.1 c20.6-3.3,41.7,2.1,58.2,14.9c0.1,1.8,0.1,3.6,0.1,5.3c0,24.5-8.2,47.2-22.1,65.3C355.5,339.05,343.1,319.45,324.8,306.05z M188,230.25c4.2,21.9,16.4,41.6,34.6,55.1v21.7c0,3.1,0.5,6,1.3,8.8c-20.4,3.1-41.4-2.3-57.8-15c-0.1-1.8-0.1-3.6-0.1-5.3 C165.9,271.05,174.1,248.45,188,230.25z"/>
                          <g>
                            <path fill="#38454F" d="M44.1,207.45c4.9,0,8.8-4,8.8-8.8c0-4.9-4-8.8-8.8-8.8H0v17.7h44.1V207.45z"/>
                            <path fill="#38454F" d="M26.5,278.15c4.9,0,8.8-4,8.8-8.8c0-4.9-4-8.8-8.8-8.8H0v17.7h26.5V278.15z"/>
                            <path fill="#38454F" d="M26.5,348.75c4.9,0,8.8-4,8.8-8.8s-4-8.8-8.8-8.8H0v17.7h26.5V278.15z"/>
                            <path fill="#38454F" d="M44.1,419.35c4.9,0,8.8-4,8.8-8.8s-4-8.8-8.8-8.8H0v17.7h44.1V419.35z"/>
                          </g>
                        </svg>
                        <span className="text-sm font-medium">Photo/Video</span>
                      </div>
                      <div 
                        onClick={() => setShowPollModal(true)}
                        className="flex items-center cursor-pointer group"
                      >
                        <svg
                          width="38"
                          height="38"
                          viewBox="0 0 512 512"
                          className="mr-2 transition-transform duration-200 group-hover:rotate-12"
                          fill="currentColor"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M383.851,264.917c-0.853-5.141-5.312-8.917-10.517-8.917H352c-5.888,0-10.667,4.779-10.667,10.667v27.243 c0,3.797,2.027,7.296,5.312,9.216c10.048,5.845,16.021,16.128,16.021,27.541c0,17.643-14.357,32-32,32h-256 c-17.643,0-32-14.357-32-32c0-11.392,5.995-21.696,16.021-27.541c3.285-1.92,5.312-5.419,5.312-9.216v-27.243 C64,260.779,59.221,256,53.333,256H32c-5.227,0-9.664,3.776-10.517,8.917L1.643,384h402.069L383.851,264.917z"/>
                                <path d="M74.667,341.333h256c5.888,0,10.667-4.779,10.667-10.667S336.555,320,330.667,320H320v-61.355 c0-3.755-1.984-7.253-5.227-9.173c-3.243-1.941-7.253-2.005-10.539-0.213c-23.019,12.523-49.899,7.68-67.115-9.557 c-19.115-19.115-22.101-49.301-7.339-71.424l32.491-44.672c2.368-3.243,2.688-7.531,0.896-11.115 c-1.813-3.563-5.504-5.824-9.515-5.824H96c-5.888,0-10.667,4.779-10.667,10.667V320H74.667C68.779,320,64,324.779,64,330.667 S68.779,341.333,74.667,341.333z"/>
                                <path d="M501.333,0c-25.109,0-57.024,16.107-66.475,21.205L298.667,0.363c-19.136,0-65.323,1.237-80.299,12.267L133.035,65.6 c-4.053,2.517-5.931,7.403-4.629,11.989c1.323,4.587,5.504,7.744,10.261,7.744h96c0.853,0,1.685-0.107,2.517-0.299l14.293-3.52 C270.997,78.656,288,94.016,288,113.195c0,7.403-2.304,14.485-6.677,20.459l-33.557,46.101 c-9.365,14.037-7.509,32.896,4.437,44.843c6.699,6.699,15.637,10.411,25.131,10.411c9.493,0,18.411-3.691,25.131-10.411 l54.08-54.08c20.203-1.131,38.677-9.856,52.395-23.957c18.923,17.557,79.552,23.104,91.563,24.043 c0.277,0.064,0.555,0.064,0.832,0.064c2.667,0,5.269-1.003,7.232-2.837c2.197-2.027,3.435-4.864,3.435-7.829V10.667 C512,4.779,507.221,0,501.333,0z"/>
                                <path d="M0,501.333C0,507.221,4.779,512,10.667,512h384c5.888,0,10.667-4.779,10.667-10.667v-96H0V501.333z"/>
                              </g>
                            </g>
                          </g>
                        </svg>
                        <span className="text-sm font-medium">{pollData ? 'Edit Poll' : 'Poll'}</span>
                      </div>
                      <div 
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center cursor-pointer group"
                      >
                        <svg
                          width="38"
                          height="38"
                          viewBox="0 0 512 512"
                          className="mr-2 transition-transform duration-200 group-hover:rotate-12"
                          fill="currentColor"
                        >
                          <circle style={{fill:"#AFF0E8"}} cx="285.867" cy="341.333" r="170.667"/>
                          <g>
                            <path style={{fill:"#74DBC9"}} d="M302.933,494.933c-94.257,0-170.667-76.41-170.667-170.667c0-42.785,15.745-81.891,41.756-111.844 c-36.035,31.292-58.822,77.439-58.822,128.911C115.2,435.59,191.61,512,285.867,512c51.472,0,97.62-22.787,128.911-58.822 C384.825,479.188,345.718,494.933,302.933,494.933z"/>
                            <path style={{fill:"#74DBC9"}} d="M380.78,468.543l-36.615-21.97l-7.098-21.291V358.4c0-1.685-0.498-3.332-1.434-4.734l-13.186-19.779 l20.653-20.654c2.192-2.191,3.022-5.398,2.172-8.378l-14.822-51.877l17.677-5.892c2.922-0.839,33.517-9.713,50.589-17.98 c5.339-2.585,6.42-9.989,2.027-13.989c-31.475-28.663-72.273-44.45-114.875-44.45c-47.903,0-93.893,20.32-126.178,55.751 c-2.158,2.368-2.807,5.744-1.683,8.743l8.938,23.835c1.249,3.331,4.433,5.537,7.99,5.537h45.05l6.589,19.765 c0.716,2.147,2.255,3.922,4.279,4.933l15.265,7.633l48.284,64.38v36.288l-31.634,31.634c-0.398,0.398-0.755,0.833-1.067,1.3 l-17.067,25.6c-1.226,1.838-1.691,4.08-1.297,6.254l7.325,40.448c0.642,3.546,3.442,6.306,6.996,6.897 c9.312,1.549,18.803,2.334,28.21,2.334c34.141,0,67.092-10.05,95.293-29.064c2.419-1.631,3.837-4.384,3.76-7.301 C384.843,472.719,383.281,470.045,380.78,468.543z"/>
                          </g>
                          <path style={{fill:"#FDD042"}} d="M337.067,0c-47.053,0-85.333,38.281-85.333,85.333c0,19.303,13.401,49.215,39.83,88.902 c19.209,28.845,38.096,52.052,38.891,53.025c3.361,4.119,9.861,4.119,13.222,0c0.795-0.974,19.683-24.181,38.891-53.025 C409,134.548,422.4,104.637,422.4,85.333C422.4,38.281,384.119,0,337.067,0z"/>
                          <circle style={{fill:"#EBEBEC"}} cx="337.067" cy="85.333" r="51.2"/>
                          <path style={{fill:"#E5563C"}} d="M157.867,85.333c-56.464,0-102.4,45.936-102.4,102.4c0,23.175,16.253,59.988,48.307,109.417 c23.412,36.103,47.159,66.24,47.396,66.54c3.363,4.256,10.029,4.256,13.393,0c0.237-0.3,23.984-30.436,47.396-66.54 c32.054-49.428,48.307-86.241,48.307-109.417C260.267,131.269,214.331,85.333,157.867,85.333z"/>
                          <circle style={{fill:"#EBEBEC"}} cx="157.867" cy="187.733" r="68.267"/>
                        </svg>
                        <span className="text-sm font-medium">{locationData ? 'Edit Location' : 'Location'}</span>
                      </div>
                      <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                        <div className="flex items-center cursor-pointer group">
                          <svg
                            width="38"
                            height="38"
                            viewBox="0 0 512 512"
                            className="mr-2 transition-transform duration-200 group-hover:rotate-12"
                            fill="currentColor"
                          >
                            <circle style={{fill:"#FBA218"}} cx="256.003" cy="256.003" r="248.173"/>
                            <path style={{fill:"#F15A24"}} d="M135.917,256c0-114.909,78.114-211.539,184.126-239.783c-20.436-5.444-41.892-8.387-64.044-8.387 C118.939,7.829,7.829,118.939,7.829,256s111.109,248.17,248.17,248.17c22.151,0,43.608-2.943,64.044-8.387 C214.031,467.538,135.917,370.909,135.917,256z"/>
                            <path style={{fill:"#84DCCF"}} d="M295.67,352.042v64.068c0,26.528-21.492,48.033-48.021,48.033s-48.021-21.505-48.021-48.033v-64.068"/>
                            <path style={{fill:"#027EA8"}} d="M223.638,416.11v-64.068h-24.01v64.068c0,26.528,21.672,48.033,48.2,48.033 c4.154,0,8.077-0.583,11.922-1.574C239.044,457.228,223.638,438.483,223.638,416.11z"/>
                            <circle style={{fill:"#FFFFFF"}} cx="336.051" cy="175.944" r="32.021"/>
                            <path d="M255.999,512c-68.38,0-132.667-26.629-181.019-74.981C26.629,388.667,0,324.38,0,256S26.629,123.333,74.98,74.981 C123.334,26.629,187.62,0,255.999,0s132.667,26.629,181.02,74.981C485.371,123.333,512,187.62,512,256.001 s-26.629,132.668-74.98,181.019C388.666,485.371,324.38,512,255.999,512z M255.999,15.659c-64.197,0-124.551,25-169.946,70.394 S15.659,191.803,15.659,256s25,124.552,70.395,169.946s105.749,70.394,169.946,70.394s124.552-25,169.946-70.394 S496.342,320.196,496.342,256s-25-124.552-70.395-169.946S320.198,15.659,255.999,15.659z"/>
                            <polygon points="207.979,199.627 192.32,199.627 192.32,183.968 111.938,183.968 111.938,168.309 207.979,168.309"/>
                            <path d="M336.055,215.797c-21.975,0-39.852-17.877-39.852-39.851c0-21.975,17.877-39.852,39.852-39.852 c21.974,0,39.851,17.877,39.851,39.852C375.906,197.919,358.029,215.797,336.055,215.797z M336.055,151.753 c-13.339,0-24.193,10.853-24.193,24.193c0,13.339,10.854,24.192,24.193,24.192s24.192-10.853,24.192-24.192 C360.247,162.605,349.395,151.753,336.055,151.753z"/>
                            <path d="M360.247,312.039c0,17.754-14.444,32.198-32.198,32.198H167.94c-17.754,0-32.199-14.444-32.199-32.198h-15.659 c0,26.388,21.468,47.857,47.858,47.857h24.38v56.215c0,30.802,25.054,55.863,55.85,55.863s55.85-25.06,55.85-55.863v-56.215h24.029 c26.387,0,47.857-21.468,47.857-47.857L360.247,312.039L360.247,312.039z M288.362,416.11c0,22.168-18.031,40.204-40.191,40.204 s-40.191-18.035-40.191-40.204v-56.215h32.362v40.167h15.659v-40.167h32.362V416.11z"/>
                            <path d="M264.005,295.851h-24.017c-21.975,0-39.852-17.877-39.852-39.851h15.659c0,13.339,10.853,24.192,24.193,24.192h24.017 c13.339,0,24.192-10.853,24.192-24.192h15.659C303.856,277.974,285.979,295.851,264.005,295.851z"/>
                          </svg>
                          <span className="text-sm font-medium">Emoji</span>
                        </div>
                      </EmojiPicker>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Settings Sidebar */}
              <div className="w-80 border-l border-border bg-muted/30">
                <div className="p-6 h-full overflow-y-auto">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Post Settings</h3>
                  
                  {/* Comments Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-border">
                      <div>
                        <p className="font-medium text-foreground">Allow Comments</p>
                        <p className="text-sm text-muted-foreground">Let people comment on this post</p>
                      </div>
                       <Switch
                         checked={allowComments}
                         onCheckedChange={setAllowComments}
                         className="bg-gradient-to-r from-red-500/10 to-gray-800/10 rounded-xl border border-red-200 data-[state=checked]:!bg-green-100"
                       />
                    </div>

                    {allowComments && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Who can comment</label>
                        <Select value={whoCanComment} onValueChange={setWhoCanComment}>
                          <SelectTrigger className="bg-white border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Everyone">Everyone</SelectItem>
                            <SelectItem value="Friends">Friends only</SelectItem>
                            <SelectItem value="Only me">Only me</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Publishing Options */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Publishing</h4>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPostNow(true)}
                          className="flex-1 p-4 bg-gradient-to-r from-red-500/10 to-gray-800/10 rounded-xl border border-red-200"
                        >
                          Post Now
                        </Button>
                        <Button
                          variant={!postNow ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPostNow(false)}
                          className="flex-1"
                        >
                          Schedule
                        </Button>
                      </div>

                      {!postNow && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start bg-white">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {scheduledDate ? format(scheduledDate, 'PPP') : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* AI Assistant */}
                    <div className="p-4 bg-gradient-to-r from-red-500/10 to-gray-800/10 rounded-xl border border-red-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <p className="font-medium text-foreground">Shqipet AI</p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Get AI help to create engaging content</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs" 
                        onClick={() => setShowAIAssistant(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Open AI Assistant
                      </Button>
                    </div>
                    </div>

                  </div>
              </div>
            </div>

            {/* Footer Actions - Redesigned for clarity */}
            <div className="px-8 py-6 bg-background border-t border-border">
              <div className="space-y-4">
                
                {/* Advanced Settings - Collapsible */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    aria-expanded={showAdvancedSettings}
                    aria-label="Toggle advanced settings"
                  >
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Advanced Settings</span>
                      <span className="text-xs text-muted-foreground">
                        (Scheduling, Cross-platform, Targeting & more)
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAdvancedSettings && (
                    <div className="px-4 py-4 bg-muted/20 border-t border-border space-y-3">
                      {/* Row 1 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('contentWarning')}
                          className="px-3 py-2 h-auto hover:bg-orange-50 hover:border-orange-300 transition-colors"
                        >
                          <WarningIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Content Warning</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('postExpiration')}
                          className="px-3 py-2 h-auto hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <PostExpirationIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Post Expiration</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('crossPlatform')}
                          className="px-3 py-2 h-auto hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <CrossPlatformIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Cross Platform</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('audienceTargeting')}
                          className="px-3 py-2 h-auto hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          <AudienceTargetingIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Audience Targeting</span>
                        </Button>
                      </div>
                      
                      {/* Row 2 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('textFormatting')}
                          className="px-3 py-2 h-auto hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                        >
                          <Type className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Text Formatting</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('voiceToText')}
                          className="px-3 py-2 h-auto hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <VoiceToTextIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Voice to Text</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('translation')}
                          className="px-3 py-2 h-auto hover:bg-cyan-50 hover:border-cyan-300 transition-colors"
                        >
                          <TranslationIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Translation</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWindow('contentModeration')}
                          className="px-3 py-2 h-auto hover:bg-amber-50 hover:border-amber-300 transition-colors"
                        >
                          <ContentModerationIcon className="h-4 w-4 mr-2" />
                          <span className="text-xs font-medium">Content Moderation</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Primary Actions - Clear hierarchy */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      disabled={isSubmitting}
                      className="h-11"
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="h-11"
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  {/* Primary CTA - Prominent and accessible */}
                  <Button
                    onClick={handleCreatePost}
                    disabled={isSubmitting || (!postContent.trim() && selectedFiles.length === 0 && !pollData && !locationData)}
                    size="lg"
                    className="px-8 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                    aria-label={isSubmitting ? 'Publishing post' : 'Publish post'}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-pulse">Publishing...</span>
                      </>
                    ) : pollData && locationData ? (
                      'Publish Poll & Location'
                    ) : pollData ? (
                      'Publish Poll'
                    ) : locationData ? (
                      'Publish with Location'
                    ) : (
                      'Publish Post'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*"
          />
          <input
            ref={imageInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*"
          />
        </div>
      </div>

      {/* Poll Creation Modal */}
      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={handleCreatePoll}
      />
      
      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* Mention Modal - Sliding from Right to Left below top bar */}
      {showMentionModal && (
        <>
          <div 
            className="fixed w-80 h-[600px] bg-white shadow-2xl border border-border z-[100] rounded-xl"
            style={{
              left: 'calc(50% - 860px - 40px)',
              top: '62px',
              animation: 'slideInFromRight 0.3s ease-out'
            }}
          >
            <div className="p-6 bg-gradient-to-r from-red-500/10 to-gray-800/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Mention People</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMentionModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {mentionQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Searching for: "{mentionQuery}"
                </p>
              )}
            </div>
            
            <div className="p-6 h-[calc(100%-120px)] overflow-y-auto">
              <div className="space-y-6">
                {(() => {
                  const allUsers = [
                    { username: 'sarah_dev', name: 'Sarah Johnson', avatar: '👩‍💻' },
                    { username: 'mike_design', name: 'Mike Chen', avatar: '🎨' },
                    { username: 'alex_pm', name: 'Alex Rivera', avatar: '📊' },
                    { username: 'team_lead', name: 'Emma Thompson', avatar: '👩‍💼' },
                    { username: 'john_tech', name: 'John Williams', avatar: '⚡' },
                    { username: 'lisa_creative', name: 'Lisa Zhang', avatar: '✨' },
                    { username: 'david_analyst', name: 'David Brown', avatar: '📈' }
                  ];
                  
                  const filteredUsers = allUsers.filter(user => 
                    mentionQuery === '' || 
                    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                    user.name.toLowerCase().split(' ').some(part => part.startsWith(mentionQuery.toLowerCase()))
                  );

                  return (
                    <>
                      {/* Recent Mentions */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">RECENT</h4>
                        <div className="space-y-2">
                          {filteredUsers.slice(0, 3).map((user) => (
                            <button
                              key={user.username}
                              onClick={() => insertMentionFromModal(user.username)}
                              className="w-full text-left p-3 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all duration-200 group flex items-center gap-3"
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-lg font-medium group-hover:scale-105 transition-transform">
                                {user.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {user.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  @{user.username}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Users */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">SUGGESTED</h4>
                        <div className="space-y-2">
                          {filteredUsers.slice(3).map((user) => (
                            <button
                              key={user.username}
                              onClick={() => insertMentionFromModal(user.username)}
                              className="w-full text-left p-3 rounded-lg hover:bg-secondary/5 border border-transparent hover:border-secondary/20 transition-all duration-200 group flex items-center gap-3"
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center text-lg font-medium group-hover:scale-105 transition-transform">
                                {user.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground group-hover:text-secondary transition-colors">
                                  {user.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  @{user.username}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {filteredUsers.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">🔍</div>
                          <p className="text-muted-foreground">No users found for "{mentionQuery}"</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hashtag Modal - Sliding from Right to Left below top bar */}
      {showHashtagModal && (
        <>
          <div 
            className="fixed w-80 h-[600px] bg-white shadow-2xl border border-border z-[100] rounded-xl"
            style={{
              left: 'calc(50% - 860px - 40px)',
              top: '62px',
              animation: 'slideInFromRight 0.3s ease-out'
            }}
          >
            <div className="p-6 bg-gradient-to-r from-red-500/10 to-gray-800/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Trending Hashtags</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHashtagModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 h-[calc(100%-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Trending Hashtags */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">TRENDING</h4>
                  <div className="flex flex-wrap gap-2">
                    {['trending', 'viral', 'today'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => insertHashtagToContent(tag)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                      >
                        #{tag} 🔥
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Hashtags */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">POPULAR</h4>
                  <div className="flex flex-wrap gap-2">
                    {['love', 'life', 'motivation', 'tech', 'nature'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => insertHashtagToContent(tag)}
                        className="bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-blue-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Hashtags */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">YOUR RECENT</h4>
                  <div className="flex flex-wrap gap-2">
                    {['coding', 'albania', 'friends'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => insertHashtagToContent(tag)}
                        className="bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-blue-500 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Formatting Modal - Sliding from Right to Left below top bar */}
      {showFormattingModal && (
        <>
          <div
            className="fixed w-96 h-[600px] bg-white shadow-2xl border border-border z-[100] rounded-xl"
            style={{
              left: 'calc(50% - 860px - 103px)',
              top: '62px',
              animation: 'slideInFromRight 0.3s ease-out'
            }}
          >
             <div className="p-6 bg-gradient-to-r from-red-500/10 to-gray-800/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Text Formatting</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFormattingModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 h-[calc(100%-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Essential Formatting */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">ESSENTIAL</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Bold, label: 'Bold', format: 'wrap', text: '**' },
                      { icon: Italic, label: 'Italic', format: 'wrap', text: '*' },
                      { icon: Underline, label: 'Underline', format: 'wrap', text: '__' },
                      { icon: Strikethrough, label: 'Strikethrough', format: 'wrap', text: '~~' },
                      { icon: Quote, label: 'Quote', format: 'prefix', text: '> ' },
                      { icon: Code, label: 'Code', format: 'wrap', text: '`' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => insertFormatting(item.format, item.text)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 transition-all duration-200 text-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headers */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">HEADERS</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Heading1, label: 'Header 1', format: 'prefix', text: '# ' },
                      { icon: Heading2, label: 'Header 2', format: 'prefix', text: '## ' },
                      { icon: Heading3, label: 'Header 3', format: 'prefix', text: '### ' },
                      { icon: FileText, label: 'Header 4', format: 'prefix', text: '#### ' },
                      { icon: FileText, label: 'Header 5', format: 'prefix', text: '##### ' },
                      { icon: FileText, label: 'Header 6', format: 'prefix', text: '###### ' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => insertFormatting(item.format, item.text)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-purple-50 hover:text-purple-600 border border-transparent hover:border-purple-200 transition-all duration-200 text-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lists */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">LISTS</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: List, label: 'Bullet List', format: 'prefix', text: '• ' },
                      { icon: ListOrdered, label: 'Numbered List', format: 'prefix', text: '1. ' },
                      { icon: MinusSquare, label: 'Checklist', format: 'prefix', text: '- [ ] ' },
                      { icon: PlusSquare, label: 'Done Item', format: 'prefix', text: '- [x] ' },
                      { icon: Circle, label: 'Circle List', format: 'prefix', text: '○ ' },
                      { icon: Square, label: 'Square List', format: 'prefix', text: '■ ' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => insertFormatting(item.format, item.text)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-green-50 hover:text-green-600 border border-transparent hover:border-green-200 transition-all duration-200 text-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">ALIGNMENT</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: AlignLeft, label: 'Left Align', format: 'prefix', text: '<div align="left">' },
                      { icon: AlignCenter, label: 'Center Align', format: 'prefix', text: '<div align="center">' },
                      { icon: AlignRight, label: 'Right Align', format: 'prefix', text: '<div align="right">' },
                      { icon: Indent, label: 'Indent', format: 'prefix', text: '    ' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => insertFormatting(item.format, item.text)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-200 transition-all duration-200 text-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Characters & Symbols */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">SYMBOLS</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { symbol: '→', label: 'Right Arrow' },
                      { symbol: '←', label: 'Left Arrow' },
                      { symbol: '↑', label: 'Up Arrow' },
                      { symbol: '↓', label: 'Down Arrow' },
                      { symbol: '★', label: 'Star' },
                      { symbol: '♥', label: 'Heart' },
                      { symbol: '•', label: 'Bullet' },
                      { symbol: '○', label: 'Circle' },
                      { symbol: '■', label: 'Square' },
                      { symbol: '▲', label: 'Triangle' },
                      { symbol: '✓', label: 'Check' },
                      { symbol: '✗', label: 'X Mark' },
                      { symbol: '©', label: 'Copyright' },
                      { symbol: '®', label: 'Registered' },
                      { symbol: '™', label: 'Trademark' },
                      { symbol: '°', label: 'Degree' },
                      { symbol: '±', label: 'Plus Minus' },
                      { symbol: '×', label: 'Multiply' },
                      { symbol: '÷', label: 'Divide' },
                      { symbol: '≈', label: 'Approximately' },
                      { symbol: '≠', label: 'Not Equal' },
                      { symbol: '≤', label: 'Less Equal' },
                      { symbol: '≥', label: 'Greater Equal' },
                      { symbol: '∞', label: 'Infinity' },
                      { symbol: '‰', label: 'Per Mille' },
                      { symbol: '§', label: 'Section' },
                      { symbol: '¶', label: 'Paragraph' },
                      { symbol: '†', label: 'Dagger' },
                      { symbol: '‡', label: 'Double Dagger' },
                      { symbol: '…', label: 'Ellipsis' },
                      { symbol: '–', label: 'En Dash' },
                      { symbol: '—', label: 'Em Dash' },
                       { symbol: '\u2018', label: 'Left Quote' },
                       { symbol: '\u2019', label: 'Right Quote' },
                       { symbol: '\u201C', label: 'Left DQuote' },
                       { symbol: '\u201D', label: 'Right DQuote' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-pink-50 hover:text-pink-600 border border-transparent hover:border-pink-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Symbols */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">CURRENCY</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '$', label: 'Dollar' },
                      { symbol: '€', label: 'Euro' },
                      { symbol: '£', label: 'Pound' },
                      { symbol: '¥', label: 'Yen' },
                      { symbol: '₹', label: 'Rupee' },
                      { symbol: '₽', label: 'Ruble' },
                      { symbol: '₩', label: 'Won' },
                      { symbol: '₪', label: 'Shekel' },
                      { symbol: '₨', label: 'Rupee' },
                      { symbol: '₡', label: 'Colon' },
                      { symbol: '₦', label: 'Naira' },
                      { symbol: '₫', label: 'Dong' },
                      { symbol: '₭', label: 'Kip' },
                      { symbol: '₮', label: 'Tugrik' },
                      { symbol: '₯', label: 'Drachma' },
                      { symbol: '₱', label: 'Peso' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-green-50 hover:text-green-600 border border-transparent hover:border-green-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Programming Symbols */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">PROGRAMMING</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '{', label: 'Left Brace' },
                      { symbol: '}', label: 'Right Brace' },
                      { symbol: '[', label: 'Left Bracket' },
                      { symbol: ']', label: 'Right Bracket' },
                      { symbol: '(', label: 'Left Paren' },
                      { symbol: ')', label: 'Right Paren' },
                      { symbol: '<', label: 'Less Than' },
                      { symbol: '>', label: 'Greater Than' },
                      { symbol: '&', label: 'Ampersand' },
                      { symbol: '|', label: 'Pipe' },
                      { symbol: '\\', label: 'Backslash' },
                      { symbol: '/', label: 'Forward Slash' },
                      { symbol: '^', label: 'Caret' },
                      { symbol: '~', label: 'Tilde' },
                      { symbol: '`', label: 'Backtick' },
                      { symbol: '@', label: 'At Symbol' },
                      { symbol: '#', label: 'Hash' },
                      { symbol: '%', label: 'Percent' },
                      { symbol: '!', label: 'Exclamation' },
                      { symbol: '?', label: 'Question' },
                      { symbol: ':', label: 'Colon' },
                      { symbol: ';', label: 'Semicolon' },
                      { symbol: '"', label: 'Quote' },
                      { symbol: "'", label: 'Apostrophe' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extended Arrows */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">ARROWS</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '↑', label: 'Up' },
                      { symbol: '↓', label: 'Down' },
                      { symbol: '←', label: 'Left' },
                      { symbol: '→', label: 'Right' },
                      { symbol: '↖', label: 'Up Left' },
                      { symbol: '↗', label: 'Up Right' },
                      { symbol: '↙', label: 'Down Left' },
                      { symbol: '↘', label: 'Down Right' },
                      { symbol: '↕', label: 'Up Down' },
                      { symbol: '↔', label: 'Left Right' },
                      { symbol: '⇑', label: 'Double Up' },
                      { symbol: '⇓', label: 'Double Down' },
                      { symbol: '⇐', label: 'Double Left' },
                      { symbol: '⇒', label: 'Double Right' },
                      { symbol: '⇔', label: 'Double LR' },
                      { symbol: '⇕', label: 'Double UD' },
                      { symbol: '➡', label: 'Bold Right' },
                      { symbol: '⬅', label: 'Bold Left' },
                      { symbol: '⬆', label: 'Bold Up' },
                      { symbol: '⬇', label: 'Bold Down' },
                      { symbol: '↩', label: 'Return' },
                      { symbol: '↪', label: 'Return Right' },
                      { symbol: '⤴', label: 'Curve Up' },
                      { symbol: '⤵', label: 'Curve Down' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-purple-50 hover:text-purple-600 border border-transparent hover:border-purple-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extended Punctuation */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">PUNCTUATION</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '¡', label: 'Inv Exclaim' },
                      { symbol: '¿', label: 'Inv Question' },
                      { symbol: '‚', label: 'Low Quote' },
                      { symbol: '„', label: 'Low DQuote' },
                      { symbol: '‹', label: 'Left Angle' },
                      { symbol: '›', label: 'Right Angle' },
                      { symbol: '«', label: 'Left Guillemet' },
                      { symbol: '»', label: 'Right Guillemet' },
                      { symbol: '¦', label: 'Broken Bar' },
                      { symbol: '•', label: 'Bullet' },
                      { symbol: '‰', label: 'Per Mille' },
                      { symbol: '′', label: 'Prime' },
                      { symbol: '″', label: 'Double Prime' },
                      { symbol: '‴', label: 'Triple Prime' },
                      { symbol: '‵', label: 'Reversed Prime' },
                      { symbol: '‶', label: 'Reversed DPrime' },
                      { symbol: '‷', label: 'Reversed TPrime' },
                      { symbol: '‸', label: 'Caret Insert' },
                      { symbol: '‹', label: 'Single Left' },
                      { symbol: '›', label: 'Single Right' },
                      { symbol: '※', label: 'Reference Mark' },
                      { symbol: '‼', label: 'Double Exclaim' },
                      { symbol: '⁇', label: 'Double Question' },
                      { symbol: '⁈', label: 'Quest Exclaim' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geometric Shapes */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">SHAPES</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '■', label: 'Black Square' },
                      { symbol: '□', label: 'White Square' },
                      { symbol: '▲', label: 'Black Triangle' },
                      { symbol: '△', label: 'White Triangle' },
                      { symbol: '●', label: 'Black Circle' },
                      { symbol: '○', label: 'White Circle' },
                      { symbol: '◆', label: 'Black Diamond' },
                      { symbol: '◇', label: 'White Diamond' },
                      { symbol: '★', label: 'Black Star' },
                      { symbol: '☆', label: 'White Star' },
                      { symbol: '♠', label: 'Spade' },
                      { symbol: '♣', label: 'Club' },
                      { symbol: '♥', label: 'Heart' },
                      { symbol: '♦', label: 'Diamond' },
                      { symbol: '♩', label: 'Quarter Note' },
                      { symbol: '♪', label: 'Eighth Note' },
                      { symbol: '♫', label: 'Beamed Notes' },
                      { symbol: '♬', label: 'Beamed 16th' },
                      { symbol: '♭', label: 'Flat' },
                      { symbol: '♮', label: 'Natural' },
                      { symbol: '♯', label: 'Sharp' },
                      { symbol: '☀', label: 'Sun' },
                      { symbol: '☁', label: 'Cloud' },
                      { symbol: '☂', label: 'Umbrella' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fractions */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">FRACTIONS</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '½', label: 'One Half' },
                      { symbol: '⅓', label: 'One Third' },
                      { symbol: '⅔', label: 'Two Thirds' },
                      { symbol: '¼', label: 'One Quarter' },
                      { symbol: '¾', label: 'Three Quarters' },
                      { symbol: '⅕', label: 'One Fifth' },
                      { symbol: '⅖', label: 'Two Fifths' },
                      { symbol: '⅗', label: 'Three Fifths' },
                      { symbol: '⅘', label: 'Four Fifths' },
                      { symbol: '⅙', label: 'One Sixth' },
                      { symbol: '⅚', label: 'Five Sixths' },
                      { symbol: '⅛', label: 'One Eighth' },
                      { symbol: '⅜', label: 'Three Eighths' },
                      { symbol: '⅝', label: 'Five Eighths' },
                      { symbol: '⅞', label: 'Seven Eighths' },
                      { symbol: '⅐', label: 'One Seventh' },
                      { symbol: '⅑', label: 'One Ninth' },
                      { symbol: '⅒', label: 'One Tenth' },
                      { symbol: '↉', label: 'Zero Thirds' },
                      { symbol: '⁄', label: 'Fraction Slash' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-teal-50 hover:text-teal-600 border border-transparent hover:border-teal-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roman Numerals */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">ROMAN NUMERALS</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: 'Ⅰ', label: 'Roman 1' },
                      { symbol: 'Ⅱ', label: 'Roman 2' },
                      { symbol: 'Ⅲ', label: 'Roman 3' },
                      { symbol: 'Ⅳ', label: 'Roman 4' },
                      { symbol: 'Ⅴ', label: 'Roman 5' },
                      { symbol: 'Ⅵ', label: 'Roman 6' },
                      { symbol: 'Ⅶ', label: 'Roman 7' },
                      { symbol: 'Ⅷ', label: 'Roman 8' },
                      { symbol: 'Ⅸ', label: 'Roman 9' },
                      { symbol: 'Ⅹ', label: 'Roman 10' },
                      { symbol: 'Ⅺ', label: 'Roman 11' },
                      { symbol: 'Ⅻ', label: 'Roman 12' },
                      { symbol: 'ⅰ', label: 'Small 1' },
                      { symbol: 'ⅱ', label: 'Small 2' },
                      { symbol: 'ⅲ', label: 'Small 3' },
                      { symbol: 'ⅳ', label: 'Small 4' },
                      { symbol: 'ⅴ', label: 'Small 5' },
                      { symbol: 'ⅵ', label: 'Small 6' },
                      { symbol: 'ⅶ', label: 'Small 7' },
                      { symbol: 'ⅷ', label: 'Small 8' },
                      { symbol: 'ⅸ', label: 'Small 9' },
                      { symbol: 'ⅹ', label: 'Small 10' },
                      { symbol: 'ⅺ', label: 'Small 11' },
                      { symbol: 'ⅻ', label: 'Small 12' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Superscript Numbers */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">SUPERSCRIPT</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '⁰', label: 'Super 0' },
                      { symbol: '¹', label: 'Super 1' },
                      { symbol: '²', label: 'Super 2' },
                      { symbol: '³', label: 'Super 3' },
                      { symbol: '⁴', label: 'Super 4' },
                      { symbol: '⁵', label: 'Super 5' },
                      { symbol: '⁶', label: 'Super 6' },
                      { symbol: '⁷', label: 'Super 7' },
                      { symbol: '⁸', label: 'Super 8' },
                      { symbol: '⁹', label: 'Super 9' },
                      { symbol: '⁺', label: 'Super Plus' },
                      { symbol: '⁻', label: 'Super Minus' },
                      { symbol: '⁼', label: 'Super Equals' },
                      { symbol: '⁽', label: 'Super Left Paren' },
                      { symbol: '⁾', label: 'Super Right Paren' },
                      { symbol: 'ⁿ', label: 'Super n' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 border border-transparent hover:border-yellow-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subscript Numbers */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">SUBSCRIPT</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '₀', label: 'Sub 0' },
                      { symbol: '₁', label: 'Sub 1' },
                      { symbol: '₂', label: 'Sub 2' },
                      { symbol: '₃', label: 'Sub 3' },
                      { symbol: '₄', label: 'Sub 4' },
                      { symbol: '₅', label: 'Sub 5' },
                      { symbol: '₆', label: 'Sub 6' },
                      { symbol: '₇', label: 'Sub 7' },
                      { symbol: '₈', label: 'Sub 8' },
                      { symbol: '₉', label: 'Sub 9' },
                      { symbol: '₊', label: 'Sub Plus' },
                      { symbol: '₋', label: 'Sub Minus' },
                      { symbol: '₌', label: 'Sub Equals' },
                      { symbol: '₍', label: 'Sub Left Paren' },
                      { symbol: '₎', label: 'Sub Right Paren' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-lime-50 hover:text-lime-600 border border-transparent hover:border-lime-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Formatting */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">ADVANCED</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Code2, label: 'Code Block', format: 'wrap', text: '```' },
                      { icon: Link2, label: 'Link', format: 'wrap', text: '[](url)' },
                      { icon: Superscript, label: 'Superscript', format: 'wrap', text: '^' },
                      { icon: Subscript, label: 'Subscript', format: 'wrap', text: '~' },
                      { icon: FileText, label: 'Horizontal Rule', format: 'prefix', text: '---' },
                      { icon: Quote, label: 'Blockquote', format: 'prefix', text: '> ' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => insertFormatting(item.format, item.text)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-200 transition-all duration-200 text-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mathematical Symbols */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">MATH</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { symbol: '∑', label: 'Sum' },
                      { symbol: '∏', label: 'Product' },
                      { symbol: '∫', label: 'Integral' },
                      { symbol: '∂', label: 'Partial' },
                      { symbol: '√', label: 'Square Root' },
                      { symbol: '∛', label: 'Cube Root' },
                      { symbol: '∜', label: 'Fourth Root' },
                      { symbol: 'π', label: 'Pi' },
                      { symbol: 'α', label: 'Alpha' },
                      { symbol: 'β', label: 'Beta' },
                      { symbol: 'γ', label: 'Gamma' },
                      { symbol: 'δ', label: 'Delta' },
                      { symbol: 'ε', label: 'Epsilon' },
                      { symbol: 'ζ', label: 'Zeta' },
                      { symbol: 'η', label: 'Eta' },
                      { symbol: 'θ', label: 'Theta' },
                      { symbol: 'ι', label: 'Iota' },
                      { symbol: 'κ', label: 'Kappa' },
                      { symbol: 'λ', label: 'Lambda' },
                      { symbol: 'μ', label: 'Mu' },
                      { symbol: 'ν', label: 'Nu' },
                      { symbol: 'ξ', label: 'Xi' },
                      { symbol: 'ο', label: 'Omicron' },
                      { symbol: 'ρ', label: 'Rho' },
                      { symbol: 'σ', label: 'Sigma' },
                      { symbol: 'τ', label: 'Tau' },
                      { symbol: 'υ', label: 'Upsilon' },
                      { symbol: 'φ', label: 'Phi' },
                      { symbol: 'χ', label: 'Chi' },
                      { symbol: 'ψ', label: 'Psi' },
                      { symbol: 'ω', label: 'Omega' },
                      { symbol: 'Α', label: 'Cap Alpha' },
                      { symbol: 'Β', label: 'Cap Beta' },
                      { symbol: 'Γ', label: 'Cap Gamma' },
                      { symbol: 'Δ', label: 'Cap Delta' },
                      { symbol: 'Ε', label: 'Cap Epsilon' },
                      { symbol: 'Ζ', label: 'Cap Zeta' },
                      { symbol: 'Η', label: 'Cap Eta' },
                      { symbol: 'Θ', label: 'Cap Theta' },
                      { symbol: 'Ι', label: 'Cap Iota' },
                      { symbol: 'Κ', label: 'Cap Kappa' },
                      { symbol: 'Λ', label: 'Cap Lambda' },
                      { symbol: 'Μ', label: 'Cap Mu' },
                      { symbol: 'Ν', label: 'Cap Nu' },
                      { symbol: 'Ξ', label: 'Cap Xi' },
                      { symbol: 'Ο', label: 'Cap Omicron' },
                      { symbol: 'Π', label: 'Cap Pi' },
                      { symbol: 'Ρ', label: 'Cap Rho' },
                      { symbol: 'Σ', label: 'Cap Sigma' },
                      { symbol: 'Τ', label: 'Cap Tau' },
                      { symbol: 'Υ', label: 'Cap Upsilon' },
                      { symbol: 'Φ', label: 'Cap Phi' },
                      { symbol: 'Χ', label: 'Cap Chi' },
                      { symbol: 'Ψ', label: 'Cap Psi' },
                      { symbol: 'Ω', label: 'Cap Omega' },
                      { symbol: '∈', label: 'Element Of' },
                      { symbol: '∉', label: 'Not Element' },
                      { symbol: '∋', label: 'Contains' },
                      { symbol: '∌', label: 'Not Contains' },
                      { symbol: '∅', label: 'Empty Set' },
                      { symbol: '∪', label: 'Union' },
                      { symbol: '∩', label: 'Intersection' },
                      { symbol: '⊂', label: 'Subset' },
                      { symbol: '⊃', label: 'Superset' },
                      { symbol: '⊆', label: 'Subset Equal' },
                      { symbol: '⊇', label: 'Superset Equal' },
                      { symbol: '⊄', label: 'Not Subset' },
                      { symbol: '⊅', label: 'Not Superset' },
                      { symbol: '∴', label: 'Therefore' },
                      { symbol: '∵', label: 'Because' },
                      { symbol: '∀', label: 'For All' },
                      { symbol: '∃', label: 'There Exists' },
                      { symbol: '∇', label: 'Nabla' },
                      { symbol: '∆', label: 'Increment' },
                      { symbol: '∝', label: 'Proportional' },
                      { symbol: '∠', label: 'Angle' },
                      { symbol: '∡', label: 'Measured Angle' },
                      { symbol: '∢', label: 'Spherical Angle' },
                      { symbol: '⊥', label: 'Perpendicular' },
                      { symbol: '∥', label: 'Parallel' },
                      { symbol: '∦', label: 'Not Parallel' },
                      { symbol: '∧', label: 'Logical And' },
                      { symbol: '∨', label: 'Logical Or' },
                      { symbol: '¬', label: 'Logical Not' },
                      { symbol: '⊕', label: 'XOR' },
                      { symbol: '⊗', label: 'Tensor Product' },
                    ].map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => insertFormatting('insert', item.symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 border border-transparent hover:border-cyan-200 transition-all duration-200 text-xs"
                      >
                        <span className="text-lg">{item.symbol}</span>
                        <span className="text-xs text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Styles */}
                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">TYPOGRAPHY</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Bold, label: 'Bold Selection', format: 'wrap', text: '**' },
                      { icon: Italic, label: 'Italic Selection', format: 'wrap', text: '*' },
                      { icon: Underline, label: 'Underline Selection', format: 'wrap', text: '<u>' },
                      { icon: Strikethrough, label: 'Strikethrough Selection', format: 'wrap', text: '~~' },
                      { icon: Code, label: 'Inline Code', format: 'wrap', text: '`' },
                      { icon: Code2, label: 'Code Block', format: 'wrap', text: '```' },
                      { icon: Superscript, label: 'Superscript Text', format: 'wrap', text: '<sup>' },
                      { icon: Subscript, label: 'Subscript Text', format: 'wrap', text: '<sub>' },
                      { icon: Quote, label: 'Inline Quote', format: 'wrap', text: '"' },
                      { icon: Quote, label: 'Block Quote', format: 'prefix', text: '> ' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => insertFormatting(item.format, item.text)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 hover:text-slate-600 border border-transparent hover:border-slate-200 transition-all duration-200 text-sm"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Shqipet AI Assistant */}
      <ShqipetAIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onInsertContent={handleAIContentInsert}
        currentContent={postContent}
      />

      {/* Sliding Windows */}
      <ContentWarningSlidingWindow
        isOpen={activeWindow === 'contentWarning'}
        onClose={closeWindow}
        warnings={contentWarnings}
        onWarningsChange={setContentWarnings}
        icon={<WarningIcon className="h-5 w-5" />}
      />
      
      <PostExpirationSlidingWindow
        isOpen={activeWindow === 'postExpiration'}
        onClose={closeWindow}
        expiration={postExpiration}
        onExpirationChange={setPostExpiration}
        icon={<PostExpirationIcon className="h-5 w-5" />}
      />
      
      <CrossPlatformSlidingWindow
        isOpen={activeWindow === 'crossPlatform'}
        onClose={closeWindow}
        selectedPlatforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
        icon={<CrossPlatformIcon className="h-5 w-5" />}
      />
      
      <AudienceTargetingSlidingWindow
        isOpen={activeWindow === 'audienceTargeting'}
        onClose={closeWindow}
        settings={audienceSettings}
        onSettingsChange={setAudienceSettings}
        icon={<AudienceTargetingIcon className="h-5 w-5" />}
      />
      
      <VoiceToTextSlidingWindow
        isOpen={activeWindow === 'voiceToText'}
        onClose={closeWindow}
        onTextGenerated={(text) => setPostContent(prev => prev + text)}
        icon={<VoiceToTextIcon className="h-5 w-5" />}
      />
      
      <TranslationSlidingWindow
        isOpen={activeWindow === 'translation'}
        onClose={closeWindow}
        settings={translationSettings}
        onSettingsChange={setTranslationSettings}
        content={postContent}
        onContentChange={setTranslatedContent}
        icon={<TranslationIcon className="h-5 w-5" />}
      />
      
      <ContentModerationSlidingWindow
        isOpen={activeWindow === 'contentModeration'}
        onClose={closeWindow}
        content={postContent}
        files={selectedFiles}
        icon={<ContentModerationIcon className="h-5 w-5" />}
      />
      
      <TextFormattingSlidingWindow
        isOpen={activeWindow === 'textFormatting'}
        onClose={closeWindow}
        onFormatSelect={(format) => {
          // Handle format selection
          const formatMap: { [key: string]: { type: string; text: string } } = {
            'bold': { type: 'wrap', text: '**' },
            'italic': { type: 'wrap', text: '*' },
            'underline': { type: 'wrap', text: '<u>' },
            'strikethrough': { type: 'wrap', text: '~~' },
            'quote': { type: 'wrap', text: '"' },
            'code': { type: 'wrap', text: '`' },
            'h1': { type: 'prefix', text: '# ' },
            'h2': { type: 'prefix', text: '## ' },
            'h3': { type: 'prefix', text: '### ' },
            'h4': { type: 'prefix', text: '#### ' }
          };
          
          const formatData = formatMap[format];
          if (formatData) {
            insertFormatting(formatData.type, formatData.text);
          }
        }}
        icon={<Type className="h-5 w-5" />}
      />
      
      <PhotoPreviewSlidingWindow
        isOpen={activeWindow === 'photoPreview'}
        onClose={closeWindow}
        selectedFiles={selectedFiles}
      />
    </>
  );
};

export default CreatePostForm;