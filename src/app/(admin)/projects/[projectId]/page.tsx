'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import type { Project } from '@/types/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Wallet } from 'lucide-react';
import { useProjectFinancials } from '@/hooks/use-project-financials';
import { Progress } from '@/components/ui/progress';

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

function FinancialsCard({ project }: { project: Project }) {
    const { utilisedBudget, totalIncome, isLoading } = useProjectFinancials(project.id);
    
    if (isLoading) {
        return (
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Financials</CardTitle>
                    <CardDescription>Income and expenses for this project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
        )
    }

    const budgetLimit = project.budget_limit || 0;
    const remainingBudget = budgetLimit - utilisedBudget;
    const utilisationPercentage = budgetLimit > 0 ? (utilisedBudget / budgetLimit) * 100 : 0;

    return (
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet />
                    Financials
                </CardTitle>
                <CardDescription>Budget and expense tracking for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Budget Utilisation</span>
                         <span className="text-sm font-medium">
                            ₹{utilisedBudget.toLocaleString()} / ₹{budgetLimit.toLocaleString()}
                        </span>
                    </div>
                     <Progress value={utilisationPercentage} className="h-2" />
                </div>
                <div className="text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining Budget</span>
                        <span className="font-semibold">₹{remainingBudget.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Total Approved Income</span>
                        <span className="font-medium text-green-600">₹{totalIncome.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


export default function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
    const { projectId } = params;
    const firestore = useFirestore();
    const projectRef = useMemo(() => doc(firestore, 'projects', projectId), [firestore, projectId]);
    const { data: project, isLoading } = useDoc<Project>(projectRef);


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
                {isLoading ? <Skeleton className="h-48 w-full" /> : project && <FinancialsCard project={project} />}
            </div>
        </>
    );
}
