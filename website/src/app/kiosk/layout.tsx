import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secured Tampa — In-Store Kiosk",
  description: "Browse our inventory in-store",
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#002244]">
      {children}
    </div>
  );
}
