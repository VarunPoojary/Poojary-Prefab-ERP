'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Briefcase } from 'lucide-react';
import { ProjectList } from '@/components/admin/project-list';
import { CreateProjectModal } from '@/components/admin/create-project-modal';
import { useCollection, useUser } from '@/firebase';
import { collection, query, getDocs, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import type { Project, Transaction, User } from '@/types/schema';
import { Skeleton } from '@/components/ui/skeleton';

function AdminStats() {
  const firestore = useFirestore();
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!firestore) return;
      setStatsLoading(true);
      let expenses = 0;
      let income = 0;
      
      const transactionsQuery = query(collectionGroup(firestore, 'transactions'));
      
      try {
        const transactionsSnapshot = await getDocs(transactionsQuery);
        transactionsSnapshot.forEach((doc) => {
          const transaction = doc.data() as Transaction;
          if (transaction.type === 'expense') {
            expenses += transaction.amount;
          } else if (transaction.type === 'income') {
            income += transaction.amount;
          }
        });
        setTotalExpenses(expenses);
        setTotalIncome(income);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchTransactions();
  }, [firestore]);
  

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">
              ₹{totalIncome.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">
              ₹{totalExpenses.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function AdminDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [userRole, setUserRole] = useState<User['role'] | null>(null);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((doc) => {
        if (doc.exists()) {
          setUserRole((doc.data() as User).role);
        }
      });
    }
  }, [user, firestore]);

  if (!userRole || userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Admin Dashboard
        </h1>
        <CreateProjectModal />
      </div>
      <AdminStats />
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectList />
        </CardContent>
      </Card>
    </>
  );
}
