import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

interface MealPeriodTabsProps {
  children: React.ReactNode;
  defaultValue?: string;
}

export default function MealPeriodTabs({ children, defaultValue = "breakfast" }: MealPeriodTabsProps) {
  const [nextMealInfo, setNextMealInfo] = useState<{ period: string; openTime: string } | null>(null);

  // Get next meal opening time
  const getNextMealOpening = () => {
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
    const dayOfWeek = chicagoTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Operating hours (same as backend)
    const operatingHours = {
      breakfast: { start: 7, end: 9.5 }, // 7:00 AM - 9:30 AM
      lunch: { start: 11, end: 14 }, // 11:00 AM - 2:00 PM  
      dinner: { start: 17, end: dayOfWeek === 5 ? 20 : 21 } // 5:00 PM - 9:00 PM (8 PM Friday)
    };

    const formatTime = (hourNum: number) => {
      const hours = Math.floor(hourNum);
      const minutes = Math.round((hourNum - hours) * 60);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
      return `${displayHour}${displayMinutes} ${period}`;
    };

    // Check each meal period to find the next one that will open
    const periods = ['breakfast', 'lunch', 'dinner'] as const;
    
    for (const period of periods) {
      const mealHours = operatingHours[period];
      
      // If we're currently before this meal period starts today
      if (hour < mealHours.start) {
        return {
          period,
          openTime: formatTime(mealHours.start)
        };
      }
    }

    // If we're past all meal periods for today, next opening is breakfast tomorrow
    return {
      period: 'breakfast',
      openTime: formatTime(operatingHours.breakfast.start)
    };
  };

  useEffect(() => {
    const updateNextMeal = () => {
      const next = getNextMealOpening();
      setNextMealInfo(next);
    };

    // Update immediately
    updateNextMeal();

    // Update every minute
    const interval = setInterval(updateNextMeal, 60000);

    return () => clearInterval(interval);
  }, []);

  // Check if a meal period is currently open
  const isMealPeriodOpen = (period: string) => {
    const now = new Date();
    const chicagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const hour = chicagoTime.getHours() + chicagoTime.getMinutes() / 60;
    const dayOfWeek = chicagoTime.getDay();
    
    const operatingHours = {
      breakfast: { start: 7, end: 9.5 },
      lunch: { start: 11, end: 14 },
      dinner: { start: 17, end: dayOfWeek === 5 ? 20 : 21 }
    };

    const mealHours = operatingHours[period as keyof typeof operatingHours];
    return mealHours && hour >= mealHours.start && hour < mealHours.end;
  };

  // Check if ANY meal period is currently open
  const isAnyMealPeriodOpen = () => {
    return isMealPeriodOpen('breakfast') || isMealPeriodOpen('lunch') || isMealPeriodOpen('dinner');
  };
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList className="grid w-full grid-cols-3" data-testid="tabs-meal-periods">
        <TabsTrigger value="breakfast" data-testid="tab-breakfast" className="flex flex-col gap-1">
          <span>Breakfast</span>
          {nextMealInfo?.period === 'breakfast' && !isMealPeriodOpen('breakfast') && !isAnyMealPeriodOpen() && (
            <span className="text-xs text-muted-foreground font-normal">
              Opens at {nextMealInfo.openTime}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="lunch" data-testid="tab-lunch" className="flex flex-col gap-1">
          <span>Lunch</span>
          {nextMealInfo?.period === 'lunch' && !isMealPeriodOpen('lunch') && !isAnyMealPeriodOpen() && (
            <span className="text-xs text-muted-foreground font-normal">
              Opens at {nextMealInfo.openTime}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="dinner" data-testid="tab-dinner" className="flex flex-col gap-1">
          <span>Dinner</span>
          {nextMealInfo?.period === 'dinner' && !isMealPeriodOpen('dinner') && !isAnyMealPeriodOpen() && (
            <span className="text-xs text-muted-foreground font-normal">
              Opens at {nextMealInfo.openTime}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}