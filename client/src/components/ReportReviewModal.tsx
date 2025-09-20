import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  onSubmit: (reportData: { reason: string; details?: string }) => void;
}

const reportReasons = [
  { value: "spam", label: "Spam or repetitive content" },
  { value: "inappropriate", label: "Inappropriate language or content" },
  { value: "fake", label: "Fake or misleading review" },
  { value: "harassment", label: "Harassment or personal attack" },
  { value: "other", label: "Other (please specify)" },
];

export default function ReportReviewModal({
  isOpen,
  onClose,
  reviewId,
  onSubmit
}: ReportReviewModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    
    onSubmit({
      reason,
      details: details.trim() || undefined,
    });
    
    // Reset form
    setReason("");
    setDetails("");
    onClose();
  };

  const selectedReason = reportReasons.find(r => r.value === reason);
  const showDetailsField = reason === "other" || reason !== "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-report-review">
        <DialogHeader>
          <DialogTitle data-testid="text-report-title">
            Report Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Report Reason */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you reporting this review?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    data-testid={`radio-reason-${option.value}`}
                  />
                  <Label 
                    htmlFor={option.value} 
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          {showDetailsField && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {reason === "other" ? "Please explain" : "Additional details (optional)"}
              </Label>
              <Textarea
                placeholder={reason === "other" 
                  ? "Please describe the issue with this review..." 
                  : "Any additional context you'd like to provide..."
                }
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-report-details"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason}
              className="flex-1"
              data-testid="button-submit-report"
            >
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}