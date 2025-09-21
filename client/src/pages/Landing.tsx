import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Users, MessageSquare } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Campus Menu
              <span className="text-primary block text-lg md:text-xl font-normal mt-2">
                Student Food Reviews & Ratings
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Share your honest food reviews and help fellow students make better dining choices. 
              Your authentic feedback creates a better campus dining experience for everyone.
            </p>
          </div>

          {/* Authentication Notice */}
          <Card className="mb-12 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Required
              </CardTitle>
              <CardDescription>
                We require account creation to ensure all reviews are authentic and to maintain accountability in our community.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-left">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Authentic Reviews</h4>
                    <p className="text-sm text-muted-foreground">
                      Every review is tied to a real account, ensuring genuine feedback from actual students.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Community Accountability</h4>
                    <p className="text-sm text-muted-foreground">
                      Account-based system helps maintain a respectful and helpful review community.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <MessageSquare className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Better Feedback Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      Registered users tend to provide more thoughtful and constructive reviews.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="px-8 py-6 text-lg"
              data-testid="button-login"
            >
              Sign In to Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Sign in with Google, GitHub, Apple, or your email address
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rate & Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share your experience with campus dining options and help others discover great meals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daily Menus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse daily menu items, nutrition info, and allergen details before you go.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Read reviews from fellow students and make informed decisions about your meals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}