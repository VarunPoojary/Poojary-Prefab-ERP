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
  useSidebar,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { UserNav } from '@/components/user-nav';
import { ProtectedRoute } from '@/components/protected-route';

const adminMenuItems = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/workers', label: 'Workers & Payroll', icon: Users },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardCheck },
];

const mainMenuItems = [
  { href: '/dashboard/projects', label: 'Projects', icon: Briefcase },
  { href: '/dashboard/workers', label: 'Workers', icon: Users },
  { href: '/dashboard/budget', label: 'Budget AI', icon: PieChart },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // useSidebar must be used within SidebarProvider, so we can use it in a sub-component.
  // Or we can create a new component for the menu items.
  // A simple way is to wrap the menu in a component that uses the hook.
  
  const MobileAwareMenuItems = () => {
    const { setOpenMobile } = useSidebar();
    return (
      <>
        {adminMenuItems.map(({ href, label, icon: Icon }) => (
          <SidebarMenuItem key={href}>
            <Link href={href} onClick={() => setOpenMobile(false)}>
              <SidebarMenuButton
                isActive={pathname.startsWith(href)}
                tooltip={label}
              >
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </>
    )
  }

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
                <MobileAwareMenuItems />
            </SidebarMenu>
          </SidebarContent>
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
