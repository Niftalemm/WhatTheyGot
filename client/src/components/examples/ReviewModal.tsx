import ReviewModal from '../ReviewModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ReviewModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (review: {
    rating: number;
    text: string;
    emoji: string;
    photo?: File;
  }) => {
    console.log('Review submitted:', review);
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Review Modal
      </Button>
      
      <ReviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        itemName="Fluffy Buttermilk Pancakes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}