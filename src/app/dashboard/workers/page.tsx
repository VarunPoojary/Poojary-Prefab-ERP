import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function WorkersPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Workers</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Worker
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Worker Profiles</CardTitle>
          <CardDescription>Manage your workforce and their details.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A table of workers will be displayed here.</p>
        </CardContent>
      </Card>
    </>
  );
}
