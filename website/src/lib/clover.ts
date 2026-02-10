import { createClient } from "@/lib/supabase/server";
import type { CloverSettings } from "@/types/admin";

// --- Types ---

export interface CloverItem {
  id: string;
  name: string;
  price: number;
  priceType: string;
  sku?: string;
  code?: string;
  stockCount?: number;
  hidden: boolean;
  itemStock?: { quantity: number };
}

export interface CloverOrder {
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

export interface CloverCategory {
  id: string;
  name: string;
  sortOrder?: number;
}

interface CloverApiResponse<T> {
  elements: T[];
  href?: string;
}

export interface CloverItemInput {
  name: string;
  price: number;
  sku?: string;
  code?: string;
  hidden?: boolean;
  priceType?: string;
}

class CloverNotConfiguredError extends Error {
  constructor() {
    super("Clover not configured. Add your Clover API keys to enable sync.");
    this.name = "CloverNotConfiguredError";
  }
}

// --- Client ---

export class CloverClient {
  private baseUrl: string;
  private accessToken: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(
    merchantId: string,
    accessToken: string,
    options?: { environment?: "sandbox" | "production"; maxRetries?: number; timeoutMs?: number }
  ) {
    const env = options?.environment ?? "production";
    const host =
      env === "sandbox"
        ? "https://sandbox.dev.clover.com"
        : "https://api.clover.com";
    this.baseUrl = `${host}/v3/merchants/${merchantId}`;
    this.accessToken = accessToken;
    this.maxRetries = options?.maxRetries ?? 2;
    this.timeoutMs = options?.timeoutMs ?? 15000;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        // Retry on 5xx or 429
        if (
          retryCount < this.maxRetries &&
          (response.status >= 500 || response.status === 429)
        ) {
          const delay = Math.pow(2, retryCount) * 500;
          await new Promise((r) => setTimeout(r, delay));
          return this.request<T>(path, options, retryCount + 1);
        }
        throw new Error(`Clover API error ${response.status}: ${errorText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (
        retryCount < this.maxRetries &&
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        const delay = Math.pow(2, retryCount) * 500;
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(path, options, retryCount + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // --- Inventory ---

  async getInventory(): Promise<CloverItem[]> {
    const data = await this.request<CloverApiResponse<CloverItem>>(
      "/items?expand=itemStock&limit=500"
    );
    return data.elements ?? [];
  }

  async getItem(itemId: string): Promise<CloverItem> {
    return this.request<CloverItem>(`/items/${itemId}?expand=itemStock`);
  }

  async createItem(data: CloverItemInput): Promise<CloverItem> {
    return this.request<CloverItem>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateItem(
    itemId: string,
    data: Partial<CloverItemInput>
  ): Promise<CloverItem> {
    return this.request<CloverItem>(`/items/${itemId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStock(itemId: string, quantity: number): Promise<boolean> {
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

  // --- Orders ---

  async getOrders(startDate?: Date, endDate?: Date): Promise<CloverOrder[]> {
    let path =
      "/orders?expand=lineItems,payments&limit=100&orderBy=createdTime+DESC";
    if (startDate) {
      path += `&filter=createdTime>=${startDate.getTime()}`;
    }
    if (endDate) {
      path += `&filter=createdTime<=${endDate.getTime()}`;
    }
    const data = await this.request<CloverApiResponse<CloverOrder>>(path);
    return data.elements ?? [];
  }

  async getOrder(orderId: string): Promise<CloverOrder | null> {
    try {
      return await this.request<CloverOrder>(
        `/orders/${orderId}?expand=lineItems,payments`
      );
    } catch {
      return null;
    }
  }

  // --- Categories ---

  async getCategories(): Promise<CloverCategory[]> {
    const data = await this.request<CloverApiResponse<CloverCategory>>(
      "/categories"
    );
    return data.elements ?? [];
  }

  async createCategory(name: string): Promise<CloverCategory> {
    return this.request<CloverCategory>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  // --- Health ---

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.request<CloverApiResponse<CloverItem>>("/items?limit=1");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// --- Factory ---

/**
 * Get a configured Clover client from env vars.
 * Returns null if not configured (no crash).
 */
export function getCloverClientFromEnv(): CloverClient | null {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const apiToken = process.env.CLOVER_API_TOKEN;
  const environment = (process.env.CLOVER_ENVIRONMENT ?? "sandbox") as
    | "sandbox"
    | "production";

  if (!merchantId || !apiToken) {
    return null;
  }

  return new CloverClient(merchantId, apiToken, { environment });
}

/**
 * Get a configured Clover client using settings stored in Supabase.
 * Falls back to env vars. Returns null if not configured.
 */
export async function getCloverClient(): Promise<CloverClient | null> {
  try {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
      .from("clover_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!error && settings) {
      const cloverSettings = settings as CloverSettings;
      if (cloverSettings.merchant_id && cloverSettings.access_token) {
        const environment = (process.env.CLOVER_ENVIRONMENT ?? "sandbox") as
          | "sandbox"
          | "production";
        return new CloverClient(
          cloverSettings.merchant_id,
          cloverSettings.access_token,
          { environment }
        );
      }
    }
  } catch {
    // Fall through to env vars
  }

  return getCloverClientFromEnv();
}

export { CloverNotConfiguredError };
