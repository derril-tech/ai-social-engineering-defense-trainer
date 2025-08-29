-- Initialize ClickHouse for event telemetry
CREATE DATABASE IF NOT EXISTS ai_defense_events;

-- Create events table for telemetry
CREATE TABLE IF NOT EXISTS ai_defense_events.events (
    id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),
    campaign_id UUID,
    user_id UUID,
    org_id UUID,
    timestamp DateTime64(3) DEFAULT now64(),
    properties Map(String, String),
    user_agent String,
    ip_address IPv4,
    created_at DateTime64(3) DEFAULT now64()
) ENGINE = MergeTree()
ORDER BY (org_id, campaign_id, timestamp)
PARTITION BY toYYYYMM(timestamp)
TTL timestamp + INTERVAL 2 YEAR;

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_defense_events.campaign_stats
ENGINE = SummingMergeTree()
ORDER BY (org_id, campaign_id, event_type, date)
AS SELECT
    org_id,
    campaign_id,
    event_type,
    toDate(timestamp) as date,
    count() as event_count
FROM ai_defense_events.events
GROUP BY org_id, campaign_id, event_type, date;
