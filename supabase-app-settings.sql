-- =============================================================================
-- Annes Recepten - App settings (1 rij met globale flags)
-- =============================================================================
-- Voer na supabase-webauthn.sql. Bevat één rij met globale schakelaars,
-- momenteel alleen `registration_open` waarmee je tijdelijk het aanmaken
-- van nieuwe passkeys toestaat.
-- =============================================================================

CREATE TABLE app_settings (
    id                integer     PRIMARY KEY DEFAULT 1,
    registration_open boolean     NOT NULL DEFAULT false,
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO app_settings (id, registration_open) VALUES (1, false);

-- Alleen bereikbaar vanaf de server met de service-role key.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
