import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Briefcase, Users, Construction, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { title: 'Active Projects', value: '5', icon: <Briefcase className="h-4 w-4 text-muted-foreground" />, description: '+2 from last month' },
    { title: 'Total Workers', value: '78', icon: <Users className="h-4 w-4 text-muted-foreground" />, description: '+15 from last month' },
    { title: 'Tasks Completed', value: '125', icon: <Construction className="h-4 w-4 text-muted-foreground" />, description: 'in the last 7 days' },
    { title: 'Total Expenses', value: '$45,231.89', icon: <DollarSign className="h-4 w-4 text-muted-foreground" />, description: '+20.1% from last month' },
  ];

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
         <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>A list of recent transactions across all projects.</CardDescription>
            </CardHeader>
            <CardContent>
               <p>Recent transactions will be listed here.</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
                <CardTitle>Project Status</CardTitle>
                 <CardDescription>Overview of current project statuses.</CardDescription>
            </CardHeader>
            <CardContent>
               <p>Project status chart will be displayed here.</p>
            </CardContent>
         </Card>
      </div>
    </>
  );
}
