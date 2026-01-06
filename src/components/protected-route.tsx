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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user state is loaded from auth
    }

    if (!user) {
      // If no user, not authorized, redirect to login
      setIsAuthorized(false);
      setIsLoading(false);
      if (pathname !== '/login') {
         router.replace('/login');
      }
      return;
    }

    // User is authenticated, now check role for authorization
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then((docSnap) => {
      let authorized = false;
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        if (pathname.startsWith('/admin')) {
          if (userData.role === 'admin') {
            authorized = true;
          } else {
             // Manager trying to access admin route, redirect them
            router.replace('/dashboard');
          }
        } else if (pathname.startsWith('/dashboard') || pathname === '/') {
          // All authenticated users can access general dashboard routes
          authorized = true;
        }
      } else {
         // User doc doesn't exist, they can't access protected routes
         // This might happen if creation failed. Redirect to login to be safe.
         router.replace('/login');
      }
      setIsAuthorized(authorized);
      setIsLoading(false);
    }).catch(() => {
        // Error fetching doc, treat as unauthorized
        setIsLoading(false);
        setIsAuthorized(false);
        router.replace('/login');
    });

  }, [isUserLoading, user, firestore, router, pathname]);

  if (isLoading) {
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
  
  if (!isAuthorized && pathname !== '/login') {
    // This is a fallback, the useEffect should have already redirected.
    return null;
  }

  return <>{children}</>;
}
