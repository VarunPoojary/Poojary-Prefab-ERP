'use client';

import { useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Project, User } from '@/types/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function ManagerName({ managerId }: { managerId: string }) {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  if (isLoading) return <Skeleton className="h-5 w-24" />;

  const manager = users?.find(u => u.id === managerId);
  return <span>{manager?.name || 'Unassigned'}</span>;
}


export function ProjectList() {
  const firestore = useFirestore();
  const router = useRouter();
  
  const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
  const {
    data: projects,
    isLoading,
    error,
  } = useCollection<Project>(projectsQuery);

  const handleRowClick = (projectId: string) => {
    router.push(`/admin/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading projects: {error.message}</p>;
  }

  return (
    <div className="rounded-md border">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Manager</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {projects && projects.length > 0 ? (
            projects.map((project) => (
                <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.location}</TableCell>
                <TableCell>${project.budget_limit.toLocaleString()}</TableCell>
                <TableCell>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
                </TableCell>
                <TableCell>
                    <ManagerName managerId={project.assigned_manager_id} />
                </TableCell>
                </TableRow>
            ))
            ) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center">
                No projects found.
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}
