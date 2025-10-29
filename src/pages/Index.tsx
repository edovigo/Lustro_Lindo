import Hero from "@/components/Hero";
import CleanerCard from "@/components/CleanerCard";
import { mockCleaners } from "@/data/mockData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <section className="container py-16 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Professionisti della Pulizia Verificati
          </h2>
          <p className="text-muted-foreground">
            Scegli tra i migliori professionisti nella tua zona
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {mockCleaners.map((cleaner) => (
            <CleanerCard key={cleaner.id} {...cleaner} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
