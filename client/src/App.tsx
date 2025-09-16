import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import MenuPage from "@/pages/MenuPage";
import ReviewsPage from "@/pages/ReviewsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [activeTab, setActiveTab] = useState('menu');

  const renderPage = () => {
    switch (activeTab) {
      case 'menu':
        return <MenuPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'add':
        // For now, just show menu page with a console message
        console.log('Add review functionality would be implemented here');
        return <MenuPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <MenuPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="min-h-screen">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark">
          <Router />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;