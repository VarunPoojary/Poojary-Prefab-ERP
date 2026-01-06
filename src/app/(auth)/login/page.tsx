'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        if (userData.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
         router.push('/dashboard');
      }

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
          router.push('/dashboard');
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
  
  // If user is already logged in, redirect them
  if (user) {
    // router.push('/dashboard');
    return null; // or a loading indicator
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
