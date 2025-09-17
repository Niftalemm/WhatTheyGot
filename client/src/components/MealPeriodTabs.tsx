import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MealPeriodTabsProps {
  children: React.ReactNode;
  defaultValue?: string;
}

// Helper function to get current meal period status in America/Chicago timezone
function getMealPeriodStatus(mealPeriod: string): string {
  // Get current time in America/Chicago timezone (handles CDT/CST automatically)
  const now = new Date();
  
  // Create a date in America/Chicago timezone
  const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const decimalHour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
  const dayOfWeek = chicagoTime.getDay(); // 0=Sunday, 1=Monday, etc.
  
  // Check if it's Friday (5) for different dinner hours
  const dinnerEnd = dayOfWeek === 5 ? 20 : 21; // 8 PM Friday, 9 PM other days
  
  switch (mealPeriod) {
    case 'breakfast':
      if (decimalHour >= 7 && decimalHour < 9.5) {
        return 'OPEN NOW';
      } else {
        return 'OPENS AT 7:00 AM';
      }
    case 'lunch':
      if (decimalHour >= 11 && decimalHour < 14) {
        return 'OPEN NOW';
      } else if (decimalHour < 11) {
        return 'OPENS AT 11:00 AM';
      } else {
        return 'CLOSED - OPENS AT 11:00 AM';
      }
    case 'dinner':
      if (decimalHour >= 17 && decimalHour < dinnerEnd) {
        return 'OPEN NOW';
      } else if (decimalHour >= 14 && decimalHour < 17) {
        return 'LITE DINNER 2:00-4:00 PM';
      } else if (decimalHour < 17) {
        return 'OPENS AT 5:00 PM';
      } else {
        return dayOfWeek === 5 ? 'CLOSED - OPENS MON 5:00 PM' : 'CLOSED - OPENS AT 5:00 PM';
      }
    default:
      return '';
  }
}

export default function MealPeriodTabs({ children, defaultValue = "breakfast" }: MealPeriodTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList className="grid w-full grid-cols-3" data-testid="tabs-meal-periods">
        <TabsTrigger value="breakfast" data-testid="tab-breakfast" className="flex flex-col py-3 h-auto">
          <span className="font-medium">Breakfast</span>
          <span className="text-xs text-muted-foreground">{getMealPeriodStatus('breakfast')}</span>
        </TabsTrigger>
        <TabsTrigger value="lunch" data-testid="tab-lunch" className="flex flex-col py-3 h-auto">
          <span className="font-medium">Lunch</span>
          <span className="text-xs text-muted-foreground">{getMealPeriodStatus('lunch')}</span>
        </TabsTrigger>
        <TabsTrigger value="dinner" data-testid="tab-dinner" className="flex flex-col py-3 h-auto">
          <span className="font-medium">Dinner</span>
          <span className="text-xs text-muted-foreground">{getMealPeriodStatus('dinner')}</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}