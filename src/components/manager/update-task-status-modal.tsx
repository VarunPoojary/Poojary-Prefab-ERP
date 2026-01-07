'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Project, Task } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const taskStatusSchema = z.object({
  status: z.enum(['todo', 'inprogress', 'done']),
});

interface UpdateTaskStatusModalProps {
  task: Task;
  children: React.ReactNode;
}

export function UpdateTaskStatusModal({ task, children }: UpdateTaskStatusModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const projectRef = useMemoFirebase(() => doc(firestore, 'projects', task.project_id), [firestore, task.project_id]);
  const { data: project } = useDoc<Project>(projectRef);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof taskStatusSchema>>({
    resolver: zodResolver(taskStatusSchema),
    defaultValues: {
      status: task.status,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        status: task.status,
      });
    }
  }, [open, task, reset]);

  const onSubmit = async (data: z.infer<typeof taskStatusSchema>) => {
    try {
      const taskRef = doc(firestore, `projects/${task.project_id}/tasks`, task.id);
      
      await updateDoc(taskRef, { status: data.status });
      
      toast({
        title: 'Task Status Updated',
        description: `Task "${task.title}" is now "${data.status}".`,
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
        return 'Invalid Date';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="w-full cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogDescription>
            Change the status for the task "{task.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 py-4">
             <div className="space-y-1">
                <Label className="text-muted-foreground">Project</Label>
                <p className="font-semibold">{project?.name || "Unknown Project"}</p>
            </div>
             <div className="space-y-1">
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{task.description || 'No description provided.'}</p>
            </div>
            <div className="space-y-1">
                <Label className="text-muted-foreground">Due Date</Label>
                <p className="text-sm">{formatDate(task.expected_completion_date)}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                 {errors.status && <p className="text-destructive text-sm">{errors.status.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
