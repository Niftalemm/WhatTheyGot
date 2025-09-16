import MenuCard from '../MenuCard';
import breakfastImage from '@assets/generated_images/University_breakfast_spread_hero_5b900fb1.png';

export default function MenuCardExample() {
  const handleRate = (itemId: string, rating: number) => {
    console.log(`Rated item ${itemId} with ${rating} stars`);
  };

  const handleReview = (itemId: string) => {
    console.log(`Review item ${itemId}`);
  };

  const handleReport = (itemId: string) => {
    console.log(`Report issue with item ${itemId}`);
  };

  return (
    <div className="max-w-sm">
      <MenuCard
        id="pancakes-1"
        name="Fluffy Buttermilk Pancakes"
        station="Grill Station"
        calories={420}
        allergens={["Gluten", "Dairy", "Eggs"]}
        rating={4.2}
        reviewCount={18}
        image={breakfastImage}
        onRate={handleRate}
        onReview={handleReview}
        onReport={handleReport}
      />
    </div>
  );
}