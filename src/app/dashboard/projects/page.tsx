'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Project } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, CalendarCheck, ClipboardCheck, DollarSign } from 'lucide-react';
import Link from 'next/link';

function ManagerProjectView({ projects }: { projects: Project[] }) {
  const project = projects[0]; // For now, manager is assigned to one project

  const actions = [
    { href: `/dashboard/attendance`, label: 'Mark Attendance', icon: CalendarCheck },
    { href: `/dashboard/tasks`, label: 'Manage Tasks', icon: ClipboardCheck },
    { href: `/dashboard/transactions`, label: 'Add Expense', icon: ArrowLeftRight },
    { href: `/dashboard/transactions`, label: 'Add Income', icon: DollarSign },
  ];

  if (!project) {
    return (
      <Card>
          <CardContent className="pt-6">
          <p>You have not been assigned to any projects yet. Please contact an administrator.</p>
          </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <Card>
            <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.location}</CardDescription>
            </CardHeader>
       </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            asChild
            variant="outline"
            className="h-24 flex-col gap-2 text-base"
          >
            <Link href={action.href}>
              <action.icon className="h-6 w-6" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // This is the crucial fix: we are now using a 'where' clause to filter by the manager's UID.
    // This ensures we only request data the manager is allowed to see.
    return query(collection(firestore, 'projects'), where('assigned_manager_id', '==', user.uid));
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">My Project</h1>
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">My Project</h1>
      </div>
       <ManagerProjectView projects={projects || []} />
    </>
  );
}
