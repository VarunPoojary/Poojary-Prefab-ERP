'use client';
import { useState } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { useUser } from '@/firebase';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  location: z.string().min(1, 'Location is required'),
  budget_limit: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Budget must be a positive number')
  ),
  order_value: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Order value must be a positive number')
  ),
  assigned_manager_id: z.string().min(1, 'Please select a manager'),
});

export function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const managersQuery = useMemoFirebase(() =>
    query(collection(firestore, 'users'), where('role', '==', 'manager')),
    [firestore]
  );
  
  const { data: managers, isLoading: managersLoading } = useCollection<User>(managersQuery);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      location: '',
      budget_limit: 0,
      order_value: 0,
      assigned_manager_id: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof projectSchema>) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to create a project.',
        });
        return;
    }
    try {
      const projectsCollection = collection(firestore, 'projects');
      await addDoc(projectsCollection, {
        ...data,
        status: 'active',
        utilised_budget: 0,
        received_amount: 0,
      });
      toast({
        title: 'Project Created',
        description: `${data.name} has been successfully created.`,
      });
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create project. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} className="col-span-3" />}
              />
              {errors.name && <p className="col-span-4 text-destructive text-sm text-right">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
               <Controller
                name="location"
                control={control}
                render={({ field }) => <Input id="location" {...field} className="col-span-3" />}
              />
              {errors.location && <p className="col-span-4 text-destructive text-sm text-right">{errors.location.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_value" className="text-right">
                Order Value
              </Label>
              <Controller
                name="order_value"
                control={control}
                render={({ field }) => <Input id="order_value" type="number" placeholder="₹0" {...field} className="col-span-3" />}
              />
              {errors.order_value && <p className="col-span-4 text-destructive text-sm text-right">{errors.order_value.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget_limit" className="text-right">
                Budget
              </Label>
              <Controller
                name="budget_limit"
                control={control}
                render={({ field }) => <Input id="budget_limit" type="number" placeholder="₹0" {...field} className="col-span-3" />}
              />
              {errors.budget_limit && <p className="col-span-4 text-destructive text-sm text-right">{errors.budget_limit.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assigned_manager_id" className="text-right">
                Manager
              </Label>
              <Controller
                name="assigned_manager_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={managersLoading}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={managersLoading ? "Loading..." : "Select a manager"} />
                    </SelectTrigger>
                    <SelectContent>
                      {managers?.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
               {errors.assigned_manager_id && <p className="col-span-4 text-destructive text-sm text-right">{errors.assigned_manager_id.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    
