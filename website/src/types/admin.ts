export type AdminRole = "customer" | "owner" | "manager" | "staff";

export interface AdminProfile {
  id: string;
  auth_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: AdminRole;
}

export type AdjustmentReason =
  | "sold_online"
  | "sold_instore"
  | "returned"
  | "damaged"
  | "restocked"
  | "adjustment"
  | "transfer";

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  sold_online: "Sold Online",
  sold_instore: "Sold In-Store",
  returned: "Returned",
  damaged: "Damaged",
  restocked: "Restocked",
  adjustment: "Manual Adjustment",
  transfer: "Transfer",
};

export type AdjustmentSource = "admin" | "clover_webhook" | "web_order";

export interface InventoryAdjustment {
  id: string;
  product_id: string;
  quantity_change: number;
  reason: AdjustmentReason;
  previous_quantity: number;
  new_quantity: number;
  notes: string | null;
  adjusted_by: string;
  source: AdjustmentSource;
  created_at: string;
}

export interface CloverSettings {
  id: string;
  merchant_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  webhook_secret: string | null;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyAnalytics {
  id: string;
  date: string;
  total_revenue: number;
  total_orders: number;
  web_orders: number;
  instore_orders: number;
  web_revenue: number;
  instore_revenue: number;
  items_sold: number;
  new_customers: number;
  avg_order_value: number;
  created_at: string;
}

export type TimePeriod = "today" | "7d" | "30d" | "all" | "custom";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  itemsSold: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  itemsChange: number;
}

export type OrderStatusAction =
  | "confirm"
  | "process"
  | "ship"
  | "deliver"
  | "cancel"
  | "refund";

export interface AdminPermissions {
  viewDashboard: boolean;
  viewRevenue: boolean;
  viewInventory: boolean;
  editInventory: boolean;
  viewOrders: boolean;
  manageOrders: boolean;
  cancelOrders: boolean;
  refundOrders: boolean;
  viewCustomers: boolean;
  viewAnalytics: boolean;
  manageStaff: boolean;
  manageSettings: boolean;
  exportData: boolean;
}

export const ROLE_PERMISSIONS: Record<"owner" | "staff", AdminPermissions> = {
  owner: {
    viewDashboard: true,
    viewRevenue: true,
    viewInventory: true,
    editInventory: true,
    viewOrders: true,
    manageOrders: true,
    cancelOrders: true,
    refundOrders: true,
    viewCustomers: true,
    viewAnalytics: true,
    manageStaff: true,
    manageSettings: true,
    exportData: true,
  },
  staff: {
    viewDashboard: true,
    viewRevenue: false,
    viewInventory: true,
    editInventory: true,
    viewOrders: true,
    manageOrders: true,
    cancelOrders: false,
    refundOrders: false,
    viewCustomers: true,
    viewAnalytics: false,
    manageStaff: false,
    manageSettings: false,
    exportData: false,
  },
};
