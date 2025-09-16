import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onSubmit: (report: {
    type: string;
    description: string;
  }) => void;
}

const reportTypes = [
  { id: 'incorrect-info', label: 'Wrong menu information' },
  { id: 'not-available', label: 'Item not available' },
  { id: 'wrong-allergens', label: 'Incorrect allergen info' },
  { id: 'wrong-calories', label: 'Wrong calorie count' },
  { id: 'other', label: 'Other issue' },
];

export default function ReportModal({
  isOpen,
  onClose,
  itemName,
  onSubmit
}: ReportModalProps) {
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!reportType) return;
    
    onSubmit({
      type: reportType,
      description
    });
    
    // Reset form
    setReportType("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-report">
        <DialogHeader>
          <DialogTitle data-testid="text-report-title">
            Report Issue: {itemName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Report Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">What's wrong? *</label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              {reportTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={type.id}
                    id={type.id}
                    data-testid={`radio-report-${type.id}`}
                  />
                  <Label htmlFor={type.id} className="text-sm">
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional details</label>
            <Textarea
              placeholder="Please describe the issue in more detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
              data-testid="input-report-description"
            />
          </div>

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
              disabled={!reportType}
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