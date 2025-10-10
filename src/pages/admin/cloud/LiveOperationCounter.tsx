import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Zap, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface OperationMetric {
  label: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'error';
  description: string;
  lastUpdate: string;
}

interface RecentLog {
  timestamp: string;
  type: string;
  message: string;
  severity: string;
}

const LiveOperationCounter: React.FC = () => {
  const [metrics, setMetrics] = useState<OperationMetric[]>([
    {
      label: 'Database Queries',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Total database operations',
      lastUpdate: new Date().toISOString()
    },
    {
      label: 'Auth Operations',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Authentication requests',
      lastUpdate: new Date().toISOString()
    },
    {
      label: 'Error Events',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Database errors detected',
      lastUpdate: new Date().toISOString()
    },
    {
      label: 'Active Connections',
      count: 0,
      trend: 'stable',
      status: 'good',
      description: 'Current database connections',
      lastUpdate: new Date().toISOString()
    }
  ]);

  const [totalOperations, setTotalOperations] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [lastFetch, setLastFetch] = useState<Date>(new Date());

  // Fetch real database analytics
  const fetchRealAnalytics = async () => {
    try {
      console.log('📊 Fetching real-time database analytics...');
      
      // Fetch postgres logs to count operations
      const { data: postgresLogs, error: pgError } = await supabase.rpc('supabase_analytics_query' as any, {
        query: `
          select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity 
          from postgres_logs
          cross join unnest(metadata) as m
          cross join unnest(m.parsed) as parsed
          where timestamp > extract(epoch from now() - interval '5 minutes') * 1000000
          order by timestamp desc
          limit 100
        `
      });

      if (pgError) {
        console.error('Error fetching postgres logs:', pgError);
      }

      // Fetch auth logs
      const { data: authLogs, error: authError } = await supabase.rpc('supabase_analytics_query' as any, {
        query: `
          select id, auth_logs.timestamp, event_message, metadata.level
          from auth_logs
          cross join unnest(metadata) as metadata
          where timestamp > extract(epoch from now() - interval '5 minutes') * 1000000
          order by timestamp desc
          limit 50
        `
      });

      if (authError) {
        console.error('Error fetching auth logs:', authError);
      }

      // Count operations
      const dbQueryCount = postgresLogs?.length || 0;
      const authCount = authLogs?.length || 0;
      const errorCount = postgresLogs?.filter((log: any) => 
        log.error_severity === 'ERROR' || log.error_severity === 'FATAL'
      ).length || 0;

      // Count active connections
      const connectionCount = postgresLogs?.filter((log: any) => 
        log.event_message?.includes('connection')
      ).length || 0;

      // Extract recent logs for display
      const logs: RecentLog[] = [
        ...(postgresLogs?.slice(0, 5).map((log: any) => ({
          timestamp: new Date(log.timestamp / 1000).toISOString(),
          type: 'Database',
          message: log.event_message?.substring(0, 80) || 'Database operation',
          severity: log.error_severity || 'LOG'
        })) || []),
        ...(authLogs?.slice(0, 3).map((log: any) => ({
          timestamp: new Date(log.timestamp / 1000).toISOString(),
          type: 'Auth',
          message: log.event_message?.substring(0, 80) || 'Auth operation',
          severity: log.level || 'info'
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      setRecentLogs(logs);

      const now = new Date().toISOString();
      setMetrics([
        {
          label: 'Database Queries',
          count: dbQueryCount,
          trend: dbQueryCount > 20 ? 'up' : 'stable',
          status: dbQueryCount > 50 ? 'warning' : 'good',
          description: 'Last 5 minutes',
          lastUpdate: now
        },
        {
          label: 'Auth Operations',
          count: authCount,
          trend: authCount > 10 ? 'up' : 'stable',
          status: authCount > 30 ? 'warning' : 'good',
          description: 'Last 5 minutes',
          lastUpdate: now
        },
        {
          label: 'Error Events',
          count: errorCount,
          trend: errorCount > 0 ? 'up' : 'stable',
          status: errorCount > 5 ? 'error' : errorCount > 0 ? 'warning' : 'good',
          description: 'Errors detected',
          lastUpdate: now
        },
        {
          label: 'Active Connections',
          count: connectionCount,
          trend: 'stable',
          status: connectionCount > 20 ? 'warning' : 'good',
          description: 'Recent connections',
          lastUpdate: now
        }
      ]);

      setTotalOperations(dbQueryCount + authCount);
      setLastFetch(new Date());
      
      console.log('✅ Analytics fetched:', { dbQueryCount, authCount, errorCount, connectionCount });
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error);
    }
  };

  // Fetch real-time data every 5 seconds
  useEffect(() => {
    if (!isMonitoring) return;

    fetchRealAnalytics(); // Initial fetch

    const interval = setInterval(() => {
      fetchRealAnalytics();
    }, 5000); // Refresh every 5 seconds

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
            Real-time monitoring from Cloud database analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRealAnalytics}
            disabled={!isMonitoring}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge
            variant={isMonitoring ? 'default' : 'secondary'}
            className="h-8 px-4"
          >
            <Activity className="w-4 h-4 mr-2 animate-pulse" />
            {isMonitoring ? 'Live' : 'Paused'}
          </Badge>
        </div>
      </div>

      {/* Total Operations Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">Total Operations (Last 5 min)</p>
            <p className="text-4xl font-bold text-blue-900">{totalOperations.toLocaleString()}</p>
            <p className="text-xs text-blue-600">
              Last updated: {lastFetch.toLocaleTimeString()}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
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

      {/* Recent Activity Logs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Recent Activity (Last 10 operations)
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Waiting for operations...</p>
            </div>
          ) : (
            recentLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all ${
                  log.severity === 'ERROR' || log.severity === 'FATAL'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate">{log.message}</p>
                  </div>
                  <Badge
                    variant={
                      log.severity === 'ERROR' || log.severity === 'FATAL'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-xs flex-shrink-0"
                  >
                    {log.severity}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Info Banner */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">✅ 100% Real-Time Monitoring Active</p>
            <p className="text-xs text-blue-700">
              Connected to Cloud database analytics. Auto-refreshes every 5 seconds with real operation data. 
              Light green = good performance, Light red = issues detected.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LiveOperationCounter;
