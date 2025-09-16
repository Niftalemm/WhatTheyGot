import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Flag, Settings } from "lucide-react";

//todo: remove mock functionality
const userStats = {
  reviewsPosted: 12,
  averageRating: 4.2,
  photosShared: 8,
  reportsSubmitted: 2,
};

//todo: remove mock functionality
const recentActivity = [
  {
    id: '1',
    type: 'review',
    itemName: 'Classic Cheeseburger', 
    rating: 5,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    type: 'photo',
    itemName: 'Chicken Alfredo Pasta',
    timeAgo: '1 day ago',
  },
  {
    id: '3',
    type: 'review',
    itemName: 'Garden Fresh Salad',
    rating: 3,
    timeAgo: '2 days ago',
  },
];

export default function ProfilePage() {
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
              <AvatarFallback className="text-lg font-medium">
                YU
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-lg font-semibold" data-testid="text-username">
                You
              </h2>
              <p className="text-sm text-muted-foreground">
                MNSU Student • Joined this week
              </p>
            </div>
            
            <Button variant="outline" size="icon" data-testid="button-settings">
              <Settings className="w-4 h-4" />
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
        <CardContent className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover-elevate">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {activity.type === 'review' ? (
                  <MessageSquare className="w-4 h-4 text-primary" />
                ) : activity.type === 'photo' ? (
                  <MessageSquare className="w-4 h-4 text-primary" />
                ) : (
                  <Flag className="w-4 h-4 text-primary" />
                )}
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium" data-testid={`text-activity-item-${activity.id}`}>
                  {activity.type === 'review' ? 'Reviewed' : 
                   activity.type === 'photo' ? 'Shared photo of' : 'Reported'} {activity.itemName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.rating && (
                    <>
                      <div className="flex items-center gap-1">
                        {[...Array(activity.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                        ))}
                      </div>
                      <span>•</span>
                    </>
                  )}
                  <span>{activity.timeAgo}</span>
                </div>
              </div>
            </div>
          ))}
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