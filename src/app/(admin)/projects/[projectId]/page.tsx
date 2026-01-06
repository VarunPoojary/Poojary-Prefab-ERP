'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import type { Project } from '@/types/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

function ProjectHeader({ projectId }: { projectId: string }) {
    const firestore = useFirestore();
    const projectRef = useMemo(() => doc(firestore, 'projects', projectId), [firestore, projectId]);
    const { data: project, isLoading } = useDoc<Project>(projectRef);

    if (isLoading) {
        return (
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    if (!project) {
        return <div>Project not found.</div>;
    }

    return (
        <div className="flex items-center gap-4">
             <Briefcase className="h-8 w-8 text-muted-foreground" />
            <div>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">
                    {project.name}
                </h1>
                <p className="text-sm text-muted-foreground">{project.location}</p>
            </div>
        </div>
    );
}


export default function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
    const { projectId } = params;

    return (
        <>
            <div className="flex items-center justify-between">
                <ProjectHeader projectId={projectId} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Tasks</CardTitle>
                        <CardDescription>Breakdown of project tasks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Task details will be shown here.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Attendance</CardTitle>
                        <CardDescription>Daily worker attendance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Attendance records will be shown here.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Financials</CardTitle>
                        <CardDescription>Income and expenses for this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Financial details will be shown here.</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
