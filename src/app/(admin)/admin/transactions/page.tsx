'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionList } from '@/components/admin/transaction-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseList } from '@/components/admin/expense-list';

export default function AdminTransactionsPage() {

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Transaction Logs
        </h1>
      </div>
      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses">
            <Card>
                <CardHeader>
                    <CardTitle>All Expenses</CardTitle>
                    <CardDescription>
                        Review and approve or reject expenses submitted by managers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseList />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="payroll">
            <Card>
                <CardHeader>
                    <CardTitle>All Payroll Transactions</CardTitle>
                    <CardDescription>
                        View all payroll-related transactions, including advances and settlements.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionList types={['payout_advance', 'payout_settlement']} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="income">
             <Card>
                <CardHeader>
                    <CardTitle>All Income Transactions</CardTitle>
                    <CardDescription>
                        View all income transactions across all projects.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TransactionList types={['income']} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
