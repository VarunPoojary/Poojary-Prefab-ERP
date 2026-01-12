'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const expenseSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Amount must be a positive number.')
  ),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().min(1, 'An expense reason (description) is required.'),
});

interface AddExpenseModalProps {
    projectId: string;
}

export function AddExpenseModal({ projectId }: AddExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!firestore || !user || !projectId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit expense. Missing required context.',
      });
      return;
    }

    try {
      const transactionsCollection = collection(firestore, `projects/${projectId}/transactions`);
      await addDoc(transactionsCollection, {
        ...values,
        project_id: projectId,
        type: 'expense',
        status: 'unapproved',
        created_by: user.uid,
        timestamp: serverTimestamp(),
      });

      toast({
        title: 'Expense Added',
        description: 'Your expense has been logged for approval.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add expense. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Expense
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Fill out the form below to log a new expense for this project.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="₹0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Materials, Labor, Equipment" {...field} />
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
                        <FormLabel>Expense Reason (Description)</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Describe the expense..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Submitting...' : 'Submit Expense'}
                    </Button>
                </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
