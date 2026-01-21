
'use client';

import { useMemo } from 'react';
import { collection, doc, orderBy, query, where } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import type { Project, User, Transaction, Attendance } from '@/types/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function ProjectHeader({ project }: { project: Project | null }) {
    if (!project) {
        return (
            <div className="flex items-center gap-4">
                 <Skeleton className="h-8 w-8 shrink-0" />
                <div>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-32 mt-1" />
                </div>
            </div>
        );
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

function ManagerName({ managerId }: { managerId: string }) {
  const firestore = useFirestore();
  const managerRef = useMemoFirebase(() => {
      if (!managerId || !firestore) return null;
      return doc(firestore, 'users', managerId);
  }, [firestore, managerId]);

  const { data: manager, isLoading } = useDoc<User>(managerRef);

  if (isLoading) return <Skeleton className="h-5 w-24" />;

  return <span className="font-medium">{manager?.name || 'Unassigned'}</span>;
}


function ProjectDetailsCard({ project }: { project: Project }) {
    const budgetLimit = project.budget_limit || 0;
    const utilisedBudget = project.utilised_budget || 0;
    const remainingBudget = budgetLimit - utilisedBudget;
    const utilisationPercentage = budgetLimit > 0 ? (utilisedBudget / budgetLimit) * 100 : 0;
    const isOverBudget = utilisedBudget > budgetLimit;

    const getStatusVariant = (status: Project['status']) => {
        return status === 'active' ? 'default' : 'secondary';
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={getStatusVariant(project.status)} className="capitalize">{project.status}</Badge>
                    </div>
                     <div className="space-y-1 sm:col-span-2">
                        <p className="text-muted-foreground">Assigned Manager</p>
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <ManagerName managerId={project.assigned_manager_id} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Order Value</p>
                        <p className="font-semibold text-lg">₹{project.order_value.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Budget Limit</p>
                        <p className="font-semibold text-lg">₹{budgetLimit.toLocaleString()}</p>
                    </div>
                </div>
                
                <div>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Budget Utilisation</span>
                         <span className="text-sm font-medium">
                            ₹{utilisedBudget.toLocaleString()} / ₹{budgetLimit.toLocaleString()}
                        </span>
                    </div>
                     <Progress value={utilisationPercentage} className="h-2" />
                     <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className={cn("font-semibold", isOverBudget && "text-destructive")}>
                            ₹{remainingBudget.toLocaleString()}
                        </span>
                     </div>
                     {isOverBudget && (
                         <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Project is over budget by ₹{Math.abs(remainingBudget).toLocaleString()}</span>
                         </div>
                     )}
                </div>

            </CardContent>
        </Card>
    );
}


function ProjectTransactions({ projectId }: { projectId: string }) {
  const firestore = useFirestore();
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !projectId) return null;
    return query(collection(firestore, `projects/${projectId}/transactions`), orderBy('timestamp', 'desc'));
  }, [firestore, projectId]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const getVariantForType = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return 'default';
      case 'expense':
        return 'destructive';
      case 'payout_settlement':
        return 'secondary';
      case 'payout_advance':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getVariantForStatus = (status: Transaction['status']) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'unapproved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Transactions</CardTitle>
        <CardDescription>A log of all financial activities for this project.</CardDescription>
      </CardHeader>
      <CardContent>
        {(!transactions || transactions.length === 0) ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                No transactions found for this project.
            </div>
        ) : (
            <>
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <Badge variant={getVariantForType(transaction.type)}>{transaction.type.replace('_', ' ')}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">₹{transaction.amount.toLocaleString()}</TableCell>
                                <TableCell>{transaction.category}</TableCell>
                                <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                                <TableCell>
                                    <Badge variant={getVariantForStatus(transaction.status)}>{transaction.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {transactions.map((transaction) => (
                    <Card key={transaction.id}>
                        <CardHeader>
                            <CardTitle>₹{transaction.amount.toLocaleString()}</CardTitle>
                            <CardDescription>{transaction.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Type</span>
                                <Badge variant={getVariantForType(transaction.type)}>{transaction.type.replace('_', ' ')}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Category</span>
                                <span>{transaction.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date</span>
                                <span>{formatDate(transaction.timestamp)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={getVariantForStatus(transaction.status)}>{transaction.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectAttendance({ projectId }: { projectId: string }) {
  const firestore = useFirestore();

  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !projectId) return null;
    return query(
      collection(firestore, 'attendance'), 
      where('project_id', '==', projectId),
      where('status', '==', 'present')
    );
  }, [firestore, projectId]);

  const { data: attendances, isLoading } = useCollection<Attendance>(attendanceQuery);

  const groupedAttendance = useMemo(() => {
    if (!attendances) return {};
    return attendances.reduce((acc, record) => {
        const dateStr = format(record.date.toDate(), 'yyyy-MM-dd');
        if (!acc[dateStr]) {
            acc[dateStr] = [];
        }
        acc[dateStr].push(record);
        return acc;
    }, {} as Record<string, Attendance[]>);
  }, [attendances]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedAttendance);
  }, [groupedAttendance]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Attendance</CardTitle>
        <CardDescription>A log of daily worker attendance for this project.</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedDates.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No attendance records found for this project.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {sortedDates.map(dateStr => {
              const records = groupedAttendance[dateStr];
              const presentCount = records.length;
              
              return (
                <AccordionItem key={dateStr} value={dateStr}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4 text-left">
                      <span className="font-semibold">{format(new Date(dateStr), 'MMMM d, yyyy')}</span>
                      <span className="text-muted-foreground text-right pl-2">{presentCount} worker(s) present</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {records.map(record => (
                        <li key={record.id}>{record.worker_name}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}


export default function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
    const { projectId } = params;
    const router = useRouter();
    const firestore = useFirestore();
    const projectRef = useMemoFirebase(() => {
        if (!firestore || !projectId) return null;
        return doc(firestore, 'projects', projectId)
    }, [firestore, projectId]);

    const { data: project, isLoading } = useDoc<Project>(projectRef);
    
    if (isLoading) {
        return (
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 shrink-0" />
                    <ProjectHeader project={null} />
                </div>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Card className="p-8 text-center">
                    <CardTitle>Project Not Found</CardTitle>
                    <CardDescription>The requested project does not exist.</CardDescription>
                     <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <ProjectHeader project={project} />
            </div>
           
           <ProjectDetailsCard project={project} />
           <ProjectTransactions projectId={projectId} />
           <ProjectAttendance projectId={projectId} />
        </div>
    );
}

