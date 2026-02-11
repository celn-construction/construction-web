'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '~/trpc/react';
import { useSwitchProject } from '@/store/hooks';
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
import {
  createProjectSchema,
  type CreateProjectInput,
} from '~/lib/validations/project';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProjectDialog({
  open,
  onOpenChange,
}: AddProjectDialogProps) {
  const utils = api.useUtils();
  const switchProject = useSwitchProject();

  // Initialize form with react-hook-form + zod
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: (newProject) => {
      toast.success('Project created successfully');
      void utils.project.list.invalidate();
      switchProject(newProject.id);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });

  const onSubmit = (data: CreateProjectInput) => {
    createProject.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <DialogTitle>Add Project</DialogTitle>
            </div>
          </div>
          <DialogDescription>
            Create a new project for your organization
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-5 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Downtown Tower Construction"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
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
              <Button type="submit" loading={createProject.isPending}>
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
