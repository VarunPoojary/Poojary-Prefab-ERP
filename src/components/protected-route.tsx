'use client';

import { useFirestore, useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/types/schema';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    const checkRole = async () => {
      setIsCheckingRole(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const isAdminRoute = pathname.startsWith('/admin');
        const isManagerRoute = pathname.startsWith('/dashboard'); // Assuming managers use /dashboard

        if (isAdminRoute && userData.role !== 'admin') {
          router.replace('/dashboard'); // Or a specific unauthorized page
        } else if (isManagerRoute && userData.role !== 'manager' && userData.role !== 'admin') {
           router.replace('/login');
        } else {
          setIsAuthorized(true);
        }
      } else {
        // Handle case where user doc doesn't exist but they are authenticated
        router.replace('/login');
      }
      setIsCheckingRole(false);
    };

    checkRole();
  }, [isUserLoading, user, router, firestore, pathname]);

  if (isUserLoading || isCheckingRole || !isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
