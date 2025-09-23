import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Flag, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Student';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getJoinedDate = () => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 1) return 'Joined today';
      if (diffInDays < 7) return 'Joined this week';
      if (diffInDays < 30) return 'Joined this month';
      return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }
    return 'New member';
  };

  // Real user stats (placeholder for now - would be fetched from API)
  const userStats = {
    reviewsPosted: 0, // TODO: Fetch real data
    averageRating: null,
    photosShared: 0,
    reportsSubmitted: 0,
  };
  return (
    <div className="pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-4 px-4 z-10 border-b border-border">
        <h1 className="text-2xl font-bold" data-testid="text-profile-title">
          Your Profile
        </h1>
      </div>

      <div className="space-y-6 px-4 pt-6">

        {/* User Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.profileImageUrl || ""} alt={getDisplayName()} />
                <AvatarFallback className="text-lg font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-lg font-semibold" data-testid="text-username">
                  {getDisplayName()}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user?.email && (
                    <span className="block">{user.email}</span>
                  )}
                  MNSU Student • {getJoinedDate()}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary" data-testid="text-reviews-count">
              {userStats.reviewsPosted}
            </div>
            <p className="text-sm text-muted-foreground">Reviews Posted</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary" data-testid="text-avg-rating">
              {userStats.averageRating}
            </div>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary" data-testid="text-photos-count">
              {userStats.photosShared}
            </div>
            <p className="text-sm text-muted-foreground">Photos Shared</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary" data-testid="text-reports-count">
              {userStats.reportsSubmitted}
            </div>
            <p className="text-sm text-muted-foreground">Issues Reported</p>
          </CardContent>
        </Card>
      </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-activity-title">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity yet</p>
              <p className="text-sm">Start by reviewing your favorite campus meals!</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" data-testid="button-view-reviews">
              <MessageSquare className="w-4 h-4 mr-2" />
              View All My Reviews
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-report-issue">
              <Flag className="w-4 h-4 mr-2" />
              Report an Issue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}