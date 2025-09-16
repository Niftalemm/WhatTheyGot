import ReportModal from '../ReportModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ReportModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (report: {
    type: string;
    description: string;
  }) => {
    console.log('Report submitted:', report);
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Report Modal
      </Button>
      
      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        itemName="Fluffy Buttermilk Pancakes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}