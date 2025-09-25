import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Calculator, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CalorieEntry {
  id: string;
  foodName: string;
  caloriesPerServing: number;
  quantity: number;
  savedAt: string;
}

export default function CalorieTracker() {
  const queryClient = useQueryClient();

  // Fetch today's calorie entries
  const { data: entries = [], isLoading } = useQuery<CalorieEntry[]>({
    queryKey: ["/api/calories"],
    staleTime: 30000, // 30 seconds
  });

  // Mutation to update quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return apiRequest("PATCH", `/api/calories/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calories"] });
    },
  });

  // Mutation to delete entry
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/calories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calories"] });
    },
  });

  const handleQuantityChange = (id: string, delta: number) => {
    const entry = entries.find((e: CalorieEntry) => e.id === id);
    if (!entry) return;

    const newQuantity = Math.max(1, entry.quantity + delta);
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const handleDelete = (id: string) => {
    deleteEntryMutation.mutate(id);
  };

  const totalCalories = entries.reduce(
    (sum: number, entry: CalorieEntry) => sum + entry.caloriesPerServing * entry.quantity,
    0
  );

  if (isLoading) {
    return (
      <Card data-testid="card-calorie-tracker">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Today's Calorie Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card data-testid="card-calorie-tracker">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Today's Calorie Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No calorie entries saved yet. Use the calorie counter above to save your meals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-calorie-tracker">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Today's Calorie Tracker
          </span>
          <span className="text-lg font-bold text-primary" data-testid="text-total-calories-tracker">
            {totalCalories} cal
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry: CalorieEntry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              data-testid={`calorie-entry-${entry.id}`}
            >
              <div className="flex-1">
                <p className="font-medium" data-testid={`text-food-name-${entry.id}`}>
                  {entry.foodName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.caloriesPerServing} cal per serving
                </p>
                <p className="text-sm font-medium text-primary">
                  Total: {entry.caloriesPerServing * entry.quantity} cal
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(entry.id, -1)}
                    disabled={entry.quantity <= 1 || updateQuantityMutation.isPending}
                    data-testid={`button-decrease-${entry.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <span 
                    className="px-3 py-1 bg-background border rounded min-w-[3rem] text-center font-medium"
                    data-testid={`text-quantity-${entry.id}`}
                  >
                    {entry.quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(entry.id, 1)}
                    disabled={updateQuantityMutation.isPending}
                    data-testid={`button-increase-${entry.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleteEntryMutation.isPending}
                  data-testid={`button-delete-${entry.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}