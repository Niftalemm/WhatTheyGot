import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UtensilsCrossed, 
  AlertTriangle, 
  TrendingUp,
  LogOut,
  Star,
  Clock,
  MessageSquare
} from 'lucide-react';

interface AppStats {
  totalReviews: number;
  totalMenuItems: number;
  totalReports: number;
  recentActivity: Array<{
    type: 'review' | 'report';
    id: string;
    content?: string;
    rating?: number;
    issueType?: string;
    createdAt: string;
    menuItemId: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
      return;
    }
    
    fetchStats();
  }, [setLocation]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast({
          title: 'Access Denied',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        setLocation('/admin/login');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">MNSU Dining Admin</h1>
              <p className="text-muted-foreground">Manage your dining app</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="default"
            className="h-auto p-4 flex-col"
            onClick={() => setLocation('/admin/menu')}
            data-testid="button-manage-menu"
          >
            <UtensilsCrossed className="w-6 h-6 mb-2" />
            Manage Menu
          </Button>
          <Button 
            variant="default"
            className="h-auto p-4 flex-col"
            onClick={() => setLocation('/admin/messages')}
            data-testid="button-manage-messages"
          >
            <MessageSquare className="w-6 h-6 mb-2" />
            Manage Messages
          </Button>
          <Button 
            variant="default"
            className="h-auto p-4 flex-col"
            onClick={() => setLocation('/admin/reports')}
            data-testid="button-view-reports"
          >
            <AlertTriangle className="w-6 h-6 mb-2" />
            View Reports
          </Button>
          <Button 
            variant="default"
            className="h-auto p-4 flex-col"
            onClick={() => window.open('/', '_blank')}
            data-testid="button-view-app"
          >
            <TrendingUp className="w-6 h-6 mb-2" />
            View App
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-reviews">
                {stats?.totalReviews || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Student feedback received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-menu-items">
                {stats?.totalMenuItems || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Items in dining system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-reports">
                {stats?.totalReports || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Issues to review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest reviews and reports from students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentActivity?.length ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {activity.type === 'review' ? (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                      )}
                      <div>
                        <Badge variant={activity.type === 'review' ? 'default' : 'secondary'}>
                          {activity.type === 'review' ? 'Review' : 'Report'}
                        </Badge>
                        <p className="text-sm mt-1">
                          {activity.type === 'review' 
                            ? `${activity.rating}⭐ ${activity.content || 'No comment'}`
                            : `${activity.issueType}: ${activity.content || 'No details'}`
                          }
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity to display
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}