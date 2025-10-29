import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-cleaning.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center">
      <div 
        className="absolute inset-0 bg-gradient-hero opacity-95"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(20, 184, 166, 0.9) 0%, rgba(94, 234, 212, 0.9) 100%), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10 px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Il Tuo Professionista della Pulizia a Portata di Tap
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
            Prenota personale qualificato con recensioni verificate, tariffe trasparenti e disponibilità in tempo reale
          </p>
          
          <div className="bg-card p-6 rounded-2xl shadow-elevated max-w-2xl mx-auto animate-scale-in">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Dove hai bisogno del servizio?"
                  className="pl-10 h-12 border-2 focus-visible:ring-primary"
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                <Search className="mr-2 h-5 w-5" />
                Cerca
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
