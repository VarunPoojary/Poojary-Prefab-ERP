'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkerList } from '@/components/admin/worker-list';
import { AddWorkerModal } from '@/components/admin/add-worker-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResetPayrollModal } from '@/components/admin/reset-payroll-modal';
import { PaySalariesModal } from '@/components/admin/pay-salaries-modal';
import { SalaryHistoryList } from '@/components/admin/salary-history-list';

export default function AdminWorkersPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Workers & Payroll
        </h1>
        <div className="flex gap-2">
          <ResetPayrollModal />
          <AddWorkerModal />
        </div>
      </div>
      <Tabs defaultValue="payroll">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payroll">Worker Balances</TabsTrigger>
          <TabsTrigger value="salaries">Monthly Salaries</TabsTrigger>
          <TabsTrigger value="all-workers">All Workers</TabsTrigger>
        </TabsList>
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Worker Payroll</CardTitle>
              <CardDescription>
                View worker balances and record new payments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkerList view="payroll" />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="salaries">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Salary Payouts</CardTitle>
                <CardDescription>
                  Settle all worker balances for the month and view payout history.
                </CardDescription>
              </div>
              <PaySalariesModal />
            </CardHeader>
            <CardContent>
                <SalaryHistoryList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all-workers">
          <Card>
            <CardHeader>
              <CardTitle>All Workers</CardTitle>
              <CardDescription>
                A complete list of all workers in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkerList view="all" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

    