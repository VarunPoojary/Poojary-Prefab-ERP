'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Project, Transaction } from '@/types/schema';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function ManagerTransactionList() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Step 1: Get the manager's assigned project
    const projectsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'projects'), where('assigned_manager_id', '==', user.uid));
    }, [firestore, user]);

    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
    const assignedProject = projects?.[0];

    // Step 2: Get transactions for that project
    const transactionsQuery = useMemoFirebase(() => {
        if (!assignedProject) return null;
        return query(collection(firestore, `projects/${assignedProject.id}/transactions`));
    }, [firestore, assignedProject]);
    
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const isLoading = projectsLoading || transactionsLoading;

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }
    
    if (!assignedProject) {
        return <p>You are not assigned to any project.</p>
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

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM d, yyyy');
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                        <TableRow key={transaction.id} >
                            <TableCell>
                                <Badge variant={getVariantForType(transaction.type)}>{transaction.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">${transaction.amount.toLocaleString()}</TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                        No transactions found for this project.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default function TransactionsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Transactions</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Project's Transaction History</CardTitle>
          <CardDescription>Keep track of all finances for your assigned project.</CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerTransactionList />
        </CardContent>
      </Card>
    </>
  );
}
