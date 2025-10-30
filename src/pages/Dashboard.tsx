import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, MapPin, LogOut } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData || profileData.role !== "professional") {
        toast.error("Accesso non autorizzato");
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Get professional profile
      const { data: professionalData } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfessionalProfile(professionalData || {});
    } catch (error: any) {
      toast.error("Errore nel caricamento del profilo");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        bio: formData.get("bio") as string,
        hourly_rate: parseFloat(formData.get("hourly_rate") as string),
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        postal_code: formData.get("postal_code") as string,
      };

      const { error } = await supabase
        .from("professional_profiles")
        .update(updates)
        .eq("user_id", profile.id);

      if (error) throw error;

      toast.success("Profilo aggiornato con successo!");
      await checkUser();
    } catch (error: any) {
      toast.error(error.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("kyc_documents").insert({
        professional_id: professionalProfile.id,
        document_type: "identity",
        document_url: publicUrl,
      });

      if (insertError) throw insertError;

      toast.success("Documento caricato con successo!");
    } catch (error: any) {
      toast.error(error.message || "Errore nel caricamento");
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalizzazione non supportata dal browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { error } = await supabase
            .from("professional_profiles")
            .update({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
            .eq("user_id", profile.id);

          if (error) throw error;

          toast.success("Posizione aggiornata!");
          await checkUser();
        } catch (error: any) {
          toast.error("Errore nell'aggiornamento della posizione");
        }
      },
      () => {
        toast.error("Accesso alla posizione negato");
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4 px-4">
          <h1 className="text-2xl font-bold text-foreground">Dashboard Professionista</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Esci
          </Button>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Stato Account</CardTitle>
              <CardDescription>Informazioni sul tuo stato di verifica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stato Verifica KYC</span>
                <Badge
                  variant={
                    professionalProfile?.kyc_status === "approved"
                      ? "default"
                      : professionalProfile?.kyc_status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {professionalProfile?.kyc_status === "approved"
                    ? "Verificato"
                    : professionalProfile?.kyc_status === "pending"
                    ? "In Attesa"
                    : "Non Verificato"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Piano</span>
                <Badge variant="outline">
                  {professionalProfile?.subscription_plan === "pro" ? "Pro (10% commissione)" : "Free (15% commissione)"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <span className="font-semibold">
                  ⭐ {professionalProfile?.rating || 0} ({professionalProfile?.review_count || 0} recensioni)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Il Tuo Profilo</CardTitle>
              <CardDescription>Aggiorna le informazioni del tuo profilo</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Descrivi la tua esperienza e specializzazioni..."
                    defaultValue={professionalProfile?.bio || ""}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Tariffa Oraria (€)</Label>
                    <Input
                      id="hourly_rate"
                      name="hourly_rate"
                      type="number"
                      step="0.01"
                      min="10"
                      defaultValue={professionalProfile?.hourly_rate || 15}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Città</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      defaultValue={professionalProfile?.city || ""}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      defaultValue={professionalProfile?.address || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">CAP</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      type="text"
                      defaultValue={professionalProfile?.postal_code || ""}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestGeolocation}
                    className="flex-1"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Ottieni Posizione GPS
                  </Button>
                  {professionalProfile?.latitude && (
                    <Badge variant="secondary" className="self-center">
                      Posizione Attiva
                    </Badge>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salva Modifiche
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* KYC Upload */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Verifica Identità (KYC)</CardTitle>
              <CardDescription>
                Carica un documento d'identità per ottenere il badge "Verificato"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Label
                    htmlFor="kyc-upload"
                    className="cursor-pointer text-primary hover:underline"
                  >
                    Clicca per caricare documento (PDF, JPG, PNG)
                  </Label>
                  <Input
                    id="kyc-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading && (
                    <div className="mt-4">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Accettiamo: Carta d'identità, Patente, Passaporto. Max 5MB.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
