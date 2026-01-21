
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading projects: {error.message}</p>;
  }
  
  if (!projects || projects.length === 0) {
      return <div className="text-center text-muted-foreground py-10">No projects found.</div>
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
              <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Order Value</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Utilised Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Manager</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
              {projects.map((project) => (
                  <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.location}</TableCell>
                  <TableCell>₹{project.order_value.toLocaleString()}</TableCell>
                  <TableCell>₹{project.budget_limit.toLocaleString()}</TableCell>
                  <TableCell>₹{(project.utilised_budget || 0).toLocaleString()}</TableCell>
                  <TableCell>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
                  </TableCell>
                  <TableCell>
                      <ManagerName managerId={project.assigned_manager_id} />
                  </TableCell>
                  </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {projects.map((project) => (
            <Card key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
                <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Order Value</span>
                        <span className="font-medium">₹{project.order_value.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">₹{project.budget_limit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Utilised</span>
                        <span className="font-medium">₹{(project.utilised_budget || 0).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Manager</span>
                        <span className="font-medium"><ManagerName managerId={project.assigned_manager_id} /></span>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </>
  );
}

    