"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OrderItem, Address } from "@/types/order";

export default function PackingSlipPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      setOrder(data);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (order && !loading) {
      // Auto-trigger print dialog after render
      setTimeout(() => window.print(), 500);
    }
  }, [order, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const items = (order.items ?? []) as OrderItem[];
  const shippingAddress = order.shipping_address as Address | null;
  const orderNumber = order.order_number ?? orderId.slice(0, 8);

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-[#002244] text-white p-3 flex items-center justify-between">
        <span className="font-bold text-sm">Packing Slip Preview</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-[#FB4F14] text-white text-sm font-semibold rounded hover:bg-[#e04400] transition-colors"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-1.5 bg-white/10 text-white text-sm font-semibold rounded hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-[700px] mx-auto bg-white text-black p-8 mt-16 print:mt-0 print:p-6 font-sans text-sm leading-relaxed">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[#002244] pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#002244]" style={{ fontFamily: "system-ui, sans-serif" }}>
              SECURED TAMPA
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest">Packing Slip</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#002244]">#{orderNumber}</p>
            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Ship To */}
        {shippingAddress && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Ship To</h2>
            <div className="text-sm">
              <p className="font-semibold">{shippingAddress.firstName} {shippingAddress.lastName}</p>
              <p>{shippingAddress.street}</p>
              {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
              <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
              {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
            </div>
          </div>
        )}

        {!shippingAddress && order.customer_name && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Customer</h2>
            <p className="font-semibold">{order.customer_name}</p>
            {order.customer_email && <p className="text-gray-600">{order.customer_email}</p>}
          </div>
        )}

        {/* Items table */}
        <table className="w-full mb-6" cellPadding={0} cellSpacing={0}>
          <thead>
            <tr className="border-b-2 border-[#002244]">
              <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 w-8">
                <span className="sr-only">Check</span>
              </th>
              <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Item</th>
              <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Size</th>
              <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">SKU</th>
              <th className="text-center py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-2.5">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-sm" />
                </td>
                <td className="py-2.5 font-medium pr-4">{item.name}</td>
                <td className="py-2.5 text-gray-600">{item.size ?? "--"}</td>
                <td className="py-2.5 text-gray-600 font-mono text-xs">{item.sku ?? "--"}</td>
                <td className="py-2.5 text-center font-bold">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Packing checklist */}
        <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-200">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Packing Checklist</h2>
          <div className="space-y-2.5">
            {[
              "All items verified and match order",
              "Items inspected for damage/defects",
              "Correct sizes confirmed",
              "Protective packaging applied",
              "Packing slip included in box",
              "Box sealed and labeled",
            ].map((step, i) => (
              <label key={i} className="flex items-center gap-2.5 text-sm">
                <div className="w-4 h-4 border-2 border-gray-400 rounded-sm shrink-0" />
                {step}
              </label>
            ))}
          </div>
        </div>

        {/* Footer — store return address */}
        <div className="border-t-2 border-[#002244] pt-4 flex justify-between items-end">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Return Address</h2>
            <p className="text-xs text-gray-600">Secured Tampa</p>
            <p className="text-xs text-gray-600">Tampa, FL</p>
            <p className="text-xs text-gray-600">securedtampa.com</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              Total Items: {items.reduce((acc, item) => acc + item.quantity, 0)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Packed by: ___________________
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Date: ___________________
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
