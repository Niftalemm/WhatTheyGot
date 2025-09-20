import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useState } from "react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onSubmit: (review: {
    rating: number;
    text: string;
    emoji: string;
  }) => void;
}

const emojiReactions = ["😋", "🔥", "👍", "😍", "🤤", "💯", "😐", "👎", "🤢"];

export default function ReviewModal({
  isOpen,
  onClose,
  itemName,
  onSubmit
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const handleSubmit = () => {
    if (rating === 0) return;
    
    onSubmit({
      rating,
      text: reviewText,
      emoji: selectedEmoji,
    });
    
    // Reset form
    setRating(0);
    setReviewText("");
    setSelectedEmoji("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-review">
        <DialogHeader>
          <DialogTitle data-testid="text-review-title">
            Review {itemName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-1"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  data-testid={`button-modal-rate-${star}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Reactions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">How was it?</label>
            <div className="flex flex-wrap gap-2">
              {emojiReactions.map((emoji) => (
                <button
                  key={emoji}
                  className={`p-2 rounded-lg border hover-elevate ${
                    selectedEmoji === emoji
                      ? "bg-primary/20 border-primary"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedEmoji(emoji)}
                  data-testid={`button-emoji-${emoji}`}
                >
                  <span className="text-2xl">{emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your thoughts</label>
            <Textarea
              placeholder="What did you think? Was it fresh? Tasty? Would you order again?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[80px]"
              data-testid="input-review-text"
            />
          </div>


          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1"
              data-testid="button-submit-review"
            >
              Post Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}