import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import BottomNav from "@/components/BottomNav";
import MenuPage from "@/pages/MenuPage";
import MenuItemPage from "@/pages/MenuItemPage";
import ReviewsPage from "@/pages/ReviewsPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminMenu from "@/pages/AdminMenu";
import AdminMessages from "@/pages/AdminMessages";
import AdminReviews from "@/pages/AdminReviews";
import AdminModeration from "@/pages/AdminModeration";
import AdminThreads from "@/pages/AdminThreads";
import AdminThreadDetailPage from "@/pages/AdminThreadDetailPage";
import NewMessagePage from "@/pages/NewMessagePage";
import ThreadDetailPage from "@/pages/ThreadDetailPage";
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
      <main className="min-h-screen pb-20">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Check if we're on an admin route
  if (location.startsWith('/admin')) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/menu" component={AdminMenu} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/threads" component={AdminThreads} />
        <Route path="/admin/threads/:threadId">
          {({ threadId }) => <AdminThreadDetailPage threadId={threadId} />}
        </Route>
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/moderation" component={AdminModeration} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Show landing page for logged out users or while loading
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show protected content for logged in users
  return (
    <Switch>
      {/* Individual menu item pages without bottom navigation */}
      <Route path="/menu-item/:itemId">
        {({ itemId }) => <MenuItemPage itemId={itemId} />}
      </Route>
      
      {/* Messaging pages without bottom navigation */}
      <Route path="/messages/new" component={NewMessagePage} />
      <Route path="/messages/:threadId">
        {({ threadId }) => <ThreadDetailPage threadId={threadId} />}
      </Route>
      
      {/* Protected routes for authenticated users */}
      <Route path="/" component={MainApp} />
      <Route path="/menu" component={MainApp} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
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