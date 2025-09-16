import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

//todo: remove mock functionality
const mockReviews = [
  {
    id: '1',
    userName: 'Alex M.',
    userInitials: 'AM',
    itemName: 'Classic Cheeseburger',
    station: 'Grill Station',
    rating: 5,
    emoji: '🔥',
    text: 'Actually fire! The patty was juicy and the fries were crispy. Would definitely get again.',
    timeAgo: '2 hours ago',
    image: null,
  },
  {
    id: '2', 
    userName: 'Sarah K.',
    userInitials: 'SK',
    itemName: 'Chicken Alfredo Pasta',
    station: 'International',
    rating: 4,
    emoji: '😋',
    text: 'Pretty good! Sauce was creamy but could use more seasoning.',
    timeAgo: '4 hours ago',
    image: null,
  },
  {
    id: '3',
    userName: 'Mike D.',
    userInitials: 'MD', 
    itemName: 'Garden Fresh Salad',
    station: 'Salad Bar',
    rating: 2,
    emoji: '😐',
    text: 'Lettuce was kinda wilted and the dressing was watery. Skip this one.',
    timeAgo: '6 hours ago',
    image: null,
  },
  {
    id: '4',
    userName: 'Jess L.',
    userInitials: 'JL',
    itemName: 'Fluffy Buttermilk Pancakes', 
    station: 'Grill Station',
    rating: 5,
    emoji: '🤤',
    text: 'OMG these are amazing! Fluffy and the syrup is the good stuff.',
    timeAgo: '8 hours ago',
    image: null,
  },
];

export default function ReviewsPage() {
  return (
    <div className="space-y-4 px-4 pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-4 z-10">
        <h1 className="text-2xl font-bold" data-testid="text-reviews-title">
          Recent Reviews
        </h1>
        <p className="text-muted-foreground">
          See what students are saying
        </p>
      </div>

      <div className="space-y-4">
        {mockReviews.map((review) => (
          <Card key={review.id} className="hover-elevate" data-testid={`card-review-${review.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="text-sm font-medium">
                    {review.userInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" data-testid={`text-reviewer-${review.id}`}>
                      {review.userName}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {review.emoji && (
                      <span className="text-lg">{review.emoji}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span data-testid={`text-item-name-${review.id}`}>
                      {review.itemName}
                    </span>
                    <span>•</span>
                    <span>{review.station}</span>
                    <span>•</span>
                    <span>{review.timeAgo}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed" data-testid={`text-review-content-${review.id}`}>
                {review.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}