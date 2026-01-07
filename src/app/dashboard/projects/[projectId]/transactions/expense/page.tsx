'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/types/schema';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const expenseSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Amount must be a positive number.')
  ),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().min(1, 'An expense reason (description) is required.'),
});

function ProjectHeader({ projectId }: { projectId: string }) {
  const firestore = useFirestore();
  const projectRef = useMemoFirebase(() => (firestore ? doc(firestore, 'projects', projectId) : null), [firestore, projectId]);
  const { data: project } = useDoc<Project>(projectRef);
  return <CardTitle>Add Expense for: {project?.name || 'Loading...'}</CardTitle>;
}

export default function AddExpensePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

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
      router.push(`/dashboard/projects`);
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
    <>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/projects`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
            </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <ProjectHeader projectId={projectId} />
          <CardDescription>Fill out the form below to log a new expense for this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Expense'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
