import { useParams, Link } from "react-router-dom";
import { Star, CheckCircle2, Clock, MapPin, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import ReviewCard from "@/components/ReviewCard";
import { mockCleaners, mockReviews } from "@/data/mockData";

const CleanerDetail = () => {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const cleaner = mockCleaners.find((c) => c.id === id);
  
  if (!cleaner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Professionista non trovato</h1>
          <Link to="/">
            <Button variant="outline">Torna alla Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={cleaner.image} alt={cleaner.name} />
                    <AvatarFallback className="text-2xl">
                      {cleaner.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-card-foreground">{cleaner.name}</h1>
                      {cleaner.verified && (
                        <CheckCircle2 className="h-6 w-6 text-secondary" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="font-bold text-lg text-card-foreground">
                          {cleaner.rating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({cleaner.reviews} recensioni)
                        </span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {cleaner.completedJobs} lavori completati
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cleaner.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Risponde {cleaner.responseTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{cleaner.availability}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <div className="text-4xl font-bold text-primary">€{cleaner.hourlyRate}</div>
                    <div className="text-muted-foreground">all'ora</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Chi Sono</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground/80 leading-relaxed">{cleaner.bio}</p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Recensioni
                  <Badge variant="secondary">{cleaner.reviews}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockReviews.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border sticky top-4">
              <CardHeader>
                <CardTitle>Prenota un Servizio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Seleziona una Data
                  </label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-lg border border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tariffa oraria</span>
                    <span className="font-semibold text-card-foreground">€{cleaner.hourlyRate}/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Durata minima</span>
                    <span className="font-semibold text-card-foreground">3 ore</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                >
                  Richiedi Preventivo
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  La prenotazione sarà confermata dopo il contatto iniziale
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CleanerDetail;
