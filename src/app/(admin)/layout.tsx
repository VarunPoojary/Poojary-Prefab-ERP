'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Users,
  ArrowLeftRight,
  ClipboardCheck,
  CalendarCheck,
  PieChart,
  LayoutDashboard,
  Settings,
  Shield,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { UserNav } from '@/components/user-nav';
import { ProtectedRoute } from '@/components/protected-route';

const adminMenuItems = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: Shield },
  // Add other admin-specific links here
];

const mainMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: Briefcase },
  { href: '/dashboard/workers', label: 'Workers', icon: Users },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardCheck },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/dashboard/budget', label: 'Budget AI', icon: PieChart },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Icons.logo className="size-6 text-sidebar-primary" />
              <span className="text-lg font-semibold font-headline text-sidebar-foreground">
                Project Sentinel
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
             <SidebarMenu>
                <SidebarMenuItem>
                    <span className="p-2 text-xs font-semibold text-muted-foreground">Admin</span>
                </SidebarMenuItem>
              {adminMenuItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <Link href={href}>
                    <SidebarMenuButton
                      isActive={pathname === href}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarMenu>
                <SidebarMenuItem>
                    <span className="p-2 text-xs font-semibold text-muted-foreground">Manager</span>
                </SidebarMenuItem>
              {mainMenuItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <Link href={href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(href) && href !== '/dashboard' || pathname === '/dashboard'}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard/settings">
                  <SidebarMenuButton isActive={pathname === '/dashboard/settings'} tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
              {/* Can add search or other header elements here */}
            </div>
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
