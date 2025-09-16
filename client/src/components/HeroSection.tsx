import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  currentMeal: string;
  lastUpdated: string;
}

export default function HeroSection({
  title,
  subtitle,
  backgroundImage,
  currentMeal,
  lastUpdated
}: HeroSectionProps) {
  return (
    <div className="relative h-64 overflow-hidden rounded-xl">
      <img
        src={backgroundImage}
        alt="University Dining"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              {currentMeal}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-white/80">
              <Clock className="w-3 h-3" />
              Updated {lastUpdated}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold" data-testid="text-hero-title">
            {title}
          </h1>
          <p className="text-white/90 text-lg" data-testid="text-hero-subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}