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
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import type { Worker } from '@/types/schema';


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

export function AddWorkerModal() {
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
      name: '',
      skill: '',
      phone: '',
      payment_type: 'daily',
      base_rate: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof workerSchema>) => {
    try {
      const workersCollection = collection(firestore, 'workers');
      await addDoc(workersCollection, {
        ...data,
        current_balance: 0, // Initialize balance to 0
      });
      toast({
        title: 'Worker Added',
        description: `${data.name} has been successfully added.`,
      });
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Error creating worker:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add worker. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Worker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new worker to the system.
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
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Worker'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
