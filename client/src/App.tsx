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
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminMenu from "@/pages/AdminMenu";
import AdminMessages from "@/pages/AdminMessages";
import AdminReviews from "@/pages/AdminReviews";
import AdminModeration from "@/pages/AdminModeration";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { useLocation } from "wouter";

function MainApp() {
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

function Router() {
  const [location] = useLocation();

  // Check if we're on an admin route
  if (location.startsWith('/admin')) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/menu" component={AdminMenu} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/moderation" component={AdminModeration} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default to main app with bottom navigation
  return <MainApp />;
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