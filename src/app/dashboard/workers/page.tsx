'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Worker } from '@/types/schema';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

function WorkerList() {
  const firestore = useFirestore();
  const workersQuery = useMemoFirebase(() => query(collection(firestore, 'workers')), [firestore]);
  const { data: workers, isLoading } = useCollection<Worker>(workersQuery);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  
  if (!workers || workers.length === 0) {
      return <div className="text-center text-muted-foreground py-10">No workers found.</div>
  }

  return (
    <>
      {/* Desktop View */}
     <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Skill</TableHead>
            <TableHead>Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.skill}</TableCell>
                <TableCell>{worker.phone}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </div>

    {/* Mobile View */}
    <div className="md:hidden space-y-4">
      {workers.map((worker) => (
        <Card key={worker.id}>
            <CardHeader>
                <CardTitle>{worker.name}</CardTitle>
                <CardDescription>{worker.skill}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
                <p className="text-muted-foreground">{worker.phone}</p>
            </CardContent>
        </Card>
      ))}
    </div>
    </>
  )
}


export default function WorkersPage() {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl font-headline self-start">Workers</h1>
        <Button className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Worker
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Workers</CardTitle>
          <CardDescription>
            This is a global list of all workers available for projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkerList />
        </CardContent>
      </Card>
    </>
  );
}
