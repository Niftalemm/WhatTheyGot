import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import MealPeriodTabs from "@/components/MealPeriodTabs";
import StationCarousel from "@/components/StationCarousel";
import MenuCard from "@/components/MenuCard";
import ReviewModal from "@/components/ReviewModal";
import ReportModal from "@/components/ReportModal";
import { TabsContent } from "@/components/ui/tabs";
import breakfastImage from '@assets/generated_images/University_breakfast_spread_hero_5b900fb1.png';
import lunchImage from '@assets/generated_images/University_lunch_spread_hero_3f701dd6.png';
import dinnerImage from '@assets/generated_images/University_dinner_spread_hero_9c67f7bd.png';

//todo: remove mock functionality
const mockStations = [
  { id: 'grill', name: 'Grill Station', description: 'Burgers, fries & classics' },
  { id: 'pizza', name: 'Pizza Corner', description: 'Fresh made pizzas' },
  { id: 'salad', name: 'Salad Bar', description: 'Fresh greens & toppings' },
  { id: 'international', name: 'Global Kitchen', description: 'World cuisines' },
  { id: 'dessert', name: 'Sweet Treats', description: 'Desserts & beverages' },
];

//todo: remove mock functionality
const mockMenuItems = {
  breakfast: [
    {
      id: 'pancakes-1',
      name: 'Fluffy Buttermilk Pancakes',
      station: 'Grill Station',
      calories: 420,
      allergens: ['Gluten', 'Dairy', 'Eggs'],
      rating: 4.2,
      reviewCount: 18,
      image: breakfastImage,
    },
    {
      id: 'eggs-1',
      name: 'Scrambled Eggs',
      station: 'Grill Station', 
      calories: 180,
      allergens: ['Eggs'],
      rating: 3.8,
      reviewCount: 12,
    },
    {
      id: 'oatmeal-1',
      name: 'Steel Cut Oatmeal',
      station: 'International',
      calories: 220,
      allergens: [],
      rating: 4.0,
      reviewCount: 8,
    },
  ],
  lunch: [
    {
      id: 'burger-1',
      name: 'Classic Cheeseburger',
      station: 'Grill Station',
      calories: 650,
      allergens: ['Gluten', 'Dairy'],
      rating: 4.5,
      reviewCount: 32,
      image: lunchImage,
    },
    {
      id: 'salad-1',
      name: 'Garden Fresh Salad',
      station: 'Salad Bar',
      calories: 180,
      allergens: [],
      rating: 4.1,
      reviewCount: 15,
    },
  ],
  dinner: [
    {
      id: 'pasta-1',
      name: 'Chicken Alfredo Pasta',
      station: 'International',
      calories: 480,
      allergens: ['Gluten', 'Dairy'],
      rating: 4.3,
      reviewCount: 24,
      image: dinnerImage,
    },
    {
      id: 'pizza-1',
      name: 'Pepperoni Pizza',
      station: 'Pizza Corner',
      calories: 320,
      allergens: ['Gluten', 'Dairy'],
      rating: 4.6,
      reviewCount: 45,
    },
  ],
};

export default function MenuPage() {
  const [activeStation, setActiveStation] = useState('grill');
  const [reviewModal, setReviewModal] = useState({ isOpen: false, itemName: '', itemId: '' });
  const [reportModal, setReportModal] = useState({ isOpen: false, itemName: '', itemId: '' });

  const handleRate = (itemId: string, rating: number) => {
    console.log(`Rated item ${itemId} with ${rating} stars`);
  };

  const handleReview = (itemId: string) => {
    const item = Object.values(mockMenuItems).flat().find(i => i.id === itemId);
    if (item) {
      setReviewModal({ isOpen: true, itemName: item.name, itemId });
    }
  };

  const handleReport = (itemId: string) => {
    const item = Object.values(mockMenuItems).flat().find(i => i.id === itemId);
    if (item) {
      setReportModal({ isOpen: true, itemName: item.name, itemId });
    }
  };

  const handleReviewSubmit = (review: any) => {
    console.log('Review submitted:', review);
  };

  const handleReportSubmit = (report: any) => {
    console.log('Report submitted:', report);
  };

  const getHeroImage = (mealPeriod: string) => {
    switch (mealPeriod) {
      case 'breakfast': return breakfastImage;
      case 'lunch': return lunchImage;
      case 'dinner': return dinnerImage;
      default: return breakfastImage;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <HeroSection
        title="What they Got?"
        subtitle="Real reviews from MNSU students"
        backgroundImage={breakfastImage}
        currentMeal="Breakfast"
        lastUpdated="8:30 AM"
      />

      <div className="px-4 space-y-6">
        <StationCarousel
          stations={mockStations}
          onStationSelect={setActiveStation}
          activeStation={activeStation}
        />

        <MealPeriodTabs>
          {Object.entries(mockMenuItems).map(([mealPeriod, items]) => (
            <TabsContent key={mealPeriod} value={mealPeriod} className="mt-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <MenuCard
                    key={item.id}
                    {...item}
                    onRate={handleRate}
                    onReview={handleReview}
                    onReport={handleReport}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </MealPeriodTabs>
      </div>

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        itemName={reviewModal.itemName}
        onSubmit={handleReviewSubmit}
      />

      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        itemName={reportModal.itemName}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}