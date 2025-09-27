'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, Plus, FileText, Calendar, User, Edit, Trash2, Crown, Users, ArrowLeft, Circle } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Note {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  createdFor?: { _id: string; firstName: string; lastName: string };
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
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

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  
  // Loading states for different operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '' as string
  });

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [userRes, tenantRes, notesRes, usersRes] = await Promise.all([
        fetch('/api/me'),
        fetch('/api/tenant'),
        fetch('/api/notes'),
        fetch('/api/users')
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user || null);
      } else if (userRes.status === 401) {
        router.push('/');
        return;
      }

      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenant(tenantData);
      }

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(Array.isArray(notesData) ? notesData : notesData.notes || []);
      } else if (notesRes.status === 401) {
        router.push('/');
      } else {
        setError('Failed to fetch notes');
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTeamMembers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/');
    } catch {
      console.error('Logout failed');
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // Convert "none" back to empty string for API
      const apiData = {
        ...formData,
        assignedTo: formData.assignedTo === 'none' ? '' : formData.assignedTo
      };

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        await fetchAllData();
        setShowCreateModal(false);
        setFormData({ title: '', content: '', priority: 'medium', assignedTo: '' });
        setError('');
        toast.success('Note created successfully');
      } else {
        const errorData = await response.json();
        if (response.status === 403 && errorData.error?.includes('note limit')) {
          setShowUpgradeModal(true);
        } else {
          // Handle parsed error from backend
          let errorMessage = 'Failed to create note';
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.fieldErrors) {
              // Handle Zod validation errors
              const fieldErrors = Object.entries(errorData.error.fieldErrors)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('; ');
              errorMessage = `Validation error: ${fieldErrors}`;
            } else if (errorData.error.formErrors) {
              errorMessage = `Form error: ${errorData.error.formErrors.join(', ')}`;
            }
          }
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch {
      setError('Network error');
      toast.error('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/notes/${editingNote._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAllData();
        setShowEditModal(false);
        setEditingNote(null);
        setFormData({ title: '', content: '', priority: 'medium', assignedTo: '' });
        setError('');
        toast.success('Note updated successfully');
      } else {
        const errorData = await response.json();
        let errorMessage = 'Failed to update note';
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.fieldErrors) {
            const fieldErrors = Object.entries(errorData.error.fieldErrors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = `Validation error: ${fieldErrors}`;
          } else if (errorData.error.formErrors) {
            errorMessage = `Form error: ${errorData.error.formErrors.join(', ')}`;
          }
        }
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch {
      setError('Network error');
      toast.error('Network error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpgrade = async () => {
    if (!tenant) return;
    setIsUpgrading(true);
    try {
      const response = await fetch(`/api/tenant/${tenant.slug}/upgrade`, { method: 'POST' });
      if (response.ok) {
        await fetchAllData();
        setShowUpgradeModal(false);
        toast.success('Successfully upgraded to Pro plan!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upgrade');
        toast.error(errorData.error || 'Failed to upgrade');
      }
    } catch {
      setError('Network error');
      toast.error('Network error');
    } finally {
      setIsUpgrading(false);
    }
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      priority: note.priority,
      assignedTo: note.createdFor?._id || ''
    });
    setShowEditModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const isAtNoteLimit = tenant?.subscriptionPlan === 'free' && (tenant.notesCount ?? 0) >= 3;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        <span className="ml-2 text-slate-600">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-slate-600 mr-3" />
              <h1 className="text-xl font-semibold text-slate-900 cursor-pointer" onClick={() => router.push('/dashboard')}>Quillio Notes</h1>
              {tenant && (
                <Badge variant="outline" className="ml-4">
                  {tenant.title} ({tenant.subscriptionPlan?.toUpperCase()})
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              )}
              {user?.role === 'admin' && tenant?.subscriptionPlan === 'free' && (
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 cursor-pointer"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your Notes</h2>
              <p className="text-slate-600">
                Manage your notes and stay organized
                {tenant?.subscriptionPlan === 'free' && (
                  <span className="ml-2 text-sm">
                    ({tenant?.notesCount}/3 notes used)
                  </span>
                )}
              </p>
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800 cursor-pointer"
              onClick={() => setShowCreateModal(true)}
              disabled={isAtNoteLimit}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>

          {isAtNoteLimit && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <Crown className="h-4 w-4" />
              <AlertDescription>
                You've reached the free plan limit of 3 notes.
                {user?.role === 'admin' ? ' Upgrade to Pro to create unlimited notes.' : ' Contact your admin to upgrade.'}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {notes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No notes yet</h3>
                <p className="text-slate-600 mb-4">Create your first note to get started</p>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  onClick={() => setShowCreateModal(true)}
                  disabled={isAtNoteLimit}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes?.map((note) => (
                <Card key={note._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(note.priority)}>
                          {note.priority}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(note)}
                            className="h-8 w-8 p-0 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNoteToDelete(note)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {note.content}
                    </CardDescription>

                    <div className="flex flex-col gap-2 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Created by: {note.createdBy.firstName} {note.createdBy.lastName}
                      </div>

                      {note.createdFor && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Assigned to: {note.createdFor.firstName} {note.createdFor.lastName}
                        </div>
                      )}

                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <AlertDialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create Note</AlertDialogTitle>
            </AlertDialogHeader>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  className='mt-2'
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  rows={6}
                  className="w-full border rounded-md p-2 resize-none h-40 mt-2"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as "low" | "medium" | "high" })
                  }
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2 ">
                        <Circle className="h-3 w-3 text-red-500 fill-red-500" />
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={formData.assignedTo || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="-- Not Assigned --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not Assigned --</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer"
                  disabled={isCreating}
                >
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" className="cursor-pointer" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showEditModal && editingNote && (
        <AlertDialog open={showEditModal} onOpenChange={setShowEditModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Note</AlertDialogTitle>
            </AlertDialogHeader>
            <form onSubmit={handleEditNote} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <textarea
                  id="edit-content"
                  rows={6}
                  className="w-full border rounded-md p-2 resize-none h-40"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as "low" | "medium" | "high" })
                  }
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-red-500 fill-red-500" />
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-assignedTo">Assign To</Label>
                <select
                  id="edit-assignedTo"
                  className="w-full border rounded p-2"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                >
                  <option value="">-- Not Assigned --</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.firstName} {member.lastName} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setShowEditModal(false)}
                  className="cursor-pointer"
                  disabled={isUpdating}
                >
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" className="cursor-pointer" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {noteToDelete && (
        <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the note "{noteToDelete.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNoteToDelete(null)} className="cursor-pointer" disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!noteToDelete) return;
                  setIsDeleting(true);
                  try {
                    const response = await fetch(`/api/notes/${noteToDelete._id}`, { method: 'DELETE' });
                    if (response.ok) {
                      await fetchAllData();
                      setNoteToDelete(null);
                      toast.success('Note deleted successfully');
                    } else {
                      const errorData = await response.json();
                      setError(errorData.error || 'Failed to delete note');
                      toast.error(errorData.error || 'Failed to delete note');
                    }
                  } catch {
                    setError('Network error');
                    toast.error('Network error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
