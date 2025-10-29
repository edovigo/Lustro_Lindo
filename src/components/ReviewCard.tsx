import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewCardProps {
  author: string;
  authorImage?: string;
  rating: number;
  date: string;
  comment: string;
}

const ReviewCard = ({ author, authorImage, rating, date, comment }: ReviewCardProps) => {
  return (
    <Card className="bg-gradient-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={authorImage} alt={author} />
            <AvatarFallback>{author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-card-foreground">{author}</h4>
              <span className="text-sm text-muted-foreground">{date}</span>
            </div>
            
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            
            <p className="text-card-foreground/80 leading-relaxed">{comment}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
