'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateTaskModal } from '@/components/admin/create-task-modal';
import { TaskList } from '@/components/admin/task-list';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { User } from '@/types/schema';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminTasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((doc) => {
        if (doc.exists()) {
          setUserRole((doc.data() as User).role);
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } else if (!user) {
      setIsLoading(false);
    }
  }, [user, firestore]);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>This page is for administrators only.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>You do not have the required permissions to view all tasks across all projects.</p>
            </CardContent>
        </Card>
      </div>
    );
  }


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
