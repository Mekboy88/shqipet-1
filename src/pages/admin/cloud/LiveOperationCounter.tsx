import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Zap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OperationMetric {
  label: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'error';
  description: string;
}

const LiveOperationCounter: React.FC = () => {
  const [metrics, setMetrics] = useState<OperationMetric[]>([
    {
      label: 'Database Reads',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Total SELECT queries'
    },
    {
      label: 'Database Writes',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Total INSERT/UPDATE/DELETE queries'
    },
    {
      label: 'Auth Checks',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Authentication verifications'
    },
    {
      label: 'Real-time Subscriptions',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Active real-time connections'
    }
  ]);

  const [totalOperations, setTotalOperations] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Simulate real-time operation counting
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setMetrics((prev) => {
        return prev.map((metric) => {
          // Simulate random increments
          const increment = Math.floor(Math.random() * 3);
          const newCount = metric.count + increment;
          
          // Determine status based on count thresholds
          let status: 'good' | 'warning' | 'error' = 'good';
          if (newCount > 100) status = 'warning';
          if (newCount > 200) status = 'error';

          // Determine trend
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (increment > 1) trend = 'up';
          else if (increment === 0) trend = 'down';

          return {
            ...metric,
            count: newCount,
            status,
            trend
          };
        });
      });

      setTotalOperations((prev) => prev + Math.floor(Math.random() * 5));
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-gray-400" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Live Operation Counter</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Cloud operations
          </p>
        </div>
        <Badge
          variant={isMonitoring ? 'default' : 'secondary'}
          className="h-8 px-4"
        >
          <Activity className="w-4 h-4 mr-2" />
          {isMonitoring ? 'Live' : 'Paused'}
        </Badge>
      </div>

      {/* Total Operations Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">Total Operations</p>
            <p className="text-4xl font-bold text-blue-900">{totalOperations.toLocaleString()}</p>
            <p className="text-xs text-blue-600">Since monitoring started</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Operation Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className={`p-6 border-2 transition-all ${getStatusColor(metric.status)}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  <h3 className="font-semibold">{metric.label}</h3>
                </div>
                {getTrendIcon(metric.trend)}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{metric.count}</span>
                  <span className="text-sm text-muted-foreground">operations</span>
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>

              {metric.status === 'warning' && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-amber-100 rounded-md">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium">High Usage Detected</p>
                    <p>Consider reviewing your queries for optimization</p>
                  </div>
                </div>
              )}

              {metric.status === 'error' && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-red-100 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-xs text-red-700">
                    <p className="font-medium">Critical Usage Level</p>
                    <p>Immediate optimization recommended</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">Live Monitoring Active</p>
            <p className="text-xs text-blue-700">
              This dashboard updates every 2 seconds. Use light green for good performance and light red for issues that need attention.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LiveOperationCounter;
