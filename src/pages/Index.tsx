import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import CleanerCard from "@/components/CleanerCard";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Professional {
  id: string;
  user_id: string;
  bio: string | null;
  hourly_rate: number;
  specialties: string[];
  is_verified: boolean;
  rating: number;
  review_count: number;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Index = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          profiles!inner(full_name, avatar_url)
        `)
        .eq("is_verified", true)
        .order("rating", { ascending: false });

      if (error) throw error;

      setProfessionals(data || []);
    } catch (error: any) {
      toast.error("Errore nel caricamento dei professionisti");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalizzazione non supportata dal browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSortByDistance(true);
        toast.success("Posizione acquisita! Ordinamento per distanza attivato");
      },
      () => {
        toast.error("Accesso alla posizione negato");
      }
    );
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distanza in km
  };

  const getSortedProfessionals = () => {
    if (!sortByDistance || !userLocation) {
      return professionals;
    }

    return [...professionals]
      .filter(p => p.latitude && p.longitude)
      .sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          a.latitude!, 
          a.longitude!
        );
        const distanceB = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          b.latitude!, 
          b.longitude!
        );
        return distanceA - distanceB;
      });
  };

  const displayedProfessionals = getSortedProfessionals();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      <section className="container py-16 px-4">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Professionisti della Pulizia Verificati
            </h2>
            <p className="text-muted-foreground">
              {sortByDistance 
                ? "Ordinati per distanza dalla tua posizione" 
                : "Scegli tra i migliori professionisti nella tua zona"}
            </p>
          </div>
          
          <Button
            variant={sortByDistance ? "default" : "outline"}
            onClick={requestLocation}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {sortByDistance ? "Vicino a me ✓" : "Trova vicino a me"}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayedProfessionals.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {displayedProfessionals.map((professional) => {
              const distance = userLocation && professional.latitude && professional.longitude
                ? calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    professional.latitude, 
                    professional.longitude
                  )
                : null;

              return (
                <CleanerCard
                  key={professional.id}
                  id={professional.id}
                  name={professional.profiles.full_name || "Professionista"}
                  image={professional.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${professional.id}`}
                  rating={Number(professional.rating)}
                  reviews={professional.review_count}
                  hourlyRate={Number(professional.hourly_rate)}
                  verified={professional.is_verified}
                  specialties={professional.specialties || []}
                  availability={distance ? `A ${distance.toFixed(1)} km` : professional.city || "Disponibile"}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nessun professionista trovato</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
