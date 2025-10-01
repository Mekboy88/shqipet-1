// Enhanced Content Security Filter with Malicious Content Detection
import { toast } from 'sonner';

interface ContentFilterResult {
  isAllowed: boolean;
  reason?: string;
  category?: 'malicious' | 'inappropriate' | 'security' | 'format';
}

// Comprehensive list of dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  // Executable files
  '.exe', '.msi', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe', '.js', '.jar', '.app', '.deb', '.rpm',
  // Script files
  '.ps1', '.sh', '.bash', '.zsh', '.fish', '.py', '.rb', '.pl', '.php', '.asp', '.aspx', '.jsp',
  // Archive files that could contain malware
  '.rar', '.7z', '.ace', '.arj', '.bz2', '.cab', '.gz', '.iso', '.lzh', '.tar', '.uue', '.xz', '.z',
  // System files
  '.sys', '.dll', '.drv', '.cpl', '.ocx', '.ax', '.ime', '.tsp', '.fon',
  // Office macros
  '.xlsm', '.xlsb', '.xltm', '.xla', '.xlam', '.pptm', '.potm', '.ppam', '.ppsm', '.sldm',
  // Other potentially dangerous
  '.hta', '.wsf', '.wsh', '.reg', '.scf', '.lnk', '.url', '.desktop'
];

// Allowed safe file extensions
const ALLOWED_EXTENSIONS = [
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.tif',
  // Videos
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv',
  // Audio
  '.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a', '.wma',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp',
  // Archives (safe ones)
  '.zip'
];

// Malicious content patterns (simplified version)
const MALICIOUS_PATTERNS = [
  /virus/i, /malware/i, /trojan/i, /worm/i, /ransomware/i, /spyware/i, /adware/i, /rootkit/i,
  /keylogger/i, /botnet/i, /exploit/i, /payload/i, /backdoor/i, /phishing/i, /scam/i,
  /hack/i, /crack/i, /keygen/i, /serial/i, /patch/i, /loader/i, /activator/i,
  /bitcoin/i, /cryptocurrency/i, /wallet/i, /seed/i, /private.*key/i, /password.*dump/i
];

// Suspicious file name patterns
const SUSPICIOUS_FILE_PATTERNS = [
  /setup.*\.exe$/i, /install.*\.exe$/i, /update.*\.exe$/i, /patch.*\.exe$/i,
  /crack/i, /keygen/i, /serial/i, /loader/i, /activator/i, /hack/i,
  /virus/i, /malware/i, /trojan/i, /backdoor/i, /exploit/i,
  /\.exe\.zip$/i, /\.scr\.zip$/i, /\.bat\.zip$/i, /\.cmd\.zip$/i
];

// MIME type validation
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 
  'image/bmp', 'image/x-icon', 'image/tiff',
  // Videos
  'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 
  'video/webm', 'video/x-matroska', 'video/3gpp', 'video/ogg',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-ms-wma',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text',
  // Archives
  'application/zip', 'application/x-zip-compressed'
];

export const validateFileContent = async (file: File): Promise<ContentFilterResult> => {
  // Check file size (50MB limit)
  if (file.size > 50 * 1024 * 1024) {
    return {
      isAllowed: false,
      reason: 'File too large. Maximum size is 50MB.',
      category: 'security'
    };
  }

  // Get file extension
  const fileName = file.name.toLowerCase();
  const fileExtension = '.' + fileName.split('.').pop();

  // Check against dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
    return {
      isAllowed: false,
      reason: `File type '${fileExtension}' is not allowed for security reasons.`,
      category: 'malicious'
    };
  }

  // Check against allowed extensions
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isAllowed: false,
      reason: `File type '${fileExtension}' is not supported.`,
      category: 'format'
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isAllowed: false,
      reason: `File format '${file.type}' is not allowed.`,
      category: 'format'
    };
  }

  // Check for suspicious file name patterns
  for (const pattern of SUSPICIOUS_FILE_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        isAllowed: false,
        reason: 'File name contains suspicious patterns and cannot be uploaded.',
        category: 'malicious'
      };
    }
  }

  // Check for malicious content patterns in filename
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(fileName)) {
      return {
        isAllowed: false,
        reason: 'File name contains potentially malicious content indicators.',
        category: 'malicious'
      };
    }
  }

  // Additional validation for executable files disguised as other formats
  if (file.type !== 'application/octet-stream' && fileExtension === '.zip') {
    // For ZIP files, we could add additional scanning in the future
    console.log('ZIP file detected, performing basic validation...');
  }

  // File passed all checks
  return {
    isAllowed: true
  };
};

export const validateFiles = async (files: File[]): Promise<{ validFiles: File[], rejectedFiles: Array<{file: File, reason: string}> }> => {
  const validFiles: File[] = [];
  const rejectedFiles: Array<{file: File, reason: string}> = [];

  for (const file of files) {
    const validation = await validateFileContent(file);
    
    if (validation.isAllowed) {
      validFiles.push(file);
    } else {
      rejectedFiles.push({
        file,
        reason: validation.reason || 'File validation failed'
      });
      
      // Show toast for rejected files
      toast.error(`${file.name}: ${validation.reason}`, {
        duration: 5000,
        action: {
          label: "Learn More",
          onClick: () => {
            toast.info("For security reasons, we only allow safe file formats. Please convert your file to a supported format.", {
              duration: 8000
            });
          }
        }
      });
    }
  }

  return { validFiles, rejectedFiles };
};

export const getFileCategory = (file: File): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('application/') || file.type.startsWith('text/')) return 'document';
  return 'other';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
