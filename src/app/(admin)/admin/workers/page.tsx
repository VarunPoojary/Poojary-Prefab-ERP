'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkerList } from '@/components/admin/worker-list';

export default function AdminWorkersPage() {

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Workers & Payroll
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Workers</CardTitle>
          <CardDescription>
            View all workers across all projects and manage their payroll.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkerList />
        </CardContent>
      </Card>
    </>
  );
}
