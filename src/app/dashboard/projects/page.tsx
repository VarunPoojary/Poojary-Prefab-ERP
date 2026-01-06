import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Projects</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
          <CardDescription>Manage all your construction projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>A table of projects will be displayed here.</p>
        </CardContent>
      </Card>
    </>
  );
}
