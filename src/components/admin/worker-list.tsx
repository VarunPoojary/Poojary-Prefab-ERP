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
import { UpdateWorkerModal } from './update-worker-modal';

export function WorkerList() {
  const firestore = useFirestore();
  const router = useRouter();
  
  const workersQuery = useMemoFirebase(() => query(collection(firestore, 'workers')), [firestore]);
  const {
    data: workers,
    isLoading,
    error,
  } = useCollection<Worker>(workersQuery);

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
              <UpdateWorkerModal key={worker.id} worker={worker}>
                <TableRow className="cursor-pointer">
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>{worker.skill}</TableCell>
                    <TableCell>{worker.phone}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                         ${worker.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <RecordPaymentModal worker={worker} />
                    </TableCell>
                </TableRow>
              </UpdateWorkerModal>
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
