import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "./LoginModal";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface ProtectedContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blurLevel?: "sm" | "md" | "lg";
}

export function ProtectedContent({ 
  children, 
  fallback,
  blurLevel = "md" 
}: ProtectedContentProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse bg-muted rounded-lg h-32" />;
  }

  if (!isAuthenticated) {
    const blurClass = blurLevel === 'sm' ? 'blur-sm' : blurLevel === 'lg' ? 'blur-lg' : 'blur';
    
    return (
      <>
        <div className="relative">
          {/* Blurred content */}
          <div className={`${blurClass} pointer-events-none select-none`}>
            {children}
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4 p-6">
              {fallback || (
                <>
                  <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Sign in required</h3>
                    <p className="text-muted-foreground">
                      Please sign in to view and post reviews
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowLoginModal(true)}
                    data-testid="button-signin-overlay"
                  >
                    Sign in to continue
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    );
  }

  return <>{children}</>;
}