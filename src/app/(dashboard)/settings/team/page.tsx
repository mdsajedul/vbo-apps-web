"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { platformApi, PlatformMember } from "@/lib/platform-api";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  Building2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function TeamSettingsPage() {
  const { user } = useAuthStore();
  const currentTenantId = user?.vbo_tenant_id || user?.tenant_id || "";
  const [members, setMembers] = useState<PlatformMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"OWNER" | "ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    if (!currentTenantId) return;
    try {
      setRefreshing(true);
      const data = await platformApi.getMembers(currentTenantId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load members:", err);
      toast.error(err.message || "Failed to fetch workspace members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentTenantId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      toast.loading(`Sending invitation to ${inviteEmail}...`, { id: "invite-member" });
      await platformApi.inviteMember(currentTenantId, {
        email: inviteEmail,
        role: inviteRole,
      });

      toast.success(`Invitation sent successfully to ${inviteEmail}`, { id: "invite-member" });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      await fetchMembers();
    } catch (err: any) {
      console.error("Failed to invite member:", err);
      toast.error(err.message || "Invitation could not be sent", { id: "invite-member" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toUpperCase()) {
      case "OWNER":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "ADMIN":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "MEMBER":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Team & Identity Management
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Centralized SSO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Invite colleagues and manage access permissions. Invited users automatically receive access across all subscribed VBO applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMembers}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Members Directory Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Active Members
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              {members.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Auto-synced with ERP & Connect
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium">Loading workspace team members...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No team members found. Click &quot;Invite Member&quot; to add colleagues.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member) => {
              const fullName = member.user?.full_name || "Team Member";
              const email = member.user?.email || "Unknown";
              const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={member.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar Initial */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {fullName}
                        </span>
                        {member.user_id === user?.vbo_user_id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-13 sm:ml-0">
                    {/* Role Pill */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getRoleBadgeClass(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{member.status || "Active"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INVITE MEMBER MODAL */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Invite New Team Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              The user will receive an email invitation to join this workspace with single sign-on.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs font-semibold">
                Workspace Role
              </Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="MEMBER">MEMBER — Standard access to subscribed apps</option>
                <option value="ADMIN">ADMIN — Can manage team members & settings</option>
                <option value="VIEWER">VIEWER — Read-only access to dashboards</option>
                <option value="OWNER">OWNER — Full administrative ownership</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Automated Cross-Service Sync</span>
              </div>
              <p>
                When accepted, this user will automatically have access to both VBO ERP and VBO Connect without needing separate passwords.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Send Invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
