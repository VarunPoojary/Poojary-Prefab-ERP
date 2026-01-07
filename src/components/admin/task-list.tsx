'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, collectionGroup, Unsubscribe } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Task, Project } from '@/types/schema';
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
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TaskList() {
  const firestore = useFirestore();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectsMap, setProjectsMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const projectsQuery = useMemoFirebase(() => query(collection(firestore, 'projects')), [firestore]);
  const { data: projectData, isLoading: projectsLoading, error: projectsError } = useCollection<Project>(projectsQuery);

  useEffect(() => {
    if (!firestore) return;

    if (projectData) {
        const newProjectsMap = new Map(projectData.map(p => [p.id, p.name]));
        setProjectsMap(newProjectsMap);
    }
    
    setIsLoading(true);
    const tasksQuery = query(collectionGroup(firestore, 'tasks'));
    
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(allTasks);
        setIsLoading(false);
    }, (e) => {
        console.error("Error fetching tasks in real-time: ", e);
        setError(e as Error);
        setIsLoading(false);
    });

    return () => unsubscribe();

  }, [firestore, projectData]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => projectFilter === 'all' || task.project_id === projectFilter)
      .filter(task => statusFilter === 'all' || task.status === statusFilter);
  }, [tasks, projectFilter, statusFilter]);

  if (isLoading || projectsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || projectsError) {
    return <p className="text-destructive">Error loading data: {error?.message || projectsError?.message}</p>;
  }
  
  const getStatusVariant = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'inprogress': return 'default';
      case 'done': return 'outline';
      default: return 'secondary';
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
        return 'Invalid Date';
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {Array.from(projectsMap.entries()).map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="inprogress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{projectsMap.get(task.project_id) || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(task.expected_completion_date)}</TableCell>
                      </TableRow>
                  ))
                  ) : (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No tasks found for the selected filters.
                      </TableCell>
                  </TableRow>
                  )}
              </TableBody>
          </Table>
      </div>
    </div>
  );
}
