/**
 * DeviceSessionService.ts
 * FINAL — StableID via localStorage
 */

import { supabase } from "@/lib/supabaseClient";

// KEY for storing stable device ID
const STABLE_ID_KEY = "shqipet_device_stable_id";

// ------------------------------
// 1. Stable ID (Final Solution)
// ------------------------------
function getStableDeviceId(): string {
  let id = localStorage.getItem(STABLE_ID_KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STABLE_ID_KEY, id);
  }

  return id;
}

// ------------------------------
// 2. Generate Fingerprint (for uniqueness)
// ------------------------------
async function generateFingerprint(): Promise<string> {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ------------------------------
// 3. Device Type Detection
// ------------------------------
function detectDeviceType(): "mobile" | "tablet" | "laptop" | "desktop" {
  const ua = navigator.userAgent.toLowerCase();
  const width = screen.width;

  // True tablet detection first
  if (ua.includes("ipad") || (width >= 768 && ua.includes("mobile"))) {
    return "tablet";
  }

  // Phones
  if (ua.includes("iphone") || ua.includes("android") || ua.includes("mobile")) {
    return "mobile";
  }

  // Laptop vs Desktop
  if (width < 1280) return "laptop";
  return "desktop";
}

// ------------------------------
// 4. OS Detection
// ------------------------------
function detectOperatingSystem(): string {
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Win/.test(ua)) return "Windows";
  if (/Mac/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";

  return "Unknown";
}

// ------------------------------
// 5. Browser Detection
// ------------------------------
function detectBrowser(): string {
  const ua = navigator.userAgent;

  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";

  return "Unknown";
}

// ------------------------------
// 6. MAIN SERVICE
// ------------------------------
export const DeviceSessionService = {
  // Register session on login or startup
  async registerSession(userId: string) {
    const stableId = getStableDeviceId();
    const fingerprint = await generateFingerprint();

    const deviceType = detectDeviceType();
    const os = detectOperatingSystem();
    const browser = detectBrowser();
    const resolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Check if session exists
    const { data: existing } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("device_stable_id", stableId)
      .single();

    const now = new Date().toISOString();

    const payload = {
      user_id: userId,
      device_stable_id: stableId,
      device_fingerprint: fingerprint,
      device_type: deviceType,
      operating_system: os,
      browser_info: browser,
      platform_type:
        os.toLowerCase().includes("ios") || os.toLowerCase().includes("android") ? os.toLowerCase() : "web",
      screen_resolution: resolution,
      timezone,
      last_activity: now,
      is_active: true,
      session_status: "active",
    };

    if (existing) {
      // Update existing session
      await supabase.from("user_sessions").update(payload).eq("id", existing.id);
    } else {
      // Create new session
      await supabase.from("user_sessions").insert(payload);
    }

    console.log("📱 Device Session Saved:", payload);
  },

  // Logout device
  async logoutDevice(sessionId: string) {
    await supabase.from("user_sessions").update({ is_active: false, session_status: "logged_out" }).eq("id", sessionId);
  },

  // Logout all except current
  async logoutAllOther(userId: string) {
    const stableId = getStableDeviceId();

    await supabase
      .from("user_sessions")
      .update({ is_active: false, session_status: "logged_out" })
      .eq("user_id", userId)
      .neq("device_stable_id", stableId);
  },
};
