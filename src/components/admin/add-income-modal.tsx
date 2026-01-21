'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const incomeSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Amount must be a positive number.')
  ),
  description: z.string().min(1, 'A description/reason is required.'),
});

interface AddIncomeModalProps {
  projectId: string;
}

export function AddIncomeModal({ projectId }: AddIncomeModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof incomeSchema>) => {
    if (!firestore || !user || !projectId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit income. Missing required context.',
      });
      return;
    }

    const projectRef = doc(firestore, 'projects', projectId);
    const transactionsCollectionRef = collection(firestore, `projects/${projectId}/transactions`);

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Add the new income transaction document
            const newTransactionRef = doc(transactionsCollectionRef);
            transaction.set(newTransactionRef, {
                ...values,
                project_id: projectId,
                type: 'income',
                status: 'approved', // Income is typically pre-approved
                created_by: user.uid,
                timestamp: serverTimestamp(),
                category: 'Client Payment' // Default category for income
            });

            // 2. Atomically increment the project's received_amount
            transaction.update(projectRef, { received_amount: increment(values.amount) });
        });

      toast({
        title: 'Income Added',
        description: 'The project income has been successfully recorded.',
      });
      form.reset();
      setOpen(false);

    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        variant: 'destructive',
        title: 'Transaction Failed',
        description: 'Failed to add income. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project Income</DialogTitle>
          <DialogDescription>
            Record a new payment or income received for this project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Received</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="₹0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Phase 1 payment from client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Income'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
