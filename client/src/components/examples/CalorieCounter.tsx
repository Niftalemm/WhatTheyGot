import CalorieCounter from '../CalorieCounter';
import { useState } from 'react';

export default function CalorieCounterExample() {
  //todo: remove mock functionality
  const [selectedItems, setSelectedItems] = useState([
    { id: '1', name: 'Cheeseburger', calories: 650 },
    { id: '2', name: 'French Fries', calories: 320 },
    { id: '3', name: 'Chocolate Shake', calories: 480 },
  ]);

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(items => items.filter(item => item.id !== itemId));
    console.log(`Removed item ${itemId} from calorie counter`);
  };

  const handleClear = () => {
    setSelectedItems([]);
    console.log('Cleared all items from calorie counter');
  };

  return (
    <div className="max-w-md">
      <CalorieCounter
        selectedItems={selectedItems}
        onRemoveItem={handleRemoveItem}
        onClear={handleClear}
      />
    </div>
  );
}