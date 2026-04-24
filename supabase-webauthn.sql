-- =============================================================================
-- Anne's keuken - WebAuthn (Face ID / Passkey) tabel
-- =============================================================================
-- Voer dit draaien NA supabase-schema.sql.
-- Slaat geregistreerde passkeys (Face ID / Touch ID / Windows Hello) op.
-- =============================================================================

CREATE TABLE webauthn_credentials (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id   text        NOT NULL UNIQUE,   -- base64url encoded
    public_key      text        NOT NULL,          -- base64url encoded
    counter         bigint      NOT NULL DEFAULT 0,
    transports      text[],
    device_label    text,                          -- vrije label, bijv. "Erik iPhone"
    created_at      timestamptz NOT NULL DEFAULT now(),
    last_used_at    timestamptz
);

CREATE INDEX idx_webauthn_credentials_credential_id
    ON webauthn_credentials (credential_id);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
-- Deze tabel mag NIET toegankelijk zijn via de publieke anon key.
-- Alle toegang loopt via de server met de service-role key (die RLS omzeilt).
-- RLS staat aan zonder policies => anon key krijgt niets.
-- ---------------------------------------------------------------------------
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
