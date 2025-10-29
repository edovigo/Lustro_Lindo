import { Star, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface CleanerCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  verified: boolean;
  specialties: string[];
  availability: string;
}

const CleanerCard = ({
  id,
  name,
  image,
  rating,
  reviews,
  hourlyRate,
  verified,
  specialties,
  availability,
}: CleanerCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-gradient-card border-border">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg text-card-foreground flex items-center gap-2">
                  {name}
                  {verified && (
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                  )}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold text-card-foreground">{rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviews} recensioni)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">€{hourlyRate}</div>
                <div className="text-sm text-muted-foreground">/ora</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{availability}</span>
              </div>
            </div>
            
            <Link to={`/cleaner/${id}`}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Vedi Profilo e Prenota
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanerCard;
