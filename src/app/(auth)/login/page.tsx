'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useAuth, useFirestore, useUser } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from '@/types/schema';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (userData.role === 'admin') {
              router.replace('/admin/dashboard');
            } else {
              router.replace('/dashboard');
            }
          } else {
            // If doc doesn't exist, they are likely a new user or role isn't set
            // Default to manager dashboard
            router.replace('/dashboard');
          }
        }).catch(() => {
          // In case of error, default to manager dashboard
          router.replace('/dashboard');
        });
      } else {
        // No user, stop checking
        setIsCheckingRole(false);
      }
    }
  }, [user, isUserLoading, firestore, router]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      // Let the useEffect handle redirection
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') {
        // If user not found, try to create a new account
        try {
          const newUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
          const newUser = newUserCredential.user;

          // Create a user document in Firestore
          const userDocRef = doc(firestore, 'users', newUser.uid);
          const newUserData: User = {
            uid: newUser.uid,
            email: newUser.email!,
            name: newUser.email!.split('@')[0],
            role: 'manager', // Default role for new users
            assigned_project_ids: [],
          };
          await setDoc(userDocRef, newUserData);

           toast({
            title: 'Account Created',
            description: "We've created a new account for you.",
          });
          // Let the useEffect handle redirection
        } catch (createError) {
           if (createError instanceof FirebaseError) {
             toast({
              variant: 'destructive',
              title: 'Error',
              description: createError.message,
            });
           }
        }
      } else if (error instanceof FirebaseError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      }
    }
  };
  
  if (isUserLoading || isCheckingRole || user) {
     return (
       <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md space-y-4 p-4">
            <Card>
                <CardHeader className="space-y-1 text-center">
                  <div className="flex justify-center mb-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                   <Skeleton className="h-6 w-3/4 mx-auto" />
                   <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
          </div>
       </div>
     );
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Icons.logo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">
            Welcome to Project Sentinel
          </CardTitle>
          <CardDescription>
            Enter your email and password to sign in or create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="mt-4 text-center text-sm">
        By signing in, you agree to our{' '}
        <Link href="#" className="underline">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
