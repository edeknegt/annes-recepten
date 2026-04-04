-- =============================================================================
-- Annes Recepten - Supabase Database Schema
-- =============================================================================
-- Nederlandse recepten-app database schema voor Supabase (PostgreSQL)
-- Bevat tabellen, indexen, triggers, RLS policies en seed data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CATEGORIES - Receptcategorieen
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    slug        text        NOT NULL UNIQUE,
    sort_order  integer     DEFAULT 0,
    created_at  timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. SUBCATEGORIES - Subcategorieen, gekoppeld aan een categorie
-- ---------------------------------------------------------------------------
CREATE TABLE subcategories (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    slug        text        NOT NULL,
    category_id uuid        NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    sort_order  integer     DEFAULT 0,
    created_at  timestamptz DEFAULT now(),

    -- Slug moet uniek zijn binnen dezelfde categorie
    UNIQUE (category_id, slug)
);

CREATE INDEX idx_subcategories_category_id ON subcategories (category_id);

-- ---------------------------------------------------------------------------
-- 3. RECIPES - Hoofdtabel voor recepten
-- ---------------------------------------------------------------------------
CREATE TABLE recipes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text        NOT NULL,
    description text,                           -- korte omschrijving
    prep_time   integer,                        -- voorbereidingstijd in minuten
    cook_time   integer,                        -- bereidingstijd in minuten
    servings    integer     NOT NULL DEFAULT 4, -- aantal porties
    source      text,                           -- bijv. naam van kookboek
    source_url  text,                           -- link naar bron
    category_id uuid        NOT NULL REFERENCES categories (id),
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_recipes_category_id ON recipes (category_id);
CREATE INDEX idx_recipes_title       ON recipes (title);
CREATE INDEX idx_recipes_created_at  ON recipes (created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. RECIPE_SUBCATEGORIES - Koppeltabel (many-to-many) recept <-> subcategorie
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_subcategories (
    recipe_id       uuid NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    subcategory_id  uuid NOT NULL REFERENCES subcategories (id) ON DELETE CASCADE,

    PRIMARY KEY (recipe_id, subcategory_id)
);

CREATE INDEX idx_recipe_subcategories_subcategory_id ON recipe_subcategories (subcategory_id);

-- ---------------------------------------------------------------------------
-- 5. RECIPE_INGREDIENTS - Ingredienten per recept
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_ingredients (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id   uuid        NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    amount      numeric,                -- kan null zijn voor "naar smaak"
    unit        text,                   -- bijv. "gram", "ml", "stuks", "el", "tl"
    name        text        NOT NULL,   -- naam van het ingredient
    sort_order  integer     DEFAULT 0
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients (recipe_id);

-- ---------------------------------------------------------------------------
-- 6. RECIPE_STEPS - Bereidingsstappen per recept
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_steps (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id   uuid        NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    step_number integer     NOT NULL,
    description text        NOT NULL
);

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps (recipe_id);

-- ---------------------------------------------------------------------------
-- TRIGGER: Auto-update van recipes.updated_at bij wijzigingen
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================================================
-- RLS wordt ingeschakeld op alle tabellen. Omdat de app PIN-bescherming op
-- applicatieniveau gebruikt (met de anon key), staan we alle operaties toe
-- via permissive policies.
-- ===========================================================================

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to categories"
    ON categories FOR ALL
    USING (true)
    WITH CHECK (true);

-- Subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to subcategories"
    ON subcategories FOR ALL
    USING (true)
    WITH CHECK (true);

-- Recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recipes"
    ON recipes FOR ALL
    USING (true)
    WITH CHECK (true);

-- Recipe subcategories (koppeltabel)
ALTER TABLE recipe_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recipe_subcategories"
    ON recipe_subcategories FOR ALL
    USING (true)
    WITH CHECK (true);

-- Recipe ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recipe_ingredients"
    ON recipe_ingredients FOR ALL
    USING (true)
    WITH CHECK (true);

-- Recipe steps
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recipe_steps"
    ON recipe_steps FOR ALL
    USING (true)
    WITH CHECK (true);

-- ===========================================================================
-- SEED DATA - Initiele categorieen en subcategorieen
-- ===========================================================================

-- ---- Categorieen ----
INSERT INTO categories (name, slug, sort_order) VALUES
    ('Hoofdmaaltijden', 'hoofdmaaltijden', 1),
    ('Gebak',           'gebak',           2),
    ('Desserts',        'desserts',        3),
    ('Salades',         'salades',         4),
    ('Ontbijt & Lunch', 'ontbijt-lunch',  5),
    ('Brood',           'brood',           6);

-- ---- Subcategorieen: Hoofdmaaltijden ----
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
    ('Ovenschotels',      'ovenschotels',      (SELECT id FROM categories WHERE slug = 'hoofdmaaltijden'), 1),
    ('Pasta''s',          'pastas',            (SELECT id FROM categories WHERE slug = 'hoofdmaaltijden'), 2),
    ('Soepen',            'soepen',            (SELECT id FROM categories WHERE slug = 'hoofdmaaltijden'), 3),
    ('Rijstgerechten',    'rijstgerechten',    (SELECT id FROM categories WHERE slug = 'hoofdmaaltijden'), 4),
    ('Noedels',           'noedels',           (SELECT id FROM categories WHERE slug = 'hoofdmaaltijden'), 5),
    ('Snelle maaltijden', 'snelle-maaltijden', (SELECT id FROM categories WHERE slug = 'hoofdmaaltijden'), 6);

-- ---- Subcategorieen: Gebak ----
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
    ('Taarten', 'taarten', (SELECT id FROM categories WHERE slug = 'gebak'), 1),
    ('Cakes',   'cakes',   (SELECT id FROM categories WHERE slug = 'gebak'), 2),
    ('Koeken',  'koeken',  (SELECT id FROM categories WHERE slug = 'gebak'), 3);

-- ---- Subcategorieen: Desserts ----
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
    ('Pudding',        'pudding',        (SELECT id FROM categories WHERE slug = 'desserts'), 1),
    ('Ijs & Sorbets',  'ijs-sorbets',   (SELECT id FROM categories WHERE slug = 'desserts'), 2),
    ('Mousse',         'mousse',         (SELECT id FROM categories WHERE slug = 'desserts'), 3),
    ('Fruitdesserts',  'fruitdesserts',  (SELECT id FROM categories WHERE slug = 'desserts'), 4),
    ('Crèmes',        'cremes',         (SELECT id FROM categories WHERE slug = 'desserts'), 5);

-- ---- Subcategorieen: Salades ----
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
    ('Rauwkost',          'rauwkost',          (SELECT id FROM categories WHERE slug = 'salades'), 1),
    ('Fruitsalades',      'fruitsalades',      (SELECT id FROM categories WHERE slug = 'salades'), 2),
    ('Pastasalades',      'pastasalades',      (SELECT id FROM categories WHERE slug = 'salades'), 3),
    ('Gemengde salades',  'gemengde-salades',  (SELECT id FROM categories WHERE slug = 'salades'), 4);

-- ---- Subcategorieen: Ontbijt & Lunch ----
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
    ('Broodjes', 'broodjes', (SELECT id FROM categories WHERE slug = 'ontbijt-lunch'), 1),
    ('Zoet',     'zoet',     (SELECT id FROM categories WHERE slug = 'ontbijt-lunch'), 2),
    ('Hartig',   'hartig',   (SELECT id FROM categories WHERE slug = 'ontbijt-lunch'), 3);

-- ---- Subcategorieen: Brood ----
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
    ('Zuurdesembrood', 'zuurdesembrood', (SELECT id FROM categories WHERE slug = 'brood'), 1),
    ('Gevuld brood',   'gevuld-brood',  (SELECT id FROM categories WHERE slug = 'brood'), 2),
    ('Gistbrood',      'gistbrood',     (SELECT id FROM categories WHERE slug = 'brood'), 3);

-- ===========================================================================
-- Klaar! Schema is aangemaakt met alle tabellen, indexen, triggers,
-- RLS policies en seed data.
-- ===========================================================================
