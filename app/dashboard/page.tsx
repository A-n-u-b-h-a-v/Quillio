'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, FileText, Plus, Users, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getToken, getAuthHeaders, clearToken } from '@/lib/auth-utils';

interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'member';
  tenantId: string;
}

interface Tenant {
  _id: string;
  title: string;
  slug: string;
  subscriptionPlan: 'free' | 'pro';
  notesCount: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Fetch authenticated user and tenant
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tenantRes] = await Promise.all([
          fetch('/api/me', { headers: getAuthHeaders() }),
          fetch('/api/tenant', { headers: getAuthHeaders() })
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        } else {
          router.push('/login'); // redirect if not authenticated
          return;
        }

        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setTenant(tenantData);
        }
      } catch (err) {
        router.push('/login'); // redirect on network error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearToken(); // Clear the JWT token from cookies
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      logger.error('Logout failed', err);
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleUpgrade = async () => {
    if (!tenant) return;
    setUpgradeLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/tenant/${tenant.slug}/upgrade`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok) {
        setTenant((prev) => prev ? { ...prev, subscriptionPlan: 'pro' } : null);
        setMessage(data.message);
        toast.success('Successfully upgraded to Pro plan!');
      } else {
        setMessage(data.error || 'Upgrade failed');
        toast.error(data.error || 'Upgrade failed');
      }
    } catch (err) {
      setMessage('Network error');
      toast.error('Network error');
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        <span className="ml-2 text-slate-600">Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Welcome, {user.firstName}!</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Role: {user.role} • Tenant: {tenant?.title || 'Loading...'}
              {tenant && (
                <Badge variant="outline">
                  {tenant.subscriptionPlan?.toUpperCase()}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          {message && (
            <CardContent>
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => router.push('/notes')}
          >
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">View Notes</p>
                <p className="text-sm text-slate-600">Check all your notes</p>
              </div>
              <FileText className="h-6 w-6 text-slate-500" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => router.push('/notes')}
          >
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Add Note</p>
                <p className="text-sm text-slate-600">Create a new note</p>
              </div>
              <Plus className="h-6 w-6 text-slate-500" />
            </CardContent>
          </Card>

          {user.role === 'admin' && (
            <Card 
              className="cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => router.push('/admin/users')}
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Manage Users</p>
                  <p className="text-sm text-slate-600">Invite and manage team</p>
                </div>
                <Users className="h-6 w-6 text-slate-500" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upgrade Section */}
        {user.role === 'admin' && tenant?.subscriptionPlan === 'free' && (
          <Card className="shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Upgrade to Pro</p>
                <p className="text-sm text-slate-600">
                  Unlock unlimited notes for your tenant.
                </p>
              </div>
              <Button onClick={handleUpgrade} disabled={upgradeLoading}>
                {upgradeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Upgrade
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Logout */}
        <div className="flex justify-end">
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2" disabled={isLoggingOut}>
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
