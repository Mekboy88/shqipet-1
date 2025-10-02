import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { profileRepairService } from "@/services/profile/profileRepairService";

export const ProfileRepairButton = () => {
  const [isRepairing, setIsRepairing] = useState(false);

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      const result = await profileRepairService.repairCurrentUserProfile();
      
      if (result.success) {
        const parts: string[] = [];
        if (result.repairedAvatar) parts.push('avatar');
        if (result.repairedCover) parts.push('cover');
        
        toast.success(`Restored ${parts.join(' and ')} from photo history`);
        
        // Refresh page to show restored images
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.info('No photos to restore from history');
      }
    } catch (error) {
      console.error('Repair failed:', error);
      toast.error('Failed to restore photos');
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRepair}
      disabled={isRepairing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRepairing ? 'animate-spin' : ''}`} />
      {isRepairing ? 'Restoring...' : 'Restore Photos'}
    </Button>
  );
};
