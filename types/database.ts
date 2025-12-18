export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          kalshi_api_key: string | null
          kalshi_api_secret: string | null
          email_notifications: boolean
          sms_notifications: boolean
          phone_number: string | null
          timezone: string
          default_target_pct: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kalshi_api_key?: string | null
          kalshi_api_secret?: string | null
          email_notifications?: boolean
          sms_notifications?: boolean
          phone_number?: string | null
          timezone?: string
          default_target_pct?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kalshi_api_key?: string | null
          kalshi_api_secret?: string | null
          email_notifications?: boolean
          sms_notifications?: boolean
          phone_number?: string | null
          timezone?: string
          default_target_pct?: number
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          market_id: string
          market_title: string | null
          buy_amount: number
          target_sell_pct: number
          shares_owned: number | null
          avg_buy_price: number | null
          current_price: number | null
          status: 'pending' | 'active' | 'sold' | 'resolved' | 'error' | 'cancelled'
          created_at: string
          updated_at: string
          purchased_at: string | null
          sold_at: string | null
          resolved_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          market_title?: string | null
          buy_amount: number
          target_sell_pct: number
          shares_owned?: number | null
          avg_buy_price?: number | null
          current_price?: number | null
          status?: 'pending' | 'active' | 'sold' | 'resolved' | 'error' | 'cancelled'
          created_at?: string
          updated_at?: string
          purchased_at?: string | null
          sold_at?: string | null
          resolved_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          market_title?: string | null
          buy_amount?: number
          target_sell_pct?: number
          shares_owned?: number | null
          avg_buy_price?: number | null
          current_price?: number | null
          status?: 'pending' | 'active' | 'sold' | 'resolved' | 'error' | 'cancelled'
          created_at?: string
          updated_at?: string
          purchased_at?: string | null
          sold_at?: string | null
          resolved_at?: string | null
          error_message?: string | null
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          position_id: string | null
          market_id: string
          trade_type: 'buy' | 'sell'
          shares: number
          price: number
          total_amount: number
          profit_loss: number | null
          timestamp: string
          kalshi_order_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          position_id?: string | null
          market_id: string
          trade_type: 'buy' | 'sell'
          shares: number
          price: number
          total_amount: number
          profit_loss?: number | null
          timestamp?: string
          kalshi_order_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          position_id?: string | null
          market_id?: string
          trade_type?: 'buy' | 'sell'
          shares?: number
          price?: number
          total_amount?: number
          profit_loss?: number | null
          timestamp?: string
          kalshi_order_id?: string | null
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          position_id: string | null
          action: string
          details: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          position_id?: string | null
          action: string
          details?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          position_id?: string | null
          action?: string
          details?: Json | null
          timestamp?: string
        }
      }
      monitoring_runs: {
        Row: {
          id: string
          started_at: string
          completed_at: string | null
          positions_checked: number
          positions_sold: number
          errors: number
          status: 'running' | 'completed' | 'failed'
        }
        Insert: {
          id?: string
          started_at?: string
          completed_at?: string | null
          positions_checked?: number
          positions_sold?: number
          errors?: number
          status?: 'running' | 'completed' | 'failed'
        }
        Update: {
          id?: string
          started_at?: string
          completed_at?: string | null
          positions_checked?: number
          positions_sold?: number
          errors?: number
          status?: 'running' | 'completed' | 'failed'
        }
      }
    }
  }
}

