'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import type { Worker } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export function ResetPayrollModal() {
  const [isProcessing, setIsProcessing] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleResetPayroll = async () => {
    setIsProcessing(true);
    try {
      const workersRef = collection(firestore, 'workers');
      const workersSnapshot = await getDocs(workersRef);
      
      if (workersSnapshot.empty) {
        toast({
          title: 'No Workers Found',
          description: 'There are no workers in the system to update.',
        });
        return;
      }
      
      const batch = writeBatch(firestore);

      workersSnapshot.forEach((workerDoc) => {
        const workerData = workerDoc.data() as Worker;
        const workerRef = doc(firestore, 'workers', workerDoc.id);
        const newBalance = (workerData.current_balance || 0) + (workerData.base_rate || 0);
        batch.update(workerRef, { current_balance: newBalance });
      });

      await batch.commit();
      
      toast({
        title: 'Payroll Reset Successfully',
        description: `All worker balances have been updated with their base rate.`,
      });

    } catch (error) {
      console.error('Error resetting payroll:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reset payroll. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Payroll
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will add each worker's base rate to their current balance. 
            This is typically done at the start of a new payment cycle (e.g., daily, weekly, monthly).
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleResetPayroll} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm & Reset'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
