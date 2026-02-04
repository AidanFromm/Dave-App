# Backend Configuration (Supabase)

**Owner:** Shared (Kyle + Partner)
**Last Updated:** February 4, 2026
**Status:** COMPLETE - Database ready

---

## Supabase Project

### Dashboard
https://supabase.com/dashboard/project/wupfvvwypyvzkznekksw

### Credentials

```
# Supabase Connection
SUPABASE_URL=https://wupfvvwypyvzkznekksw.supabase.co

# Public key (safe for client-side)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjkzMjIsImV4cCI6MjA4NTc0NTMyMn0.zDSY9wgurlBCEskYvihLmZYqbrt6ovtGj6ntk4WsYDY

# Service key (server-side only, NEVER expose to client)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2OTMyMiwiZXhwIjoyMDg1NzQ1MzIyfQ.0dzNEm4ygSQUEUWuXQqXXzmsslvayB7xpXBWB1BTUVg
```

---

## Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| categories | Product categories | Ready |
| products | All inventory items | Ready |
| customers | User accounts | Ready |
| orders | Purchase records | Ready |
| inventory_logs | Audit trail for stock changes | Ready |
| scheduled_drops | Upcoming releases | Ready |

## Storage Buckets

| Bucket | Purpose |
|--------|---------|
| product-images | Product photos (StockX images + custom uploads) |

## Database Functions

| Function | Purpose |
|----------|---------|
| deduct_inventory() | Atomic inventory deduction |
| restore_inventory() | Restore stock (cancelled orders) |
| generate_order_number() | Create unique order IDs |

## Row Level Security (RLS)

- Enabled on all tables
- Customers can only see their own data
- Products visible to everyone (read)
- Admin role can modify all data

---

## How to Access

1. Go to: https://supabase.com/dashboard
2. Sign in
3. Select project: wupfvvwypyvzkznekksw
