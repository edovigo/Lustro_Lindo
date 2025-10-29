-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('client', 'professional');

-- Create enum for subscription plans
CREATE TYPE subscription_plan AS ENUM ('free', 'pro');

-- Create enum for KYC status
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table (for all users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create professional_profiles table (additional data for professionals)
CREATE TABLE public.professional_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  specialties TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  kyc_status kyc_status DEFAULT 'pending',
  subscription_plan subscription_plan DEFAULT 'free',
  completed_jobs INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  response_time_minutes INTEGER DEFAULT 60,
  
  -- Geolocation data
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location GEOGRAPHY(POINT, 4326),
  
  -- Subscription dates
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create KYC documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'identity', 'certificate', 'reference'
  document_url TEXT NOT NULL,
  status kyc_status DEFAULT 'pending',
  notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table (for tracking commissions)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL, -- 15% or 20% based on plan
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for professional_profiles
CREATE POLICY "Anyone can view verified professionals"
  ON public.professional_profiles FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Professionals can view own profile"
  ON public.professional_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can update own profile"
  ON public.professional_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can insert own profile"
  ON public.professional_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kyc_documents
CREATE POLICY "Professionals can view own documents"
  ON public.kyc_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professional_profiles
      WHERE id = kyc_documents.professional_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can insert own documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professional_profiles
      WHERE id = professional_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM public.professional_profiles
      WHERE id = bookings.professional_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Clients can create reviews for their bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Function to automatically update location geography from lat/lng
CREATE OR REPLACE FUNCTION update_professional_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_professional_location
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON public.professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_location();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography
  ) / 1000; -- Convert to kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update professional rating after new review
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.professional_profiles
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
    )
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
);

-- Storage policies for KYC documents
CREATE POLICY "Professionals can upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Professionals can view own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for better performance
CREATE INDEX idx_professional_profiles_location ON public.professional_profiles USING GIST(location);
CREATE INDEX idx_professional_profiles_verified ON public.professional_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX idx_professional_profiles_user_id ON public.professional_profiles(user_id);
CREATE INDEX idx_bookings_professional_id ON public.bookings(professional_id);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_reviews_professional_id ON public.reviews(professional_id);