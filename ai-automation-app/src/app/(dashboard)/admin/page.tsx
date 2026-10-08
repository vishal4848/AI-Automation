'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Coins,
  BarChart3,
  CalendarCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Sparkles,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'audit'>('overview');

  // Overview data
  const [overview, setOverview] = useState<any>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  // Users data
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Audit logs data
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Modals
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState(50);
  const [creditReason, setCreditReason] = useState('Manual bonus credit grant');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('ADMIN');
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const roleUpper = (user?.role as string)?.toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'overview') fetchOverview();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'analytics') fetchAnalytics();
      if (activeTab === 'audit') fetchAuditLogs();
    }
  }, [activeTab, isAdmin]);

  const fetchOverview = async () => {
    setIsOverviewLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok && data.success) {
        setOverview(data.data);
      }
    } catch {}
    finally {
      setIsOverviewLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data.users || []);
      }
    } catch {}
    finally {
      setIsUsersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data.data);
      }
    } catch {}
    finally {
      setIsAnalyticsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (res.ok && data.success) {
        setAuditLogs(data.data.logs || []);
      }
    } catch {}
    finally {
      setIsAuditLoading(false);
    }
  };

  const handleToggleStatus = async (targetUser: any) => {
    setActionLoading(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ type: 'success', text: `User ${targetUser.email} status updated.` });
        fetchUsers();
      } else {
        setBanner({ type: 'error', text: data.error || 'Failed to update user status.' });
      }
    } catch (e: any) {
      setBanner({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(creditAmount), reason: creditReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ type: 'success', text: data.message || 'Credits successfully adjusted.' });
        setIsCreditModalOpen(false);
        fetchUsers();
      } else {
        setBanner({ type: 'error', text: data.error || 'Failed to adjust credits.' });
      }
    } catch (e: any) {
      setBanner({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBanner({ type: 'success', text: `User role updated to ${targetRole}.` });
        setIsRoleModalOpen(false);
        fetchUsers();
      } else {
        setBanner({ type: 'error', text: data.error || 'Failed to update role.' });
      }
    } catch (e: any) {
      setBanner({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This control center is restricted to platform administrators with ADMIN or SUPER_ADMIN permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Admin Control Center</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-bold">
              {user?.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Manage platform users, inspect system operations, and audit sensitive actions.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-2xl self-start">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'audit', label: 'Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {banner && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            banner.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{banner.text}</span>
        </div>
      )}

      {/* ─── TAB: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-card border-border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">Total Registered Users</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isOverviewLoading ? '...' : (overview?.totalUsers ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-500 mt-1">
                +{overview?.newUsers ?? 0} joined in last 7 days
              </p>
            </Card>

            <Card className="p-5 bg-card border-border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">Active User Accounts</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isOverviewLoading ? '...' : (overview?.activeUsers ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Active platform subscribers</p>
            </Card>

            <Card className="p-5 bg-card border-border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">Total AI Media Created</span>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isOverviewLoading ? '...' : ((overview?.totalImages || 0) + (overview?.totalVideos || 0)).toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {overview?.totalImages ?? 0} images, {overview?.totalVideos ?? 0} videos
              </p>
            </Card>

            <Card className="p-5 bg-card border-border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">Credits Consumed</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {isOverviewLoading ? '...' : (overview?.creditsConsumed ?? 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Cumulative platform consumption</p>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB: USERS ─── */}
      {activeTab === 'users' && (
        <Card className="bg-card border-border rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setTimeout(fetchUsers, 10); }}
                className="text-xs px-3 py-2 rounded-xl bg-background border border-border focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
              <Button onClick={fetchUsers} size="sm" variant="outline" className="rounded-xl text-xs gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Search</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/20 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{u.name || 'Anonymous User'}</div>
                      <div className="text-[11px] text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] font-semibold border-border">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      {u.credits}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${u.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedUser(u); setIsCreditModalOpen(true); }}
                        className="rounded-xl text-[11px] h-7 px-2.5"
                      >
                        Adjust Credits
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedUser(u); setTargetRole(u.role); setIsRoleModalOpen(true); }}
                        className="rounded-xl text-[11px] h-7 px-2.5"
                      >
                        Change Role
                      </Button>
                      <Button
                        size="sm"
                        variant={u.isActive ? 'ghost' : 'default'}
                        onClick={() => handleToggleStatus(u)}
                        disabled={actionLoading}
                        className={`rounded-xl text-[11px] h-7 px-2.5 ${u.isActive ? 'text-destructive hover:bg-destructive/10' : ''}`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── TAB: ANALYTICS ─── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 bg-card border-border rounded-2xl shadow-sm">
              <CardTitle className="text-sm font-bold mb-4">Post Lifecycle Status</CardTitle>
              <div className="space-y-2">
                {analytics?.postsByStatus?.map((s: any) => (
                  <div key={s.status} className="flex justify-between items-center text-xs p-2 rounded-xl bg-background border border-border">
                    <span className="font-semibold text-foreground">{s.status}</span>
                    <Badge variant="outline">{s.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-card border-border rounded-2xl shadow-sm">
              <CardTitle className="text-sm font-bold mb-4">Recent Publishing Failures</CardTitle>
              <div className="space-y-2">
                {analytics?.recentFailures?.length > 0 ? (
                  analytics.recentFailures.map((f: any) => (
                    <div key={f.id} className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>{f.platform}</span>
                        <span className="text-muted-foreground text-[10px]">{f.user?.email}</span>
                      </div>
                      <div className="text-destructive text-[11px]">{f.errorMessage || 'Unknown publish error'}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No recent publishing failures.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB: AUDIT LOGS ─── */}
      {activeTab === 'audit' && (
        <Card className="bg-card border-border rounded-2xl p-6 space-y-4">
          <CardTitle className="text-sm font-bold">Administrative Audit Trail</CardTitle>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target ID</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/20">
                    <td className="p-3 text-muted-foreground text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-foreground">{log.user?.email || 'System'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{log.resourceId || '—'}</td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Credit Modal */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-foreground">Adjust Credits for {selectedUser?.email}</h3>
            <form onSubmit={handleAdjustCredits} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Credit Delta (+ to add, - to deduct)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-background border border-border text-xs focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Reason / Audit Justification</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-background border border-border text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreditModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={actionLoading}>Confirm Adjustment</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-foreground">Change Role for {selectedUser?.email}</h3>
            <form onSubmit={handleUpdateRole} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Select New Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-background border border-border text-xs focus:outline-none"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={actionLoading}>Update Role</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
