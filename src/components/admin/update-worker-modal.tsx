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
import { useFirestore } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import type { Worker } from '@/types/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const workerSchema = z.object({
  name: z.string().min(1, 'Worker name is required'),
  skill: z.string().min(1, 'Skill is required'),
  phone: z.string().min(1, 'Phone number is required'),
  payment_type: z.enum(['hourly', 'daily', 'monthly']),
  base_rate: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Base rate must be a positive number')
  ),
});

interface UpdateWorkerModalProps {
  worker: Worker;
  children: React.ReactNode;
}

export function UpdateWorkerModal({ worker, children }: UpdateWorkerModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: worker.name,
      skill: worker.skill,
      phone: worker.phone,
      payment_type: worker.payment_type,
      base_rate: worker.base_rate,
    },
  });

   useEffect(() => {
    if (open) {
      reset({
        name: worker.name,
        skill: worker.skill,
        phone: worker.phone,
        payment_type: worker.payment_type,
        base_rate: worker.base_rate,
      });
    }
  }, [open, worker, reset]);

  const onSubmit = async (data: z.infer<typeof workerSchema>) => {
    try {
      const workerRef = doc(firestore, 'workers', worker.id);
      await updateDoc(workerRef, data);
      toast({
        title: 'Worker Updated',
        description: `${data.name}'s details have been successfully updated.`,
      });
      setOpen(false);
    } catch (error) {
      console.error('Error updating worker:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update worker. Please try again.',
      });
    }
  };

  const handleDelete = async () => {
    const workerRef = doc(firestore, 'workers', worker.id);
    try {
        await deleteDoc(workerRef);
        toast({
            title: 'Worker Deleted',
            description: `${worker.name} has been removed from the system.`,
        });
        setOpen(false);
    } catch (error) {
        console.error('Error deleting worker:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete worker. Please try again.',
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Worker Details</DialogTitle>
          <DialogDescription>
            Edit the details for {worker.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} />}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="skill">Skill</Label>
              <Controller
                name="skill"
                control={control}
                render={({ field }) => <Input id="skill" {...field} />}
              />
              {errors.skill && <p className="text-destructive text-sm">{errors.skill.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input id="phone" {...field} />}
              />
              {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="payment_type">Payment Type</Label>
                    <Controller
                        name="payment_type"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                        )}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="base_rate">Rate / Salary</Label>
                    <Controller
                        name="base_rate"
                        control={control}
                        render={({ field }) => <Input id="base_rate" type="number" {...field} />}
                    />
                </div>
            </div>
             {errors.base_rate && <p className="text-destructive text-sm">{errors.base_rate.message}</p>}
          </div>
          <DialogFooter className="flex justify-between w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the worker
                    "{worker.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
