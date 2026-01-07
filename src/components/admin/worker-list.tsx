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

interface WorkerListProps {
  view?: 'all' | 'payroll';
}

export function WorkerList({ view = 'all' }: WorkerListProps) {
  const firestore = useFirestore();
  
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

  const renderRow = (worker: Worker) => {
    if (view === 'payroll') {
        return (
            <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.skill}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                    ${worker.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Badge>
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <RecordPaymentModal worker={worker} />
                </TableCell>
            </TableRow>
        )
    }

    return (
        <UpdateWorkerModal key={worker.id} worker={worker}>
            <TableRow className="cursor-pointer">
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.skill}</TableCell>
                <TableCell>{worker.phone}</TableCell>
            </TableRow>
        </UpdateWorkerModal>
    )
  }

  return (
    <div className="rounded-md border">
        <Table>
        <TableHeader>
           {view === 'payroll' ? (
              <TableRow>
                <TableHead>Worker Name</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead className="text-right">Net Payable</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            ) : (
               <TableRow>
                <TableHead>Worker Name</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            )}
        </TableHeader>
        <TableBody>
            {workers && workers.length > 0 ? (
            workers.map((worker) => renderRow(worker))
            ) : (
            <TableRow>
                <TableCell colSpan={view === 'payroll' ? 4 : 3} className="text-center">
                No workers found.
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}
