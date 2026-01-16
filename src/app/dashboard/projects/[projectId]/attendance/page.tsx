'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Attendance } from '@/types/schema';
import { collection, query, where } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { AddAttendanceModal } from '@/components/manager/add-attendance-modal';
import { Input } from '@/components/ui/input';

function AttendanceList() {
    const params = useParams();
    const projectId = params.projectId as string;
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    console.log('projectId', projectId);

    const attendanceQuery = useMemoFirebase(() => {
        if (!projectId) return null;
        return query(collection(firestore, 'attendance'), where('project_id', '==', projectId));
    }, [firestore, projectId]);

    const { data: attendances, isLoading } = useCollection<Attendance>(attendanceQuery);

    const groupedAttendance = useMemo(() => {
        if (!attendances) return {};
        return attendances.reduce((acc, record) => {
            const date = format(record.date.toDate(), 'yyyy-MM-dd');
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(record);
            return acc;
        }, {} as Record<string, Attendance[]>);
    }, [attendances]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedAttendance).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }, [groupedAttendance]);

     if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }
    
    const filteredWorkers = (records: Attendance[]) => {
        return records.filter(record => 
            record.worker_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    return (
        <div className="space-y-4">
            <Input 
                placeholder="Search by worker name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-full sm:max-w-sm"
            />
            {sortedDates.length === 0 ? (
                 <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                    No attendance records found for this project yet.
                </div>
            ) : (
                <Accordion type="multiple" className="w-full">
                    {sortedDates.map(date => {
                        const records = groupedAttendance[date];
                        const presentWorkers = records.filter(r => r.status === 'present');
                        const workersForDate = filteredWorkers(presentWorkers);

                        if (searchTerm && workersForDate.length === 0) {
                            return null; // Don't show the date if no workers match the search
                        }

                        return (
                            <AccordionItem key={date} value={date}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4 text-left">
                                        <span className="font-semibold">{format(new Date(date), 'MMMM d, yyyy')}</span>
                                        <span className="text-muted-foreground text-right pl-2">{presentWorkers.length} worker(s) present</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {workersForDate.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                            {workersForDate.map(record => (
                                                <li key={record.id}>{record.worker_name}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No workers found for this search term on this date.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}
        </div>
    );
}


export default function AttendancePage() {
    const params = useParams();
    const projectId = params.projectId as string;
  
  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl font-headline self-start">Attendance</h1>
        <AddAttendanceModal projectId={projectId} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Records</CardTitle>
          <CardDescription>View historical attendance records for this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceList />
        </CardContent>
      </Card>
    </>
  );
}
