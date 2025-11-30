import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileCode, Folder, Github, AlertCircle, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Complete list of all UI page files in the application
const pageFiles = [
  // Main Pages
  { name: 'Index (Home/Feed)', path: 'src/pages/Index.tsx', category: 'Main' },
  { name: 'Reels', path: 'src/pages/Reels.tsx', category: 'Main' },
  { name: 'Watch (Videos)', path: 'src/pages/Watch.tsx', category: 'Main' },
  { name: 'Profile', path: 'src/pages/Profile.tsx', category: 'Main' },
  { name: 'Profile Settings', path: 'src/pages/ProfileSettings.tsx', category: 'Main' },
  { name: 'Photos', path: 'src/pages/Photos.tsx', category: 'Main' },
  { name: 'Photo Gallery', path: 'src/pages/PhotoGallery.tsx', category: 'Main' },
  { name: 'Location Preferences', path: 'src/pages/LocationPreferences.tsx', category: 'Main' },
  { name: 'Professional Presentation', path: 'src/pages/ProfessionalPresentation.tsx', category: 'Main' },
  { name: 'Marketplace', path: 'src/pages/Marketplace.tsx', category: 'Main' },
  { name: 'Marketplace Entrance', path: 'src/pages/MarketplaceEntrance.tsx', category: 'Main' },
  { name: 'Create Post Desktop', path: 'src/pages/CreatePostDesktop.tsx', category: 'Main' },
  
  // Auth Pages
  { name: 'Register', path: 'src/pages/Register.tsx', category: 'Auth' },
  { name: 'Login', path: 'src/pages/auth/Login.tsx', category: 'Auth' },
  { name: 'Verification', path: 'src/pages/auth/Verification.tsx', category: 'Auth' },
  { name: 'Auth Callback', path: 'src/pages/auth/AuthCallback.tsx', category: 'Auth' },
  
  // Admin Pages
  { name: 'Admin Login', path: 'src/pages/admin/AdminLogin.tsx', category: 'Admin' },
  { name: 'Admin Dashboard', path: 'src/pages/admin/AdminDashboard.tsx', category: 'Admin' },
  { name: 'Admin Overview', path: 'src/pages/admin/AdminOverview.tsx', category: 'Admin' },
  { name: 'Users Management', path: 'src/pages/admin/UsersManagement.tsx', category: 'Admin' },
  { name: 'System Requirements Status', path: 'src/pages/admin/SystemRequirementsStatusPage.tsx', category: 'Admin' },
  { name: 'OAuth Providers Config', path: 'src/pages/admin/integrations/OAuthProvidersConfig.tsx', category: 'Admin' },
  { name: 'ChatGPT Integration', path: 'src/pages/admin/integrations/ChatGPTIntegration.tsx', category: 'Admin' },
  { name: 'AI Analytics Dashboard', path: 'src/pages/admin/AIAnalyticsDashboard.tsx', category: 'Admin' },
  { name: 'Upload Monitoring', path: 'src/pages/AdminUploadMonitoring.tsx', category: 'Admin' },
  
  // Feature Pages
  { name: 'Albums', path: 'src/pages/Albums.tsx', category: 'Features' },
  { name: 'Dating', path: 'src/pages/Dating.tsx', category: 'Features' },
  { name: 'Hotels', path: 'src/pages/Hotels.tsx', category: 'Features' },
  { name: 'Restaurant', path: 'src/pages/Restaurant.tsx', category: 'Features' },
  { name: 'Takeout Food', path: 'src/pages/TakeoutFood.tsx', category: 'Features' },
  { name: 'Games', path: 'src/pages/Games.tsx', category: 'Features' },
  { name: 'Forum', path: 'src/pages/Forum.tsx', category: 'Features' },
  { name: 'Movies', path: 'src/pages/Movies.tsx', category: 'Features' },
  { name: 'Jobs', path: 'src/pages/Jobs.tsx', category: 'Features' },
  { name: 'Offers', path: 'src/pages/Offers.tsx', category: 'Features' },
  { name: 'Learn Together', path: 'src/pages/LearnTogether.tsx', category: 'Features' },
  { name: 'Discover Places', path: 'src/pages/DiscoverPlaces.tsx', category: 'Features' },
  { name: 'Proud of the Country', path: 'src/pages/ProudOfTheCountry.tsx', category: 'Features' },
  { name: 'Anonymous Report', path: 'src/pages/AnonymousReport.tsx', category: 'Features' },
  { name: 'Social Networks', path: 'src/pages/SocialNetworks.tsx', category: 'Features' },
  { name: 'Applications', path: 'src/pages/Applications.tsx', category: 'Features' },
  { name: 'Travel', path: 'src/pages/Travel.tsx', category: 'Features' },
  { name: 'Music', path: 'src/pages/Music.tsx', category: 'Features' },
  { name: 'Books', path: 'src/pages/Books.tsx', category: 'Features' },
  { name: 'Saved Posts', path: 'src/pages/SavedPosts.tsx', category: 'Features' },
  { name: 'Popular Posts', path: 'src/pages/PopularPosts.tsx', category: 'Features' },
  { name: 'Memories', path: 'src/pages/Memories.tsx', category: 'Features' },
  { name: 'How Are You', path: 'src/pages/HowAreYou.tsx', category: 'Features' },
  { name: 'My Groups', path: 'src/pages/MyGroups.tsx', category: 'Features' },
  { name: 'Messages', path: 'src/pages/Messages.tsx', category: 'Features' },
  { name: 'My Pages', path: 'src/pages/MyPages.tsx', category: 'Features' },
  { name: 'Blog', path: 'src/pages/Blog.tsx', category: 'Features' },
  { name: 'Shared Things', path: 'src/pages/SharedThings.tsx', category: 'Features' },
  { name: 'Fundraising', path: 'src/pages/Fundraising.tsx', category: 'Features' },
  { name: 'Find Friends', path: 'src/pages/FindFriends.tsx', category: 'Features' },
  { name: 'Information', path: 'src/pages/Information.tsx', category: 'Features' },
  { name: 'Directory', path: 'src/pages/Directory.tsx', category: 'Features' },
  { name: 'Events', path: 'src/pages/Events.tsx', category: 'Features' },
  { name: 'Tasks', path: 'src/pages/Tasks.tsx', category: 'Features' },
  
  // Other Pages
  { name: 'Terms of Use', path: 'src/pages/TermsOfUse.tsx', category: 'Other' },
  { name: 'Not Found (404)', path: 'src/pages/NotFound.tsx', category: 'Other' },
];

const UIExport: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', ...Array.from(new Set(pageFiles.map(f => f.category)))];
  
  const filteredFiles = selectedCategory === 'All' 
    ? pageFiles 
    : pageFiles.filter(f => f.category === selectedCategory);

  const downloadProjectManifest = () => {
    const manifest = {
      projectName: "Social Media Platform UI",
      exportDate: new Date().toISOString(),
      totalFiles: pageFiles.length,
      categories: categories.filter(c => c !== 'All'),
      files: pageFiles.map(file => ({
        name: file.name,
        path: file.path,
        category: file.category,
        fullPath: `/${file.path}`
      })),
      instructions: {
        howToGetCompleteCode: [
          "1. Enable Dev Mode in Lovable (toggle in top left)",
          "2. Use the file explorer to navigate to each file path listed above",
          "3. Copy the complete source code from each file",
          "OR",
          "1. Connect your project to GitHub (GitHub button in top right)",
          "2. Export the entire project to your GitHub repository",
          "3. Clone the repository to get all source code",
          "OR",
          "1. Go to Project Settings",
          "2. Use the 'Download Project' option to get a ZIP file with all code"
        ],
        fileStructure: {
          "src/pages/": "Main page components",
          "src/pages/auth/": "Authentication pages",
          "src/pages/admin/": "Admin dashboard pages",
          "src/components/": "Reusable UI components",
          "src/hooks/": "Custom React hooks",
          "src/utils/": "Utility functions",
          "src/integrations/": "Third-party integrations"
        }
      }
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-manifest-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadFileList = () => {
    const content = `
# Complete UI Files List
# Project: Social Media Platform
# Generated: ${new Date().toLocaleString()}
# Category Filter: ${selectedCategory}
# Total Files: ${filteredFiles.length}

==========================================
FILE LIST BY CATEGORY
==========================================

${categories.filter(c => c !== 'All').map(cat => {
  const catFiles = pageFiles.filter(f => f.category === cat);
  return `
## ${cat.toUpperCase()} (${catFiles.length} files)
${catFiles.map(file => `  - ${file.name}
    Path: ${file.path}
`).join('\n')}`;
}).join('\n')}

==========================================
HOW TO GET THE COMPLETE SOURCE CODE
==========================================

METHOD 1: Using Dev Mode (File by File)
  1. Click "Dev Mode" toggle in the top left of Lovable
  2. Browse to each file path listed above
  3. Copy the complete source code from each file
  4. Paste into your local files

METHOD 2: GitHub Export (Recommended)
  1. Click the GitHub button in the top right
  2. Connect your GitHub account
  3. Export the entire project
  4. Clone the repository to your local machine
  5. You'll have all source code including:
     - All page components
     - All UI components
     - All hooks and utilities
     - All configuration files
     - Complete project structure

METHOD 3: Download ZIP
  1. Go to Project Settings
  2. Look for "Download Project" or "Export" option
  3. Download the complete ZIP file
  4. Extract to get all source code

==========================================
PROJECT STRUCTURE
==========================================

src/
├── pages/           # All page components (${pageFiles.length} files)
│   ├── auth/        # Authentication pages
│   └── admin/       # Admin dashboard pages
├── components/      # Reusable UI components
│   ├── ui/          # Base UI components (buttons, cards, etc.)
│   └── shared/      # Shared complex components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── integrations/    # Backend integrations
└── contexts/        # React context providers

==========================================
NOTES
==========================================

- All files are TypeScript (.tsx)
- Project uses React 18, Vite, TailwindCSS
- Backend: Supabase (via Lovable Cloud)
- UI Library: shadcn/ui components
- Routing: React Router v6
- State Management: React Query + Context API

For complete functionality, you need:
- All page files listed above
- All component files in src/components/
- All configuration files (vite.config, tailwind.config)
- All integration files (Supabase client, types)
- All utility files and hooks
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui-files-list-${selectedCategory.toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Complete UI Export</h1>
          <p className="text-muted-foreground">
            Access all {pageFiles.length} UI page files from this project
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>To get the complete source code:</strong> Use GitHub Export (recommended), 
            enable Dev Mode to copy files individually, or download the project ZIP from settings. 
            The buttons below provide file lists and structure information.
          </AlertDescription>
        </Alert>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GitHub Export (Recommended)</CardTitle>
              <CardDescription>Get complete source code with full project structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                <Github className="w-4 h-4 mr-2" />
                Connect to GitHub
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Click the GitHub button in the top right of Lovable to export your entire project
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download File Manifests</CardTitle>
              <CardDescription>Get complete file lists and instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={downloadProjectManifest} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download JSON Manifest
              </Button>
              <Button onClick={downloadFileList} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Text File List
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              <Folder className="w-4 h-4 mr-2" />
              {cat} ({cat === 'All' ? pageFiles.length : pageFiles.filter(f => f.category === cat).length})
            </Button>
          ))}
        </div>

        {/* Files Grid */}
        <Card>
          <CardHeader>
            <CardTitle>UI Page Files ({filteredFiles.length})</CardTitle>
            <CardDescription>
              All page component files in this project - Enable Dev Mode to access source code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2">
                        <FileCode className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <CardTitle className="text-sm font-medium">{file.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {file.category}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs text-muted-foreground font-mono break-all block p-2 bg-muted rounded">
                        {file.path}
                      </code>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(file.path);
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Copy Path
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Get Complete Source Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Method 1: GitHub Export (Recommended)</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click the GitHub button in the top right of Lovable</li>
                <li>Connect your GitHub account if not already connected</li>
                <li>Export the entire project to your repository</li>
                <li>Clone the repository to get all source code</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Method 2: Dev Mode (Individual Files)</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Enable Dev Mode (toggle in top left of Lovable)</li>
                <li>Use the file explorer to navigate to each file path</li>
                <li>Copy the complete source code from each file</li>
                <li>Paste into your local project files</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Method 3: Download Project ZIP</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Project Settings in Lovable</li>
                <li>Look for "Download Project" or "Export" option</li>
                <li>Download the complete ZIP file</li>
                <li>Extract to get all source code and assets</li>
              </ol>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> This page shows you all UI file locations. To get the actual source code, 
                you must use one of the methods above. Web browsers cannot directly access source files for security reasons.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UIExport;
