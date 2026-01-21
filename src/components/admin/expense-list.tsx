'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, collectionGroup, where, doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Transaction, Project } from '@/types/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';


export function ExpenseList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
  const { data: projectData, isLoading: projectsLoading, error: projectsError } = useCollection<Project>(projectsQuery);

  useEffect(() => {
    if (!firestore) return;

    if (projectData) {
        const newProjectsMap = new Map(projectData.map(p => [p.id, p.name]));
        setProjectsMap(newProjectsMap);
    }
    
    setIsLoading(true);
    // Fetch all transactions from the collection group without filtering by type
    const allTransactionsQuery = query(collectionGroup(firestore, 'transactions'));
    
    const unsubscribe = onSnapshot(allTransactionsQuery, (snapshot) => {
        // Filter for expenses on the client-side
        const allExpenses = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data(), project_id: doc.ref.parent.parent?.id } as Transaction))
            .filter(t => t.type === 'expense');

        allExpenses.sort((a, b) => {
           const dateA = a.timestamp && (a.timestamp as any).toDate ? (a.timestamp as any).toDate() : new Date(a.timestamp as string);
           const dateB = b.timestamp && (b.timestamp as any).toDate ? (b.timestamp as any).toDate() : new Date(b.timestamp as string);
           return dateB.getTime() - dateA.getTime();
        });
        setTransactions(allExpenses);
        setIsLoading(false);
    }, (e) => {
        console.error("Error fetching expenses in real-time: ", e);
        setError(e as Error);
        setIsLoading(false);
    });

    return () => unsubscribe();

  }, [firestore, projectData]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        if (projectFilter === 'all') return true;
        return transaction.project_id === projectFilter;
      })
      .filter(transaction => {
        if (statusFilter === 'all') return true;
        return transaction.status === statusFilter;
      });
  }, [transactions, projectFilter, statusFilter]);

  const handleUpdateStatus = async (transaction: Transaction, status: 'approved' | 'rejected') => {
    if (!firestore || !transaction.project_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Transaction project ID is missing.' });
        return;
    }
    const transactionRef = doc(firestore, `projects/${transaction.project_id}/transactions`, transaction.id);
    const projectRef = doc(firestore, 'projects', transaction.project_id);

    if (status === 'approved') {
        // Use a transaction to ensure atomicity
        try {
            await runTransaction(firestore, async (t) => {
                // First, ensure the transaction is still 'unapproved' to avoid double processing.
                const txDoc = await t.get(transactionRef);
                if (txDoc.data()?.status !== 'unapproved') {
                    throw new Error('This transaction has already been processed.');
                }

                // Update the transaction status to 'approved'
                t.update(transactionRef, { status: 'approved' });

                // Atomically increment the project's utilised_budget
                t.update(projectRef, { utilised_budget: increment(transaction.amount) });
            });
            toast({ title: 'Success', description: 'Transaction approved and budget updated.' });
        } catch (e: any) {
             console.error("Error approving transaction: ", e);
             toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to approve transaction.' });
        }
    } else { // For 'rejected' status
        try {
            await updateDoc(transactionRef, { status });
            toast({ title: 'Success', description: `Transaction has been ${status}.` });
        } catch(e) {
            console.error("Error updating status: ", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update transaction status.' });
        }
    }
  };

  if (isLoading || projectsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || projectsError) {
    return <p className="text-destructive">Error loading data: {error?.message || projectsError?.message}</p>;
  }
  
  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'unapproved': return 'secondary';
      case 'approved': return 'default';
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {Array.from(projectsMap.entries()).map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unapproved">Unapproved</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

       {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{projectsMap.get(transaction.project_id) || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                          <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.status === 'unapproved' && (
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(transaction, 'approved')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(transaction, 'rejected')}>
                                         <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                          </TableCell>
                      </TableRow>
                  ))
                  ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No expenses found for the selected filters.
                      </TableCell>
                  </TableRow>
                  )}
              </TableBody>
          </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader>
                <CardTitle>₹{transaction.amount.toLocaleString()}</CardTitle>
                <CardDescription>{transaction.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">{projectsMap.get(transaction.project_id) || 'Unknown Project'}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{formatDate(transaction.timestamp)}</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
                </div>
                {transaction.status === 'unapproved' && (
                  <div className="flex gap-2 justify-end pt-3">
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(transaction, 'approved')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(transaction, 'rejected')}>
                         <XCircle className="mr-2 h-4 w-4" />
                        Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">No expenses found for the selected filters.</div>
        )}
      </div>

    </div>
  );
}
