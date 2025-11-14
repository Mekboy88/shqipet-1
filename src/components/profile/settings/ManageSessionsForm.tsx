import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor } from 'lucide-react';

const ManageSessionsForm: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border border-border bg-card rounded-2xl shadow-lg">
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">
            <Monitor size={64} className="mx-auto mb-6 text-muted-foreground/30" />
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Device Management
            </h2>
            <p className="text-base mb-2">
              Device session management is being rebuilt.
            </p>
            <p className="text-sm">
              This feature will be available soon with improved security and functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageSessionsForm;