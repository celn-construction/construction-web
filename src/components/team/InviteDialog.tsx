'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '~/trpc/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RoleSelect from './RoleSelect';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export default function InviteDialog({
  open,
  onOpenChange,
  organizationId,
}: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const utils = api.useUtils();

  const createInvitation = api.invitation.create.useMutation({
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      void utils.invitation.list.invalidate();
      setEmail('');
      setRole('member');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    createInvitation.mutate({ organizationId, email, role });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <DialogTitle>Invite Team Member</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role
              </Label>
              <RoleSelect value={role} onValueChange={setRole} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createInvitation.isPending}>
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
