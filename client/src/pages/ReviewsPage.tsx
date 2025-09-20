import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AdminMessages from "@/components/AdminMessages";
import { format } from "date-fns";

export default function ReviewsPage() {
  const { data: reviews = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/reviews/recent'],
  });

  return (
    <div className="pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-4 px-4 z-10 border-b border-border">
        <h1 className="text-2xl font-bold" data-testid="text-reviews-title">
          Recent Reviews
        </h1>
        <p className="text-muted-foreground">
          See what students are saying
        </p>
      </div>
      
      <div className="px-4">
        <AdminMessages page="reviews" className="mt-4" />
      </div>
      
      <div className="space-y-4 px-4 pt-6">
        {isLoading ? (
          <div className="text-center py-8" data-testid="loading-reviews">
            Loading reviews...
          </div>
        ) : reviews?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-reviews">
            No reviews yet. Be the first to share your thoughts!
          </div>
        ) : (
          reviews?.map((review: any) => (
            <Card key={review.id} className="hover-elevate" data-testid={`card-review-${review.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="text-sm font-medium">
                      {review.user?.displayName?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm" data-testid={`text-reviewer-${review.id}`}>
                        {review.user?.displayName || "Anonymous"}
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
                        {review.menuItem?.itemName || "Unknown Item"}
                      </span>
                      <span>•</span>
                      <span>{review.menuItem?.station || "Unknown Station"}</span>
                      <span>•</span>
                      <span>{format(new Date(review.createdAt), "h:mm a")}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed" data-testid={`text-review-content-${review.id}`}>
                  {review.text || "No comment provided"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}