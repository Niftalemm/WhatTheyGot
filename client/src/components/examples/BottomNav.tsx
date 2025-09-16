import BottomNav from '../BottomNav';
import { ThemeProvider } from '../ThemeProvider';
import { useState } from 'react';

export default function BottomNavExample() {
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <ThemeProvider>
      <div className="h-40 relative bg-background">
        <div className="p-4">
          <p className="text-center text-muted-foreground">
            Active tab: {activeTab}
          </p>
        </div>
        
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </ThemeProvider>
  );
}