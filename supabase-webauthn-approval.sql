-- =============================================================================
-- Anne's keuken - Per-credential approval
-- =============================================================================
-- Nieuwe passkeys worden NIET automatisch toegelaten. Na registratie moet je
-- in Supabase de rij in webauthn_credentials op approved = true zetten
-- voordat dat apparaat kan inloggen.
--
-- Dit vervangt de eerder gemaakte app_settings-tabel; die wordt hier
-- opgeruimd.
-- =============================================================================

ALTER TABLE webauthn_credentials
    ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Zet bestaande rijen handmatig op true voor apparaten die je wil toelaten,
-- bijv.:
--   UPDATE webauthn_credentials SET approved = true WHERE device_label = 'iPhone';

DROP TABLE IF EXISTS app_settings;
