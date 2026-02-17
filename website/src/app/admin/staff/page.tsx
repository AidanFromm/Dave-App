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
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/85 text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{member.full_name || "--"}</td>
                <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemoveStaff(member.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-medium">No staff members yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add your first team member to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {staff.length === 0 && !loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium">No staff members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first team member to get started.</p>
          </div>
        ) : (
          staff.map((member) => (
            <div key={member.id} className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{member.full_name || "--"}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveStaff(member.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium capitalize min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
                <span className="text-xs text-muted-foreground">{new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border/50 bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
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
                  className="w-full rounded-lg border border-border bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
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
                  className="w-full rounded-lg border border-border bg-white/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <button
                onClick={handleAddStaff}
                className="w-full rounded-lg bg-primary hover:bg-primary/85 text-primary-foreground px-6 py-3 text-sm font-medium transition-all duration-200"
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
