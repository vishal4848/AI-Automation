'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Unlink, AlertCircle, CheckCircle2, KeyRound, ExternalLink, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isTokenSubmitting, setIsTokenSubmitting] = useState(false);

  const extractArray = (d: any): any[] => {
    if (Array.isArray(d?.data)) return d.data;
    if (d?.data && Array.isArray(d.data.data)) return d.data.data;
    if (Array.isArray(d)) return d;
    return [];
  };

  const fetchAccounts = () => {
    fetch('/api/social/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAccounts(extractArray(data));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();

    // Check URL parameters for OAuth callbacks
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const error = params.get('error');

      if (success === 'instagram_connected') {
        setBannerMessage({ type: 'success', text: 'Instagram Professional account successfully connected!' });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (success === 'facebook_connected') {
        setBannerMessage({ type: 'success', text: 'Facebook Page successfully connected!' });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (success === 'linkedin_connected') {
        setBannerMessage({ type: 'success', text: 'LinkedIn account successfully connected!' });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        setBannerMessage({ type: 'error', text: decodeURIComponent(error) });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const connectInstagram = async () => {
    try {
      const res = await fetch('/api/social/instagram/connect');
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setBannerMessage({
          type: 'error',
          text: 'Authentication session expired. Please log in again to connect your Instagram account.',
        });
        return;
      }

      const targetUrl = data.url || data.data?.url;
      if (res.ok && data.success && targetUrl) {
        window.location.href = targetUrl;
      } else {
        setBannerMessage({
          type: 'error',
          text: data.error || data.message || 'INSTAGRAM_NOT_CONFIGURED: Meta App credentials missing in backend environment.',
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err.message || 'Failed to initiate Instagram connection. Please check server connection.',
      });
    }
  };

  const connectFacebook = async () => {
    try {
      const res = await fetch('/api/social/facebook/connect');
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setBannerMessage({
          type: 'error',
          text: 'Authentication session expired. Please log in again to connect your Facebook Page.',
        });
        return;
      }

      const targetUrl = data.url || data.data?.url;
      if (res.ok && data.success && targetUrl) {
        window.location.href = targetUrl;
      } else {
        setBannerMessage({
          type: 'error',
          text: data.error || data.message || 'FACEBOOK_NOT_CONFIGURED: Meta App credentials missing in backend environment.',
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err.message || 'Failed to initiate Facebook connection. Please check server connection.',
      });
    }
  };

  const connectLinkedIn = async () => {
    try {
      const res = await fetch('/api/social/linkedin/connect');
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setBannerMessage({
          type: 'error',
          text: 'Authentication session expired. Please log in again to connect your LinkedIn account.',
        });
        return;
      }

      const targetUrl = data.url || data.data?.url;
      if (res.ok && data.success && targetUrl) {
        window.location.href = targetUrl;
      } else {
        setBannerMessage({
          type: 'error',
          text: data.error || data.message || 'LINKEDIN_NOT_CONFIGURED: LinkedIn Client ID missing in backend environment.',
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err.message || 'Failed to initiate LinkedIn connection. Please check server connection.',
      });
    }
  };

  const disconnectAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/social/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
        setBannerMessage({ type: 'success', text: 'Account disconnected.' });
      }
    } catch {
      setBannerMessage({ type: 'error', text: 'Failed to disconnect account.' });
    }
  };

  const handleReconnect = (platform: string) => {
    const p = platform?.toLowerCase();
    if (p === 'facebook') return connectFacebook();
    if (p === 'linkedin') return connectLinkedIn();
    return connectInstagram();
  };

  const handleTokenConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsTokenSubmitting(true);
    try {
      const res = await fetch('/api/social/token-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setBannerMessage({
          type: 'success',
          text: data.message || 'Social account(s) successfully connected with access token!',
        });
        setTokenInput('');
        setIsTokenModalOpen(false);
        fetchAccounts();
      } else {
        setBannerMessage({
          type: 'error',
          text: data.error || 'Failed to connect account with the provided token.',
        });
      }
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err.message || 'Connection error. Please verify the token and try again.',
      });
    } finally {
      setIsTokenSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connected Social Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage authorized channels for automated social media scheduling and analytics sync.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <Button onClick={() => setIsTokenModalOpen(true)} variant="outline" className="rounded-xl gap-2 font-semibold text-xs border-primary/40 hover:bg-primary/5 text-primary shadow-sm">
            <KeyRound className="w-4 h-4" />
            <span>Connect via Token (Instant)</span>
          </Button>
          <Button onClick={connectInstagram} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl gap-2 font-semibold text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Connect Instagram</span>
          </Button>
          <Button onClick={connectFacebook} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Connect Facebook Page</span>
          </Button>
          <Button onClick={connectLinkedIn} className="bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-xl gap-2 font-semibold text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Connect LinkedIn</span>
          </Button>
        </div>
      </div>

      {bannerMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {bannerMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Grid of Social Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.length === 0 && !loading && (
          <Card className="col-span-full border-dashed border-border bg-card/40 rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No social accounts connected yet.</p>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
              <Button onClick={() => setIsTokenModalOpen(true)} variant="default" size="sm" className="rounded-xl text-xs gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Connect via Access Token (Instant)
              </Button>
              <Button onClick={connectInstagram} variant="outline" size="sm" className="rounded-xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Connect Instagram
              </Button>
              <Button onClick={connectFacebook} variant="outline" size="sm" className="rounded-xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Connect Facebook Page
              </Button>
              <Button onClick={connectLinkedIn} variant="outline" size="sm" className="rounded-xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Connect LinkedIn
              </Button>
            </div>
          </Card>
        )}

        {accounts.map((account) => {
          const platformLower = account.platform?.toLowerCase();
          const isFB = platformLower === 'facebook';
          const isLI = platformLower === 'linkedin';

          return (
            <Card key={account.id} className="border-border bg-card rounded-2xl p-5 flex flex-col justify-between hover:border-border/80 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-2xl border border-border flex items-center justify-center font-bold text-sm text-white shadow-sm ${
                      isFB
                        ? 'bg-blue-600'
                        : isLI
                        ? 'bg-[#0A66C2]'
                        : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
                    }`}
                  >
                    {isFB ? 'f' : isLI ? 'in' : 'ig'}
                  </div>
                  <Badge
                    className={
                      account.status === 'CONNECTED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }
                  >
                    {account.status === 'CONNECTED' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-foreground">{account.platform}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {isFB || isLI ? account.username : `@${account.username}`}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-2">
                {account.status === 'CONNECTED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
                    className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border rounded-xl"
                  >
                    <Unlink className="w-3.5 h-3.5 mr-1.5" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleReconnect(account.platform)}
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    Connect Account
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Direct Token Connect Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Connect via Access Token</h2>
                  <p className="text-xs text-muted-foreground">Instant connection without OAuth login redirect or verification blocks</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTokenConnect} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Meta Access Token (User or Page Token)</label>
                <textarea
                  rows={4}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste token starting with EAAB... or EAA..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>

              <div className="p-3 bg-accent/40 rounded-xl text-xs space-y-1.5 text-muted-foreground">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>How to generate a token in 30 seconds:</span>
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    Open Graph API Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>In Graph API Explorer, select your App and click <strong>Generate Access Token</strong>.</li>
                  <li>Grant permissions: <code className="bg-background px-1 py-0.5 rounded">pages_manage_posts</code>, <code className="bg-background px-1 py-0.5 rounded">pages_read_engagement</code>, and <code className="bg-background px-1 py-0.5 rounded">instagram_basic</code>.</li>
                  <li>Copy the generated token and paste it above!</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTokenModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isTokenSubmitting || !tokenInput.trim()}
                  className="rounded-xl text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  {isTokenSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect Account(s)</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
