import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Manage your application settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Settings form will be here.</p>
        </CardContent>
      </Card>
    </>
  );
}
