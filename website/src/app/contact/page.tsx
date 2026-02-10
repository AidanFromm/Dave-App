import { Metadata } from "next";
import ContactPage from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Secured Tampa. Questions about orders, products, or authentication — we're here to help.",
  openGraph: {
    title: "Contact Us | Secured Tampa",
    description: "Get in touch with Secured Tampa. We're here to help.",
  },
};

export default function Page() {
  return <ContactPage />;
}
