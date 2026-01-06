import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function TasksPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Tasks</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
          <CardDescription>Assign and monitor project tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A kanban board or table of tasks will be displayed here.</p>
        </CardContent>
      </Card>
    </>
  );
}
