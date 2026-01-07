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
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
        );
    }
    
    return (
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{worker.name}</CardTitle>
                <CardDescription>
                    {worker.skill} | {worker.phone}
                </CardDescription>
            </div>
            <UpdateWorkerModal worker={worker}>
                <Button variant="outline">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
                <p className="text-muted-foreground">Payment Type</p>
                <p className="font-medium capitalize">{worker.payment_type}</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground">Base Rate</p>
                <p className="font-medium">${worker.base_rate.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground">Current Balance</p>
                <Badge variant={worker.current_balance > 0 ? 'destructive' : 'secondary'}>
                    ${worker.current_balance.toLocaleString()}
                </Badge>
            </div>
        </div>
    )
}

function PayrollHistory({ workerId }: { workerId: string }) {
    const firestore = useFirestore();
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!workerId || !firestore) return null;
        return query(
            collection(firestore, `workers/${workerId}/transactions`),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, workerId]);

    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const [projectsMap, setProjectsMap] = useState<Map<string, string>>(new Map());
    const [projectsMapLoading, setProjectsMapLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;
        const fetchProjects = async () => {
            setProjectsMapLoading(true);
            const projectsQuery = query(collection(firestore, 'projects'));
            const projectSnapshots = await getDocs(projectsQuery);
            const pMap = new Map(projectSnapshots.docs.map(doc => [doc.id, (doc.data() as Project).name]));
            setProjectsMap(pMap);
            setProjectsMapLoading(false);
        };
        fetchProjects();
    }, [firestore]);
    

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    };
    
     if (transactionsLoading || projectsMapLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll History</CardTitle>
                <CardDescription>A log of all payments made to this worker.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions && transactions.length > 0 ? (
                            transactions.map((tx, index) => (
                                <TableRow key={tx.id || index}>
                                    <TableCell>{formatDate(tx.timestamp)}</TableCell>
                                    <TableCell>{tx.project_id ? projectsMap.get(tx.project_id) : 'General Payroll'}</TableCell>
                                    <TableCell><Badge variant="secondary" className="capitalize">{tx.type.replace('_', ' ')}</Badge></TableCell>
                                    <TableCell className="font-medium">${tx.amount.toLocaleString()}</TableCell>
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
            </CardContent>
        </Card>
    );
}

function AttendanceHistory({ workerId }: { workerId: string }) {
    const firestore = useFirestore();

    const attendanceQuery = useMemoFirebase(() => {
        if (!workerId) return null;
        return query(collection(firestore, 'attendance'), where('worker_id', '==', workerId), orderBy('date', 'desc'));
    }, [firestore, workerId]);

    const { data: attendances, isLoading } = useCollection<Attendance>(attendanceQuery);
    
    const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    const projectsMap = useMemo(() => {
        if (!projects) return new Map();
        return new Map(projects.map(p => [p.id, p.name]));
    }, [projects]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    };

    if (isLoading || projectsLoading) {
        return <Skeleton className="h-40 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>A log of the worker's attendance across all projects.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendances && attendances.length > 0 ? (
                            attendances.map(att => (
                                <TableRow key={att.id}>
                                    <TableCell>{formatDate(att.date)}</TableCell>
                                    <TableCell>{projectsMap.get(att.project_id) || 'Unknown Project'}</TableCell>
                                    <TableCell>
                                        <Badge variant={att.status === 'present' ? 'default' : 'destructive'} className="capitalize">
                                            {att.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No attendance records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
            
            <PayrollHistory workerId={workerId} />
            <AttendanceHistory workerId={workerId} />
        </div>
    );
}
