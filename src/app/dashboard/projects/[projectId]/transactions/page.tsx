'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddExpenseModal } from '@/components/manager/add-expense-modal';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import type { Project, Transaction } from '@/types/schema';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ProjectHeader({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    const projectRef = useMemoFirebase(() => (firestore ? doc(firestore, 'projects', projectId) : null), [firestore, projectId]);
    const { data: project } = useDoc<Project>(projectRef);
    return <CardTitle>Transactions for: {project?.name || 'Loading...'}</CardTitle>;
}

function ProjectTransactionList() {
    const params = useParams();
    const projectId = params.projectId as string;
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!projectId) return null;
        return query(collection(firestore, `projects/${projectId}/transactions`));
    }, [firestore, projectId]);
    
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    if (transactionsLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }
    
    if (!transactions || transactions.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No transactions found for this project yet.</p>
    }

    const getVariantForType = (type: Transaction['type']) => {
        switch(type) {
            case 'income': return 'default';
            case 'expense': return 'destructive';
            case 'payout_settlement': return 'secondary';
            case 'payout_advance': return 'outline';
            default: return 'secondary';
        }
    }
    
    const getVariantForStatus = (status: Transaction['status']) => {
        switch(status) {
            case 'approved': return 'default';
            case 'unapproved': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'secondary';
        }
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    };

    return (
      <>
        {/* Desktop View */}
        <div className="hidden md:block rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id} >
                            <TableCell>
                                <Badge variant={getVariantForType(transaction.type)}>{transaction.type.replace('_', ' ')}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">${transaction.amount.toLocaleString()}</TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                             <TableCell>
                                <Badge variant={getVariantForStatus(transaction.status)}>{transaction.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {transactions.map((transaction) => (
                <Card key={transaction.id}>
                    <CardHeader>
                        <CardTitle>${transaction.amount.toLocaleString()}</CardTitle>
                        <CardDescription>{transaction.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Type</span>
                            <Badge variant={getVariantForType(transaction.type)}>{transaction.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span>{transaction.category}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>{formatDate(transaction.timestamp)}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={getVariantForStatus(transaction.status)}>{transaction.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </>
    )
}

export default function ProjectTransactionsPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/projects`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
            </Link>
        </Button>
        <AddExpenseModal projectId={projectId} />
      </div>
      <Card>
        <CardHeader>
          <ProjectHeader projectId={projectId}/>
          <CardDescription>Keep track of all finances for your assigned project.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTransactionList />
        </CardContent>
      </Card>
    </>
  );
}
