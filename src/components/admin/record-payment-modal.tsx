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
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import type { Worker } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';

const paymentSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Payment amount must be a positive number')
  ),
  description: z.string().optional(),
});

interface RecordPaymentModalProps {
  worker: Worker;
}

export function RecordPaymentModal({ worker }: RecordPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: worker.current_balance > 0 ? worker.current_balance : 0,
      description: `Settlement payment to ${worker.name}`,
    },
  });

  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    const workerRef = doc(firestore, 'workers', worker.id);
    const transactionsCollectionRef = collection(firestore, 'transactions');
    
    try {
      // Use a transaction to ensure balance update and transaction record are atomic.
      await runTransaction(firestore, async (transaction) => {
        const workerDoc = await transaction.get(workerRef);
        if (!workerDoc.exists()) {
          throw new Error("Worker document not found!");
        }

        const currentBalance = workerDoc.data().current_balance;
        const newBalance = currentBalance - data.amount;
        
        // 1. Update worker's balance
        transaction.update(workerRef, { current_balance: newBalance });
        
        // 2. Create the global transaction record
        const newTransactionRef = doc(transactionsCollectionRef);
        transaction.set(newTransactionRef, {
            type: 'payout_settlement',
            amount: data.amount,
            category: 'Payroll',
            description: data.description || `Payment to ${worker.name}`,
            worker_id: worker.id,
            timestamp: serverTimestamp(),
            created_by: user.uid,
            status: 'approved' // Admin payroll payments are auto-approved
        });
      });
      
      toast({
        title: 'Payment Recorded',
        description: `$${data.amount.toFixed(2)} paid to ${worker.name}. Their balance has been updated and the transaction has been logged.`,
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
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Payment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
