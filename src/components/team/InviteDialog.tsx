'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import RoleSelect from './RoleSelect';
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from '~/lib/validations/invitation';

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
  const utils = api.useUtils();

  // Initialize form with react-hook-form + zod
  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      organizationId,
      email: '',
      role: 'member',
    },
  });

  const createInvitation = api.invitation.create.useMutation({
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      void utils.invitation.list.invalidate();
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });

  const onSubmit = (data: CreateInvitationInput) => {
    createInvitation.mutate(data);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-5 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="member@example.com"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <RoleSelect
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
