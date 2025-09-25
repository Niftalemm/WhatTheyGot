import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Flag } from "lucide-react";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AdminMessages from "@/components/AdminMessages";
import ReportReviewModal from "@/components/ReportReviewModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTimeCDT } from "@/lib/timezone";
import type { MenuItem, Review } from "@shared/schema";

export default function ReviewsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load saved profile image
  useEffect(() => {
    const savedImage = localStorage.getItem('userProfileImage');
    setProfileImage(savedImage);
  }, [user]);

  // First fetch all menu items
  const { data: menuItems = [], isLoading: isLoadingMenuItems } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu', today],
    queryFn: () => fetch(`/api/menu/${today}`).then(res => res.json()),
  });

  // Then fetch reviews for each menu item (only after menu items are loaded)
  const reviewQueries = useQueries({
    queries: menuItems.length ? menuItems.map(item => ({
      queryKey: ['/api/reviews', item.id],
      queryFn: () => fetch(`/api/reviews/${item.id}`).then(res => res.json()),
      enabled: !!item.id,
      placeholderData: [],
    })) : [],
  });

  // Flatten and combine all reviews with their menu item data
  const allReviews = reviewQueries
    .map((query, index) => {
      const menuItem = menuItems[index];
      return (query.data || []).map((review: Review) => ({
        ...review,
        menuItem,
      }));
    })
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = isLoadingMenuItems || reviewQueries.some(query => query.isLoading);
  const reviews = allReviews;

  // Report review mutation
  const reportMutation = useMutation({
    mutationFn: (reportData: { reviewId: string; reason: string; details?: string }) =>
      apiRequest('POST', '/api/review-reports', {
        reviewId: reportData.reviewId,
        reason: reportData.reason,
        details: reportData.details,
      }),
    onSuccess: () => {
      toast({
        title: "Review reported",
        description: "Thank you for your report. The review has been reported for moderation.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReportClick = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = (reportData: { reason: string; details?: string }) => {
    reportMutation.mutate({
      reviewId: selectedReviewId,
      ...reportData,
    });
  };

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
                    {((review.user?.id === user?.id) || (review.userId === user?.id)) && profileImage ? (
                      <AvatarImage src={profileImage} alt={review.user?.displayName || "User"} />
                    ) : null}
                    <AvatarFallback className="text-sm font-medium">
                      {review.user?.displayName?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleReportClick(review.id)}
                        data-testid={`button-report-${review.id}`}
                      >
                        <Flag className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid={`text-item-name-${review.id}`}>
                        {review.menuItem?.itemName || "Unknown Item"}
                      </span>
                      <span>•</span>
                      <span>{review.menuItem?.station || "Unknown Station"}</span>
                      <span>•</span>
                      <span>{formatTimeCDT(review.createdAt)}</span>
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
      
      <ReportReviewModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reviewId={selectedReviewId}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}