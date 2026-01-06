import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, ArrowLeftRight, ClipboardCheck, CalendarCheck, PieChart, Construction } from 'lucide-react';
import { Icons } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-construction');
  const features = [
    { icon: <Briefcase className="h-8 w-8 text-primary" />, title: 'Project Management', description: 'Oversee all your projects from a single dashboard.' },
    { icon: <Users className="h-8 w-8 text-primary" />, title: 'Worker Management', description: 'Manage worker profiles, skills, and payments.' },
    { icon: <ArrowLeftRight className="h-8 w-8 text-primary" />, title: 'Transaction Tracking', description: 'Keep a detailed record of all financial transactions.' },
    { icon: <ClipboardCheck className="h-8 w-8 text-primary" />, title: 'Task Management', description: 'Assign and track tasks to ensure project milestones are met.' },
    { icon: <CalendarCheck className="h-8 w-8 text-primary" />, title: 'Attendance Tracking', description: 'Monitor worker attendance with ease.' },
    { icon: <PieChart className="h-8 w-8 text-primary" />, title: 'AI Budget Overview', description: 'Get smart budget insights and risk alerts.' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold font-headline text-foreground">Project Sentinel</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Login
          </Link>
          <Button asChild>
             <Link href="/signup" prefetch={false}>Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Build with Confidence, Manage with <span className="text-primary">Precision</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Project Sentinel is the all-in-one platform for managing your construction projects, from workers and tasks to budgets and AI-powered insights.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard" prefetch={false}>
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  width={600}
                  height={400}
                  alt={heroImage.description}
                  data-ai-hint={heroImage.imageHint}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                />
              )}
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a comprehensive suite of tools to streamline your construction management workflow.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Project Sentinel. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
