import MealPeriodTabs from '../MealPeriodTabs';
import { TabsContent } from "@/components/ui/tabs";

export default function MealPeriodTabsExample() {
  return (
    <div className="w-full max-w-md">
      <MealPeriodTabs>
        <TabsContent value="breakfast" className="mt-4">
          <p className="text-center text-muted-foreground">Breakfast menu items would go here</p>
        </TabsContent>
        <TabsContent value="lunch" className="mt-4">
          <p className="text-center text-muted-foreground">Lunch menu items would go here</p>
        </TabsContent>
        <TabsContent value="dinner" className="mt-4">
          <p className="text-center text-muted-foreground">Dinner menu items would go here</p>
        </TabsContent>
      </MealPeriodTabs>
    </div>
  );
}