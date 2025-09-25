import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Flag, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface MenuItemProps {
  id: string;
  name: string;
  station: string;
  calories?: number;
  allergens: string[];
  rating: number;
  reviewCount: number;
  image?: string;
  mealPeriod: string;
  isInCalorieCounter?: boolean;
  onRate: (itemId: string, rating: number) => void;
  onReview: (itemId: string) => void;
  onReport: (itemId: string) => void;
  onAddToCalorieCounter?: (item: { id: string; name: string; calories: number }) => void;
}

export default function MenuCard({
  id,
  name,
  station,
  calories,
  allergens,
  rating,
  reviewCount,
  image,
  mealPeriod,
  isInCalorieCounter = false,
  onRate,
  onReview,
  onReport,
  onAddToCalorieCounter
}: MenuItemProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleStarClick = (starRating: number) => {
    const mealStatus = checkMealPeriodStatus(mealPeriod);
    if (!mealStatus.isOpen) {
      toast({
        title: "Rating not available",
        description: mealStatus.nextOpening,
        variant: "destructive",
      });
      return;
    }
    setUserRating(starRating);
    onRate(id, starRating);
  };

  const handleCardClick = () => {
    setLocation(`/menu-item/${id}`);
  };

  // Check if meal period is currently open for reviews
  const checkMealPeriodStatus = (mealPeriod: string): { isOpen: boolean; reason?: string; nextOpening?: string } => {
    // Use America/Chicago timezone (same as backend)
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Operating hours (same as backend)
    const operatingHours = {
      breakfast: { start: 7, end: 9.5 }, // 7:00 AM - 9:30 AM
      lunch: { start: 11, end: 14 }, // 11:00 AM - 2:00 PM  
      liteDinner: { start: 14, end: 16 }, // 2:00 PM - 4:00 PM
      dinner: { start: 17, end: dayOfWeek === 5 ? 20 : 21 } // 5:00 PM - 9:00 PM (8 PM Friday)
    };

    const mealHours = operatingHours[mealPeriod as keyof typeof operatingHours];
    if (!mealHours) {
      return { isOpen: false, reason: "Invalid meal period" };
    }

    // Check if currently within operating hours
    if (hour >= mealHours.start && hour < mealHours.end) {
      return { isOpen: true };
    }

    // Calculate next opening time
    const formatTime = (hourNum: number) => {
      const hours = Math.floor(hourNum);
      const minutes = Math.round((hourNum - hours) * 60);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
      return `${displayHour}${displayMinutes} ${period}`;
    };

    let nextOpening = "";
    if (hour < mealHours.start) {
      // Before opening time today
      nextOpening = `today at ${formatTime(mealHours.start)}`;
    } else {
      // After closing time - next opening is tomorrow
      nextOpening = `tomorrow at ${formatTime(mealHours.start)}`;
    }

    const periodName = mealPeriod === 'liteDinner' ? 'Lite Dinner' : 
                      mealPeriod.charAt(0).toUpperCase() + mealPeriod.slice(1);
                      
    return {
      isOpen: false,
      reason: `${periodName} reviews are only available during serving hours (${formatTime(mealHours.start)} - ${formatTime(mealHours.end)})`,
      nextOpening: `Reviews will be available ${nextOpening}`
    };
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer" 
      data-testid={`card-menu-item-${id}`}
      onClick={handleCardClick}
    >
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            {calories && (
              <Badge variant="secondary" className="bg-black/70 text-white">
                {calories} cal
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight" data-testid={`text-item-name-${id}`}>
              {name}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-station-${id}`}>
              {station}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-medium" data-testid={`text-rating-${id}`}>
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Press to see reviews
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {allergens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allergens.map((allergen) => (
              <Badge key={allergen} variant="outline" className="text-xs">
                {allergen}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Quick rate:</span>
            {(() => {
              // Compute meal status once per render
              const mealStatus = checkMealPeriodStatus(mealPeriod);
              const isDisabled = !mealStatus.isOpen;
              
              return [1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`p-1 ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarClick(star);
                  }}
                  onMouseEnter={() => !isDisabled && setHoveredStar(star)}
                  onMouseLeave={() => !isDisabled && setHoveredStar(0)}
                  data-testid={`button-rate-${star}-${id}`}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      !isDisabled && star <= (hoveredStar || userRating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ));
            })()}
          </div>
        </div>

        <div className="flex gap-2">
          {calories && onAddToCalorieCounter && (
            <Button
              variant={isInCalorieCounter ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCalorieCounter({ id, name, calories });
              }}
              disabled={isInCalorieCounter}
              data-testid={`button-add-calories-${id}`}
            >
              <Plus className="w-4 h-4" />
              {isInCalorieCounter ? "Added" : "Add"}
            </Button>
          )}
          <Button 
            variant={(() => {
              const mealStatus = checkMealPeriodStatus(mealPeriod);
              return !mealStatus.isOpen ? "secondary" : "outline";
            })()} 
            size="sm" 
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              const mealStatus = checkMealPeriodStatus(mealPeriod);
              if (mealStatus.isOpen) {
                onReview(id);
              } else {
                toast({
                  title: "Reviews not available",
                  description: mealStatus.nextOpening,
                  variant: "destructive",
                });
              }
            }}
            data-testid={`button-review-${id}`}
          >
            <MessageCircle className="w-4 h-4" />
            Review
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReport(id);
            }}
            data-testid={`button-report-${id}`}
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}