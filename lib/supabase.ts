import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://klfxguptzzjrbbeknpun.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZnhndXB0enpqcmJiZWtucHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MjQ4MDUsImV4cCI6MjA0MTUwMDgwNX0.IWW046UbtkQBZifBTG794h-0fLfSU82XxfG_rWeLBxs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {

    }
})