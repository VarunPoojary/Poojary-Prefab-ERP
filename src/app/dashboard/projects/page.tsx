'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { Project, User } from '@/types/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, CalendarCheck, ClipboardCheck, DollarSign } from 'lucide-react';
import Link from 'next/link';

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
    { href: `/dashboard/projects/${projectId}/attendance`, label: 'Mark Attendance', icon: CalendarCheck },
    { href: `/dashboard/projects/${projectId}/tasks`, label: 'Manage Tasks', icon: ClipboardCheck },
    { href: `/dashboard/projects/${projectId}/transactions/expense`, label: 'Add Expense', icon: ArrowLeftRight },
    { href: `/dashboard/projects/${projectId}/transactions/income`, label: 'Add Income', icon: DollarSign },
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {actions(project.id).map((action) => (
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
    if (!user || !firestore || userRole !== 'manager') return null;
    return query(collection(firestore, 'projects'), where('assigned_manager_id', '==', user.uid));
  }, [firestore, user, userRole]);

  const { data: projects, isLoading } = useCollection<Project>(projectsQuery);

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
