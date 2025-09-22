import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Utensils, Calendar, Shield, Github, Mail, Rocket, Sparkles, PartyPopper, MessageCircle, Lock, CheckCircle, Trophy } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section with Background */}
        <div className="relative mb-8 sm:mb-12">
          <AspectRatio ratio={4 / 3} className="sm:aspect-[16/9] overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-blue-600/70 to-teal-600/80 z-10" />
            <img 
              src="/attached_assets/generated_images/University_lunch_spread_hero_3f701dd6.png"
              alt="Campus dining spread"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 flex flex-col justify-center items-center text-center h-full text-white p-4 sm:p-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  Campus Menu Reviews
                </h1>
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                  <Utensils className="h-5 w-5 text-cyan-200" />
                  <p className="text-base sm:text-lg md:text-xl max-w-lg text-cyan-100">
                    Real students, real reviews. Find the best campus eats!
                  </p>
                  <Star className="h-5 w-5 text-yellow-300" />
                </div>
                
                {/* Main CTA */}
                <div className="space-y-3 sm:space-y-4">
                  <Button 
                    onClick={handleLogin}
                    size="lg"
                    className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium"
                    data-testid="button-login"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Sign in to start rating
                  </Button>
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3 text-white/90" />
                    <p className="text-xs sm:text-sm text-white/90 font-medium">
                      We use accounts to keep reviews real
                    </p>
                  </div>
                  
                  {/* Provider Chips - Mobile Optimized */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogin}
                      className="text-white/90 border border-white/30 rounded-full p-2 sm:p-3"
                      data-testid="button-login-google"
                    >
                      <SiGoogle className="h-4 w-4 sm:h-5 sm:w-5 text-red-300" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogin}
                      className="text-white/90 border border-white/30 rounded-full p-2 sm:p-3"
                      data-testid="button-login-github"
                    >
                      <Github className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogin}
                      className="text-white/90 border border-white/30 rounded-full p-2 sm:p-3"
                      data-testid="button-login-apple"
                    >
                      <SiApple className="h-4 w-4 sm:h-5 sm:w-5 text-gray-200" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogin}
                      className="text-white/90 border border-white/30 rounded-full p-2 sm:p-3"
                      data-testid="button-login-email"
                    >
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AspectRatio>
        </div>

        {/* Benefits Strip - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="text-center border-0 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 hover:shadow-lg transition-all duration-200 p-4 sm:p-6">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-base sm:text-lg text-orange-800 dark:text-orange-200">Rate & Discover</h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">Find hidden gems and avoid disappointments</p>
          </Card>
          <Card className="text-center border-0 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 hover:shadow-lg transition-all duration-200 p-4 sm:p-6">
            <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Utensils className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-base sm:text-lg text-emerald-800 dark:text-emerald-200">Authentic Reviews</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Real students sharing honest food experiences</p>
          </Card>
          <Card className="text-center border-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 hover:shadow-lg transition-all duration-200 p-4 sm:p-6">
            <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-base sm:text-lg text-cyan-800 dark:text-cyan-200">Daily Menus</h3>
            <p className="text-sm text-cyan-700 dark:text-cyan-300">Check what's cooking before you go</p>
          </Card>
        </div>


        {/* FAQ Accordion - Mobile Optimized */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <Accordion type="single" collapsible>
            <AccordionItem value="why-signin" className="border border-violet-200 dark:border-violet-700 rounded-lg px-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
              <AccordionTrigger className="text-left hover:no-underline" data-testid="faq-trigger">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-violet-800 dark:text-violet-200">
                    Why do I need to sign in?
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    Keeps reviews authentic and prevents fake ratings
                  </li>
                  <li className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    Builds a trusted community of real students
                  </li>
                  <li className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    You can sign out anytime - no spam, ever
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Bottom CTA - Mobile Optimized */}
        <div className="text-center bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 sm:p-8 border border-purple-200 dark:border-purple-700">
          <div className="flex justify-center mb-2">
            <PartyPopper className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-purple-700 dark:text-purple-300 mb-4 text-sm sm:text-base font-medium">
            Join the campus food community
          </p>
          <Button 
            onClick={handleLogin} 
            data-testid="button-login-bottom"
            size="lg"
            className="px-6 sm:px-8 py-3 sm:py-4"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}