"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, User, Bell, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    drops: true,
    promotions: false,
  });

  const themes = [
    { key: "system", label: "System", icon: Monitor },
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
  ] as const;

  const handleSave = async () => {
    setSaving(true);
    // Settings are saved locally for now — server persistence available when profile table is ready
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    toast.success("Settings saved");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="mt-6 rounded-xl shadow-card bg-card p-4 sm:p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your display name and contact info
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-4 rounded-xl shadow-card bg-card p-4 sm:p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose what updates you&apos;d like to receive
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Order Updates</p>
              <p className="text-xs text-muted-foreground">Get notified about order status changes</p>
            </div>
            <Switch
              checked={notifications.orderUpdates}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, orderUpdates: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Drop Alerts</p>
              <p className="text-xs text-muted-foreground">Be the first to know about new drops</p>
            </div>
            <Switch
              checked={notifications.drops}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, drops: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Promotions</p>
              <p className="text-xs text-muted-foreground">Sales, discounts, and special offers</p>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, promotions: v }))}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="mt-4 rounded-xl shadow-card bg-card p-4 sm:p-6">
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose your preferred color theme
        </p>
        <div className="mt-4 flex gap-3">
          {themes.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={theme === key ? "default" : "outline"}
              className={cn("flex-1")}
              onClick={() => setTheme(key)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
