import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MealPeriodTabsProps {
  children: React.ReactNode;
  defaultValue?: string;
}

export default function MealPeriodTabs({ children, defaultValue = "breakfast" }: MealPeriodTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList className="grid w-full grid-cols-3" data-testid="tabs-meal-periods">
        <TabsTrigger value="breakfast" data-testid="tab-breakfast">Breakfast</TabsTrigger>
        <TabsTrigger value="lunch" data-testid="tab-lunch">Lunch</TabsTrigger>
        <TabsTrigger value="dinner" data-testid="tab-dinner">Dinner</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}