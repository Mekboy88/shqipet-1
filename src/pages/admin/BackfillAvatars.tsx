import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const BackfillAvatars = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [processed, setProcessed] = React.useState(0);
  const [succeeded, setSucceeded] = React.useState(0);
  const [failed, setFailed] = React.useState(0);
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const backfillAvatars = async () => {
    if (!user) {
      toast.error('Must be authenticated');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setProcessed(0);
    setSucceeded(0);
    setFailed(0);
    setLogs([]);
    addLog('Starting avatar backfill...');

    try {
      // Fetch all profiles with avatar_url but no avatar_sizes
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, avatar_url, avatar_sizes')
        .not('avatar_url', 'is', null);

      if (fetchError) throw fetchError;

      const toBackfill = profiles?.filter(p => 
        p.avatar_url && 
        (!p.avatar_sizes || Object.keys(p.avatar_sizes).length === 0)
      ) || [];

      setTotal(toBackfill.length);
      addLog(`Found ${toBackfill.length} profiles to backfill`);

      if (toBackfill.length === 0) {
        addLog('✅ No profiles need backfilling');
        setIsRunning(false);
        return;
      }

      // Process each profile
      for (let i = 0; i < toBackfill.length; i++) {
        const profile = toBackfill[i];
        addLog(`Processing ${i + 1}/${toBackfill.length}: ${profile.id}`);

        try {
          const formData = new FormData();
          formData.append('existingKey', profile.avatar_url);
          formData.append('mediaType', 'avatar');
          formData.append('userId', profile.id);
          formData.append('updateProfile', 'false'); // We'll update manually

          const { data: optimizerData, error: optimizerError } = await supabase.functions.invoke(
            'image-optimizer',
            {
              body: formData,
            }
          );

          if (optimizerError) throw optimizerError;

          addLog(`✅ Success: ${profile.id}`);
          setSucceeded(prev => prev + 1);
        } catch (err) {
          addLog(`❌ Failed: ${profile.id} - ${err instanceof Error ? err.message : 'Unknown error'}`);
          setFailed(prev => prev + 1);
        }

        setProcessed(prev => prev + 1);
        setProgress(((i + 1) / toBackfill.length) * 100);
      }

      addLog(`🎉 Backfill complete: ${succeeded} succeeded, ${failed} failed`);
      toast.success(`Backfilled ${succeeded} avatars`);
    } catch (error) {
      console.error('Backfill error:', error);
      addLog(`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Backfill failed');
    } finally {
      setIsRunning(false);
    }
  };

  const backfillCovers = async () => {
    if (!user) {
      toast.error('Must be authenticated');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setProcessed(0);
    setSucceeded(0);
    setFailed(0);
    setLogs([]);
    addLog('Starting cover backfill...');

    try {
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, cover_url, cover_sizes')
        .not('cover_url', 'is', null);

      if (fetchError) throw fetchError;

      const toBackfill = profiles?.filter(p => 
        p.cover_url && 
        (!p.cover_sizes || Object.keys(p.cover_sizes).length === 0)
      ) || [];

      setTotal(toBackfill.length);
      addLog(`Found ${toBackfill.length} profiles to backfill`);

      if (toBackfill.length === 0) {
        addLog('✅ No profiles need backfilling');
        setIsRunning(false);
        return;
      }

      for (let i = 0; i < toBackfill.length; i++) {
        const profile = toBackfill[i];
        addLog(`Processing ${i + 1}/${toBackfill.length}: ${profile.id}`);

        try {
          const formData = new FormData();
          formData.append('existingKey', profile.cover_url);
          formData.append('mediaType', 'cover');
          formData.append('userId', profile.id);
          formData.append('updateProfile', 'false');

          const { data: optimizerData, error: optimizerError } = await supabase.functions.invoke(
            'image-optimizer',
            {
              body: formData,
            }
          );

          if (optimizerError) throw optimizerError;

          addLog(`✅ Success: ${profile.id}`);
          setSucceeded(prev => prev + 1);
        } catch (err) {
          addLog(`❌ Failed: ${profile.id} - ${err instanceof Error ? err.message : 'Unknown error'}`);
          setFailed(prev => prev + 1);
        }

        setProcessed(prev => prev + 1);
        setProgress(((i + 1) / toBackfill.length) * 100);
      }

      addLog(`🎉 Backfill complete: ${succeeded} succeeded, ${failed} failed`);
      toast.success(`Backfilled ${succeeded} covers`);
    } catch (error) {
      console.error('Backfill error:', error);
      addLog(`❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Backfill failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Backfill Avatar & Cover Sizes</CardTitle>
          <CardDescription>
            Regenerate responsive image sizes for existing avatars and covers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={backfillAvatars} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Backfill Avatars'
              )}
            </Button>
            <Button 
              onClick={backfillCovers} 
              disabled={isRunning}
              variant="outline"
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                'Backfill Covers'
              )}
            </Button>
          </div>

          {total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {processed}/{total}</span>
                <span>
                  <CheckCircle2 className="inline h-4 w-4 text-green-500 mr-1" />
                  {succeeded} 
                  <XCircle className="inline h-4 w-4 text-red-500 ml-3 mr-1" />
                  {failed}
                </span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Click a button to start backfill...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={
                    log.includes('✅') ? 'text-green-600' :
                    log.includes('❌') ? 'text-red-600' :
                    log.includes('🎉') ? 'text-blue-600 font-bold' :
                    ''
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackfillAvatars;
