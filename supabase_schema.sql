-- =============================================================================
-- SCHÉMA DE BASE DE DONNÉES CLOUD POSTGRESQL (SUPABASE)
-- APPLICATION DE GESTION DE CANTINE SCOLAIRE (OFFLINE-FIRST)
-- =============================================================================

-- 1. Table des Écoles
CREATE TABLE IF NOT EXISTS public.schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    meal_price NUMERIC NOT NULL DEFAULT 400,
    currency TEXT NOT NULL DEFAULT 'FCFA',
    timezone TEXT DEFAULT 'Africa/Lome',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table des Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'Primaire',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table des Élèves
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    parent_name TEXT,
    parent_phone TEXT,
    balance NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Table des Repas (avec contrainte anti-doublon absolue par jour)
CREATE TABLE IF NOT EXISTS public.meals (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 400,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('prepaid', 'cash', 'credit')),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT unq_student_meal_per_day UNIQUE (school_id, student_id, date)
);

-- 5. Table des Dépôts / Recharges des Parents
CREATE TABLE IF NOT EXISTS public.deposits (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    reference TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Table des Profils Utilisateurs (Liée à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'agent')) DEFAULT 'agent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- INDEX POUR PERFORMANCES OPTIMALES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON public.students(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_meals_school_date ON public.meals(school_id, date);
CREATE INDEX IF NOT EXISTS idx_deposits_school_date ON public.deposits(school_id, date);

-- =============================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS) MULTI-ÉCOLES
-- =============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples et permissives pour l'API anon (ou basées sur school_id)
CREATE POLICY "Acces public par ecole sur schools" ON public.schools FOR ALL USING (true);
CREATE POLICY "Acces public par ecole sur classes" ON public.classes FOR ALL USING (true);
CREATE POLICY "Acces public par ecole sur students" ON public.students FOR ALL USING (true);
CREATE POLICY "Acces public par ecole sur meals" ON public.meals FOR ALL USING (true);
CREATE POLICY "Acces public par ecole sur deposits" ON public.deposits FOR ALL USING (true);
CREATE POLICY "Acces public sur profiles" ON public.profiles FOR ALL USING (true);

-- =============================================================================
-- DONNÉES INITIALES PAR DÉFAUT
-- =============================================================================
INSERT INTO public.schools (id, name, address, phone, meal_price, currency)
VALUES ('school-default-01', 'École Primaire La Référence', 'Boulevard du 13 Janvier, Lomé, Togo', '+228 90 12 34 56', 400, 'FCFA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.classes (id, school_id, name, level) VALUES
('cls-sec-1', 'school-default-01', 'Section 1', 'Maternelle'),
('cls-sec-2', 'school-default-01', 'Section 2', 'Maternelle'),
('cls-cp1', 'school-default-01', 'CP1', 'Primaire'),
('cls-cp2', 'school-default-01', 'CP2', 'Primaire'),
('cls-ce1', 'school-default-01', 'CE1', 'Primaire'),
('cls-ce2', 'school-default-01', 'CE2', 'Primaire'),
('cls-cm1', 'school-default-01', 'CM1', 'Primaire'),
('cls-cm2', 'school-default-01', 'CM2', 'Primaire')
ON CONFLICT (id) DO NOTHING;
