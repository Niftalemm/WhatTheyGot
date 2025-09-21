import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Utensils, Calendar, Shield, Github, Mail } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section with Background */}
        <div className="relative mb-12">
          <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 z-10" />
            <img 
              src="/attached_assets/generated_images/University_lunch_spread_hero_3f701dd6.png"
              alt="Campus dining spread"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 flex flex-col justify-center items-center text-center h-full text-white p-8">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Campus Menu Reviews
              </h1>
              <p className="text-lg md:text-xl mb-6 max-w-lg">
                Real students, real reviews. Find the best campus eats.
              </p>
              
              {/* Main CTA */}
              <div className="space-y-3">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="px-8 py-6 text-lg font-medium"
                  data-testid="button-login"
                >
                  Sign in to start rating
                </Button>
                <p className="text-sm text-white/80">
                  We use accounts to keep reviews real
                </p>
                
                {/* Provider Chips */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10">
                    <SiGoogle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10">
                    <SiApple className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </AspectRatio>
        </div>

        {/* Benefits Strip */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Rate & Discover</h3>
            <p className="text-sm text-muted-foreground">Find hidden gems and avoid disappointments</p>
          </div>
          <div className="text-center">
            <Utensils className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Authentic Reviews</h3>
            <p className="text-sm text-muted-foreground">Real students sharing honest food experiences</p>
          </div>
          <div className="text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Daily Menus</h3>
            <p className="text-sm text-muted-foreground">Check what's cooking before you go</p>
          </div>
        </div>

        {/* Preview Carousel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">See what students are saying</h2>
          <div className="max-w-2xl mx-auto">
            <Carousel>
              <CarouselContent>
                <CarouselItem>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="font-medium mb-2">"Best pasta on campus!"</p>
                      <p className="text-sm text-muted-foreground">Dining Hall • Italian Station</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="flex">
                          {[1, 2, 3, 4].map((star) => (
                            <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                          ))}
                          <Star className="h-5 w-5 text-gray-300" />
                        </div>
                      </div>
                      <p className="font-medium mb-2">"Great salad bar options"</p>
                      <p className="text-sm text-muted-foreground">Student Union • Fresh Market</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Badge variant="secondary" className="mb-3">Allergen Info</Badge>
                      <p className="font-medium mb-2">"Clear allergen labeling helped me!"</p>
                      <p className="text-sm text-muted-foreground">Menu information you can trust</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-2xl mx-auto mb-8">
          <Accordion type="single" collapsible>
            <AccordionItem value="why-signin">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Why do I need to sign in?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Keeps reviews authentic and prevents fake ratings</li>
                  <li>• Builds a trusted community of real students</li>
                  <li>• You can sign out anytime - no spam, ever</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Join the campus food community</p>
          <Button onClick={handleLogin} data-testid="button-login-bottom">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}