'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateTaskModal } from '@/components/admin/create-task-modal';
import { TaskList } from '@/components/admin/task-list';

export default function AdminTasksPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          All Tasks
        </h1>
        <CreateTaskModal />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task Overview</CardTitle>
          <CardDescription>
            View and filter tasks across all projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList />
        </CardContent>
      </Card>
    </>
  );
}
