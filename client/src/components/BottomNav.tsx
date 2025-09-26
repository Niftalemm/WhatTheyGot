import { useState } from "react";
import { Home, MessageSquare, Plus, User, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { theme, setTheme } = useTheme();

  // Fetch unread message count
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/threads/unread/count"],
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  const navItems = [
    { id: 'menu', icon: Home, label: 'Menu' },
    { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-between px-4 py-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover-elevate relative",
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
            data-testid={`button-nav-${item.id}`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.id === 'profile' && unreadCount && unreadCount.count > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4"
                  data-testid="badge-unread-messages"
                >
                  {unreadCount.count > 99 ? '99+' : unreadCount.count}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="ml-2"
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}