'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, UserPlus, Users, ArrowLeft, Trash2, Edit, X } from 'lucide-react';
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from '@/components/ui/select';
import { toast } from 'sonner';
import { getAuthHeaders, clearToken } from '@/lib/auth-utils';

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  const inviteModalRef = useRef<HTMLDivElement | null>(null);

  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'member' as 'admin' | 'member'
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When modal opens: lock scroll, focus, close on Escape. Cleanup on close.
  useEffect(() => {
    if (!showInviteModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInviteModal(false);
    };
    const prevOverflow = document.body.style.overflow;
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // focus the modal wrapper so keyboard events reach it
    setTimeout(() => inviteModalRef.current?.focus(), 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow || '';
    };
  }, [showInviteModal]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userRes, tenantRes, usersRes] = await Promise.all([
        fetch('/api/me', { headers: getAuthHeaders() }),
        fetch('/api/tenant', { headers: getAuthHeaders() }),
        fetch('/api/users', { headers: getAuthHeaders() })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user || null);

        // Check if user is admin
        if (userData.user?.role !== 'admin') {
          router.push('/notes');
          return;
        }
      } else if (userRes.status === 401) {
        router.push('/login');
        return;
      }

      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenant(tenantData || null);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else if (usersRes.status === 403) {
        setError('Admin access required');
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`User created successfully! Temporary password: ${data.tempPassword}`);
        setShowInviteModal(false);
        setInviteForm({ firstName: '', lastName: '', email: '', role: 'member' });
        fetchData(); // Refresh users list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
        toast.error(errorData.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error');
      toast.error('Network error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(userId);
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setUsers(users.filter(u => u._id !== userId));
        toast.success('User deleted successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user');
        toast.error(errorData.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error');
      toast.error('Network error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearToken(); // Clear the JWT token from cookies
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed');
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-96">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">Admin privileges required</p>
            <Button onClick={() => router.push('/notes')}>Go to Notes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Users className="h-8 w-8 text-slate-600 mr-3" />
              <h1 className="text-xl font-semibold text-slate-900">Manage Users</h1>
              {tenant && (
                <Badge variant="outline" className="ml-4">
                  {tenant.title} ({tenant.subscriptionPlan?.toUpperCase()})
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button
                className="bg-slate-900 hover:bg-slate-800 cursor-pointer"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
              <Button variant="outline" onClick={handleLogout} className="cursor-pointer" disabled={isLoggingOut}>
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Team Members</h2>
              <p className="text-slate-600">Manage users in your organization</p>
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {users.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No users yet</h3>
                <p className="text-slate-600 mb-4">Invite your first team member</p>
                <Button
                  className="bg-slate-900 hover:bg-slate-800"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {users.map((u) => (
                <Card key={u._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-slate-600 font-medium">
                          {u.firstName[0]}{u.lastName?.[0] || ''}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {u.firstName} {u.lastName}
                        </h3>
                        <p className="text-sm text-slate-600">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                        disabled={isDeleting === u._id}
                      >
                        {isDeleting === u._id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite User Modal (overlay closes on outside click; dialog stops propagation) */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)} // click outside closes
        >
          {/* overlay: blur + dim */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

          {/* modal wrapper for focus control */}
          <div
            ref={inviteModalRef}
            tabIndex={-1}
            className="relative z-10 w-full max-w-md"
            aria-modal="true"
            role="dialog"
            aria-labelledby="invite-modal-title"
          >
            {/* stop clicks inside modal from bubbling up to overlay */}
            <Card onClick={(e) => e.stopPropagation()} className="bg-slate-50 shadow-xl rounded-2xl">
              <CardHeader className="bg-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle id="invite-modal-title">Invite New User</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                    className="h-8 w-8 p-0"
                    aria-label="Close invite dialog"
                  >
                    < X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={inviteForm.firstName}
                      onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={inviteForm.lastName}
                      onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
  <Label htmlFor="role">Role</Label>
  <Select
    value={inviteForm.role}
    onValueChange={(value) =>
      setInviteForm({ ...inviteForm, role: value as "admin" | "member" })
    }
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select a role" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="member">Member</SelectItem>
      <SelectItem value="admin">Admin</SelectItem>
    </SelectContent>
  </Select>
</div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={isInviting}>
                      {isInviting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Invite User'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
