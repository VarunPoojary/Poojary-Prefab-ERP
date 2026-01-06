import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function AttendancePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Attendance</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Mark Attendance
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>View and manage worker attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A calendar or table of attendance records will be displayed here.</p>
        </CardContent>
      </Card>
    </>
  );
}
