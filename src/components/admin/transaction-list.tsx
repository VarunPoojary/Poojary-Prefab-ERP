'use client';

import { useMemo, useState, useEffect } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc, getDocs } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function TransactionList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
  const { data: projectData, isLoading: projectsLoading, error: projectsError } = useCollection<Project>(projectsQuery);

  useEffect(() => {
    if (projectsLoading) {
      setIsLoading(true);
      return;
    }
    if (projectsError) {
      setError(projectsError);
      setIsLoading(false);
      return;
    }
    if (projectData) {
      setProjects(projectData);
      const fetchTransactions = async () => {
        setIsLoading(true);
        try {
          const allTransactions: Transaction[] = [];
          for (const project of projectData) {
            const transactionsColRef = collection(firestore, `projects/${project.id}/transactions`);
            const transactionSnapshot = await getDocs(transactionsColRef);
            transactionSnapshot.forEach(doc => {
              allTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
            });
          }
          // Sort transactions by timestamp, newest first
          allTransactions.sort((a, b) => {
             const dateA = a.timestamp && (a.timestamp as any).toDate ? (a.timestamp as any).toDate() : new Date(a.timestamp as string);
             const dateB = b.timestamp && (b.timestamp as any).toDate ? (b.timestamp as any).toDate() : new Date(b.timestamp as string);
             return dateB.getTime() - dateA.getTime();
          });
          setTransactions(allTransactions);
        } catch (e) {
          setError(e as Error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactions();
    }
  }, [projectData, projectsLoading, projectsError, firestore]);

  const handleDelete = async (transaction: Transaction) => {
    if (!transaction.project_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Transaction is missing project ID.' });
        return;
    }
    const transactionRef = doc(firestore, `projects/${transaction.project_id}/transactions`, transaction.id);
    try {
        await deleteDoc(transactionRef);
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
        toast({ title: 'Success', description: 'Transaction deleted successfully.' });
    } catch (e) {
        console.error("Error deleting transaction:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete transaction.' });
    }
  }
  
  const getProjectName = (projectId: string) => {
      const project = projects.find(p => p.id === projectId);
      return project?.name || 'Unknown Project';
  }

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
    return <p className="text-destructive">Error loading transactions: {error.message}</p>;
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
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell>{getProjectName(transaction.project_id)}</TableCell>
                        <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                        <TableCell className="text-right">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the transaction
                                    record.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(transaction)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">
                    No transactions found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );
}
