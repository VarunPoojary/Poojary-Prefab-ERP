'use client';

import { useUser, useFirestore } from '@/firebase';
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
  
  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user state is definitively loaded
    }

    if (!user) {
      // If no user, redirect to login. The auth pages are not wrapped in this component.
      router.replace('/login');
      return;
    }

    // User is authenticated, now check role for authorization
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        if (pathname.startsWith('/admin') && userData.role !== 'admin') {
          // Manager trying to access admin route, redirect them
          router.replace('/dashboard');
        } else {
          // User is authorized for this route.
          setIsAuthorized(true);
        }
      } else {
         // User doc doesn't exist, they can't access protected routes.
         router.replace('/login');
      }
    }).catch(() => {
        // Error fetching doc, treat as unauthorized and send to login.
        router.replace('/login');
    });

  }, [isUserLoading, user, firestore, router, pathname]);

  if (isUserLoading || !isAuthorized) {
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
  
  // If we've reached this point, user is loaded and authorized.
  return <>{children}</>;
}
