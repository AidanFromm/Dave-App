import { createClient } from "@/lib/supabase/server";
import type { CloverSettings } from "@/types/admin";

interface CloverItem {
  id: string;
  name: string;
  price: number;
  priceType: string;
  sku?: string;
  code?: string; // barcode
  stockCount?: number;
  hidden: boolean;
}

interface CloverOrder {
  id: string;
  currency: string;
  total: number;
  state: string;
  createdTime: number;
  modifiedTime: number;
  lineItems?: {
    elements: Array<{
      id: string;
      name: string;
      price: number;
      unitQty: number;
      item?: { id: string };
    }>;
  };
  payments?: {
    elements: Array<{
      id: string;
      amount: number;
      result: string;
    }>;
  };
}

interface CloverApiResponse<T> {
  elements: T[];
  href?: string;
}

export class CloverClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(merchantId: string, accessToken: string) {
    this.baseUrl = `https://api.clover.com/v3/merchants/${merchantId}`;
    this.accessToken = accessToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Clover API error ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getItems(): Promise<CloverItem[]> {
    try {
      const data = await this.request<CloverApiResponse<CloverItem>>(
        "/items?expand=itemStock&limit=500"
      );
      return data.elements ?? [];
    } catch (error) {
      console.error("Failed to fetch Clover items:", error);
      return [];
    }
  }

  async getOrders(startDate?: Date): Promise<CloverOrder[]> {
    try {
      let path = "/orders?expand=lineItems,payments&limit=100&orderBy=createdTime+DESC";
      if (startDate) {
        path += `&filter=createdTime>=${startDate.getTime()}`;
      }
      const data = await this.request<CloverApiResponse<CloverOrder>>(path);
      return data.elements ?? [];
    } catch (error) {
      console.error("Failed to fetch Clover orders:", error);
      return [];
    }
  }

  async getOrder(orderId: string): Promise<CloverOrder | null> {
    try {
      return await this.request<CloverOrder>(
        `/orders/${orderId}?expand=lineItems,payments`
      );
    } catch (error) {
      console.error(`Failed to fetch Clover order ${orderId}:`, error);
      return null;
    }
  }

  async updateItemStock(itemId: string, quantity: number): Promise<boolean> {
    try {
      await this.request(`/item_stocks/${itemId}`, {
        method: "POST",
        body: JSON.stringify({ quantity, stockCount: quantity }),
      });
      return true;
    } catch (error) {
      console.error(`Failed to update stock for item ${itemId}:`, error);
      return false;
    }
  }
}

/**
 * Get a configured Clover client using settings stored in Supabase.
 * Returns null if no active Clover settings are found.
 */
export async function getCloverClient(): Promise<CloverClient | null> {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from("clover_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !settings) {
      console.warn("No active Clover settings found");
      return null;
    }

    const cloverSettings = settings as CloverSettings;

    if (!cloverSettings.merchant_id || !cloverSettings.access_token) {
      console.warn("Clover settings incomplete: missing merchant_id or access_token");
      return null;
    }

    return new CloverClient(cloverSettings.merchant_id, cloverSettings.access_token);
  } catch (error) {
    console.error("Failed to initialize Clover client:", error);
    return null;
  }
}
