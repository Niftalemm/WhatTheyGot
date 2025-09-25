import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Star, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateCDT } from "@/lib/timezone";
import { Link } from "wouter";

interface Review {
  id: string;
  rating: number;
  emoji: string;
  text: string;
  photoUrl?: string;
  deviceId: string;
  isFlagged: boolean;
  createdAt: string;
  menuItem: {
    id: string;
    name: string;
    station: string;
    mealPeriod: string;
    date: string;
  };
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No admin token found");
      }
      
      const response = await fetch("/api/admin/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          window.location.href = "/admin/login";
          throw new Error("Authentication failed");
        }
        throw new Error("Failed to fetch reviews");
      }

      return response.json();
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({
        title: "Review Deleted",
        description: "The inappropriate review has been permanently removed.",
      });
      setSelectedReview(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review);
  };

  const confirmDelete = () => {
    if (selectedReview) {
      deleteReviewMutation.mutate(selectedReview.id);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-primary text-primary" : "text-muted-foreground"
        }`}
      />
    ));
  };


  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Reviews</h2>
            <p className="text-muted-foreground">
              Unable to load reviews. Please check your authentication and try again.
            </p>
            <Link to="/admin/dashboard">
              <Button className="mt-4" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Review Management</h1>
              <p className="text-muted-foreground">
                View and moderate user reviews for inappropriate content
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reviews.length}</div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {reviews.filter((r) => r.isFlagged).length}
              </div>
              <div className="text-sm text-muted-foreground">Flagged Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {reviews.filter((r) => r.rating >= 4).length}
              </div>
              <div className="text-sm text-muted-foreground">High Rated (4-5★)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {reviews.filter((r) => r.rating <= 2).length}
              </div>
              <div className="text-sm text-muted-foreground">Low Rated (1-2★)</div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading reviews...</div>
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                No reviews found. Students haven't posted any reviews yet.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className={`${
                  review.isFlagged ? "border-destructive bg-destructive/5" : ""
                }`}
                data-testid={`card-review-${review.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold" data-testid={`text-menu-item-${review.id}`}>
                          {review.menuItem.name}
                        </h3>
                        <Badge variant="secondary" data-testid={`badge-station-${review.id}`}>
                          {review.menuItem.station}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-meal-${review.id}`}>
                          {review.menuItem.mealPeriod}
                        </Badge>
                        {review.isFlagged && (
                          <Badge variant="destructive" data-testid={`badge-flagged-${review.id}`}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex" data-testid={`rating-stars-${review.id}`}>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-2xl" data-testid={`emoji-${review.id}`}>
                          {review.emoji}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDateCDT(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteReview(review)}
                          data-testid={`button-delete-${review.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid="dialog-confirm-delete">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete this review? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Delete Review
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3" data-testid={`text-review-content-${review.id}`}>
                    {review.text}
                  </p>
                  {review.photoUrl && (
                    <img
                      src={review.photoUrl}
                      alt="Review photo"
                      className="w-32 h-32 object-cover rounded-md"
                      data-testid={`img-review-photo-${review.id}`}
                    />
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Device ID: {review.deviceId.substring(0, 12)}...
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}