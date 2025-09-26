import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calendar, UtensilsCrossed, Save, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';

type MenuItem = {
  id: string;
  date: string;
  mealPeriod: string;
  station: string;
  itemName: string;
  calories: number | null;
  allergens: string[];
  imageUrl: string | null;
  sourceUrl: string | null;
  createdAt: string;
};

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
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuForm, setMenuForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mealPeriod: 'breakfast',
    station: '',
    itemName: '',
    calories: '',
    allergens: [] as string[],
  });

  // Fetch existing menu items for the selected date
  const { data: menuItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/menu', selectedDate],
    enabled: !!selectedDate,
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/menu-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu', selectedDate] });
      toast({
        title: 'Menu Item Deleted',
        description: 'The menu item has been permanently removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ id, file, altText }: { id: string; file: File; altText?: string }) => {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('photo', file);
      if (altText) formData.append('altText', altText);
      
      const response = await fetch(`/api/admin/menu-items/${id}/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu', selectedDate] });
      toast({
        title: 'Photo Uploaded',
        description: 'Photo saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/menu-items/${id}/photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu', selectedDate] });
      toast({
        title: 'Photo Removed',
        description: 'Photo removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  // Update selected date when menuForm date changes
  useEffect(() => {
    setSelectedDate(menuForm.date);
  }, [menuForm.date]);

  const handlePhotoUpload = (menuItemId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only JPG, PNG, and WebP images are allowed.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be 5MB or less.',
        variant: 'destructive',
      });
      return;
    }

    uploadPhotoMutation.mutate({ id: menuItemId, file });
  };

  const handleDeleteMenuItem = (id: string) => {
    deleteMenuItemMutation.mutate(id);
  };

  const handleDeletePhoto = (id: string) => {
    deletePhotoMutation.mutate(id);
  };

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

  const PhotoUploadSection = ({ menuItem }: { menuItem: MenuItem }) => {
    const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handlePhotoUpload(menuItem.id, file);
      }
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    };

    return (
      <div className="space-y-2">
        <input
          ref={setFileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
          className="hidden"
          data-testid={`input-photo-${menuItem.id}`}
        />
        
        {menuItem.imageUrl ? (
          <div className="space-y-2">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
              <img
                src={menuItem.imageUrl}
                alt={`${menuItem.itemName} photo`}
                className="w-full h-full object-cover"
                data-testid={`img-preview-${menuItem.id}`}
              />
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef?.click()}
                disabled={uploadPhotoMutation.isPending}
                data-testid={`button-replace-photo-${menuItem.id}`}
              >
                <Upload className="w-3 h-3 mr-1" />
                Replace
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeletePhoto(menuItem.id)}
                disabled={deletePhotoMutation.isPending}
                data-testid={`button-remove-photo-${menuItem.id}`}
              >
                <X className="w-3 h-3 mr-1" />
                Remove Photo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground/50 mb-1" />
                <p className="text-xs text-muted-foreground">No photo yet. Upload one?</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef?.click()}
              disabled={uploadPhotoMutation.isPending}
              data-testid={`button-upload-photo-${menuItem.id}`}
            >
              <Upload className="w-3 h-3 mr-1" />
              Upload Photo
            </Button>
          </div>
        )}
      </div>
    );
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
              <p className="text-muted-foreground">Manage existing items and add new menu items</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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

          {/* Existing Menu Items */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Existing Menu Items
                    </CardTitle>
                    <CardDescription>
                      Items for {selectedDate} - Remove items or add photos
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="view-date" className="text-sm font-medium">
                      View Date:
                    </Label>
                    <Input
                      id="view-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-40"
                      data-testid="input-view-date"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingItems ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading menu items...</p>
                  </div>
                ) : menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No menu items found for {selectedDate}</p>
                    <p className="text-sm text-muted-foreground">Add items using the form on the left</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {['breakfast', 'lunch', 'liteDinner', 'dinner'].map((mealPeriod) => {
                      const mealItems = menuItems.filter((item: MenuItem) => item.mealPeriod === mealPeriod);
                      if (mealItems.length === 0) return null;

                      const mealDisplayNames: Record<string, string> = {
                        breakfast: 'Breakfast',
                        lunch: 'Lunch',
                        liteDinner: 'Lite Dinner',
                        dinner: 'Dinner',
                      };

                      return (
                        <div key={mealPeriod} className="space-y-2">
                          <h4 className="font-medium text-lg border-b pb-1">
                            {mealDisplayNames[mealPeriod]} ({mealItems.length} items)
                          </h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            {mealItems.map((item: MenuItem) => (
                              <div 
                                key={item.id} 
                                className="border rounded-lg p-4 space-y-3"
                                data-testid={`menu-item-card-${item.id}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-sm">{item.itemName}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">{item.station}</Badge>
                                      {item.calories && (
                                        <span className="text-xs text-muted-foreground">
                                          {item.calories} cal
                                        </span>
                                      )}
                                    </div>
                                    {item.allergens.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.allergens.map((allergen) => (
                                          <Badge key={allergen} variant="outline" className="text-xs">
                                            {allergen}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={deleteMenuItemMutation.isPending}
                                        data-testid={`button-delete-${item.id}`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent data-testid={`dialog-confirm-delete-${item.id}`}>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove menu item?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Remove this menu item? This can't be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel data-testid={`button-cancel-delete-${item.id}`}>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteMenuItem(item.id)}
                                          data-testid={`button-confirm-delete-${item.id}`}
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                
                                <div className="pt-2 border-t">
                                  <PhotoUploadSection menuItem={item} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}