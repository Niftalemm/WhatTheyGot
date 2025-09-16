import HeroSection from '../HeroSection';
import breakfastImage from '@assets/generated_images/University_breakfast_spread_hero_5b900fb1.png';

export default function HeroSectionExample() {
  return (
    <div className="max-w-md">
      <HeroSection
        title="What they Got?"
        subtitle="Real reviews from MNSU students"
        backgroundImage={breakfastImage}
        currentMeal="Breakfast"
        lastUpdated="8:30 AM"
      />
    </div>
  );
}