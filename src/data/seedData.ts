// This file is for seeding initial data - run once manually
import { supabase } from "@/integrations/supabase/client";

export const seedMockProfessionals = async () => {
  const mockData = [
    {
      email: "maria.rossi@example.com",
      password: "password123",
      full_name: "Maria Rossi",
      bio: "Professionista con 10 anni di esperienza nella pulizia domestica e commerciale. Attenzione ai dettagli e prodotti eco-friendly.",
      hourly_rate: 15,
      specialties: ["Pulizia Profonda", "Sanificazione", "Stiro"],
      city: "Milano",
      latitude: 45.4642,
      longitude: 9.1900,
    },
    {
      email: "giovanni.bianchi@example.com",
      password: "password123",
      full_name: "Giovanni Bianchi",
      bio: "Specializzato in pulizie post-ristrutturazione e interventi straordinari. Team professionale disponibile.",
      hourly_rate: 18,
      specialties: ["Pulizia Post-Lavori", "Vetri", "Balconi"],
      city: "Roma",
      latitude: 41.9028,
      longitude: 12.4964,
    },
    {
      email: "elena.ferrari@example.com",
      password: "password123",
      full_name: "Elena Ferrari",
      bio: "Utilizzo solo prodotti certificati eco-friendly, perfetti per chi ha allergie o animali domestici.",
      hourly_rate: 20,
      specialties: ["Pulizia Ecologica", "Allergie", "Pet-Friendly"],
      city: "Milano",
      latitude: 45.4654,
      longitude: 9.1859,
    },
  ];

  for (const professional of mockData) {
    // Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: professional.email,
      password: professional.password,
      options: {
        data: {
          full_name: professional.full_name,
          role: "professional",
        },
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      continue;
    }

    if (!authData.user) continue;

    // Create profile
    await supabase.from("profiles").insert({
      id: authData.user.id,
      email: professional.email,
      full_name: professional.full_name,
      role: "professional",
    });

    // Create professional profile
    await supabase.from("professional_profiles").insert({
      user_id: authData.user.id,
      bio: professional.bio,
      hourly_rate: professional.hourly_rate,
      specialties: professional.specialties,
      city: professional.city,
      latitude: professional.latitude,
      longitude: professional.longitude,
      is_verified: true,
      kyc_status: "approved",
      rating: 4.8 + Math.random() * 0.2,
      review_count: Math.floor(Math.random() * 100) + 50,
    });
  }

  console.log("Seed data created successfully!");
};
