import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation, useSearch } from "wouter";
import AppBanner from "@/components/AppBanner";
import AdminMessages from "@/components/AdminMessages";
import HeroSection from "@/components/HeroSection";
import MealPeriodTabs from "@/components/MealPeriodTabs";
import StationCarousel from "@/components/StationCarousel";
import MenuCard from "@/components/MenuCard";
import ReviewModal from "@/components/ReviewModal";
import ReportModal from "@/components/ReportModal";
import CalorieCounter from "@/components/CalorieCounter";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Leaf, Flame, WheatOff, UtensilsCrossed } from "lucide-react";
import type { MenuItem, Review } from "@shared/schema";
import breakfastImage from '@assets/generated_images/University_breakfast_spread_hero_5b900fb1.png';
import lunchImage from '@assets/generated_images/University_lunch_spread_hero_3f701dd6.png';
import dinnerImage from '@assets/generated_images/University_dinner_spread_hero_9c67f7bd.png';
import { ProtectedContent } from "@/components/ProtectedContent";

// Real MNSU Dining Station mapping for better display
const stationDisplayNames: Record<string, { name: string; description: string }> = {
  'BLISS': { name: 'BLISS', description: 'Sweet treats & desserts' },
  'GROWN': { name: 'GROWN', description: 'Fresh & healthy options' },
  'SHOWCASE': { name: 'SHOWCASE', description: 'Featured specialties' },
  'SIMPLE SERVINGS': { name: 'SIMPLE SERVINGS', description: 'Classic comfort food' },
  'SIPS': { name: 'SIPS', description: 'Beverages & drinks' },
  'SIZZLE': { name: 'SIZZLE', description: 'Grilled favorites' },
  'SLICES': { name: 'SLICES', description: 'Pizza & breadsticks' },
  'STACKED': { name: 'STACKED', description: 'Sandwiches & wraps' },
  'TOSSED': { name: 'TOSSED', description: 'Fresh salads' },
  'TWISTS': { name: 'TWISTS', description: 'Pasta & Italian' }
};

// Transform menu items for display
const transformMenuItem = (item: MenuItem, reviews: Review[] = []) => {
  const itemReviews = reviews.filter(r => r.menuItemId === item.id);
  const avgRating = itemReviews.length > 0 
    ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length 
    : 0;

  return {
    id: item.id,
    name: item.itemName,
    station: stationDisplayNames[item.station]?.name || item.station,
    calories: item.calories || 0,
    allergens: item.allergens || [],
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: itemReviews.length,
    image: getImageForMealPeriod(item.mealPeriod),
  };
};

const getImageForMealPeriod = (mealPeriod: string) => {
  switch (mealPeriod) {
    case 'breakfast': return breakfastImage;
    case 'lunch': return lunchImage;
    case 'dinner': return dinnerImage;
    default: return breakfastImage;
  }
};

interface CalorieItem {
  id: string;
  name: string;
  calories: number;
}

export default function MenuPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const activeFilter = searchParams.get('filter');
  
  const [activeStation, setActiveStation] = useState('All');
  const [reviewModal, setReviewModal] = useState({ isOpen: false, itemName: '', itemId: '' });
  const [reportModal, setReportModal] = useState({ isOpen: false, itemName: '', itemId: '' });
  const [calorieItems, setCalorieItems] = useState<CalorieItem[]>([]);

  const today = new Date().toISOString().split('T')[0];

  // Clear filter function
  const clearFilter = () => {
    setLocation('/menu');
  };

  // Filter icons and labels
  const filterConfig = {
    vegan: { icon: Leaf, label: 'Vegan', color: 'text-green-500' },
    spicy: { icon: Flame, label: 'Spicy', color: 'text-red-500' },
    'gluten-free': { icon: WheatOff, label: 'Gluten-Free', color: 'text-yellow-500' },
    comfort: { icon: UtensilsCrossed, label: 'Comfort Food', color: 'text-blue-500' }
  };

  // Initialize app with sample data
  useEffect(() => {
    const initApp = async () => {
      try {
        await fetch('/api/init');
      } catch (error) {
        console.log('Init check failed, continuing anyway');
      }
    };
    initApp();
  }, []);

  // Fetch all menu items for today with optional filtering
  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu', today, activeFilter],
    queryFn: () => {
      const url = activeFilter 
        ? `/api/menu/${today}?filter=${activeFilter}`
        : `/api/menu/${today}`;
      return fetch(url).then(res => res.json());
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent unnecessary refetches
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Fetch reviews for each menu item individually (only after menu items are loaded)
  const reviewQueries = useQueries({
    queries: menuItems.length ? menuItems.map(item => ({
      queryKey: ['/api/reviews', item.id],
      queryFn: () => fetch(`/api/reviews/${item.id}`).then(res => res.json()),
      enabled: !!item.id,
      placeholderData: [],
    })) : [],
  });

  // Group menu items by meal period and filter by active station
  const menuItemsByMeal = menuItems
    .filter(item => activeStation === 'All' || item.station === activeStation)
    .reduce((acc, item) => {
      if (!acc[item.mealPeriod]) acc[item.mealPeriod] = [];
      // Find the corresponding reviews for this item
      const itemIndex = menuItems.findIndex(mi => mi.id === item.id);
      const itemReviews = reviewQueries[itemIndex]?.data || [];
      acc[item.mealPeriod].push(transformMenuItem(item, itemReviews));
      return acc;
    }, {} as Record<string, any[]>);

  // Get unique stations from menu items with "All" option
  const stations = [
    { id: 'All', name: 'All Stations', description: 'View all dining stations' },
    ...Array.from(new Set(menuItems.map(item => item.station)))
      .map(station => ({
        id: station,
        name: stationDisplayNames[station]?.name || station,
        description: stationDisplayNames[station]?.description || 'Delicious food'
      }))
  ];

  // Mutations for reviews and reports
  const reviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await apiRequest('POST', '/api/reviews', reviewData);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      // Invalidate the specific item's reviews and menu queries to update ratings
      queryClient.invalidateQueries({ queryKey: ['/api/reviews', variables.menuItemId] });
      queryClient.invalidateQueries({ queryKey: ['/api/menu', today] });
      setReviewModal({ isOpen: false, itemName: '', itemId: '' });
    },
    onError: (error: any) => {
      console.error('Review submission error:', error);
      toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest('POST', '/api/reports', reportData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report submitted!", description: "Thank you for reporting this issue." });
      setReportModal({ isOpen: false, itemName: '', itemId: '' });
    },
    onError: (error: any) => {
      console.error('Report submission error:', error);
      toast({ title: "Error", description: "Failed to submit report. Please try again.", variant: "destructive" });
    },
  });

  const handleRate = (itemId: string, rating: number) => {
    // For quick ratings, submit as review with just rating
    reviewMutation.mutate({
      menuItemId: itemId,
      rating,
    });
  };

  const handleReview = (itemId: string) => {
    const item = Object.values(menuItemsByMeal).flat().find(i => i.id === itemId);
    if (item) {
      setReviewModal({ isOpen: true, itemName: item.name, itemId });
    }
  };

  const handleReport = (itemId: string) => {
    const item = Object.values(menuItemsByMeal).flat().find(i => i.id === itemId);
    if (item) {
      setReportModal({ isOpen: true, itemName: item.name, itemId });
    }
  };

  const handleReviewSubmit = (review: any) => {
    reviewMutation.mutate({
      menuItemId: reviewModal.itemId,
      ...review,
    });
  };

  const handleReportSubmit = (report: any) => {
    reportMutation.mutate({
      menuItemId: reportModal.itemId,
      ...report,
    });
  };

  const handleAddToCalorieCounter = (item: CalorieItem) => {
    if (!calorieItems.find(i => i.id === item.id)) {
      setCalorieItems(prev => [...prev, item]);
    }
  };

  const handleRemoveFromCalorieCounter = (itemId: string) => {
    setCalorieItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCalorieCounter = () => {
    setCalorieItems([]);
  };

  if (isLoadingMenu) {
    return (
      <div className="pb-20">
        <AppBanner />
        <div className="px-4">
          <AdminMessages page="menu" className="mt-4" />
        </div>
        <div className="px-4 pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading today's menu...</p>
          </div>
        </div>
      </div>
    );
  }

  const getCurrentMeal = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 16) return 'Lunch';
    return 'Dinner';
  };

  return (
    <div className="pb-20">
      <AppBanner />
      <div className="px-4">
        <AdminMessages page="menu" className="mt-4" />
      </div>
      
      <CalorieCounter
        selectedItems={calorieItems}
        onRemoveItem={handleRemoveFromCalorieCounter}
        onClear={handleClearCalorieCounter}
      />

      <div className="space-y-6 px-4 pt-6">
        {/* Active Filter Indicator */}
        {activeFilter && filterConfig[activeFilter as keyof typeof filterConfig] && (
          <div className="flex items-center justify-between bg-accent/50 rounded-lg p-3 border">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const config = filterConfig[activeFilter as keyof typeof filterConfig];
                  const IconComponent = config.icon;
                  return (
                    <>
                      <IconComponent className={`w-4 h-4 ${config.color}`} />
                      <span className="font-medium">Filtering by: {config.label}</span>
                    </>
                  );
                })()}
              </div>
              <Badge variant="secondary" data-testid="badge-filtered-count">
                {menuItems.length} items
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilter}
              data-testid="button-clear-filter"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filter
            </Button>
          </div>
        )}

        <HeroSection
          title={activeFilter ? `${filterConfig[activeFilter as keyof typeof filterConfig]?.label || 'Filtered'} Menu` : "MNSU Dining Center"}
          subtitle={activeFilter ? `Showing ${filterConfig[activeFilter as keyof typeof filterConfig]?.label.toLowerCase() || 'filtered'} options available today` : `${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} Menu`}
          backgroundImage={getImageForMealPeriod(getCurrentMeal().toLowerCase())}
          currentMeal={getCurrentMeal()}
          lastUpdated={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />

        {stations.length > 0 && (
          <StationCarousel
            stations={stations}
            onStationSelect={setActiveStation}
            activeStation={activeStation}
          />
        )}

        <MealPeriodTabs>
          {Object.entries(menuItemsByMeal).map(([mealPeriod, items]) => (
            <TabsContent key={mealPeriod} value={mealPeriod} className="mt-6">
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No menu items available for {mealPeriod}</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <ProtectedContent key={item.id} blurLevel="md">
                      <MenuCard
                        {...item}
                        isInCalorieCounter={calorieItems.some(ci => ci.id === item.id)}
                        onRate={handleRate}
                        onReview={handleReview}
                        onReport={handleReport}
                        onAddToCalorieCounter={item.calories ? handleAddToCalorieCounter : undefined}
                      />
                    </ProtectedContent>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </MealPeriodTabs>

        {Object.keys(menuItemsByMeal).length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No menu available for today. Check back later!</p>
          </div>
        )}
      </div>

      <ProtectedContent>
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
          itemName={reviewModal.itemName}
          onSubmit={handleReviewSubmit}
        />

        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({ ...reportModal, isOpen: false })}
          itemName={reportModal.itemName}
          onSubmit={handleReportSubmit}
        />
      </ProtectedContent>
    </div>
  );
}