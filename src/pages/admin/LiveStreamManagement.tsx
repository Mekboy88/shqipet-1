import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Radio, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveStream {
  id: string;
  title: string;
  host: string;
  thumbnail_url: string;
  views: number;
  is_live: boolean;
  category: string;
  started_at: string;
  ended_at?: string;
}

const CATEGORIES = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'technology', label: 'Technology' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'general', label: 'General' },
];

const LiveStreamManagement: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    host: '',
    thumbnail_url: '',
    category: 'general',
    views: 0,
    is_live: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch live streams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (stream?: LiveStream) => {
    if (stream) {
      setEditingStream(stream);
      setFormData({
        title: stream.title,
        host: stream.host,
        thumbnail_url: stream.thumbnail_url,
        category: stream.category,
        views: stream.views,
        is_live: stream.is_live,
      });
    } else {
      setEditingStream(null);
      setFormData({
        title: '',
        host: '',
        thumbnail_url: '',
        category: 'general',
        views: 0,
        is_live: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStream(null);
    setFormData({
      title: '',
      host: '',
      thumbnail_url: '',
      category: 'general',
      views: 0,
      is_live: true,
    });
  };

  const handleSaveStream = async () => {
    try {
      if (editingStream) {
        // Update existing stream
        const { error } = await supabase
          .from('live_streams')
          .update({
            title: formData.title,
            host: formData.host,
            thumbnail_url: formData.thumbnail_url,
            category: formData.category,
            views: formData.views,
            is_live: formData.is_live,
            ...(formData.is_live === false && { ended_at: new Date().toISOString() }),
          })
          .eq('id', editingStream.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Live stream updated successfully',
        });
      } else {
        // Create new stream
        const { error } = await supabase
          .from('live_streams')
          .insert({
            title: formData.title,
            host: formData.host,
            thumbnail_url: formData.thumbnail_url,
            category: formData.category,
            views: formData.views,
            is_live: formData.is_live,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Live stream created successfully',
        });
      }

      handleCloseDialog();
      fetchStreams();
    } catch (error) {
      console.error('Error saving stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to save live stream',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStream = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live stream?')) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Live stream deleted successfully',
      });
      fetchStreams();
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete live stream',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Stream Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage live streams
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Live Stream
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thumbnail</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : streams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No live streams found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              streams.map((stream) => (
                <TableRow key={stream.id}>
                  <TableCell>
                    <img
                      src={stream.thumbnail_url}
                      alt={stream.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{stream.title}</TableCell>
                  <TableCell>{stream.host}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {stream.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {stream.views.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {stream.is_live ? (
                      <Badge className="bg-red-500 hover:bg-red-600 gap-1">
                        <Radio className="h-3 w-3" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Ended</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(stream.started_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(stream)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStream(stream.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <DialogHeader>
            <DialogTitle>
              {editingStream ? 'Edit Live Stream' : 'Create Live Stream'}
            </DialogTitle>
            <DialogDescription>
              {editingStream
                ? 'Update the live stream details below.'
                : 'Fill in the details to create a new live stream.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter stream title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="Enter host name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="views">Views</Label>
              <Input
                id="views"
                type="number"
                value={formData.views}
                onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.is_live ? 'live' : 'ended'}
                onValueChange={(value) => setFormData({ ...formData, is_live: value === 'live' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveStream}>
              {editingStream ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveStreamManagement;
