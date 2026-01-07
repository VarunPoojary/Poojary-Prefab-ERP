'use client';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Project, Task } from '@/types/schema';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UpdateTaskStatusModal } from '@/components/manager/update-task-status-modal';
import { Badge } from '@/components/ui/badge';


function TaskCard({ task }: { task: Task }) {
    const getStatusVariant = (status: Task['status']) => {
        switch (status) {
            case 'todo': return 'secondary';
            case 'inprogress': return 'default';
            case 'done': return 'outline';
            default: return 'secondary';
        }
    }
    return (
        <Card className="mb-2">
            <CardContent className="p-3 flex justify-between items-center">
                <p className="text-sm font-medium">{task.title}</p>
                <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
            </CardContent>
        </Card>
    )
}

function TaskListSection({ title, tasks, isLoading, projects }: { title: string, tasks: Task[], isLoading: boolean, projects: Project[] }) {
    return (
        <AccordionItem value={title.toLowerCase()}>
            <AccordionTrigger className="text-lg font-semibold">{title} ({tasks.length})</AccordionTrigger>
            <AccordionContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : tasks.length > 0 ? (
                    tasks.map(task => (
                        <UpdateTaskStatusModal key={task.id} task={task} projects={projects}>
                            <TaskCard task={task} />
                        </UpdateTaskStatusModal>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4">
                        No tasks in this section.
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
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
    
    // Although we only have one project on this page, the update modal is shared and needs the list.
    const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
    const { data: projectData, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);


    const filteredTasks = (status: Task['status']) => tasks?.filter(t => t.status === status) || [];

    const isLoading = tasksLoading || projectsLoading;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Manage Tasks</h1>
            </div>
            <Accordion type="multiple" defaultValue={['to do', 'in progress']} className="w-full">
                <TaskListSection title="To Do" tasks={filteredTasks('todo')} isLoading={isLoading} projects={projectData || []} />
                <TaskListSection title="In Progress" tasks={filteredTasks('inprogress')} isLoading={isLoading} projects={projectData || []} />
                <TaskListSection title="Done" tasks={filteredTasks('done')} isLoading={isLoading} projects={projectData || []} />
            </Accordion>
        </>
    );
}
