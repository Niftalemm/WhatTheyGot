import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calculator } from "lucide-react";
import { useState } from "react";

interface CalorieItem {
  id: string;
  name: string;
  calories: number;
}

interface CalorieCounterProps {
  selectedItems: CalorieItem[];
  onRemoveItem: (itemId: string) => void;
  onClear: () => void;
}

export default function CalorieCounter({
  selectedItems,
  onRemoveItem,
  onClear
}: CalorieCounterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalCalories = selectedItems.reduce((sum, item) => sum + item.calories, 0);

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-16 z-40 bg-card/95 backdrop-blur-sm" data-testid="card-calorie-counter">
      <CardHeader 
        className="pb-2 cursor-pointer hover-elevate"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5" />
            Calorie Counter
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base font-bold" data-testid="text-total-calories">
              {totalCalories} cal
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              data-testid="button-clear-calories"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                data-testid={`calorie-item-${item.id}`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.calories} calories</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onRemoveItem(item.id)}
                  data-testid={`button-remove-${item.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}