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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Project, Task } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  project_id: z.string().min(1, 'Please select a project'),
  status: z.enum(['todo', 'inprogress', 'done']),
  expected_completion_date: z.date().optional(),
});

interface UpdateTaskModalProps {
  task: Task;
  projects: Project[];
  children: React.ReactNode;
}

export function UpdateTaskModal({ task, projects, children }: UpdateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      project_id: task.project_id,
      status: task.status,
      expected_completion_date: task.expected_completion_date ? new Date(task.expected_completion_date) : undefined,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task.title,
        description: task.description || '',
        project_id: task.project_id,
        status: task.status,
        expected_completion_date: task.expected_completion_date ? new Date(task.expected_completion_date) : undefined,
      });
    }
  }, [open, task, reset]);

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    if (!data.project_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Project ID is missing.' });
        return;
    }
    try {
      const taskRef = doc(firestore, `projects/${task.project_id}/tasks`, task.id);
      
      const taskData: any = {
        ...data,
        expected_completion_date: data.expected_completion_date ? data.expected_completion_date.toISOString() : null,
      };

      if (taskData.expected_completion_date === null) {
          delete taskData.expected_completion_date;
      }
      
      await updateDoc(taskRef, taskData);
      
      toast({
        title: 'Task Updated',
        description: `Task "${data.title}" has been successfully updated.`,
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Task</DialogTitle>
          <DialogDescription>
            Edit the details below to update the task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => <Input id="title" {...field} />}
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea id="description" {...field} />}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="project_id">Project</Label>
              <Controller
                name="project_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={"Select a project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
            </div>
             <div className="space-y-2">
                 <Label htmlFor="expected_completion_date">Expected Completion Date</Label>
                 <Controller
                    name="expected_completion_date"
                    control={control}
                    render={({ field }) => (
                    <Popover modal={true}>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    )}
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
