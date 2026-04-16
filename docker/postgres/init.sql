-- NEXUS Game — Schema de Base de Datos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Usuarios ───────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(32) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(60) NOT NULL,
    character_id  VARCHAR(32),
    is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── Estado del Juego ───────────────────────────────────────────────
CREATE TABLE game_states (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    state_data      JSONB NOT NULL DEFAULT '{}',
    credits         NUMERIC(24,4) NOT NULL DEFAULT 500,
    total_earned    NUMERIC(24,4) NOT NULL DEFAULT 500,
    influence       INTEGER NOT NULL DEFAULT 0,
    net_worth       NUMERIC(24,4) NOT NULL DEFAULT 500,
    current_day     INTEGER NOT NULL DEFAULT 1,
    company_name    VARCHAR(100),
    prestige_level  SMALLINT NOT NULL DEFAULT 0,
    prestige_bonus  NUMERIC(5,4) NOT NULL DEFAULT 1.0,
    last_tick_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gs_net_worth ON game_states(net_worth DESC);
CREATE INDEX idx_gs_influence ON game_states(influence DESC);

-- ── Clanes ─────────────────────────────────────────────────────────
CREATE TABLE clans (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(50) NOT NULL UNIQUE,
    tag           VARCHAR(6) NOT NULL UNIQUE,
    description   TEXT,
    emblem_url    VARCHAR(500),
    color         VARCHAR(7) NOT NULL DEFAULT '#00d4ff',
    leader_id     UUID NOT NULL REFERENCES users(id),
    chest_credits NUMERIC(24,4) NOT NULL DEFAULT 0,
    total_wealth  NUMERIC(24,4) NOT NULL DEFAULT 0,
    member_count  SMALLINT NOT NULL DEFAULT 1,
    war_wins      INTEGER NOT NULL DEFAULT 0,
    war_losses    INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clans_wealth ON clans(total_wealth DESC);

CREATE TABLE clan_members (
    clan_id      UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(10) NOT NULL DEFAULT 'member'
                 CHECK (role IN ('leader', 'officer', 'member')),
    contribution NUMERIC(24,4) NOT NULL DEFAULT 0,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (clan_id, user_id)
);
CREATE INDEX idx_clan_members_user ON clan_members(user_id);

-- ── Edificios del Mapa 3D ──────────────────────────────────────────
CREATE TABLE buildings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100) NOT NULL,
    building_type       VARCHAR(30) NOT NULL,
    position_x          REAL NOT NULL,
    position_y          REAL NOT NULL DEFAULT 0,
    position_z          REAL NOT NULL,
    scale_y             REAL NOT NULL DEFAULT 1,
    base_price          NUMERIC(20,4) NOT NULL,
    owner_id            UUID REFERENCES users(id) ON DELETE SET NULL,
    owner_clan_id       UUID REFERENCES clans(id) ON DELETE SET NULL,
    display_image_url   VARCHAR(500),
    display_text        VARCHAR(200),
    passive_bonus_type  VARCHAR(30),
    passive_bonus_value NUMERIC(8,4) NOT NULL DEFAULT 0,
    last_sold_price     NUMERIC(20,4),
    owned_since         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE building_bids (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id     UUID NOT NULL REFERENCES buildings(id),
    auction_id      VARCHAR(50) NOT NULL,
    bidder_id       UUID NOT NULL REFERENCES users(id),
    bid_amount      NUMERIC(20,4) NOT NULL,
    is_winning      BOOLEAN NOT NULL DEFAULT FALSE,
    auction_ends_at TIMESTAMPTZ NOT NULL,
    placed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bids_building ON building_bids(building_id, auction_id);

-- ── Chat ───────────────────────────────────────────────────────────
CREATE TABLE messages (
    id          BIGSERIAL PRIMARY KEY,
    room_type   VARCHAR(10) NOT NULL CHECK (room_type IN ('global','clan','dm','system')),
    room_id     VARCHAR(100) NOT NULL,
    sender_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(32) NOT NULL,
    content     TEXT NOT NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_room ON messages(room_type, room_id, created_at DESC);

-- ── Bolsa de Valores Global ────────────────────────────────────────
CREATE TABLE global_stock_prices (
    ticker              VARCHAR(10) NOT NULL,
    game_day            INTEGER NOT NULL,
    price               NUMERIC(16,4) NOT NULL,
    player_buy_volume   NUMERIC(20,4) NOT NULL DEFAULT 0,
    player_sell_volume  NUMERIC(20,4) NOT NULL DEFAULT 0,
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ticker, game_day)
);

CREATE TABLE stock_transactions_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    username        VARCHAR(32) NOT NULL,
    ticker          VARCHAR(10) NOT NULL,
    action          VARCHAR(4) NOT NULL CHECK (action IN ('buy','sell')),
    shares          INTEGER NOT NULL,
    price_per_share NUMERIC(16,4) NOT NULL,
    total_value     NUMERIC(20,4) NOT NULL,
    market_impact   NUMERIC(8,6) NOT NULL DEFAULT 0,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    game_day        INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_log_public ON stock_transactions_log(is_public, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_stock_log_user ON stock_transactions_log(user_id, created_at DESC);

-- ── Misiones ───────────────────────────────────────────────────────
CREATE TABLE mission_definitions (
    id              VARCHAR(50) PRIMARY KEY,
    title           VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    mission_type    VARCHAR(10) NOT NULL CHECK (mission_type IN ('daily','weekly')),
    objective_type  VARCHAR(30) NOT NULL,
    objective_value NUMERIC(20,4) NOT NULL,
    reward_credits  NUMERIC(20,4) NOT NULL DEFAULT 0,
    reward_influence INTEGER NOT NULL DEFAULT 0,
    icon            VARCHAR(10) NOT NULL DEFAULT '🎯'
);

CREATE TABLE player_missions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id      VARCHAR(50) NOT NULL REFERENCES mission_definitions(id),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    progress        NUMERIC(20,4) NOT NULL DEFAULT 0,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    reward_claimed  BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, mission_id, expires_at)
);
CREATE INDEX idx_missions_user ON player_missions(user_id, expires_at);

-- ── Login Streak ───────────────────────────────────────────────────
CREATE TABLE daily_logins (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_date       DATE NOT NULL,
    streak_day       SMALLINT NOT NULL,
    reward_credits   NUMERIC(20,4) NOT NULL DEFAULT 0,
    reward_influence INTEGER NOT NULL DEFAULT 0,
    claimed          BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, login_date)
);
CREATE INDEX idx_daily_logins_user ON daily_logins(user_id, login_date DESC);

-- ── Leaderboard Snapshot ───────────────────────────────────────────
CREATE TABLE leaderboard_snapshots (
    snapshot_type  VARCHAR(30) NOT NULL,
    rank           SMALLINT NOT NULL,
    entity_id      UUID NOT NULL,
    entity_name    VARCHAR(100) NOT NULL,
    value          NUMERIC(24,4) NOT NULL,
    clan_tag       VARCHAR(6),
    snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (snapshot_type, rank)
);

-- ── Seed: Definiciones de Misiones ────────────────────────────────
INSERT INTO mission_definitions (id, title, description, mission_type, objective_type, objective_value, reward_credits, reward_influence, icon) VALUES
-- Diarias
('d_earn_50k',     'Acumulador',        'Gana 50,000 Đ hoy',                      'daily',  'earn_credits',  50000,   10000, 0,   '💰'),
('d_earn_100k',    'Magnate del Día',   'Gana 100,000 Đ hoy',                     'daily',  'earn_credits',  100000,  25000, 0,   '💰'),
('d_buy_stocks',   'Inversión Activa',  'Compra 100 acciones hoy',                'daily',  'buy_stocks',    100,     0,     200, '📈'),
('d_sell_stocks',  'Vendedor Activo',   'Vende 200 acciones hoy',                 'daily',  'sell_stocks',   200,     15000, 0,   '📉'),
('d_clicks_100',   'Hackeo Manual',     'Haz 100 clics hoy',                      'daily',  'clicks',        100,     5000,  0,   '🖱️'),
('d_clicks_500',   'Hackeo Intensivo',  'Haz 500 clics hoy',                      'daily',  'clicks',        500,     20000, 50,  '⚡'),
('d_upgrade_buy',  'Expansión',         'Compra 1 upgrade hoy',                   'daily',  'buy_upgrades',  1,       8000,  0,   '⬆️'),
('d_earn_500k',    'Gran Cosecha',      'Gana 500,000 Đ hoy',                     'daily',  'earn_credits',  500000,  80000, 100, '🌾'),
('d_earn_1m',      'Millonario Diario', 'Gana 1,000,000 Đ hoy',                  'daily',  'earn_credits',  1000000, 200000,200, '💎'),
-- Semanales
('w_networth_1m',  'Club del Millón',   'Alcanza 1,000,000 Đ de patrimonio',      'weekly', 'net_worth',     1000000, 500000,0,   '🏆'),
('w_networth_10m', 'Elite Financiera',  'Alcanza 10,000,000 Đ de patrimonio',     'weekly', 'net_worth',     10000000,2000000,500,'👑'),
('w_buy_bid',      'Inversor Urbano',   'Puja en 1 edificio del mapa esta semana','weekly', 'auction_bid',   1,       0,     500, '🏛️'),
('w_earn_5m',      'Tycoon Semanal',    'Gana 5,000,000 Đ esta semana',           'weekly', 'earn_credits',  5000000, 1500000,300,'💸'),
('w_clan_contrib', 'Espíritu de Equipo','Contribuye 10,000 Đ al cofre del clan',  'weekly', 'clan_contrib',  10000,   30000, 200, '🤝');

-- ── Seed: Edificios del Mapa ───────────────────────────────────────
INSERT INTO buildings (name, building_type, position_x, position_z, scale_y, base_price, passive_bonus_type, passive_bonus_value) VALUES
('Torre NEXUS',        'skyscraper', -20,  10, 6.0,  500000000,  'cps_multiplier', 0.05),
('Banco Central',      'bank',       -10,  20, 4.0,  250000000,  'stock_discount', 0.10),
('Plaza Comercial',    'mall',         5,  25, 2.5,  100000000,  'cps_multiplier', 0.03),
('Centro de Datos',    'office',      20,  15, 3.5,  200000000,  'cps_multiplier', 0.04),
('Fábrica Alpha',      'factory',     30,  -5, 2.0,   75000000,  'cps_multiplier', 0.02),
('Fábrica Beta',       'factory',     35,  10, 2.0,   75000000,  'cps_multiplier', 0.02),
('Aeropuerto',         'landmark',   -30, -20, 1.5,  350000000,  'cps_multiplier', 0.06),
('Puerto Cibernético', 'landmark',    40, -25, 2.0,  180000000,  'stock_discount', 0.05),
('Casino Digital',     'landmark',   -15, -10, 3.0,  150000000,  'cps_multiplier', 0.03),
('Rascacielos Sigma',  'skyscraper',   0,   5, 5.0,  400000000,  'cps_multiplier', 0.04),
('Rascacielos Omega',  'skyscraper',  10,  -5, 5.5,  450000000,  'cps_multiplier', 0.05),
('Hotel Nexion',       'office',      -5,  30, 3.0,  120000000,  'cps_multiplier', 0.02),
('Centro Médico',      'office',      25, -15, 2.5,   90000000,  'influence_boost',10),
('Estadio Virtual',    'landmark',   -25,  30, 1.5,  300000000,  'cps_multiplier', 0.04),
('Museo Cuántico',     'landmark',    15,  35, 2.0,  160000000,  'influence_boost',20),
('Laboratorio IA',     'factory',    -10, -30, 3.0,  280000000,  'cps_multiplier', 0.05),
('Torre Vigilancia',   'skyscraper',  20,  40, 4.5,  320000000,  'cps_multiplier', 0.04),
('Exchange Global',    'bank',        -2, -15, 3.5,  220000000,  'stock_discount', 0.08),
('Parque Tecnológico', 'office',      30,  30, 1.0,   80000000,  'cps_multiplier', 0.02),
('Megaserver Alpha',   'factory',    -35,  15, 2.5,  190000000,  'cps_multiplier', 0.03),
('Bunker Secreto',     'landmark',   -40, -35, 1.0,  500000000,  'cps_multiplier', 0.08),
('Arena de Guerras',   'landmark',    45,  40, 2.0,  260000000,  'influence_boost',30),
('Destilería de Datos','factory',    -20, -40, 2.0,  140000000,  'cps_multiplier', 0.03),
('Bóveda Cripto',      'bank',        10, -40, 2.5,  310000000,  'stock_discount', 0.12),
('Cuartel General',    'skyscraper',   0,   0, 7.0, 1000000000,  'cps_multiplier', 0.10);
