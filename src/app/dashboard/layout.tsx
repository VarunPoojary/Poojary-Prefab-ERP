'use client';

import {
  Briefcase,
  Users,
  PieChart,
  Settings,
} from 'lucide-react';

import { UserNav } from '@/components/user-nav';
import { ProtectedRoute } from '@/components/protected-route';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <div className="w-full flex-1">
              {/* Can add search or other header elements here */}
            </div>
            <UserNav />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
      </div>
    </ProtectedRoute>
  );
}
