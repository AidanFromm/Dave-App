"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }

      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">
          Have a question? We're here to help.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {/* Contact Info */}
        <div>
          <h2 className="text-xl font-semibold">Get in Touch</h2>
          <p className="mt-2 text-muted-foreground">
            Reach out to us with any questions about orders, products, or authentication.
          </p>

          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">securedtampa.llc@gmail.com</p>
                <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Location</h3>
                <p className="text-muted-foreground">Tampa, FL</p>
                <p className="text-sm text-muted-foreground">Local pickup available</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Response Time</h3>
                <p className="text-muted-foreground">Within 24 hours</p>
                <p className="text-sm text-muted-foreground">Monday - Saturday</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="font-medium">Follow Us</h3>
            <div className="mt-3 flex gap-4">
              <a 
                href="https://instagram.com/securedtampa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Instagram
              </a>
              <a 
                href="https://twitter.com/securedtampa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-xl font-semibold">Message Sent!</h3>
              <p className="mt-2 text-muted-foreground">
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
              <Button className="mt-6" onClick={() => setSent(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="What's this about?" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  name="message"
                  placeholder="How can we help you?" 
                  rows={5}
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
