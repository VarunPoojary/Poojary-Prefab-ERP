
'use client';

import { useMemo } from 'react';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { RecordPaymentModal } from './record-payment-modal';

interface WorkerListProps {
  view?: 'all' | 'payroll';
}

export function WorkerList({ view = 'all' }: WorkerListProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  
  const workersQuery = useMemoFirebase(() => {
    if (!user) return null; // Do not query if there is no user
    return query(collection(firestore, 'workers'));
  }, [firestore, user]);

  const {
    data: workers,
    isLoading,
    error,
  } = useCollection<Worker>(workersQuery);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading workers: {error.message}</p>;
  }

  if (!workers || workers.length === 0) {
      return <div className="text-center text-muted-foreground py-10">No workers found.</div>
  }

  const handleRowClick = (workerId: string) => {
    router.push(`/admin/workers/${workerId}`);
  };

  const renderPayrollView = () => (
    <>
      {/* Desktop Payroll View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Name</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead className="text-right">Net Payable</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.skill}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                    ₹{worker.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Badge>
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <RecordPaymentModal worker={worker} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Payroll View */}
      <div className="md:hidden space-y-4">
        {workers.map((worker) => (
          <Card key={worker.id}>
            <CardHeader>
                <CardTitle>{worker.name}</CardTitle>
                <CardDescription>{worker.skill}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Net Payable</span>
                    <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                        ₹{worker.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Badge>
                </div>
                 <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                    <RecordPaymentModal worker={worker} isFullWidth={true} />
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  const renderAllView = () => (
    <>
      {/* Desktop All Workers View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Name</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id} onClick={() => handleRowClick(worker.id)} className="cursor-pointer">
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.skill}</TableCell>
                <TableCell>{worker.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       {/* Mobile All Workers View */}
      <div className="md:hidden space-y-4">
        {workers.map((worker) => (
          <Card key={worker.id} onClick={() => handleRowClick(worker.id)} className="cursor-pointer">
            <CardHeader>
                <CardTitle>{worker.name}</CardTitle>
                <CardDescription>{worker.skill}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{worker.phone}</span>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );


  return view === 'payroll' ? renderPayrollView() : renderAllView();
}
