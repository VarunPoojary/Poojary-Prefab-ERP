'use client';

import { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Worker } from '@/types/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { RecordPaymentModal } from './record-payment-modal';

export function WorkerList() {
  const firestore = useFirestore();
  const router = useRouter();
  
  const workersQuery = useMemoFirebase(() => query(collection(firestore, 'workers')), [firestore]);
  const {
    data: workers,
    isLoading,
    error,
  } = useCollection<Worker>(workersQuery);

  const handleRowClick = (workerId: string) => {
    // router.push(`/admin/workers/${workerId}`); // TODO: Implement worker detail page
    console.log(`Navigating to worker ${workerId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading workers: {error.message}</p>;
  }

  return (
    <div className="rounded-md border">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Worker Name</TableHead>
            <TableHead>Skill</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Net Payable</TableHead>
            <TableHead className="text-center">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {workers && workers.length > 0 ? (
            workers.map((worker) => (
                <TableRow key={worker.id} >
                    <TableCell className="font-medium" onClick={() => handleRowClick(worker.id)}>{worker.name}</TableCell>
                    <TableCell onClick={() => handleRowClick(worker.id)}>{worker.skill}</TableCell>
                    <TableCell onClick={() => handleRowClick(worker.id)}>{worker.phone}</TableCell>
                    <TableCell className="text-right" onClick={() => handleRowClick(worker.id)}>
                        <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                         ${worker.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <RecordPaymentModal worker={worker} />
                    </TableCell>
                </TableRow>
            ))
            ) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center">
                No workers found.
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}
