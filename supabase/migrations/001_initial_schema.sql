-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings (extends Supabase Auth)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  kalshi_api_key TEXT, -- encrypted
  kalshi_api_secret TEXT, -- encrypted
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  phone_number TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  default_target_pct DECIMAL(5,2) DEFAULT 65.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  market_id TEXT NOT NULL,
  market_title TEXT,
  buy_amount DECIMAL(10,2) NOT NULL,
  target_sell_pct DECIMAL(5,2) NOT NULL,
  shares_owned INTEGER,
  avg_buy_price DECIMAL(10,4),
  current_price DECIMAL(10,4),
  status TEXT CHECK (status IN ('pending', 'active', 'sold', 'resolved', 'error', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  purchased_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  error_message TEXT
);

-- Trades (transaction history)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  position_id UUID REFERENCES positions,
  market_id TEXT NOT NULL,
  trade_type TEXT CHECK (trade_type IN ('buy', 'sell')) NOT NULL,
  shares INTEGER NOT NULL,
  price DECIMAL(10,4) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  profit_loss DECIMAL(10,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  kalshi_order_id TEXT
);

-- Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  position_id UUID REFERENCES positions,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- System monitoring (for admin)
CREATE TABLE monitoring_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  positions_checked INTEGER DEFAULT 0,
  positions_sold INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'completed', 'failed'))
);

-- Indexes for performance
CREATE INDEX idx_positions_user_status ON positions(user_id, status);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_updated ON positions(updated_at DESC);
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own positions"
  ON positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON positions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

