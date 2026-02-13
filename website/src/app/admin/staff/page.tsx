"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Plus,
  Clock,
  Activity,
  Trash2,
  Shield,
  ChevronDown,
  X,
  Search,
} from "lucide-react";

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface ClockReport {
  user_id: string;
  full_name: string | null;
  email: string;
  total_hours: number;
  entries_count: number;
}

interface ActivityEntry {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  profiles?: { full_name: string | null; email: string };
}

export default function AdminStaffPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"members" | "timeclock" | "activity">("members");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clockReports, setClockReports] = useState<ClockReport[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("staff");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week">("today");

  const loadStaff = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .in("role", ["owner", "manager", "staff"])
      .order("created_at", { ascending: false });
    if (data) setStaff(data);
    setLoading(false);
  }, [supabase]);

  const loadClockReports = useCallback(async () => {
    const start = new Date();
    if (period === "today") start.setHours(0, 0, 0, 0);
    else {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
    }
    const { data } = await supabase
      .from("staff_clock_entries")
      .select("user_id, hours, profiles(full_name, email)")
      .gte("clock_in", start.toISOString())
      .not("hours", "is", null);
    if (data) {
      const map = new Map<string, ClockReport>();
      for (const e of data as any[]) {
        const existing = map.get(e.user_id);
        if (existing) {
          existing.total_hours += e.hours || 0;
          existing.entries_count += 1;
        } else {
          map.set(e.user_id, {
            user_id: e.user_id,
            full_name: e.profiles?.full_name,
            email: e.profiles?.email || "",
            total_hours: e.hours || 0,
            entries_count: 1,
          });
        }
      }
      setClockReports(Array.from(map.values()));
    }
  }, [supabase, period]);

  const loadActivity = useCallback(async () => {
    const { data } = await supabase
      .from("staff_activity_log")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setActivities(data as any);
  }, [supabase]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (tab === "timeclock") loadClockReports();
    if (tab === "activity") loadActivity();
  }, [tab, period, loadClockReports, loadActivity]);

  const handleAddStaff = async () => {
    if (!addEmail.trim()) return;
    // Find user by email and update role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", addEmail.trim())
      .single();
    if (profile) {
      await supabase.from("profiles").update({ role: addRole }).eq("id", profile.id);
      setAddEmail("");
      setShowAddModal(false);
      loadStaff();
    }
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm("Remove this staff member? They will be set to customer role.")) return;
    await supabase.from("profiles").update({ role: "customer" }).eq("id", id);
    loadStaff();
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    loadStaff();
  };

  const tabs = [
    { id: "members" as const, label: "Members", icon: Users },
    { id: "timeclock" as const, label: "Time Clock", icon: Clock },
    { id: "activity" as const, label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members, time tracking, and activity</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary hover:bg-brand-orange-600 text-white px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-900 p-1 border border-surface-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors flex-1 justify-center ${
              tab === t.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-800/50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === "members" && (
        <div className="rounded-xl border border-surface-800 bg-surface-900 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-surface-800/50 hover:bg-surface-850/50">
                  <td className="px-4 py-3 text-sm font-medium">{member.full_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="rounded-md border border-surface-700 bg-surface-850 px-2 py-1 text-xs font-medium capitalize"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveStaff(member.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-secured-error hover:bg-secured-error/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No staff members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Time Clock Tab */}
      {tab === "timeclock" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["today", "week"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  period === p ? "bg-primary text-white" : "bg-surface-800 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "today" ? "Today" : "This Week"}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-surface-800 bg-surface-900 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hours</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shifts</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overtime</th>
                </tr>
              </thead>
              <tbody>
                {clockReports.map((r) => (
                  <tr key={r.user_id} className="border-b border-surface-800/50 hover:bg-surface-850/50">
                    <td className="px-4 py-3 text-sm font-medium">{r.full_name || r.email}</td>
                    <td className="px-4 py-3 font-mono text-sm font-bold">{r.total_hours.toFixed(2)}h</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.entries_count}</td>
                    <td className="px-4 py-3">
                      {period === "week" && r.total_hours > 40 ? (
                        <span className="text-secured-warning text-sm font-bold">
                          +{(r.total_hours - 40).toFixed(2)}h OT
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {clockReports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No clock data for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {tab === "activity" && (
        <div className="rounded-xl border border-surface-800 bg-surface-900 overflow-hidden">
          <div className="divide-y divide-surface-800/50">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-850/50">
                <div className="rounded-full bg-primary/10 p-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{(a as any).profiles?.full_name || (a as any).profiles?.email || "Unknown"}</span>
                    {" "}
                    <span className="text-muted-foreground">{a.action.replace(/_/g, " ")}</span>
                  </p>
                  {a.details && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {JSON.stringify(a.details)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity logged yet</p>
            )}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-surface-800 bg-surface-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold uppercase">Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full rounded-lg border border-surface-700 bg-surface-850 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">User must already have an account</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Role
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full rounded-lg border border-surface-700 bg-surface-850 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <button
                onClick={handleAddStaff}
                className="w-full rounded-lg bg-primary hover:bg-brand-orange-600 text-white py-3 font-display font-bold uppercase tracking-wider transition-colors"
              >
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
