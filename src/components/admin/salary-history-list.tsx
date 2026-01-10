'use client';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { SalaryPayout } from '@/types/schema';
import { collection, query, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function SalaryHistoryList() {
    const firestore = useFirestore();

    const payoutsQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'salary_payouts'), orderBy('payout_date', 'desc'));
    }, [firestore]);

    const { data: payouts, isLoading } = useCollection<SalaryPayout>(payoutsQuery);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
        );
    }
    
    if (!payouts || payouts.length === 0) {
        return (
             <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No salary payout records found yet.
            </div>
        )
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMMM yyyy');
    };

    return (
        <Accordion type="single" collapsible className="w-full">
            {payouts.map(payout => (
                <AccordionItem value={payout.id} key={payout.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4 text-left">
                            <span className="font-semibold">{formatDate(payout.payout_date)}</span>
                            <span className="text-right pl-2 font-bold text-primary">${payout.total_amount_paid.toLocaleString()}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Worker</TableHead>
                                    <TableHead className="text-right">Amount Paid</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payout.paid_workers.map(worker => (
                                    <TableRow key={worker.worker_id}>
                                        <TableCell>{worker.worker_name}</TableCell>
                                        <TableCell className="text-right">${worker.amount_paid.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

    