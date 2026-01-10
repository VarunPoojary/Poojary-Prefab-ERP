
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/types/schema';
import { collection, query, where } from 'firebase/firestore';

export function useProjectFinancials(projectId: string | null) {
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!projectId) return null;
    return query(
      collection(firestore, `projects/${projectId}/transactions`),
    );
  }, [firestore, projectId]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const financials = useMemo(() => {
    if (!transactions) {
      return {
        utilisedBudget: 0,
        totalIncome: 0,
        isLoading,
      };
    }

    const utilisedBudget = transactions
      .filter(t => t.type === 'expense' && t.status === 'approved')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'approved')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      utilisedBudget,
      totalIncome,
      isLoading,
    };
  }, [transactions, isLoading]);

  return financials;
}
