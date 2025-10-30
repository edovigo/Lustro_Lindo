import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Star, CheckCircle2, Clock, MapPin, ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import ReviewCard from "@/components/ReviewCard";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CleanerDetail = () => {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [cleaner, setCleaner] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchProfessionalData();
  }, [id]);

  const fetchProfessionalData = async () => {
    try {
      // Fetch professional profile
      const { data: professionalData, error: professionalError } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          profiles!inner(full_name, avatar_url)
        `)
        .eq("id", id)
        .single();

      if (professionalError) throw professionalError;

      setCleaner(professionalData);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_client_id_fkey(full_name, avatar_url)
        `)
        .eq("professional_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);
    } catch (error: any) {
      toast.error("Errore nel caricamento del profilo");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const commissionRate = cleaner.subscription_plan === "pro" ? 10 : 15;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-border bg-card">
        <div className="container py-4 px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
          </Link>
        </div>
      </div>

      <main className="container py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage 
                      src={cleaner.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleaner.id}`} 
                      alt={cleaner.profiles.full_name} 
                    />
                    <AvatarFallback className="text-2xl">
                      {cleaner.profiles.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-card-foreground">{cleaner.profiles.full_name || "Professionista"}</h1>
                      {cleaner.is_verified && (
                        <CheckCircle2 className="h-6 w-6 text-secondary" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="font-bold text-lg text-card-foreground">
                          {Number(cleaner.rating).toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({cleaner.review_count} recensioni)
                        </span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {cleaner.completed_jobs} lavori completati
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(cleaner.specialties || []).map((specialty: string) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Risponde entro {cleaner.response_time_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{cleaner.city || "Italia"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <div className="text-4xl font-bold text-primary">€{Number(cleaner.hourly_rate)}</div>
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
                <p className="text-card-foreground/80 leading-relaxed">
                  {cleaner.bio || "Professionista esperto con anni di esperienza nel settore delle pulizie."}
                </p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Recensioni
                  <Badge variant="secondary">{cleaner.review_count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard 
                      key={review.id} 
                      author={review.profiles.full_name || "Cliente"}
                      authorImage={review.profiles.avatar_url || undefined}
                      rating={review.rating}
                      date={new Date(review.created_at).toLocaleDateString('it-IT')}
                      comment={review.comment || ""}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nessuna recensione ancora disponibile
                  </p>
                )}
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
                    <span className="font-semibold text-card-foreground">€{Number(cleaner.hourly_rate)}/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Commissione piattaforma</span>
                    <span className="font-semibold text-card-foreground">{commissionRate}%</span>
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
