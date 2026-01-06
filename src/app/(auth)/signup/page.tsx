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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
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

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

   useEffect(() => {
    if (isUserLoading) {
      return; 
    }
    if (user) {
      // If user is already logged in, redirect them.
      router.replace('/dashboard');
    } else {
      setIsCheckingUser(false);
    }
  }, [user, isUserLoading, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const newUserCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = newUserCredential.user;

      const userDocRef = doc(firestore, 'users', newUser.uid);
      // We are omitting `id` because it's the document ID, not a field.
      const newUserData: Omit<User, 'id'> = {
        uid: newUser.uid,
        email: newUser.email!,
        name: newUser.email!.split('@')[0], // Default name from email
        role: 'manager', // Default role
        assigned_project_ids: [],
      };
      
      await setDoc(userDocRef, newUserData);

      toast({
        title: 'Account Created',
        description: "Welcome! Your account has been successfully created.",
      });
      // The useEffect will handle redirection once the user state is updated.
    } catch (error) {
      if (error instanceof FirebaseError) {
        toast({
          variant: 'destructive',
          title: 'Sign Up Error',
          description: error.message,
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'An unexpected error occurred.',
          description: 'Please try again.',
        });
      }
    }
  };
  
  if (isCheckingUser) {
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
            Create an Account
          </CardTitle>
          <CardDescription>
            Enter your email and password to get started.
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
                      <Input placeholder="manager@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardContent className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
