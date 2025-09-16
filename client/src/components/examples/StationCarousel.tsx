import StationCarousel from '../StationCarousel';
import { useState } from 'react';

export default function StationCarouselExample() {
  const [activeStation, setActiveStation] = useState('grill');

  //todo: remove mock functionality
  const mockStations = [
    { id: 'grill', name: 'Grill Station', description: 'Burgers, fries & classics' },
    { id: 'pizza', name: 'Pizza Corner', description: 'Fresh made pizzas' },
    { id: 'salad', name: 'Salad Bar', description: 'Fresh greens & toppings' },
    { id: 'international', name: 'Global Kitchen', description: 'World cuisines' },
    { id: 'dessert', name: 'Sweet Treats', description: 'Desserts & beverages' },
  ];

  const handleStationSelect = (stationId: string) => {
    setActiveStation(stationId);
    console.log(`Selected station: ${stationId}`);
  };

  return (
    <div className="w-full max-w-2xl">
      <StationCarousel
        stations={mockStations}
        onStationSelect={handleStationSelect}
        activeStation={activeStation}
      />
    </div>
  );
}