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
  WheatOff,
  Upload,
  X 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [username, setUsername] = useState(user?.displayName || "");
  const [feedback, setFeedback] = useState("");
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(
    localStorage.getItem('userProfileImage') || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
        },
        body: JSON.stringify({
          displayName: username.trim()
        }),
      });

      if (response.ok) {
        setIsEditingName(false);
        toast({
          title: "Username updated",
          description: "Your display name has been updated successfully.",
        });
        // Refresh the page to show updated username
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: "Update failed",
          description: error.error || "Failed to update username",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
        },
        body: JSON.stringify({
          message: feedback.trim()
        }),
      });

      if (response.ok) {
        toast({
          title: "Feedback sent",
          description: "Thank you for your feedback! We'll review it shortly.",
        });
        setFeedback("");
      } else {
        const error = await response.json();
        toast({
          title: "Submission failed",
          description: error.error || "Failed to submit feedback",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsImageUploadOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload click
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  // Upload cropped image
  const handleUploadCroppedImage = async () => {
    if (!selectedImage) return;
    
    try {
      // Save the image locally for demo purposes
      localStorage.setItem('userProfileImage', selectedImage);
      setProfileImage(selectedImage);
      
      toast({
        title: "Image updated!",
        description: "Your profile picture has been updated successfully.",
      });
      
      setIsImageUploadOpen(false);
      setSelectedImage(null);
      
      // TODO: In production, this would upload the cropped image to the server
      // const formData = new FormData();
      // formData.append('image', croppedImageBlob);
      // const response = await fetch('/api/auth/profile/image', { ... });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
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
                  <AvatarImage src={profileImage || user?.profileImageUrl || ""} alt={getDisplayName()} />
                  <AvatarFallback className="text-lg font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 h-8 w-8 rounded-full p-0 border-2 border-background bg-background shadow-sm"
                  onClick={handleImageUpload}
                  data-testid="button-upload-image"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
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
              <Link to="/menu?filter=vegan" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3" data-testid="filter-vegan">
                  <Leaf className="w-4 h-4 mr-2 text-green-500" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Vegan</div>
                    <div className="text-xs text-muted-foreground">Plant-based options</div>
                  </div>
                </Button>
              </Link>
              
              <Link to="/menu?filter=spicy" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3" data-testid="filter-spicy">
                  <Flame className="w-4 h-4 mr-2 text-red-500" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Spicy</div>
                    <div className="text-xs text-muted-foreground">Heat lovers</div>
                  </div>
                </Button>
              </Link>
              
              <Link to="/menu?filter=gluten-free" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3" data-testid="filter-gluten-free">
                  <WheatOff className="w-4 h-4 mr-2 text-yellow-500" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Gluten-Free</div>
                    <div className="text-xs text-muted-foreground">Safe options</div>
                  </div>
                </Button>
              </Link>
              
              <Link to="/menu?filter=comfort" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3" data-testid="filter-comfort">
                  <UtensilsCrossed className="w-4 h-4 mr-2 text-blue-500" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Comfort Food</div>
                    <div className="text-xs text-muted-foreground">Feel good meals</div>
                  </div>
                </Button>
              </Link>
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

      {/* Image Upload Dialog */}
      <Dialog open={isImageUploadOpen} onOpenChange={setIsImageUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImage && (
              <div className="flex flex-col items-center space-y-4">
                {/* Preview the selected image in circular form */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
                    <img 
                      src={selectedImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  Your image will be cropped to fit the circular format shown above.
                </p>
                
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsImageUploadOpen(false);
                      setSelectedImage(null);
                    }}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleUploadCroppedImage} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Use This Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}