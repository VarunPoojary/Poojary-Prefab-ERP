'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Task } from '@/types/schema';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';


function TaskCard({ task }: { task: Task }) {
    return (
        <Card className="mb-2">
            <CardContent className="p-3">
                <p className="text-sm font-medium">{task.title}</p>
            </CardContent>
        </Card>
    )
}

function TaskColumn({ title, tasks, isLoading }: { title: string, tasks: Task[], isLoading: boolean }) {
    return (
        <div className="flex flex-col w-full">
            <h3 className="text-lg font-semibold mb-4 px-1">{title}</h3>
            <Card className="bg-muted/50 flex-grow">
                <CardContent className="p-2 h-full">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : tasks.length > 0 ? (
                        tasks.map(task => <TaskCard key={task.id} task={task} />)
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            No tasks
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


export default function ProjectTasksPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const firestore = useFirestore();

    const tasksQuery = useMemoFirebase(() => {
        if (!projectId) return null;
        return query(collection(firestore, `projects/${projectId}/tasks`));
    }, [firestore, projectId]);
    
    const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

    const filteredTasks = (status: Task['status']) => tasks?.filter(t => t.status === status) || [];

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Manage Tasks</h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <TaskColumn title="To Do" tasks={filteredTasks('todo')} isLoading={tasksLoading} />
                <TaskColumn title="In Progress" tasks={filteredTasks('inprogress')} isLoading={tasksLoading} />
                <TaskColumn title="Done" tasks={filteredTasks('done')} isLoading={tasksLoading} />
            </div>
        </>
    );
}
