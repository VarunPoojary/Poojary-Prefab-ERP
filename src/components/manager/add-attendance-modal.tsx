'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, query, where, getDocs, doc } from 'firebase/firestore';
import type { Worker } from '@/types/schema';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const attendanceSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  present_workers: z.record(z.boolean()),
});

interface AddAttendanceModalProps {
  projectId: string;
}

export function AddAttendanceModal({ projectId }: AddAttendanceModalProps) {
  const [open, setOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const workersQuery = useMemoFirebase(() => query(collection(firestore, 'workers')), [firestore]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersQuery);

  const form = useForm<z.infer<typeof attendanceSchema>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: new Date(),
      present_workers: {},
    },
  });

  const onSubmit = async (data: z.infer<typeof attendanceSchema>) => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication or database error.' });
      return;
    }
    
    // Check if attendance for this date and project already exists
    const attendanceQuery = query(
        collection(firestore, 'attendance'),
        where('project_id', '==', projectId),
        where('date', '==', data.date)
    );
    const existingRecords = await getDocs(attendanceQuery);
    if (!existingRecords.empty) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Record',
            description: `Attendance for ${format(data.date, 'PPP')} has already been recorded for this project.`,
        });
        return;
    }

    const batch = writeBatch(firestore);
    const attendanceCollection = collection(firestore, 'attendance');

    Object.entries(data.present_workers).forEach(([workerId, isPresent]) => {
      if (isPresent) {
        const docRef = doc(attendanceCollection);
        batch.set(docRef, {
          project_id: projectId,
          worker_id: workerId,
          date: data.date,
          status: 'present',
          units_worked: 1, // Assuming 1 unit for a day's presence
        });
      }
    });

    try {
      await batch.commit();
      toast({
        title: 'Attendance Recorded',
        description: `Attendance for ${format(data.date, 'PPP')} has been successfully saved.`,
      });
      form.reset({ date: new Date(), present_workers: {} });
      setOpen(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save attendance records. Please try again.',
      });
    }
  };
  
  const filteredWorkers = useMemo(() => {
    if (!workers) return [];
    return workers.filter(worker => 
        worker.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workers, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Daily Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Daily Attendance</DialogTitle>
          <DialogDescription>
            Select a date and check the workers who were present.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                      <FormItem>
                          <Label>Date</Label>
                           <div>
                              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                  <PopoverTrigger asChild>
                                  <Button
                                      variant={"outline"}
                                      className="justify-start text-left font-normal w-full"
                                  >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                  <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={(date) => {
                                        field.onChange(date);
                                        setDatePickerOpen(false);
                                      }}
                                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                      initialFocus
                                  />
                                  </PopoverContent>
                              </Popover>
                          </div>
                          <FormMessage />
                      </FormItem>
                  )}
                  />

                <div className="space-y-2">
                    <Label>Workers</Label>
                    <Input 
                        placeholder="Search worker..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <ScrollArea className="h-64 rounded-md border p-2">
                        {workersLoading ? <p>Loading workers...</p> : 
                            filteredWorkers.map(worker => (
                                <FormField
                                    key={worker.id}
                                    control={form.control}
                                    name={`present_workers.${worker.id}`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <Label className="font-normal">{worker.name}</Label>
                                        </FormItem>
                                    )}
                                />
                            ))
                        }
                    </ScrollArea>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Attendance'}
                </Button>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
