'use client';

import React from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { Project, User } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, CalendarCheck, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemoFirebase } from '@/firebase/provider';

function ManagerProjectView({ projects, userRole }: { projects: Project[], userRole: User['role'] | null }) {
  if (userRole !== 'manager') {
     return (
      <Card>
        <CardContent className="pt-6">
          <p>You do not have manager permissions.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>You have not been assigned to any projects yet. Please contact an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  const actions = (projectId: string) => [
    { href: `/dashboard/projects/${projectId}/attendance`, label: 'Attendance', icon: CalendarCheck, disabled: true },
    { href: `/dashboard/projects/${projectId}/tasks`, label: 'Tasks', icon: ClipboardCheck, disabled: false },
    { href: `/dashboard/projects/${projectId}/transactions`, label: 'Expenses', icon: ArrowLeftRight, disabled: false },
  ];

  return (
    <div className="space-y-6">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>{project.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              {actions(project.id).map((action) => (
                <Button
                  key={action.label}
                  asChild={!action.disabled}
                  variant="default"
                  size="sm"
                  className="w-full sm:flex-1"
                  disabled={action.disabled}
                  aria-disabled={action.disabled}
                >
                  <Link href={action.disabled ? '#' : action.href} className={action.disabled ? 'pointer-events-none' : ''}>
                    <action.icon />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [userRole, setUserRole] = React.useState<User['role'] | null>(null);

  // Fetch user role
  React.useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(doc => {
        if (doc.exists()) {
          setUserRole((doc.data() as User).role);
        }
      });
    }
  }, [user, firestore]);

  const projectsQuery = useMemoFirebase(() => {
    // CRITICAL FIX: Do not run the query until the user's role is confirmed to be 'manager'.
    // If the role isn't manager, it will return null, and useCollection will not execute.
    if (!user || !firestore || userRole !== 'manager') {
        return null;
    }
    return query(collection(firestore, 'projects'), where('assigned_manager_id', '==', user.uid));
  }, [firestore, user, userRole]); // The query now correctly depends on userRole.

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

  // The loading state now correctly waits for both the role check and the data fetch.
  if (isLoading || !userRole) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">My Projects</h1>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">My Projects</h1>
      </div>
      <ManagerProjectView projects={projects || []} userRole={userRole} />
    </>
  );
}
