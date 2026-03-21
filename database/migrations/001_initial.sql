-- Eagle Eye - Initial Schema
-- TimescaleDB hypertables for time-series position data

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Aircraft positions (commercial + military)
CREATE TABLE IF NOT EXISTS flight_positions (
    time        TIMESTAMPTZ NOT NULL,
    icao24      TEXT NOT NULL,
    callsign    TEXT,
    origin_country TEXT,
    longitude   DOUBLE PRECISION,
    latitude    DOUBLE PRECISION,
    baro_altitude DOUBLE PRECISION,
    geo_altitude DOUBLE PRECISION,
    velocity    DOUBLE PRECISION,
    heading     DOUBLE PRECISION,
    vertical_rate DOUBLE PRECISION,
    on_ground   BOOLEAN,
    squawk      TEXT,
    source      TEXT NOT NULL DEFAULT 'opensky',
    is_military BOOLEAN DEFAULT FALSE
);

SELECT create_hypertable('flight_positions', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_flight_icao ON flight_positions (icao24, time DESC);

-- Satellite TLE archive
CREATE TABLE IF NOT EXISTS satellite_tle (
    id          SERIAL PRIMARY KEY,
    norad_id    INTEGER NOT NULL,
    name        TEXT,
    tle_line1   TEXT NOT NULL,
    tle_line2   TEXT NOT NULL,
    category    TEXT,
    country     TEXT,
    fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sat_norad ON satellite_tle (norad_id, fetched_at DESC);

-- Vessel positions
CREATE TABLE IF NOT EXISTS vessel_positions (
    time        TIMESTAMPTZ NOT NULL,
    mmsi        BIGINT NOT NULL,
    name        TEXT,
    vessel_type INTEGER,
    longitude   DOUBLE PRECISION,
    latitude    DOUBLE PRECISION,
    sog         DOUBLE PRECISION,
    cog         DOUBLE PRECISION,
    heading     DOUBLE PRECISION,
    nav_status  INTEGER,
    destination TEXT,
    source      TEXT NOT NULL DEFAULT 'aisstream'
);

SELECT create_hypertable('vessel_positions', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_vessel_mmsi ON vessel_positions (mmsi, time DESC);

-- Seismic events
CREATE TABLE IF NOT EXISTS seismic_events (
    id          TEXT PRIMARY KEY,
    time        TIMESTAMPTZ NOT NULL,
    magnitude   DOUBLE PRECISION,
    place       TEXT,
    longitude   DOUBLE PRECISION,
    latitude    DOUBLE PRECISION,
    depth       DOUBLE PRECISION
);

-- Event cards (for playback mode)
CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    event_type  TEXT NOT NULL,
    time        TIMESTAMPTZ NOT NULL,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    title       TEXT NOT NULL,
    description TEXT,
    severity    TEXT,
    category    TEXT,
    image_url   TEXT,
    metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_time ON events (time);
