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
    // Wait until the authentication state is fully determined.
    if (isUserLoading) {
      return;
    }

    // If auth state is determined and there's no user, redirect to login.
    if (!user) {
      router.replace('/');
      return;
    }

    // At this point, the user is authenticated. Now, we check authorization.
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        // If a manager tries to access an admin-only route, redirect them.
        if (pathname.startsWith('/admin') && userData.role !== 'admin') {
          router.replace('/dashboard/projects');
        } else {
          // The user's role is permitted for this route.
          setIsAuthorized(true);
        }
      } else {
         // This case is unlikely if signup is handled correctly, but as a fallback,
         // if the user doc doesn't exist, they can't access protected routes.
         router.replace('/');
      }
    }).catch(() => {
        // If there's an error fetching the user's role, they are not authorized.
        router.replace('/');
    });

  }, [isUserLoading, user, firestore, router, pathname]);

  // While checking auth or if the user is not yet authorized, show a loading state.
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
  
  // If we've reached this point, the user is loaded, authenticated, and authorized.
  return <>{children}</>;
}
