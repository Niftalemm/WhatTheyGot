import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { SiGoogle, SiApple } from "react-icons/si";
import { Github, Mail, Sparkles, ArrowRight, Info, X } from "lucide-react";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [showAccessPanel, setShowAccessPanel] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleEnterApp = () => {
    setShowAccessPanel(true);
  };

  const handleLearnMore = () => {
    setShowLearnMoreModal(true);
    setShowAccessPanel(false);
  };

  const handleCloseModal = () => {
    setShowLearnMoreModal(false);
  };

  const handleEmailContinue = () => {
    // For now, redirect to main login which handles all providers
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0C] via-[#0F0F10] to-[#0B0B0C] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6EE7B7] rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-[#6EE7B7] rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[#6EE7B7] rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#6EE7B7] rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          {/* App Name with Gradient */}
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-[#F5F5F5] via-[#6EE7B7] to-[#F5F5F5] bg-clip-text text-transparent leading-tight">
            What They Got?
          </h1>
          
          {/* Tagline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-[#A1A1AA] mb-12 font-medium">
            See what's bussin' at the DC today.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={handleEnterApp}
              size="lg"
              className="px-8 py-4 text-lg font-semibold bg-[#6EE7B7] text-[#0B0B0C] hover:bg-[#5FD4A8] hover:shadow-lg hover:shadow-[#6EE7B7]/20 transition-all duration-300 transform hover:scale-105 min-w-[160px]"
              data-testid="button-enter-app"
            >
              Enter App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              onClick={handleLearnMore}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold border-[#6EE7B7] text-[#6EE7B7] hover:bg-[#6EE7B7] hover:text-[#0B0B0C] transition-all duration-300 transform hover:scale-105 min-w-[160px]"
              data-testid="button-learn-more"
            >
              <Info className="mr-2 h-5 w-5" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Login/Access Panel */}
        <div className={`transition-all duration-500 transform ${showAccessPanel ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
          <Card className="w-full max-w-md mx-auto bg-[#0F0F10]/80 backdrop-blur-sm border border-[#6EE7B7]/30 shadow-lg shadow-[#6EE7B7]/10 hover:shadow-[#6EE7B7]/20 transition-all duration-300 hover:scale-105">
            <CardContent className="p-8">
              {/* Email Input */}
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
                    Get Started
                  </h3>
                  <p className="text-sm text-[#A1A1AA]">
                    Sign in with your preferred method
                  </p>
                </div>

                {/* OAuth Provider Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    className="h-12 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:border-[#6EE7B7] hover:bg-[#6EE7B7]/10 transition-all duration-300"
                    data-testid="button-login-google"
                  >
                    <SiGoogle className="h-5 w-5 text-[#EA4335]" />
                  </Button>
                  
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    className="h-12 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:border-[#6EE7B7] hover:bg-[#6EE7B7]/10 transition-all duration-300"
                    data-testid="button-login-apple"
                  >
                    <SiApple className="h-5 w-5 text-[#F5F5F5]" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    className="h-12 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:border-[#6EE7B7] hover:bg-[#6EE7B7]/10 transition-all duration-300"
                    data-testid="button-login-github"
                  >
                    <Github className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    className="h-12 border border-[#F5F5F5]/20 text-[#F5F5F5] hover:border-[#6EE7B7] hover:bg-[#6EE7B7]/10 transition-all duration-300"
                    data-testid="button-login-email"
                  >
                    <Mail className="h-5 w-5" />
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F5F5F5]/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 text-[#A1A1AA] bg-[#0F0F10]">or continue with email</span>
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-[#0B0B0C]/50 border-[#F5F5F5]/20 text-[#F5F5F5] placeholder:text-[#A1A1AA] focus:border-[#6EE7B7] focus:ring-1 focus:ring-[#6EE7B7] transition-all duration-300"
                    data-testid="input-email"
                  />
                  
                  <Button
                    onClick={handleEmailContinue}
                    className="w-full h-12 bg-[#6EE7B7] text-[#0B0B0C] hover:bg-[#5FD4A8] font-semibold transition-all duration-300 transform hover:scale-105"
                    data-testid="button-continue"
                  >
                    Continue
                  </Button>
                </div>

                {/* Subtext */}
                <div className="text-center pt-4 border-t border-[#F5F5F5]/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#6EE7B7]" />
                    <p className="text-xs text-[#A1A1AA]">
                      Unofficial student project
                    </p>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mb-2">
                    No school login required
                  </p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    🔒 Logging in is only used to protect and help students. Your info will not be shared with other people.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0B0C] to-transparent pointer-events-none"></div>
      </div>

      {/* Learn More Modal */}
      <Dialog open={showLearnMoreModal} onOpenChange={setShowLearnMoreModal}>
        <DialogContent className="max-w-md mx-auto bg-[#0F0F10] border border-[#6EE7B7]/30 shadow-2xl shadow-[#6EE7B7]/20 text-[#F5F5F5]">
          <DialogHeader className="text-center space-y-4">
            <DialogTitle className="text-2xl font-bold text-[#F5F5F5] flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-[#6EE7B7]" />
              Why this exists
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA] text-base leading-relaxed px-2">
              I got tired of playing "guess the mystery meat." So I built a quick feed to see what the DC's serving today — and whether it's bussin' or busted. Drop a review, save a stomach.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              onClick={handleCloseModal}
              className="flex-1 h-12 bg-[#6EE7B7] text-[#0B0B0C] hover:bg-[#5FD4A8] font-semibold transition-all duration-300 transform hover:scale-105"
              data-testid="button-got-it"
            >
              Got it
            </Button>
            <Button
              onClick={() => {
                handleCloseModal();
                // Small delay then show access panel
                setTimeout(() => setShowAccessPanel(true), 200);
              }}
              variant="outline"
              className="flex-1 h-12 border-[#6EE7B7] text-[#6EE7B7] hover:bg-[#6EE7B7] hover:text-[#0B0B0C] transition-all duration-300 transform hover:scale-105"
              data-testid="button-start-scrolling"
            >
              Start scrolling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}