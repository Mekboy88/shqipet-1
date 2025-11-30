import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileCode, Folder } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// All page files in the application
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

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      // Fetch the file from the public directory (this is a simplified version)
      // In production, you'd need to set up a proper API endpoint to serve files
      const response = await fetch(`/${filePath}`);
      const content = await response.text();
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please check the console for details.');
    }
  };

  const downloadAllInCategory = async () => {
    const filesToDownload = filteredFiles;
    
    // Create a text file with all file paths and instructions
    const content = `
# UI Interface Export
# Generated: ${new Date().toLocaleString()}
# Category: ${selectedCategory}
# Total Files: ${filesToDownload.length}

${filesToDownload.map(file => `
## ${file.name}
File: ${file.path}
Category: ${file.category}
----------------------------------------
`).join('\n')}

Instructions:
1. All files are listed above with their paths
2. To access each file, navigate to the path in your project
3. Each file contains the complete UI interface code
4. Files are organized by category: ${categories.join(', ')}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui-export-${selectedCategory.toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">UI Interface Export</h1>
          <p className="text-muted-foreground">
            Download all UI interfaces from your application - {pageFiles.length} pages available
          </p>
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
              {cat} {cat === 'All' ? `(${pageFiles.length})` : `(${pageFiles.filter(f => f.category === cat).length})`}
            </Button>
          ))}
        </div>

        {/* Download All Button */}
        <div className="mb-6">
          <Button onClick={downloadAllInCategory} size="lg" className="w-full md:w-auto">
            <Download className="w-5 h-5 mr-2" />
            Download All {selectedCategory} Files List ({filteredFiles.length} files)
          </Button>
        </div>

        {/* Files Grid */}
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCode className="w-5 h-5" />
                    {file.name}
                  </CardTitle>
                  <CardDescription>
                    Category: {file.category}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 font-mono break-all">
                    {file.path}
                  </p>
                  <Button 
                    onClick={() => downloadFile(file.path, `${file.name.replace(/\s+/g, '-')}.tsx`)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Download Individual Files:</strong> Click the "Download" button on any card to get that specific page's UI code.</p>
            <p><strong>Download All Files List:</strong> Click the "Download All" button at the top to get a comprehensive list of all file paths.</p>
            <p><strong>Filter by Category:</strong> Use the category buttons to filter pages by Main, Auth, Admin, Features, or Other.</p>
            <p><strong>File Access:</strong> All files can be accessed directly in your project at the paths shown.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UIExport;
