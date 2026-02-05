import type { Address } from "./order";

export interface SizeAlert {
  size: string;
  categoryId: string;
}

export interface Customer {
  id: string;
  auth_user_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  addresses: Address[];
  default_address_index: number;
  push_token: string | null;
  size_alerts: SizeAlert[];
  marketing_opt_in: boolean;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}
