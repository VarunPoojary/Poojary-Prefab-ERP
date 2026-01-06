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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, runTransaction, query, serverTimestamp } from 'firebase/firestore';
import type { Worker, Project, Transaction } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Payment amount must be a positive number')
  ),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Please select a project for this transaction.'),
});

interface RecordPaymentModalProps {
  worker: Worker;
}

export function RecordPaymentModal({ worker }: RecordPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
  const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      description: `Payment to ${worker.name}`,
      projectId: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    const workerRef = doc(firestore, 'workers', worker.id);
    const transactionRef = doc(collection(firestore, `projects/${data.projectId}/transactions`));

    try {
      await runTransaction(firestore, async (transaction) => {
        const workerDoc = await transaction.get(workerRef);
        if (!workerDoc.exists()) {
          throw new Error("Worker document not found!");
        }

        const currentBalance = workerDoc.data().current_balance;
        const newBalance = currentBalance - data.amount;

        transaction.update(workerRef, { current_balance: newBalance });

        const newTransaction: Omit<Transaction, 'id'> = {
          project_id: data.projectId,
          type: 'payout_settlement',
          amount: data.amount,
          category: 'Payroll',
          description: data.description || `Payment to ${worker.name}`,
          proof_image_url: '', // No proof for payroll settlement
          worker_id: worker.id,
          timestamp: serverTimestamp(),
          created_by: user.uid,
        };
        
        transaction.set(transactionRef, newTransaction);
      });

      toast({
        title: 'Payment Recorded',
        description: `$${data.amount.toFixed(2)} paid to ${worker.name}.`,
      });
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: error instanceof Error ? error.message : 'Could not record payment. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Record Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment for {worker.name}</DialogTitle>
          <DialogDescription>
            Enter the amount to pay. This will create a settlement transaction and update the worker's balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => <Input id="amount" type="number" {...field} className="col-span-3" />}
              />
              {errors.amount && <p className="col-span-4 text-destructive text-sm text-right">{errors.amount.message}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="projectId" className="text-right">
                Project
              </Label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={projectsLoading}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={projectsLoading ? "Loading..." : "Select a project"} />
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
               {errors.projectId && <p className="col-span-4 text-destructive text-sm text-right">{errors.projectId.message}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <Input id="description" {...field} className="col-span-3" />}
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Current Balance</Label>
                <span className="col-span-3 font-bold text-lg">${worker.current_balance.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Submit Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
