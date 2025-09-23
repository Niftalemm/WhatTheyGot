import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Flag, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface MenuItemProps {
  id: string;
  name: string;
  station: string;
  calories?: number;
  allergens: string[];
  rating: number;
  reviewCount: number;
  image?: string;
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
  isInCalorieCounter = false,
  onRate,
  onReview,
  onReport,
  onAddToCalorieCounter
}: MenuItemProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [, setLocation] = useLocation();

  const handleStarClick = (starRating: number) => {
    setUserRating(starRating);
    onRate(id, starRating);
  };

  const handleCardClick = () => {
    setLocation(`/menu-item/${id}`);
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
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStarClick(star);
                }}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                data-testid={`button-rate-${star}-${id}`}
              >
                <Star
                  className={`w-4 h-4 transition-colors ${
                    star <= (hoveredStar || userRating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
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
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onReview(id);
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