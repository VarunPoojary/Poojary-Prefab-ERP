'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Worker, Transaction, Attendance, Project } from '@/types/schema';
import { doc, collection, query, where, collectionGroup, getDocs, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { UpdateWorkerModal } from '@/components/admin/update-worker-modal';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useMemo, useEffect, useState } from 'react';

function WorkerHeader({ worker, isLoading }: { worker: Worker | null, isLoading: boolean }) {
    if (isLoading || !worker) {
        return (
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-10 w-full sm:w-32" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <CardTitle>{worker.name}</CardTitle>
                <CardDescription>
                    {worker.skill} | {worker.phone}
                </CardDescription>
            </div>
            <UpdateWorkerModal worker={worker}>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Edit className="mr-2 h-4 w-4" /> Edit Worker
                </Button>
            </UpdateWorkerModal>
        </div>
    );
}

function WorkerDetails({ worker, isLoading }: { worker: Worker | null, isLoading: boolean }) {
     if (isLoading || !worker) {
        return <Skeleton className="h-24 w-full" />;
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
                <p className="text-muted-foreground">Payment Type</p>
                <p className="font-medium capitalize">{worker.payment_type}</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground">Base Rate</p>
                <p className="font-medium">₹{worker.base_rate.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground">Current Balance</p>
                <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                    ₹{worker.current_balance.toLocaleString()}
                </Badge>
            </div>
        </div>
    )
}

function PayrollHistory({ workerId }: { workerId: string }) {
    const firestore = useFirestore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectsMap, setProjectsMap] = useState<Map<string, Project>>(new Map());

    useEffect(() => {
        if (!firestore || !workerId) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // Fetch all projects to create a map
                const projectsQuery = query(collection(firestore, 'projects'));
                const projectsSnapshot = await getDocs(projectsQuery);
                const pMap = new Map(projectsSnapshot.docs.map(doc => [doc.id, doc.data() as Project]));
                setProjectsMap(pMap);
                
                // Query 1: Get settlement transactions from the worker's subcollection
                const settlementsQuery = query(collection(firestore, `workers/${workerId}/transactions`));
                const settlementsSnapshot = await getDocs(settlementsQuery);
                const settlementTxs = settlementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                
                // Query 2: Get advance transactions from the global collection
                // const advancesQuery = query(collectionGroup(firestore, 'transactions'), where('worker_id', '==', workerId), where('type', '==', 'payout_advance'));
                // const advancesSnapshot = await getDocs(advancesQuery);
                // const advanceTxs = advancesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

                // Combine and sort
                // const allTxs = [...settlementTxs, ...advanceTxs];
                // allTxs.sort((a, b) => {
                //     const dateA = a.timestamp && (a.timestamp as any).toDate ? (a.timestamp as any).toDate() : new Date(0);
                //     const dateB = b.timestamp && (b.timestamp as any).toDate ? (b.timestamp as any).toDate() : new Date(0);
                //     return dateB.getTime() - dateA.getTime();
                // });
                const allTxs = [...settlementTxs];
                
                setTransactions(allTxs);

            } catch (error) {
                console.error("Error fetching payroll history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();

    }, [firestore, workerId]);
    

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    };
    
     if (isLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll History</CardTitle>
                <CardDescription>A log of all payments made to this worker.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View */}
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions && transactions.length > 0 ? (
                                transactions.map((tx, index) => (
                                    <TableRow key={tx.id || index}>
                                        <TableCell>{formatDate(tx.timestamp)}</TableCell>
                                        <TableCell>{tx.project_id ? projectsMap.get(tx.project_id)?.name : 'General Payroll'}</TableCell>
                                        <TableCell><Badge variant="secondary" className="capitalize">{tx.type.replace('_', ' ')}</Badge></TableCell>
                                        <TableCell className="text-right font-medium">₹{tx.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No payment records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {transactions && transactions.length > 0 ? (
                        transactions.map((tx, index) => (
                            <Card key={tx.id || index}>
                                <CardHeader>
                                    <CardTitle>₹{tx.amount.toLocaleString()}</CardTitle>
                                    <CardDescription>{formatDate(tx.timestamp)}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <Badge variant="secondary" className="capitalize">{tx.type.replace('_', ' ')}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Project</span>
                                        <span>{tx.project_id ? projectsMap.get(tx.project_id)?.name : 'General Payroll'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                            No payment records found.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AttendanceHistory({ workerId }: { workerId: string }) {
    const firestore = useFirestore();

    const attendanceQuery = useMemoFirebase(() => {
        if (!workerId) return null;
        // Query for present records only and order by date
        return query(
            collection(firestore, 'attendance'), 
            where('worker_id', '==', workerId),
        );
    }, [firestore, workerId]);
    
    const { data: attendanceData, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    };

    if (attendanceLoading) {
        return <Skeleton className="h-40 w-full" />;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>A log of all days this worker was marked present.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Project</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceData && attendanceData.length > 0 ? (
                                attendanceData.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{formatDate(record.date)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No 'present' attendance records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}


export default function WorkerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const workerId = params.workerId as string;
    const firestore = useFirestore();

    const workerRef = useMemoFirebase(() => {
        if (!workerId) return null;
        return doc(firestore, 'workers', workerId);
    }, [firestore, workerId]);

    const { data: worker, isLoading } = useDoc<Worker>(workerRef);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Worker Profile</h1>
            </div>

            <Card>
                <CardHeader>
                    <WorkerHeader worker={worker} isLoading={isLoading} />
                </CardHeader>
                <CardContent>
                    <WorkerDetails worker={worker} isLoading={isLoading} />
                </CardContent>
            </Card>
            
            <AttendanceHistory workerId={workerId} />
            <PayrollHistory workerId={workerId} />
        </div>
    );
}
