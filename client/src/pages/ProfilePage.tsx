import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Edit, 
  Camera, 
  MessageSquare, 
  UtensilsCrossed,
  ArrowRight,
  Leaf,
  Flame,
  WheatOff 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [username, setUsername] = useState(user?.displayName || "");
  const [feedback, setFeedback] = useState("");

  const handleLogout = () => {
    fetch('/api/auth/signout', { method: 'POST' })
      .then(() => window.location.reload());
  };

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.email) return user.email.split('@')[0];
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

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Basic bad word check (would be enhanced server-side)
    const badWords = ['admin', 'moderator', 'anonymous', 'fuck', 'shit', 'damn'];
    if (badWords.some(word => username.toLowerCase().includes(word))) {
      toast({
        title: "Username not allowed",
        description: "Please choose a different username. Inappropriate usernames may result in account suspension.",
        variant: "destructive",
      });
      return;
    }

    // TODO: API call to update username
    setIsEditingName(false);
    toast({
      title: "Username updated",
      description: "Your display name has been updated successfully.",
    });
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;

    // TODO: API call to send feedback to admin dashboard
    toast({
      title: "Feedback sent",
      description: "Thank you for your feedback! We'll review it shortly.",
    });
    setFeedback("");
  };

  const handleImageUpload = () => {
    // TODO: Implement image upload
    toast({
      title: "Coming soon",
      description: "Profile picture upload will be available soon. Please note that inappropriate images will result in account suspension.",
    });
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-4 px-4 z-10 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" data-testid="text-profile-title">
            Profile
          </h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-4 pt-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {/* Avatar with Upload Button */}
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={getDisplayName()} />
                  <AvatarFallback className="text-lg font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleImageUpload}
                  data-testid="button-upload-image"
                >
                  <Camera className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Name Section */}
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="space-y-2">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="font-medium"
                      data-testid="input-username"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveUsername} data-testid="button-save-username">
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditingName(false)}
                        data-testid="button-cancel-username"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold truncate" data-testid="text-username">
                        {getDisplayName()}
                      </h2>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsEditingName(true)}
                        data-testid="button-edit-username"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      MNSU Student
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Menu Filters */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Quick Filters</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start h-auto p-3" data-testid="filter-vegan">
                <Leaf className="w-4 h-4 mr-2 text-green-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Vegan</div>
                  <div className="text-xs text-muted-foreground">Plant-based options</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-3" data-testid="filter-spicy">
                <Flame className="w-4 h-4 mr-2 text-red-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Spicy</div>
                  <div className="text-xs text-muted-foreground">Heat lovers</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-3" data-testid="filter-gluten-free">
                <WheatOff className="w-4 h-4 mr-2 text-yellow-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Gluten-Free</div>
                  <div className="text-xs text-muted-foreground">Safe options</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-3" data-testid="filter-comfort">
                <UtensilsCrossed className="w-4 h-4 mr-2 text-blue-500" />
                <div className="text-left">
                  <div className="text-sm font-medium">Comfort Food</div>
                  <div className="text-xs text-muted-foreground">Feel good meals</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Link to="/menu" className="block">
                <Button variant="outline" className="w-full justify-between h-auto p-4" data-testid="button-browse-today">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Browse Today</div>
                      <div className="text-sm text-muted-foreground">See what's available now</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/reviews" className="block">
                <Button variant="outline" className="w-full justify-between h-auto p-4" data-testid="button-read-recent">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Read Recent</div>
                      <div className="text-sm text-muted-foreground">Latest student reviews</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label htmlFor="feedback" className="font-medium">Send Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts, suggestions, or report issues..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="textarea-feedback"
              />
              <Button 
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim()}
                className="w-full"
                data-testid="button-submit-feedback"
              >
                Send Feedback
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your feedback helps improve the dining experience for everyone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}