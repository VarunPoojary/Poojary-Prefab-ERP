'use client';
import { useState, useMemo } from 'react';
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query } from 'firebase/firestore';
import type { Worker } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';

export function PaySalariesModal() {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workersQuery = useMemoFirebase(() => query(collection(firestore, 'workers')), [firestore]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersQuery);

  const monthlyWorkers = useMemo(() => {
    return workers?.filter(w => w.payment_type === 'monthly' && w.current_balance > 0) || [];
  }, [workers]);

  const totalPayout = useMemo(() => {
    return monthlyWorkers.reduce((acc, worker) => acc + worker.current_balance, 0);
  }, [monthlyWorkers]);

  const handlePaySalaries = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if (monthlyWorkers.length === 0) {
      toast({ title: 'No Salaries to Pay', description: 'There are no workers with pending monthly balances.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);

      // 1. Create the historical SalaryPayout document
      const salaryPayoutsRef = doc(collection(firestore, 'salary_payouts'));
      batch.set(salaryPayoutsRef, {
        payout_date: serverTimestamp(),
        total_amount_paid: totalPayout,
        paid_by: user.uid,
        paid_workers: monthlyWorkers.map(worker => ({
          worker_id: worker.id,
          worker_name: worker.name,
          amount_paid: worker.current_balance,
        })),
      });

      // 2. Create individual transactions and reset balances
      monthlyWorkers.forEach(worker => {
        // Add transaction to worker's subcollection
        const transactionRef = doc(collection(firestore, `workers/${worker.id}/transactions`));
        batch.set(transactionRef, {
          type: 'salary_settlement',
          amount: worker.current_balance,
          category: 'Payroll',
          description: `Monthly salary settlement for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          worker_id: worker.id,
          timestamp: serverTimestamp(),
          created_by: user.uid,
          status: 'approved',
        });
        
        // Reset worker's balance
        const workerRef = doc(firestore, 'workers', worker.id);
        batch.update(workerRef, { current_balance: 0 });
      });

      await batch.commit();
      
      toast({
        title: 'Salaries Paid Successfully',
        description: `Total payout of ₹${totalPayout.toLocaleString()} has been processed for ${monthlyWorkers.length} workers.`,
      });
      setOpen(false);

    } catch (error) {
      console.error("Error processing salaries:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to process salaries. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Pay Salaries</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Monthly Salary Payout</DialogTitle>
          <DialogDescription>
            This action will settle the current balances for all workers on a monthly payment cycle. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {workersLoading ? <Skeleton className="h-48 w-full" /> : (
            <>
                <div className="space-y-4">
                    <div className="text-lg font-bold flex justify-between">
                        <span>Total Payout:</span>
                        <span>₹{totalPayout.toLocaleString()}</span>
                    </div>
                    <ScrollArea className="h-64 border rounded-md">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Worker</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyWorkers.length > 0 ? monthlyWorkers.map(worker => (
                                    <TableRow key={worker.id}>
                                        <TableCell>{worker.name}</TableCell>
                                        <TableCell className="text-right">₹{worker.current_balance.toLocaleString()}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">No monthly workers with a balance to pay.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handlePaySalaries} disabled={isSubmitting || monthlyWorkers.length === 0}>
                        {isSubmitting ? 'Processing...' : `Confirm & Pay ${monthlyWorkers.length} Workers`}
                    </Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
