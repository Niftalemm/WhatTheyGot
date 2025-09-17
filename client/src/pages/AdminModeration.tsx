import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Ban, Eye, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  menuItemId: string;
  rating: number;
  emoji: string | null;
  text: string | null;
  photoUrl: string | null;
  deviceId: string;
  isFlagged: boolean;
  moderationStatus: 'approved' | 'pending' | 'rejected';
  moderationScores: string | null;
  flaggedReason: string | null;
  createdAt: string;
  menuItem: {
    id: string;
    name: string;
    description: string;
  };
}

interface BannedDevice {
  id: string;
  deviceIdHash: string;
  reason: string;
  strikes: number;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminModeration() {
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [banDevice, setBanDevice] = useState(false);

  // Fetch pending reviews for moderation
  const { data: pendingReviews = [], refetch: refetchPending } = useQuery({
    queryKey: ["/api/admin/moderation/pending"],
    queryFn: async () => {
      const response = await fetch('/api/admin/moderation/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch pending reviews');
      return response.json();
    },
  });

  // Fetch banned devices
  const { data: bannedDevices = [], refetch: refetchBanned } = useQuery({
    queryKey: ["/api/admin/moderation/banned"],
    queryFn: async () => {
      const response = await fetch('/api/admin/moderation/banned', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch banned devices');
      return response.json();
    },
  });

  // Approve review mutation
  const approveMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await fetch(`/api/admin/moderation/approve/${reviewId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to approve');
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Review approved successfully" });
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: () => {
      toast({ description: "Failed to approve review", variant: "destructive" });
    },
  });

  // Reject review mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ reviewId, reason, ban }: { reviewId: string; reason: string; ban: boolean }) => {
      const response = await fetch(`/api/admin/moderation/reject/${reviewId}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, banDevice: ban }),
      });
      if (!response.ok) throw new Error('Failed to reject');
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Review rejected successfully" });
      refetchPending();
      refetchBanned();
      setSelectedReview(null);
      setRejectionReason("");
      setBanDevice(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: () => {
      toast({ description: "Failed to reject review", variant: "destructive" });
    },
  });

  // Unban device mutation
  const unbanMutation = useMutation({
    mutationFn: async (deviceIdHash: string) => {
      const response = await fetch(`/api/admin/moderation/unban/${deviceIdHash}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to unban');
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Device unbanned successfully" });
      refetchBanned();
    },
    onError: () => {
      toast({ description: "Failed to unban device", variant: "destructive" });
    },
  });

  const handleApprove = (reviewId: string) => {
    approveMutation.mutate(reviewId);
  };

  const handleReject = () => {
    if (!selectedReview) return;
    rejectMutation.mutate({
      reviewId: selectedReview.id,
      reason: rejectionReason.trim() || "Inappropriate content",
      ban: banDevice,
    });
  };

  const handleUnban = (deviceIdHash: string) => {
    unbanMutation.mutate(deviceIdHash);
  };

  const parseModerationScores = (scoresJson: string | null) => {
    if (!scoresJson) return {};
    try {
      return JSON.parse(scoresJson);
    } catch {
      return {};
    }
  };

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="admin-moderation-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review flagged content and manage user bans
          </p>
        </div>
        <Badge variant="outline" data-testid="pending-count">
          {(pendingReviews as Review[]).length} pending reviews
        </Badge>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Reviews ({(pendingReviews as Review[]).length})
          </TabsTrigger>
          <TabsTrigger value="banned" data-testid="tab-banned">
            Banned Devices ({(bannedDevices as BannedDevice[]).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {(pendingReviews as Review[]).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No reviews are currently pending moderation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(pendingReviews as Review[]).map((review: Review) => {
                const scores = parseModerationScores(review.moderationScores);
                const maxScore = Math.max(...Object.values(scores).map(s => typeof s === 'number' ? s : 0));
                
                return (
                  <Card key={review.id} className="border-orange-200 dark:border-orange-800" data-testid={`pending-review-${review.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {review.menuItem.name}
                          </CardTitle>
                          <CardDescription>
                            Rating: {review.rating}/5 • 
                            {formatDistanceToNow(new Date(review.createdAt))} ago
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending Review
                          </Badge>
                          {maxScore > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Risk: {formatScore(maxScore)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {review.text && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Review Text:</p>
                          <p className="whitespace-pre-wrap">{review.text}</p>
                        </div>
                      )}

                      {review.flaggedReason && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                            AI Detection:
                          </p>
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            {review.flaggedReason}
                          </p>
                        </div>
                      )}

                      {Object.keys(scores).length > 0 && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Moderation Scores:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {Object.entries(scores).map(([category, score]) => (
                              <div key={category} className="flex justify-between">
                                <span className="capitalize">
                                  {category.toLowerCase().replace('_', ' ')}:
                                </span>
                                <span className={(typeof score === 'number' && score > 0.6) ? 'text-red-600 font-medium' : ''}>
                                  {formatScore(typeof score === 'number' ? score : 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleApprove(review.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1"
                          data-testid={`button-approve-${review.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => setSelectedReview(review)}
                          disabled={rejectMutation.isPending}
                          className="flex-1"
                          data-testid={`button-reject-${review.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="banned" className="space-y-4">
          {(bannedDevices as BannedDevice[]).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Eye className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No banned devices</h3>
                <p className="text-muted-foreground">
                  All devices are currently allowed to post reviews.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(bannedDevices as BannedDevice[]).map((device: BannedDevice) => (
                <Card key={device.id} className="border-red-200 dark:border-red-800" data-testid={`banned-device-${device.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Ban className="w-5 h-5 text-red-500" />
                          Device {device.deviceIdHash.slice(0, 8)}...
                        </CardTitle>
                        <CardDescription>
                          Banned {formatDistanceToNow(new Date(device.createdAt))} ago
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">
                        {device.strikes} strike{device.strikes !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        Ban Reason:
                      </p>
                      <p className="text-red-700 dark:text-red-300">{device.reason}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Expires: {device.expiresAt 
                          ? formatDistanceToNow(new Date(device.expiresAt), { addSuffix: true })
                          : "Never (permanent)"
                        }
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(device.deviceIdHash)}
                        disabled={unbanMutation.isPending}
                        data-testid={`button-unban-${device.id}`}
                      >
                        Unban Device
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Review Dialog */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Reject Review</CardTitle>
              <CardDescription>
                Provide a reason for rejecting this review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Review:</p>
                <p className="text-sm">{selectedReview.text || "No text content"}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejecting this review..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  data-testid="textarea-rejection-reason"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ban-device"
                  checked={banDevice}
                  onCheckedChange={(checked) => setBanDevice(checked as boolean)}
                  data-testid="checkbox-ban-device"
                />
                <Label htmlFor="ban-device" className="text-sm">
                  Ban this device for 7 days (recommended for serious violations)
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReview(null);
                    setRejectionReason("");
                    setBanDevice(false);
                  }}
                  disabled={rejectMutation.isPending}
                  className="flex-1"
                  data-testid="button-cancel-reject"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="flex-1"
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject & "}
                  {banDevice ? "Ban" : "Keep User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}