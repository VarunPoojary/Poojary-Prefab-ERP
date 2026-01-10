'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkerList } from '@/components/admin/worker-list';
import { AddWorkerModal } from '@/components/admin/add-worker-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResetPayrollModal } from '@/components/admin/reset-payroll-modal';

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
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
