import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function AuthButton() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button 
        variant="default" 
        onClick={() => window.location.href = "/api/login"}
        data-testid="button-login"
      >
        Sign In
      </Button>
    );
  }

  const displayName = (user as any)?.displayName || (user as any)?.firstName || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(user as any)?.profileImageUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="flex-col items-start">
          <div className="font-medium" data-testid="text-user-name">{displayName}</div>
          {(user as any)?.email && (
            <div className="text-xs text-muted-foreground" data-testid="text-user-email">
              {(user as any).email}
            </div>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = "/api/logout"} data-testid="button-logout">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}