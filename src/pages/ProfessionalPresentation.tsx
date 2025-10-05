import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MinimalNavbar from "@/components/navbar/MinimalNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { mediaService } from "@/services/media/MediaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import UploadAnimation from "@/components/ui/UploadAnimation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, FileText, Linkedin, Github, Facebook, Instagram, Globe, Mail, Phone, ArrowRight, Wand2, ExternalLink, User as UserIcon, Move, Save, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Highlighter, X, Camera, Briefcase, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePhotoEditor } from "@/hooks/usePhotoEditor";
import { PhotoEditor } from "@/components/profile/PhotoEditor";
import { useGroupDrag } from "@/hooks/useGroupDrag";

// Resolve Wasabi storage keys to proxy URLs
const resolveMediaUrl = (value: string | null | undefined) => {
  if (!value) return '';
  const v = String(value);
  if (v.startsWith('http') || v.startsWith('blob:') || v.startsWith('data:')) return v;
  return `${supabase.supabaseUrl}/functions/v1/wasabi-proxy?key=${encodeURIComponent(v)}`;
};

// ===== Reusable: Editable & Draggable (fixed caret + sticky toolbar) =====
const FONT_OPTIONS = ["system-ui", "Inter, system-ui, sans-serif", "Georgia, serif", "Times New Roman, Times, serif", "Garamond, serif", "Cambria, Cochin, Georgia, Times, 'Times New Roman', serif", "Montserrat, system-ui, sans-serif", "Poppins, system-ui, sans-serif", "Roboto, system-ui, sans-serif"];
type StyleConfig = {
  fontFamily?: string;
  fontSize?: number; // px
  color?: string;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  textDecoration?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number; // unitless
  letterSpacing?: number; // px
  backgroundColor?: string;
};
type EditableProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  styleConfig?: StyleConfig;
  setStyleConfig?: (s: StyleConfig) => void;
  editMode: boolean;
  draggable?: boolean;
};
function EditableText({
  id,
  value,
  onChange,
  className,
  styleConfig,
  setStyleConfig,
  editMode,
  draggable
}: EditableProps) {
  const [hover, setHover] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [styles, setStyles] = useState<StyleConfig>(styleConfig || {});
  const ref = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);

  // keep local in sync only when not actively editing to avoid caret jumps
  useEffect(() => {
    if (!isEditing) setLocal(value);
  }, [value, isEditing]);
  useEffect(() => setStyles(styleConfig || {}), [styleConfig]);

  // preserve caret before re-renders caused by style changes
  const saveSelection = () => {
    const sel = window.getSelection?.();
    if (sel && sel.rangeCount > 0) selectionRef.current = sel.getRangeAt(0);
  };
  const restoreSelection = () => {
    const sel = window.getSelection?.();
    if (sel && selectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(selectionRef.current);
    }
  };
  const applySave = () => {
    onChange(local);
    setStyleConfig?.(styles);
  };
  const resetStyles = () => setStyles({});
  const toolbar = <div className="absolute -top-12 left-0 z-50 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1 shadow-sm" onMouseDown={e => e.stopPropagation()} onMouseEnter={() => setHover(true)}>
      <Type className="h-4 w-4 text-neutral-500" />
      <select className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs" value={styles.fontFamily || FONT_OPTIONS[0]} onChange={e => {
      saveSelection();
      setStyles({
        ...styles,
        fontFamily: e.target.value
      });
      setTimeout(restoreSelection, 0);
    }}>
        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f.split(",")[0]}</option>)}
      </select>
      <input type="number" className="w-16 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs" value={styles.fontSize ?? 14} min={10} max={96} onChange={e => {
      saveSelection();
      setStyles({
        ...styles,
        fontSize: Number(e.target.value)
      });
      setTimeout(restoreSelection, 0);
    }} title="Font size (px)" />
      <input type="color" className="h-7 w-7 cursor-pointer rounded-md border border-neutral-200" value={styles.color || "#111111"} onChange={e => {
      saveSelection();
      setStyles({
        ...styles,
        color: e.target.value
      });
      setTimeout(restoreSelection, 0);
    }} title="Text color" />
      <input type="color" className="h-7 w-7 cursor-pointer rounded-md border border-neutral-200" value={styles.backgroundColor || "#ffffff"} onChange={e => {
      saveSelection();
      setStyles({
        ...styles,
        backgroundColor: e.target.value
      });
      setTimeout(restoreSelection, 0);
    }} title="Background highlight" />
      <button className="rounded border border-neutral-200 p-1" onClick={() => {
      saveSelection();
      setStyles({
        ...styles,
        fontWeight: styles.fontWeight ? 400 : 700
      });
      setTimeout(restoreSelection, 0);
    }} title="Bold"><Bold className="h-4 w-4" /></button>
      <button className="rounded border border-neutral-200 p-1" onClick={() => {
      saveSelection();
      setStyles({
        ...styles,
        fontStyle: styles.fontStyle === "italic" ? "normal" : "italic"
      });
      setTimeout(restoreSelection, 0);
    }} title="Italic"><Italic className="h-4 w-4" /></button>
      <button className="rounded border border-neutral-200 p-1" onClick={() => {
      saveSelection();
      setStyles({
        ...styles,
        textDecoration: styles.textDecoration === "underline" ? "none" : "underline"
      });
      setTimeout(restoreSelection, 0);
    }} title="Underline"><Underline className="h-4 w-4" /></button>
      <button className="rounded border border-neutral-200 p-1" onClick={() => {
      saveSelection();
      setStyles({
        ...styles,
        textAlign: "left"
      });
      setTimeout(restoreSelection, 0);
    }} title="Align left"><AlignLeft className="h-4 w-4" /></button>
      <button className="rounded border border-neutral-200 p-1" onClick={() => {
      saveSelection();
      setStyles({
        ...styles,
        textAlign: "center"
      });
      setTimeout(restoreSelection, 0);
    }} title="Align center"><AlignCenter className="h-4 w-4" /></button>
      <button className="rounded border border-neutral-200 p-1" onClick={() => {
      saveSelection();
      setStyles({
        ...styles,
        textAlign: "right"
      });
      setTimeout(restoreSelection, 0);
    }} title="Align right"><AlignRight className="h-4 w-4" /></button>
      <div className="flex items-center gap-1 text-xs text-neutral-600">
        <Highlighter className="h-4 w-4" />
        <input type="number" className="w-14 rounded-md border border-neutral-200 bg-white px-1 py-0.5" value={styles.lineHeight ?? 1.4} step={0.05} min={1} max={3} onChange={e => {
        saveSelection();
        setStyles({
          ...styles,
          lineHeight: Number(e.target.value)
        });
        setTimeout(restoreSelection, 0);
      }} title="Line height" />
        <input type="number" className="w-14 rounded-md border border-neutral-200 bg-white px-1 py-0.5" value={styles.letterSpacing ?? 0} step={0.2} min={-1} max={5} onChange={e => {
        saveSelection();
        setStyles({
          ...styles,
          letterSpacing: Number(e.target.value)
        });
        setTimeout(restoreSelection, 0);
      }} title="Letter spacing (px)" />
      </div>
      <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={applySave}>
        <Save className="h-3.5 w-3.5" /> Save
      </Button>
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" onClick={resetStyles} title="Reset styles">
        <X className="h-3.5 w-3.5" /> Reset
      </Button>
    </div>;
  const style: React.CSSProperties = {
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    color: styles.color,
    fontWeight: styles.fontWeight,
    fontStyle: styles.fontStyle,
    textDecoration: styles.textDecoration,
    textAlign: styles.textAlign,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing ? `${styles.letterSpacing}px` : undefined,
    backgroundColor: styles.backgroundColor
  };
  const inner = <div ref={ref} className={(className || "") + (editMode ? " outline-none hover:bg-[var(--accent-10)]/40 focus:bg-[var(--accent-10)]/60 rounded" : "")} style={style} contentEditable={editMode} suppressContentEditableWarning onFocus={() => setIsEditing(true)} onBlur={() => {
    setIsEditing(false);
    applySave();
  }} onInput={e => setLocal((e.target as HTMLDivElement).innerText)}>
      {local}
    </div>;
  if (!editMode) return inner;
  return <motion.div drag={draggable && !isEditing} dragMomentum={false} className="relative cursor-text" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {(hover || isEditing) && toolbar}
      {inner}
      {draggable && !isEditing && <div className="pointer-events-none absolute -left-6 top-1 flex items-center gap-1 text-xs text-neutral-400">
          <Move className="h-3.5 w-3.5" /> drag
        </div>}
    </motion.div>;
}

// ===== Helper section (borderless) =====
const Section = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => <section className="space-y-2">
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
    <div className="text-[15px] leading-relaxed text-neutral-800">{children}</div>
  </section>;
const IconMap: Record<string, any> = {
  linkedin: Linkedin,
  github: Github,
  facebook: Facebook,
  instagram: Instagram,
  website: Globe
};
const SocialIcon = ({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon?: string;
}) => {
  const Icon = icon && IconMap[icon.toLowerCase()] ? IconMap[icon.toLowerCase()] : Globe;
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:opacity-80">
            <Icon className="h-5 w-5" />
          </a>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>;
};

// ===== Main component =====
export default function ProfessionalPresentation() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [presentationUserId, setPresentationUserId] = useState<string | null>(null);

  // Check if current user is the owner of this presentation
  useEffect(() => {
    setIsOwner(!!user);
  }, [user]);

  // Text group drag hook
  const textDrag = useGroupDrag({ userId: user?.id });

  // Editable state
  const [profile, setProfile] = useState(() => {
    return {
      name: "Andi Mekrizvani",
      role: "Founder • Product & Security Enthusiast",
      entry: "Building Shqipet — a clean, focused social platform. I care about craft, security, and helpful tech.",
      quick: "Based in London. Cybersecurity learner. I design systems that are fast, clear, and human-friendly.",
      email: "hello@example.com",
      phone: "+44 7123 456789",
      website: "https://shqipet.com",
      cvUrl: "#",
      avatarUrl: '' // Start empty to avoid showing stale cached image on refresh
    };
  });
  const [navLabels, setNavLabels] = useState({
    home: "Home",
    skills: "Skills",
    portfolio: "Portfolio",
    blogs: "Blogs",
    contact: "Contact"
  });

  // Per-text style configs
  const [styles, setStyles] = useState<Record<string, StyleConfig>>({});
  const setStyle = (k: string, s: StyleConfig) => setStyles(prev => ({
    ...prev,
    [k]: s
  }));

  // Dynamic socials
  const [socials, setSocials] = useState<Array<{
    label: string;
    url: string;
    icon?: string;
  }>>([{
    label: "LinkedIn",
    url: "https://linkedin.com",
    icon: "linkedin"
  }, {
    label: "GitHub",
    url: "https://github.com",
    icon: "github"
  }, {
    label: "Facebook",
    url: "https://facebook.com",
    icon: "facebook"
  }, {
    label: "Instagram",
    url: "https://instagram.com",
    icon: "instagram"
  }, {
    label: "Website",
    url: "https://shqipet.com",
    icon: "website"
  }]);
  const [sections, setSections] = useState({
    home: true,
    skills: true,
    portfolio: true,
    blogs: true,
    contact: true
  });
  const [editMode, setEditMode] = useState(false); // Default OFF

  const [layout, setLayout] = useState({
    showRightSidebar: true,
    leftColFraction: "1.1fr",
    middleColFraction: "1.4fr",
    rightColFraction: "0.5fr",
    noiseOpacity: 0.06,
    enableAnimations: true,
    fullBleedPhoto: false,
    photoHeight: 420
  });
  const [seo, setSeo] = useState({
    pageTitle: "Andi – Personal Presentation",
    description: "Clean, white-first personal page with skills, portfolio, and contact.",
    openInNewWindow: true
  });
  const [accent, setAccent] = useState("#2AA1FF");
  const accentStyle = useMemo(() => ({
    ["--accent"]: accent,
    ["--accent-10"]: accent + "19",
    ["--accent-20"]: accent + "33"
  }) as React.CSSProperties, [accent]);

  // Hire button settings
  const [hireButton, setHireButton] = useState({
    enabled: true,
    text: "Hire Me",
    url: "",
    email: ""
  });
  const lastAppliedKeyRef = useRef<string | null>(null);

  // ---- Self tests (lightweight) ----
  useEffect(() => {
    const keys = ["home", "skills", "portfolio", "blogs", "contact"] as const;
    keys.forEach(k => console.assert(typeof (navLabels as any)[k] === "string", `[SelfTest] nav label ${k} should be string`));
    console.assert(typeof seo.pageTitle === "string" && seo.pageTitle.length > 0, "[SelfTest] pageTitle should be non-empty string");
  }, []);

  // Load edit mode, hire button, and avatar from database
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const {
          data,
          error
        } = await supabase.from('professional_presentations').select('edit_mode, hire_button_enabled, hire_button_text, hire_button_url, hire_button_email, avatar_url, updated_at').eq('user_id', user.id).maybeSingle();
        if (data && !error) {
          console.log('📊 Loaded professional presentation data:', data);
          setEditMode(data.edit_mode || false);
          setHireButton({
            enabled: data.hire_button_enabled ?? true,
            text: data.hire_button_text || "Hire Me",
            url: data.hire_button_url || "",
            email: data.hire_button_email || ""
          });

          // Load professional presentation avatar (strict no-flicker: resolve once, preload, then swap)
          if (data.avatar_url) {
            const keyOrUrl = String(data.avatar_url);
            const rev = data.updated_at || Date.now().toString();
            console.log('🖼️ Loading professional avatar (no-flicker):', {
              keyOrUrl,
              rev
            });

            // For full URLs or local previews, apply directly
            if (/^(https?:|blob:|data:)/.test(keyOrUrl)) {
              setProfile(prev => ({
                ...prev,
                avatarUrl: keyOrUrl
              }));
              try {
                localStorage.setItem('pp:last:avatar_url', keyOrUrl);
                localStorage.setItem('pp:avatar_meta', JSON.stringify({
                  url: keyOrUrl,
                  rev,
                  userId: user?.id
                }));
              } catch {}
            } else {
              (async () => {
                try {
                  const fresh = await mediaService.getUrl(keyOrUrl);
                  const versioned = fresh + (fresh.includes('?') ? '&' : '?') + 'rev=' + encodeURIComponent(rev);
                  await mediaService.preloadImage(versioned);
                  setProfile(prev => ({
                    ...prev,
                    avatarUrl: versioned
                  }));
                  try {
                    localStorage.setItem('pp:last:avatar_url', versioned);
                    localStorage.setItem('pp:avatar_meta', JSON.stringify({
                      url: versioned,
                      rev,
                      userId: user?.id
                    }));
                  } catch {}
                } catch (e) {
                  console.warn('⚠️ Failed to resolve avatar on initial load, falling back to last good if any', e);
                  // Fallback to cached last good (only if nothing is shown yet)
                  try {
                    const last = localStorage.getItem('pp:last:avatar_url');
                    if (last) setProfile(prev => ({
                      ...prev,
                      avatarUrl: last
                    }));
                  } catch {}
                }
              })();
            }
          } else {
            console.log('⚠️ No avatar_url found in professional_presentations');
          }
        } else if (error) {
          console.error('❌ Error loading professional presentation data:', error);
        } else {
          console.log('ℹ️ No professional presentation data found for user');
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
    };
    loadData();

    // Set up realtime subscription for INSTANT updates (zero delay)
    const channel = supabase.channel('professional-presentation-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'professional_presentations',
      filter: `user_id=eq.${user?.id}`
    }, async payload => {
      console.log('🔄 Realtime update received:', payload);
      if (payload.new && typeof payload.new === 'object') {
        const newData = payload.new as any;
        const oldData = (payload as any).old as any;
        const commitTimestamp = (payload as any).commit_timestamp;

        // Improved deduplication: check both avatar_url AND commit_timestamp
        if (oldData?.avatar_url === newData.avatar_url && commitTimestamp === lastAppliedKeyRef.current) {
          console.log('⏭️ Skipping unchanged update');
          return;
        }
        if (newData.avatar_url) {
          const keyOrUrl = String(newData.avatar_url);
          lastAppliedKeyRef.current = commitTimestamp;

          // If this is a local preview (blob/data), apply immediately
          if (/^(blob:|data:)/.test(keyOrUrl)) {
            setProfile(prev => ({
              ...prev,
              avatarUrl: keyOrUrl
            }));
            try {
              localStorage.setItem('pp:last:avatar_url', keyOrUrl);
              localStorage.setItem('pp:avatar_meta', JSON.stringify({
                url: keyOrUrl,
                rev: commitTimestamp,
                userId: user?.id
              }));
            } catch {}
          } else {
            try {
              // CRITICAL: Clear ALL caches before fetching to ensure fresh data
              console.log('🧹 Clearing cache for:', keyOrUrl);
              try {
                mediaService.clearCache?.(keyOrUrl);
                mediaService.clearAllCaches?.();
              } catch {}

              // Force fresh fetch with proxy blob (bypasses all caches)
              const fresh = await mediaService.getProxyBlob(keyOrUrl);
              const versioned = fresh + (fresh.includes('?') ? '&' : '?') + 't=' + Date.now();

              // Preload before applying to ensure smooth transition
              await mediaService.preloadImage(versioned);
              setProfile(prev => ({
                ...prev,
                avatarUrl: versioned
              }));
              try {
                localStorage.setItem('pp:last:avatar_url', versioned);
                localStorage.setItem('pp:avatar_meta', JSON.stringify({
                  url: versioned,
                  rev: commitTimestamp,
                  userId: user?.id
                }));
              } catch {}
              console.log('✅ Applied fresh avatar URL instantly:', versioned);
            } catch (err) {
              console.error('⚠️ Failed to resolve/preload avatar URL:', err);
            }
          }
        }

        // Update hire button
        setHireButton({
          enabled: newData.hire_button_enabled ?? true,
          text: newData.hire_button_text || "Hire Me",
          url: newData.hire_button_url || "",
          email: newData.hire_button_email || ""
        });
      }
    }).subscribe(status => {
      console.log('📡 Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time sync ACTIVE - photos will update instantly!');
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Save edit mode and hire button to database when they change
  useEffect(() => {
    const saveData = async () => {
      if (!user || !isOwner) return;
      try {
        await supabase.from('professional_presentations').upsert({
          user_id: user.id,
          edit_mode: editMode,
          hire_button_enabled: hireButton.enabled,
          hire_button_text: hireButton.text,
          hire_button_url: hireButton.url,
          hire_button_email: hireButton.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    // Only save if user is owner
    if (isOwner) {
      saveData();
    }
  }, [editMode, hireButton, user, isOwner]);

  // Persist to localStorage so Save keeps edits
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ppd-state");
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile(parsed.profile ?? profile);
        setNavLabels(parsed.navLabels ?? navLabels);
        setStyles(parsed.styles ?? styles);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const saveAll = () => {
    const data = {
      profile,
      navLabels,
      styles
    };
    localStorage.setItem("ppd-state", JSON.stringify(data));
  };

  // Professional Presentation Controls (only visible to owner)
  const professionalControls = isOwner ? <>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{
        background: "var(--accent-10)"
      }}>
          <Wand2 className="h-4 w-4" style={{
          color: "var(--accent)"
        }} />
        </div>
        <div className="text-xs">
          <div className="font-semibold leading-none">Professional Presentation</div>
        </div>
      </div>
      
      {/* Removed duplicate back button from controls */}
      
      <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1">
        <span className="text-xs text-neutral-600">Edit mode</span>
        <Switch checked={editMode} onCheckedChange={setEditMode} />
      </div>
      
      <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={saveAll}>
        <Save className="h-3.5 w-3.5" /> Save all
      </Button>
      
      <a href={profile.cvUrl} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <FileText className="h-3.5 w-3.5" /> CV
        </Button>
      </a>
      
      <SettingsDialog profile={profile} setProfile={setProfile} socials={socials} setSocials={setSocials} sections={sections} setSections={setSections} accent={accent} setAccent={setAccent} layout={layout} setLayout={setLayout} seo={seo} setSeo={setSeo} hireButton={hireButton} setHireButton={setHireButton} />
    </> : null;
  return <>
      {/* Minimal Navbar with Professional Controls (only visible to owner) */}
      <MinimalNavbar professionalControls={professionalControls} />
      
      {/* Back to Profile Button - Top Left Corner */}
      <div className="fixed top-16 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/profile')} 
          className="gap-1.5 h-8 bg-white shadow-md hover:shadow-lg"
        >
          ← Back to Profile
        </Button>
      </div>
      
      <div className="min-h-screen w-full bg-white text-neutral-900 pt-14" style={accentStyle}>
        {/* Grid */}
        <main className="mx-auto grid max-w-7xl gap-10 px-6 py-10" style={{
        gridTemplateColumns: `${layout.leftColFraction} ${layout.middleColFraction} ${layout.showRightSidebar ? layout.rightColFraction : "0fr"}`
      }}>
        {/* LEFT: Photo strip + name/role/quick (borderless) */}
        <motion.section initial={{
          opacity: 0,
          y: layout.enableAnimations ? 12 : 0
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }} className="col-span-1">
          <div className="-ml-96 mt-8">
            <PhotoStrip avatarUrl={profile.avatarUrl} accent={accent} height={layout.photoHeight || 420} userId={user?.id} editMode={editMode && isOwner} onPhotoUpdate={url => setProfile({
              ...profile,
              avatarUrl: url
            })} />
          </div>

          {/* Text Section - Draggable as a group */}
          <div 
            className={`mt-12 space-y-2 mx-0 px-0 rounded-lg -ml-56 scale-[1.2] origin-left my-[60px] relative ${editMode && !textDrag.isEditMode ? 'border-2 border-dashed border-blue-300 p-4 cursor-move hover:border-blue-500' : ''} ${textDrag.isEditMode ? 'border-2 border-green-500 p-4' : ''}`}
            style={{
              transform: `translate(${textDrag.transform.translateX}px, ${textDrag.transform.translateY}px)`,
              transition: textDrag.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: textDrag.isDragging ? 'grabbing' : textDrag.isEditMode ? 'grab' : editMode ? 'grab' : 'default',
              zIndex: textDrag.isEditMode ? 50 : 'auto',
            }}
            onMouseDown={editMode && !textDrag.isEditMode ? (e) => {
              e.preventDefault();
              textDrag.setIsEditMode(true);
              // Small delay to ensure edit mode is set before drag starts
              setTimeout(() => textDrag.handleDragStart(e as any), 0);
            } : undefined}
          >
            {/* Drag indicator when not in active edit mode */}
            {editMode && !textDrag.isEditMode && (
              <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                Drag to move
              </div>
            )}

            {textDrag.isEditMode && editMode && (
              <>
                <div className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none animate-pulse" />
                <div
                  className="absolute inset-0 cursor-move"
                  onMouseDown={textDrag.handleDragStart}
                />
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 z-[100]">
                  <Button size="sm" variant="outline" onClick={textDrag.reset} disabled={textDrag.isSaving}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={textDrag.cancel} disabled={textDrag.isSaving}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={textDrag.save} disabled={textDrag.isSaving} className="bg-green-500 hover:bg-green-600">
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {textDrag.isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </>
            )}
            
            <EditableText id="name" value={profile.name} onChange={v => setProfile({
              ...profile,
              name: v
            })} className="text-2xl font-bold tracking-tight" styleConfig={styles.name} setStyleConfig={s => setStyle("name", s)} editMode={editMode} draggable />
            <EditableText id="role" value={profile.role} onChange={v => setProfile({
              ...profile,
              role: v
            })} className="text-sm text-neutral-600" styleConfig={styles.role} setStyleConfig={s => setStyle("role", s)} editMode={editMode} draggable />
            <EditableText id="quick" value={profile.quick} onChange={v => setProfile({
              ...profile,
              quick: v
            })} className="pt-2 text-sm leading-relaxed text-neutral-700 whitespace-pre-line" styleConfig={styles.quick} setStyleConfig={s => setStyle("quick", s)} editMode={editMode} draggable />

            {/* Socials stay non-editable except via Settings */}
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map((s, i) => <SocialIcon key={i} href={s.url} label={s.label} icon={s.icon} />)}
            </div>
          </div>
        </motion.section>

        {/* MIDDLE: Top buttons remain; labels editable on hover; content below is editable and draggable */}
        <motion.section initial={{
          opacity: 0,
          y: layout.enableAnimations ? 12 : 0
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.05
        }} className="col-span-1">
          <Tabs defaultValue="home" className="w-full mx-[80px] px-0">
            <TabsList className="mb-5 flex flex-wrap gap-3 bg-transparent p-0">
              {sections.home && <TabsTrigger value="home" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/10 data-[state=active]:to-gray-800/10 data-[state=active]:border data-[state=active]:border-red-200">
                  <EditableText id="nav-home" value={navLabels.home} onChange={v => setNavLabels({
                  ...navLabels,
                  home: v
                })} editMode={editMode} styleConfig={styles["nav-home"]} setStyleConfig={s => setStyle("nav-home", s)} />
                </TabsTrigger>}
              {sections.skills && <TabsTrigger value="skills" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/10 data-[state=active]:to-gray-800/10 data-[state=active]:border data-[state=active]:border-red-200">
                  <EditableText id="nav-skills" value={navLabels.skills} onChange={v => setNavLabels({
                  ...navLabels,
                  skills: v
                })} editMode={editMode} styleConfig={styles["nav-skills"]} setStyleConfig={s => setStyle("nav-skills", s)} />
                </TabsTrigger>}
              {sections.portfolio && <TabsTrigger value="portfolio" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/10 data-[state=active]:to-gray-800/10 data-[state=active]:border data-[state=active]:border-red-200">
                  <EditableText id="nav-portfolio" value={navLabels.portfolio} onChange={v => setNavLabels({
                  ...navLabels,
                  portfolio: v
                })} editMode={editMode} styleConfig={styles["nav-portfolio"]} setStyleConfig={s => setStyle("nav-portfolio", s)} />
                </TabsTrigger>}
              {sections.blogs && <TabsTrigger value="blogs" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/10 data-[state=active]:to-gray-800/10 data-[state=active]:border data-[state=active]:border-red-200">
                  <EditableText id="nav-blogs" value={navLabels.blogs} onChange={v => setNavLabels({
                  ...navLabels,
                  blogs: v
                })} editMode={editMode} styleConfig={styles["nav-blogs"]} setStyleConfig={s => setStyle("nav-blogs", s)} />
                </TabsTrigger>}
              {sections.contact && <TabsTrigger value="contact" className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/10 data-[state=active]:to-gray-800/10 data-[state=active]:border data-[state=active]:border-red-200">
                  <EditableText id="nav-contact" value={navLabels.contact} onChange={v => setNavLabels({
                  ...navLabels,
                  contact: v
                })} editMode={editMode} styleConfig={styles["nav-contact"]} setStyleConfig={s => setStyle("nav-contact", s)} />
                </TabsTrigger>}
            </TabsList>

            {/* HOME */}
            {sections.home && <TabsContent value="home" className="space-y-8">
                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="about-title" value="About me" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["about-title"]} setStyleConfig={s => setStyle("about-title", s)} editMode={editMode} />
                  <EditableText id="about-body" value={profile.entry} onChange={v => setProfile({
                  ...profile,
                  entry: v
                })} className="mt-2 text-[15px] leading-relaxed" styleConfig={styles["about-body"]} setStyleConfig={s => setStyle("about-body", s)} editMode={editMode} />
                </motion.div>

                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="highlights-title" value="Highlights" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["highlights-title"]} setStyleConfig={s => setStyle("highlights-title", s)} editMode={editMode} />
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {["Founder mindset with hands-on product execution", "Supabase, Wasabi (S3), React/Next.js, Tailwind, shadcn/ui", "Auth flows, MFA, admin dashboards, and real-time tooling"].map((item, idx) => <li key={idx}>
                        <EditableText id={`highlight-${idx}`} value={item} onChange={() => {}} editMode={editMode} styleConfig={styles[`highlight-${idx}`]} setStyleConfig={s => setStyle(`highlight-${idx}`, s)} />
                      </li>)}
                  </ul>
                </motion.div>
              </TabsContent>}

            {/* SKILLS */}
            {sections.skills && <TabsContent value="skills" className="space-y-8">
                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="skills-title" value="Core skills" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["skills-title"]} setStyleConfig={s => setStyle("skills-title", s)} editMode={editMode} />
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {["Product Thinking", "React / Next.js / Vite", "Tailwind / shadcn/ui", "Supabase & RLS", "Wasabi S3 + CORS", "Edge Functions", "Authentication & MFA", "Admin Dashboards"].map((s, i) => <EditableText key={i} id={`skill-${i}`} value={s} onChange={() => {}} className="rounded-xl bg-[var(--accent-10)] px-3 py-2 text-[13px]" styleConfig={styles[`skill-${i}`]} setStyleConfig={st => setStyle(`skill-${i}`, st)} editMode={editMode} draggable />)}
                  </div>
                </motion.div>

                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="learning-title" value="Currently learning" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["learning-title"]} setStyleConfig={s => setStyle("learning-title", s)} editMode={editMode} />
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {["Threat Modeling", "Pen Testing Basics", "Secure SDLC"].map((s, i) => <EditableText key={i} id={`learning-${i}`} value={s} onChange={() => {}} className="rounded-xl bg-neutral-50 px-3 py-2 text-[13px]" styleConfig={styles[`learning-${i}`]} setStyleConfig={st => setStyle(`learning-${i}`, st)} editMode={editMode} draggable />)}
                  </div>
                </motion.div>
              </TabsContent>}

            {/* PORTFOLIO */}
            {sections.portfolio && <TabsContent value="portfolio" className="space-y-8" id="portfolio">
                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="portfolio-title" value="Featured work" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["portfolio-title"]} setStyleConfig={s => setStyle("portfolio-title", s)} editMode={editMode} />
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    {["Shqipet Admin Settings", "Notification System", "Marketplace Cards", "Luna AI Assistant"].map((t, i) => <motion.div key={i} drag={editMode} dragMomentum={false} className="group relative overflow-hidden rounded-2xl bg-white p-3">
                        <EditableText id={`pf-${i}-title`} value={t} onChange={() => {}} className="text-[15px] font-semibold" styleConfig={styles[`pf-${i}-title`]} setStyleConfig={s => setStyle(`pf-${i}-title`, s)} editMode={editMode} />
                        <EditableText id={`pf-${i}-desc`} value={"Project description"} onChange={() => {}} className="mt-1 text-sm text-neutral-600" styleConfig={styles[`pf-${i}-desc`]} setStyleConfig={s => setStyle(`pf-${i}-desc`, s)} editMode={editMode} />
                      </motion.div>)}
                  </div>
                </motion.div>
              </TabsContent>}

            {/* BLOGS */}
            {sections.blogs && <TabsContent value="blogs" className="space-y-8">
                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="blogs-title" value="Latest posts" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["blogs-title"]} setStyleConfig={s => setStyle("blogs-title", s)} editMode={editMode} />
                  <div className="mt-3 space-y-3 text-[15px]">
                    {["Designing calm interfaces", "Auth flows that feel humane", "My Supabase & Wasabi tips"].map((t, i) => <motion.div key={i} drag={editMode} dragMomentum={false} className="flex items-center justify-between rounded-xl bg-white p-3">
                        <EditableText id={`blog-${i}`} value={t} onChange={() => {}} editMode={editMode} styleConfig={styles[`blog-${i}`]} setStyleConfig={s => setStyle(`blog-${i}`, s)} />
                        <Button variant="ghost" className="gap-1 px-2 text-[13px]">
                          Read <ArrowRight className="h-4 w-4" />
                        </Button>
                      </motion.div>)}
                  </div>
                </motion.div>
              </TabsContent>}

            {/* CONTACT */}
            {sections.contact && <TabsContent value="contact" className="space-y-8" id="contact">
                <motion.div drag={editMode} dragMomentum={false} className={`relative ${editMode ? 'border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-move hover:border-blue-500' : ''}`}>
                  {editMode && (
                    <div className="absolute -top-3 left-2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                      Drag to move
                    </div>
                  )}
                  <EditableText id="contact-title" value="Get in touch" onChange={() => {}} className="text-lg font-semibold tracking-tight" styleConfig={styles["contact-title"]} setStyleConfig={s => setStyle("contact-title", s)} editMode={editMode} />
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="Your name" />
                      <Label className="mt-2">Email</Label>
                      <Input type="email" placeholder="your@email.com" />
                      <Label className="mt-2">Message</Label>
                      <Textarea placeholder="Say hello…" rows={6} />
                      <Button className="mt-2">Send message</Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {profile.email}</div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {profile.phone}</div>
                      <a className="inline-flex items-center gap-1 underline" href={profile.website} target="_blank" rel="noreferrer">
                        Visit website <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>}
          </Tabs>
        </motion.section>

        {/* RIGHT: CV only */}
        <motion.aside initial={{
          opacity: 0,
          y: layout.enableAnimations ? 12 : 0
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.1
        }} className="col-span-1" style={{
          display: layout.showRightSidebar ? undefined : "none"
        }}>
          <div className="sticky top-24 space-y-3">
            <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="block">
              <Button className="w-full gap-2"><FileText className="h-4 w-4" /> Open CV</Button>
            </a>
            <p className="text-xs text-neutral-500">Opens in a new tab/window.</p>
          </div>
        </motion.aside>
      </main>

      {/* Floating Hire Button - Bottom Right */}
      {hireButton.enabled && !editMode && <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        duration: 0.4,
        delay: 0.3
      }} className="fixed bottom-8 right-8 z-50">
          <Button size="lg" onClick={() => {
          if (hireButton.url) {
            window.open(hireButton.url, '_blank');
          } else if (hireButton.email) {
            window.location.href = `mailto:${hireButton.email}`;
          }
        }} className="gap-2 shadow-xl bg-gradient-to-r from-[#2AA1FF] to-[#1E88E5] hover:from-[#1E88E5] hover:to-[#1565C0] text-white" style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}dd)`
        }}>
            <Briefcase className="h-5 w-5" />
            {hireButton.text}
          </Button>
        </motion.div>}
    </div>
    </>;
}

// ===== Photo strip (left, subtle) =====
function PhotoStrip({
  avatarUrl,
  accent,
  height = 420,
  userId,
  editMode = false,
  onPhotoUpdate
}: {
  avatarUrl: string;
  accent: string;
  height?: number;
  userId?: string;
  editMode?: boolean;
  onPhotoUpdate?: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // Show local preview instantly
      const localPreview = URL.createObjectURL(file);
      if (onPhotoUpdate) {
        onPhotoUpdate(localPreview);
      }
      setUploadProgress(15);
      console.log('📤 Uploading professional photo...', {
        fileName: file.name,
        fileSize: file.size
      });

      // Upload to Wasabi
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', 'professional-presentation-avatar');
      formData.append('userId', userId);
      setUploadProgress(30);
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      setUploadProgress(40);
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/wasabi-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Upload response error:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }
      setUploadProgress(60);
      const result = await response.json();
      console.log('✅ Upload successful:', result);
      const key = result.key || result.url;
      if (!key) {
        throw new Error('Upload did not return a file key');
      }
      setUploadProgress(75);
      // Update professional_presentations table with the new avatar key
      const {
        data: upserted,
        error: updateError
      } = await supabase.from('professional_presentations').upsert({
        user_id: userId,
        avatar_url: key,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      }).select('updated_at, avatar_url').single();
      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw updateError;
      }

      // CRITICAL: Clear cache and force fresh URL resolution for instant sync
      try {
        mediaService.clearCache?.(key);
        mediaService.clearAllCaches?.();
      } catch {}
      const freshUrl = await mediaService.getProxyBlob(key);
      const timestamp = Date.now();
      const versionedUrl = freshUrl + (freshUrl.includes('?') ? '&' : '?') + 't=' + timestamp;

      // Preload and apply immediately
      await mediaService.preloadImage(versionedUrl);
      onPhotoUpdate?.(versionedUrl);

      // Store in localStorage for instant display on refresh
      try {
        localStorage.setItem('pp:last:avatar_url', versionedUrl);
        localStorage.setItem('pp:avatar_meta', JSON.stringify({
          url: versionedUrl,
          rev: upserted?.updated_at || new Date().toISOString(),
          userId
        }));
      } catch {}
      setUploadProgress(85);
      console.log('✅ Database updated with key:', key);
      toast.success('Professional photo updated successfully');
      const rev = (upserted as any)?.updated_at || Date.now().toString();
      try {
        mediaService.clearCache?.(key);
      } catch {}
      try {
        const fresh = await mediaService.getUrl(key);
        const versioned = fresh + (fresh.includes('?') ? '&' : '?') + 'rev=' + encodeURIComponent(rev);
        await mediaService.preloadImage(versioned);
        setUploadProgress(95);
        // Apply final resolved URL immediately
        if (onPhotoUpdate) onPhotoUpdate(versioned);
        try {
          localStorage.setItem('pp:last:avatar_url', versioned);
          localStorage.setItem('pp:avatar_meta', JSON.stringify({
            url: versioned,
            rev,
            userId
          }));
        } catch {}
      } catch (e) {
        console.warn('⚠️ Failed to resolve fresh avatar after upload', e);
      }
      setUploadProgress(100);
    } catch (error) {
      console.error('❌ Professional photo upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update professional photo');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Flicker-free image loading with version dedupe
  const [displayUrl, setDisplayUrl] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('pp:avatar_meta');
      if (raw) {
        const meta = JSON.parse(raw);
        if (meta?.url && (!userId || meta.userId === userId)) {
          return String(meta.url);
        }
      }
    } catch {}
    return resolveMediaUrl(avatarUrl);
  });
  const imgRequestIdRef = useRef(0);
  useEffect(() => {
    const next = resolveMediaUrl(avatarUrl);
    if (!next || next === displayUrl) return;
    const requestId = ++imgRequestIdRef.current;

    // Preload off-DOM, only swap src after fully loaded
    const img = new Image();
    img.onload = () => {
      if (imgRequestIdRef.current === requestId) {
        setDisplayUrl(next);
      }
    };
    img.onerror = () => {
      console.warn('⚠️ Preload failed, keeping last good image', {
        next
      });
    };
    img.src = next;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl]);
  // Photo editor hook
  const photoEditor = usePhotoEditor({
    userId,
    onSave: (transform) => {
      console.log('Photo transform saved:', transform);
    }
  });

  return <div className="relative group">
      <div 
        className={`relative w-full ${photoEditor.isEditMode ? 'overflow-visible z-[60]' : 'overflow-hidden'} rounded-xl border border-neutral-200 bg-white`}
        style={{
          height,
          transform: `translate(${photoEditor.transform.translateX}px, ${photoEditor.transform.translateY}px) scale(${photoEditor.transform.scaleX}, ${photoEditor.transform.scaleY})`,
          transition: (photoEditor.isLoading || photoEditor.isDragging || photoEditor.isResizing) ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: photoEditor.isDragging ? 'grabbing' : photoEditor.isEditMode ? 'grab' : 'default',
          opacity: photoEditor.isLoading && !photoEditor.hadCache ? 0 : 1,
          willChange: 'transform',
        }}
      >
        {displayUrl ? <UploadAnimation isUploading={isUploading} progress={uploadProgress} type="avatar">
            <img 
              src={displayUrl} 
              alt="Professional Profile" 
              className="h-full w-full object-cover animate-fade-in select-none"
              draggable={false}
            />
          </UploadAnimation> : <div className="h-full w-full">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_12px,#e5e7eb_12px,#e5e7eb_24px)]" />
          </div>}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
        
        {/* Photo Editor Controls */}
        {editMode && (
          <PhotoEditor
            isEditMode={photoEditor.isEditMode}
            isDragging={photoEditor.isDragging}
            isResizing={photoEditor.isResizing}
            isSaving={photoEditor.isSaving}
            scaleX={photoEditor.transform.scaleX}
            scaleY={photoEditor.transform.scaleY}
            onEditToggle={() => photoEditor.setIsEditMode(!photoEditor.isEditMode)}
            onDragStart={photoEditor.handleDragStart}
            onResizeStart={photoEditor.handleResizeStart}
            onSave={photoEditor.saveTransform}
            onReset={photoEditor.resetTransform}
            onCancel={photoEditor.cancelEdit}
          />
        )}

        {/* Camera button - only show when NOT in photo edit mode */}
        {editMode && !photoEditor.isEditMode && (
          <div className="absolute bottom-4 right-4 transition-opacity duration-200">
            <Button size="sm" variant="secondary" onClick={triggerUpload} disabled={isUploading} className="bg-white/90 text-black hover:bg-white shadow-lg">
              <Camera className="w-4 h-4 mr-1" />
              {isUploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
    </div>;
}

// ===== Minor helpers =====
function SettingsDialog({
  profile,
  setProfile,
  socials,
  setSocials,
  sections,
  setSections,
  accent,
  setAccent,
  layout,
  setLayout,
  seo,
  setSeo,
  hireButton,
  setHireButton
}: any) {
  function updateSocial(i: number, key: "label" | "url" | "icon", value: string) {
    const copy = socials.slice();
    (copy[i] as any)[key] = value;
    setSocials(copy);
  }
  function addSocial() {
    setSocials([...socials, {
      label: "New link",
      url: "https://",
      icon: "website"
    }]);
  }
  function removeSocial(i: number) {
    setSocials(socials.filter((_, idx) => idx !== i));
  }
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2"><Settings className="h-4 w-4" /> Settings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Page settings</DialogTitle></DialogHeader>
        <Tabs defaultValue="profile">
          <TabsList className="mb-4 grid grid-cols-7">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="links">Social links</TabsTrigger>
            <TabsTrigger value="hire">Hire Button</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={profile.name} onChange={e => setProfile({
                ...profile,
                name: e.target.value
              })} />
                <Label className="mt-2">Role / headline</Label>
                <Input value={profile.role} onChange={e => setProfile({
                ...profile,
                role: e.target.value
              })} />
                <Label className="mt-2">Entry text (Home)</Label>
                <Textarea rows={4} value={profile.entry} onChange={e => setProfile({
                ...profile,
                entry: e.target.value
              })} />
                <Label className="mt-2">Quick intro (under photo)</Label>
                <Textarea rows={3} value={profile.quick} onChange={e => setProfile({
                ...profile,
                quick: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Avatar image URL</Label>
                <Input placeholder="https://…" value={profile.avatarUrl} onChange={e => setProfile({
                ...profile,
                avatarUrl: e.target.value
              })} />
                <Label className="mt-2">Email</Label>
                <Input value={profile.email} onChange={e => setProfile({
                ...profile,
                email: e.target.value
              })} />
                <Label className="mt-2">Phone</Label>
                <Input value={profile.phone} onChange={e => setProfile({
                ...profile,
                phone: e.target.value
              })} />
                <Label className="mt-2">Website</Label>
                <Input value={profile.website} onChange={e => setProfile({
                ...profile,
                website: e.target.value
              })} />
                <Label className="mt-2">CV URL</Label>
                <Input value={profile.cvUrl} onChange={e => setProfile({
                ...profile,
                cvUrl: e.target.value
              })} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-3">
            {[["Home", "home"], ["Skills", "skills"], ["Portfolio", "portfolio"], ["Blogs", "blogs"], ["Contact", "contact"]].map(([label, key]: any) => <div key={key} className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                <div className="text-sm font-medium">{label}</div>
                <Switch checked={(sections as any)[key]} onCheckedChange={v => setSections({
              ...sections,
              [key]: v
            })} />
              </div>)}
          </TabsContent>

          <TabsContent value="links" className="space-y-3">
            <div className="rounded-xl bg-neutral-50 p-3">
              <div className="mb-2 text-sm font-medium">Add any social/profile link</div>
              {socials.map((s: any, i: number) => <div key={i} className="mb-3 grid grid-cols-[140px_1fr_140px_auto] items-center gap-2">
                  <Input value={s.label} onChange={e => updateSocial(i, "label", e.target.value)} placeholder="Label (e.g. LinkedIn)" />
                  <Input value={s.url} onChange={e => updateSocial(i, "url", e.target.value)} placeholder="https://…" />
                  <Input value={s.icon || "website"} onChange={e => updateSocial(i, "icon", e.target.value)} placeholder="icon (linkedin/github/…)" />
                  <Button variant="ghost" onClick={() => removeSocial(i)}>Remove</Button>
                </div>)}
              <Button variant="outline" onClick={addSocial}>+ Add new link</Button>
              <p className="mt-2 text-xs text-neutral-500">Supported icons: linkedin, github, facebook, instagram, website.</p>
            </div>
          </TabsContent>

          <TabsContent value="hire" className="space-y-4">
            <div className="rounded-xl bg-neutral-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-medium">Enable Hire Button</div>
                <Switch checked={hireButton.enabled} onCheckedChange={v => setHireButton({
                ...hireButton,
                enabled: v
              })} />
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label>Button Text</Label>
                  <Input value={hireButton.text} onChange={e => setHireButton({
                  ...hireButton,
                  text: e.target.value
                })} placeholder="Hire Me" />
                </div>
                
                <div>
                  <Label>Button URL (optional)</Label>
                  <Input value={hireButton.url} onChange={e => setHireButton({
                  ...hireButton,
                  url: e.target.value
                })} placeholder="https://your-booking-page.com" />
                  <p className="mt-1 text-xs text-neutral-500">If set, clicking the button opens this URL</p>
                </div>
                
                <div>
                  <Label>Email Address (optional)</Label>
                  <Input value={hireButton.email} onChange={e => setHireButton({
                  ...hireButton,
                  email: e.target.value
                })} placeholder="your.email@example.com" />
                  <p className="mt-1 text-xs text-neutral-500">If URL is not set, clicking opens email client</p>
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
                  <strong>Note:</strong> The hire button will appear at the bottom right of the page. 
                  It's hidden when in edit mode.
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Accent color (HEX)</Label>
                <Input value={accent} onChange={e => setAccent(e.target.value)} placeholder="#2AA1FF" />
                <div className="text-xs text-neutral-500">White-first theme; accent is subtle.</div>
              </div>
              <div className="rounded-xl bg-neutral-50 p-4">
                <div className="mb-2 text-sm font-medium">Preview</div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl" style={{
                  background: "var(--accent)"
                }} />
                  <div className="h-9 w-9 rounded-xl" style={{
                  background: "var(--accent-20)"
                }} />
                  <div className="h-9 w-9 rounded-xl" style={{
                  background: "var(--accent-10)"
                }} />
                  <div className="h-9 w-9 rounded-xl bg-white" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Left column width (CSS fr)</Label>
                <Input value={layout.leftColFraction} onChange={e => setLayout({
                ...layout,
                leftColFraction: e.target.value
              })} />
                <Label>Middle column width (CSS fr)</Label>
                <Input value={layout.middleColFraction} onChange={e => setLayout({
                ...layout,
                middleColFraction: e.target.value
              })} />
                <Label>Right column width (CSS fr)</Label>
                <Input value={layout.rightColFraction} onChange={e => setLayout({
                ...layout,
                rightColFraction: e.target.value
              })} />
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 mt-2">
                  <div className="text-sm">Enable animations</div>
                  <Switch checked={layout.enableAnimations} onCheckedChange={v => setLayout({
                  ...layout,
                  enableAnimations: v
                })} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                  <div className="text-sm">Show right sidebar</div>
                  <Switch checked={layout.showRightSidebar} onCheckedChange={v => setLayout({
                  ...layout,
                  showRightSidebar: v
                })} />
                </div>
                <div className="rounded-xl bg-neutral-50 p-3">
                  <Label>Noise strength (0–0.2)</Label>
                  <Input value={String(layout.noiseOpacity)} onChange={e => setLayout({
                  ...layout,
                  noiseOpacity: Number(e.target.value || 0)
                })} placeholder="0.06" />
                </div>
                <div className="rounded-xl bg-neutral-50 p-3">
                  <Label>Photo height (px)</Label>
                  <Input value={String(layout.photoHeight)} onChange={e => setLayout({
                  ...layout,
                  photoHeight: Number(e.target.value || 0)
                })} placeholder="220" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page title</Label>
                <Input value={seo.pageTitle} onChange={e => setSeo({
                ...seo,
                pageTitle: e.target.value
              })} />
                <Label className="mt-2">Description</Label>
                <Textarea rows={3} value={seo.description} onChange={e => setSeo({
                ...seo,
                description: e.target.value
              })} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
                  <div className="text-sm">Open in new window</div>
                  <Switch checked={seo.openInNewWindow} onCheckedChange={v => setSeo({
                  ...seo,
                  openInNewWindow: v
                })} />
                </div>
                <p className="text-xs text-neutral-500">Optimized for separate profile window.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}

// ===== Simple tag visual used in Skills (still editable via wrapper) =====
function SkillTag({
  label,
  subtle = false
}: {
  label: string;
  subtle?: boolean;
}) {
  return <span className={"inline-flex items-center justify-center rounded-xl px-3 py-2 " + (subtle ? "bg-neutral-50" : "bg-[var(--accent-10)]")}>
      <span className="text-[13px] font-medium">{label}</span>
    </span>;
}