const SHIPPO_API_URL = "https://api.goshippo.com";

function getHeaders() {
  return {
    Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Default "from" address for SecuredTampa store
export const FROM_ADDRESS = {
  name: "SecuredTampa",
  street1: "2398 Grand Cypress Dr STE 420",
  city: "Lutz",
  state: "FL",
  zip: "33559",
  country: "US",
  phone: "8139432777",
  email: "orders@securedtampa.com",
};

export interface ShippoAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface ShippoParcel {
  length: string;
  width: string;
  height: string;
  distance_unit: string;
  weight: string;
  mass_unit: string;
}

// Default parcel for sneaker box
export const DEFAULT_PARCEL: ShippoParcel = {
  length: "14",
  width: "10",
  height: "6",
  distance_unit: "in",
  weight: "3",
  mass_unit: "lb",
};

async function shippoFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${SHIPPO_API_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shippo API error (${res.status}): ${err}`);
  }
  return res.json();
}

export async function createShipment(
  addressFrom: ShippoAddress,
  addressTo: ShippoAddress,
  parcel: ShippoParcel = DEFAULT_PARCEL,
  async = false
) {
  return shippoFetch("/shipments/", {
    method: "POST",
    body: JSON.stringify({
      address_from: addressFrom,
      address_to: addressTo,
      parcels: [parcel],
      async,
    }),
  });
}

export async function getRates(shipmentId: string) {
  return shippoFetch(`/shipments/${shipmentId}/rates/`);
}

export async function createTransaction(rateId: string, labelFileType = "PDF") {
  return shippoFetch("/transactions/", {
    method: "POST",
    body: JSON.stringify({
      rate: rateId,
      label_file_type: labelFileType,
      async: false,
    }),
  });
}

export async function getTransaction(transactionId: string) {
  return shippoFetch(`/transactions/${transactionId}`);
}

export async function getTrackingStatus(carrier: string, trackingNumber: string) {
  return shippoFetch(`/tracks/${carrier}/${trackingNumber}`);
}

export async function registerWebhook(url: string) {
  return shippoFetch("/tracks/", {
    method: "POST",
    body: JSON.stringify({ carrier: "", tracking_number: "", metadata: "", url }),
  });
}
