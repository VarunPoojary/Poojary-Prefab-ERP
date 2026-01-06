'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Project, Task } from '@/types/schema';
import { collection, query, where } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function ManagerTaskList() {
    const firestore = useFirestore();
    const { user } = useUser();

    const projectsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'projects'), where('assigned_manager_id', '==', user.uid));
    }, [firestore, user]);

    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);
    const assignedProject = projects?.[0];

    const tasksQuery = useMemoFirebase(() => {
        if (!assignedProject) return null;
        return query(collection(firestore, `projects/${assignedProject.id}/tasks`));
    }, [firestore, assignedProject]);
    
    const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

    const isLoading = projectsLoading || tasksLoading;

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }
    
    if (!assignedProject) {
        return <p>You are not assigned to any project.</p>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                        <TableRow key={task.id} >
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>
                                <Badge variant={task.is_completed ? 'default' : 'secondary'}>
                                    {task.is_completed ? 'Completed' : 'Pending'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center">
                        No tasks found for this project.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

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
          <CardTitle>My Project's Tasks</CardTitle>
          <CardDescription>Assign and monitor project tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerTaskList />
        </CardContent>
      </Card>
    </>
  );
}
