import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Calendar, UtensilsCrossed, Save } from 'lucide-react';

const STATIONS = [
  'SIZZLE', 'BLISS', 'GROWN', 'ACTION STATION', 'SHOWCASE', 
  'SIMPLE SERVINGS', 'SIPS', 'SLICES', 'STACKED', 'TOSSED', 'TWISTS'
];

const ALLERGENS = [
  'eggs', 'milk', 'peanuts', 'tree nuts', 'fish', 'shellfish', 
  'wheat', 'soy', 'gluten', 'sesame', 'mustard', 'sulphites'
];

export default function AdminMenu() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [menuForm, setMenuForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mealPeriod: 'breakfast',
    station: '',
    itemName: '',
    calories: '',
    allergens: [] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  const handleAllergenToggle = (allergen: string) => {
    setMenuForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...menuForm,
          calories: menuForm.calories ? parseInt(menuForm.calories) : null,
          sourceUrl: 'https://mnsu.sodexomyway.com/en-us/locations/university-dining-center',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Menu Item Added!',
          description: `${menuForm.itemName} has been added to the ${menuForm.mealPeriod} menu.`,
        });
        
        // Reset form
        setMenuForm({
          date: new Date().toISOString().split('T')[0],
          mealPeriod: 'breakfast',
          station: '',
          itemName: '',
          calories: '',
          allergens: [],
        });
      } else {
        throw new Error('Failed to add menu item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add menu item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/admin/dashboard')}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Menu Management</h1>
              <p className="text-muted-foreground">Add menu items manually for specific dates and meal periods</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Menu Item Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add Menu Item
              </CardTitle>
              <CardDescription>
                Manually add a new menu item for a specific date and meal period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={menuForm.date}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    data-testid="input-menu-date"
                  />
                </div>

                {/* Meal Period */}
                <div className="space-y-2">
                  <Label htmlFor="mealPeriod">Meal Period</Label>
                  <Select 
                    value={menuForm.mealPeriod} 
                    onValueChange={(value) => setMenuForm(prev => ({ ...prev, mealPeriod: value }))}
                  >
                    <SelectTrigger data-testid="select-meal-period">
                      <SelectValue placeholder="Select meal period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast (7:00 AM - 9:30 AM)</SelectItem>
                      <SelectItem value="lunch">Lunch (11:00 AM - 2:00 PM)</SelectItem>
                      <SelectItem value="liteDinner">Lite Dinner (2:00 PM - 4:00 PM)</SelectItem>
                      <SelectItem value="dinner">Dinner (5:00 PM - 9:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Station */}
                <div className="space-y-2">
                  <Label htmlFor="station">Dining Station</Label>
                  <Select 
                    value={menuForm.station} 
                    onValueChange={(value) => setMenuForm(prev => ({ ...prev, station: value }))}
                  >
                    <SelectTrigger data-testid="select-station">
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map(station => (
                        <SelectItem key={station} value={station}>{station}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Item Name */}
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., Scrambled Eggs, Pepperoni Pizza"
                    value={menuForm.itemName}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, itemName: e.target.value }))}
                    required
                    data-testid="input-item-name"
                  />
                </div>

                {/* Calories */}
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories (optional)</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="e.g., 250"
                    value={menuForm.calories}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, calories: e.target.value }))}
                    data-testid="input-calories"
                  />
                </div>

                {/* Allergens */}
                <div className="space-y-2">
                  <Label>Allergens</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ALLERGENS.map(allergen => (
                      <div 
                        key={allergen}
                        className={`p-2 border rounded cursor-pointer text-center text-sm ${
                          menuForm.allergens.includes(allergen) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleAllergenToggle(allergen)}
                        data-testid={`allergen-${allergen}`}
                      >
                        {allergen}
                      </div>
                    ))}
                  </div>
                  {menuForm.allergens.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Selected allergens:</p>
                      <div className="flex flex-wrap gap-1">
                        {menuForm.allergens.map(allergen => (
                          <Badge key={allergen} variant="outline">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !menuForm.station || !menuForm.itemName}
                  data-testid="button-add-menu-item"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Adding...' : 'Add Menu Item'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UtensilsCrossed className="w-5 h-5 mr-2" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">MNSU Operating Hours</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Breakfast: 7:00 AM - 9:30 AM</li>
                  <li>• Lunch: 11:00 AM - 2:00 PM</li>
                  <li>• Lite Dinner: 2:00 PM - 4:00 PM</li>
                  <li>• Dinner: 5:00 PM - 9:00 PM (8 PM Friday)</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Popular Stations</h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• <strong>SIZZLE:</strong> Grilled items, eggs</li>
                  <li>• <strong>BLISS:</strong> Desserts, pastries</li>
                  <li>• <strong>GROWN:</strong> Fresh produce, salads</li>
                  <li>• <strong>SLICES:</strong> Pizza varieties</li>
                  <li>• <strong>SIMPLE SERVINGS:</strong> Allergy-friendly</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Best Practices</h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Use descriptive item names</li>
                  <li>• Include allergen information</li>
                  <li>• Add calorie counts when available</li>
                  <li>• Plan menus a day ahead</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}