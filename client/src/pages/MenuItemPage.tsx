import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Flag,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNowCDT } from "@/lib/timezone";
import type { MenuItem, Review, User } from "@shared/schema";
import ReviewModal from "@/components/ReviewModal";
import ReportReviewModal from "@/components/ReportReviewModal";

interface MenuItemPageProps {
  itemId: string;
}

// Helper functions for user display
function computeDisplayName(
  firstName: string | null,
  lastName: string | null,
): string {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (first && last) {
    return `${first} ${last}`;
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  } else {
    return "Anonymous User";
  }
}

function getInitials(
  firstName: string | null,
  lastName: string | null,
): string {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (first && last) {
    return (first[0] + last[0]).toUpperCase();
  } else if (first) {
    return first.slice(0, 2).toUpperCase();
  } else if (last) {
    return last.slice(0, 2).toUpperCase();
  } else {
    return "AU";
  }
}

export default function MenuItemPage({ itemId }: MenuItemPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    itemName: "",
  });
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    reviewId: "",
  });

  // Load saved profile image
  useEffect(() => {
    const savedImage = localStorage.getItem("userProfileImage");
    setProfileImage(savedImage);
  }, [user]);

  // Fetch menu item details
  const { data: menuItem, isLoading: isLoadingItem } = useQuery<MenuItem>({
    queryKey: ["/api/menu-item", itemId],
    enabled: !!itemId,
  });

  // Fetch reviews for this item
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<
    Review[]
  >({
    queryKey: ["/api/reviews", itemId],
    enabled: !!itemId,
  });

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return apiRequest("POST", "/api/reviews", {
        menuItemId: itemId,
        ...reviewData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/recent"] });
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setReviewModal({ ...reviewModal, isOpen: false });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReviewSubmit = (reviewData: any) => {
    reviewMutation.mutate(reviewData);
  };

  // Report review mutation
  const reportMutation = useMutation({
    mutationFn: async (reportData: {
      reviewId: string;
      reason: string;
      details?: string;
    }) => {
      return apiRequest("POST", `/api/review-reports`, {
        reviewId: reportData.reviewId,
        reason: reportData.reason,
        details: reportData.details,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/recent"] });
      toast({
        title: "Report submitted",
        description:
          "Thank you for reporting this review. It has been hidden and will be reviewed by moderators.",
      });
      setReportModal({ isOpen: false, reviewId: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit report",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReportReview = (reviewId: string) => {
    setReportModal({ isOpen: true, reviewId });
  };

  const handleReportSubmit = (reportData: {
    reason: string;
    details?: string;
  }) => {
    reportMutation.mutate({
      reviewId: reportModal.reviewId,
      ...reportData,
    });
  };

  // Check if meal period is currently open for reviews
  const checkMealPeriodStatus = (
    mealPeriod: string,
  ): { isOpen: boolean; reason?: string; nextOpening?: string } => {
    // Use America/Chicago timezone (same as backend)
    const now = new Date();
    const chicagoTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Operating hours (same as backend)
    const operatingHours = {
      breakfast: { start: 7, end: 9.5 }, // 7:00 AM - 9:30 AM
      lunch: { start: 11, end: 14 }, // 11:00 AM - 2:00 PM
      liteDinner: { start: 14, end: 16 }, // 2:00 PM - 4:00 PM
      dinner: { start: 17, end: dayOfWeek === 5 ? 20 : 21 }, // 5:00 PM - 9:00 PM (8 PM Friday)
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
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const displayMinutes =
        minutes === 0 ? "" : `:${minutes.toString().padStart(2, "0")}`;
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

    const periodName =
      mealPeriod === "liteDinner"
        ? "Lite Dinner"
        : mealPeriod.charAt(0).toUpperCase() + mealPeriod.slice(1);

    return {
      isOpen: false,
      reason: `${periodName} reviews are only available during serving hours (${formatTime(mealHours.start)} - ${formatTime(mealHours.end)})`,
      nextOpening: `Reviews will be available ${nextOpening}`,
    };
  };

  // Transform reviews for display with real user data
  const transformReview = (review: Review & { user?: User }) => {
    const displayName = review.user
      ? computeDisplayName(review.user.firstName, review.user.lastName)
      : "Anonymous User";
    const initials = review.user
      ? getInitials(review.user.firstName, review.user.lastName)
      : "AU";

    return {
      id: review.id,
      userName: displayName,
      userInitials: initials,
      profileImageUrl: review.user?.profileImageUrl || null,
      rating: review.rating,
      emoji: review.emoji,
      text: review.text,
      timeAgo: formatDistanceToNowCDT(review.createdAt as unknown as string),
      photoUrl: review.photoUrl,
    };
  };

  if (isLoadingItem) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!menuItem) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Item Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The menu item you're looking for could not be found.
            </p>
            <Button
              onClick={() => setLocation("/")}
              data-testid="button-back-to-menu"
            >
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation("/")}
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Menu
      </Button>

      {/* Item details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2" data-testid="text-item-name">
                {menuItem.itemName}
              </CardTitle>
              <p className="text-muted-foreground" data-testid="text-station">
                {menuItem.station}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span
                className="text-xl font-semibold"
                data-testid="text-avg-rating"
              >
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {menuItem.calories && (
              <div>
                <h4 className="font-medium mb-1">Calories</h4>
                <Badge variant="secondary" data-testid="text-calories">
                  {menuItem.calories} cal
                </Badge>
              </div>
            )}
            {menuItem.allergens && menuItem.allergens.length > 0 && (
              <div>
                <h4 className="font-medium mb-1">Allergens</h4>
                <div className="flex flex-wrap gap-1">
                  {menuItem.allergens.map((allergen: string) => (
                    <Badge
                      key={allergen}
                      variant="outline"
                      data-testid={`badge-allergen-${allergen}`}
                    >
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add review button */}
      <div className="mb-6">
        {(() => {
          const mealStatus = checkMealPeriodStatus(menuItem.mealPeriod);
          const isDisabled = !mealStatus.isOpen;

          return (
            <div>
              <Button
                onClick={() => {
                  if (mealStatus.isOpen) {
                    setReviewModal({
                      isOpen: true,
                      itemName: menuItem.itemName,
                    });
                  } else {
                    toast({
                      title: "Reviews not available",
                      description: mealStatus.nextOpening,
                      variant: "destructive",
                    });
                  }
                }}
                variant={isDisabled ? "secondary" : "default"}
                className="w-full sm:w-auto"
                data-testid="button-add-review"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
              {isDisabled && (
                <p
                  className="text-sm text-muted-foreground mt-2"
                  data-testid="text-review-closed-notice"
                >
                  {mealStatus.nextOpening}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Reviews section */}
      <div>
        <h2
          className="text-xl font-semibold mb-4"
          data-testid="text-reviews-title"
        >
          Reviews ({reviews.length})
        </h2>

        {isLoadingReviews ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to review this item!
              </p>
              {(() => {
                const mealStatus = checkMealPeriodStatus(menuItem.mealPeriod);
                const isDisabled = !mealStatus.isOpen;

                return (
                  <div>
                    <Button
                      onClick={() => {
                        if (mealStatus.isOpen) {
                          setReviewModal({
                            isOpen: true,
                            itemName: menuItem.itemName,
                          });
                        } else {
                          toast({
                            title: "Reviews not available",
                            description: mealStatus.nextOpening,
                            variant: "destructive",
                          });
                        }
                      }}
                      variant={isDisabled ? "secondary" : "default"}
                      data-testid="button-first-review"
                    >
                      Write First Review
                    </Button>
                    {isDisabled && (
                      <p
                        className="text-sm text-muted-foreground mt-3"
                        data-testid="text-first-review-closed-notice"
                      >
                        {mealStatus.nextOpening}
                      </p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: Review) => {
              const transformedReview = transformReview(review);
              return (
                <Card key={review.id} data-testid={`card-review-${review.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10">
                        {transformedReview.profileImageUrl ? (
                          <AvatarImage
                            src={transformedReview.profileImageUrl}
                            alt={`${transformedReview.userName}'s profile`}
                          />
                        ) : review.userId === user?.id && profileImage ? (
                          <AvatarImage src={profileImage} alt="Your profile" />
                        ) : null}
                        <AvatarFallback className="text-sm">
                          {transformedReview.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-medium text-sm"
                              data-testid={`text-reviewer-${review.id}`}
                            >
                              {transformedReview.userName}
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.emoji && (
                              <span
                                className="text-lg"
                                data-testid={`emoji-${review.id}`}
                              >
                                {review.emoji}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {transformedReview.timeAgo}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleReportReview(review.id)}
                              data-testid={`button-report-${review.id}`}
                            >
                              <Flag className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {review.text && (
                          <p
                            className="text-sm leading-relaxed"
                            data-testid={`text-review-content-${review.id}`}
                          >
                            {review.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        itemName={reviewModal.itemName}
        onSubmit={handleReviewSubmit}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, reviewId: "" })}
        reviewId={reportModal.reviewId}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
