import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Station {
  id: string;
  name: string;
  description: string;
  isActive?: boolean;
}

interface StationCarouselProps {
  stations: Station[];
  onStationSelect: (stationId: string) => void;
  activeStation?: string;
}

export default function StationCarousel({ 
  stations, 
  onStationSelect, 
  activeStation 
}: StationCarouselProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap" data-testid="scroll-stations">
      <div className="flex gap-4 p-1">
        {stations.map((station) => (
          <Card
            key={station.id}
            className={cn(
              "min-w-[160px] cursor-pointer hover-elevate active-elevate-2 transition-all",
              activeStation === station.id && "ring-2 ring-primary"
            )}
            onClick={() => onStationSelect(station.id)}
            data-testid={`card-station-${station.id}`}
          >
            <CardContent className="p-4 text-center">
              <h4 className="font-medium text-sm" data-testid={`text-station-name-${station.id}`}>
                {station.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-station-desc-${station.id}`}>
                {station.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}