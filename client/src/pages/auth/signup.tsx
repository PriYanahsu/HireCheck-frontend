import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { insertUserSchema } from "@/lib/schema";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const signupSchema = insertUserSchema.extend({
  company: z.string().optional(),
  passwordConfirm: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
});

type FormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signup, isSigningUp, user } = useAuth();

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      company: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = (data: FormData) => {
    const { passwordConfirm, ...userData } = data;
    signup(userData);
  };

  return (
    <AuthLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Create your account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Already have one?{" "}
            <Link href="/login">
              <a className="font-medium text-primary hover:underline">Sign in</a>
            </Link>
          </p>
        </div>

        <Card className="surface-card border-0 shadow-md">
          <CardContent className="pt-5 px-4 sm:pt-6 sm:px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="h-11 text-[15px] sm:text-sm"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="h-11 text-[15px] sm:text-sm"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] sm:text-sm">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="johndoe"
                            className="h-11 text-[15px] sm:text-sm"
                            autoComplete="username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] sm:text-sm">Company</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Acme Inc."
                            className="h-11 text-[15px] sm:text-sm"
                            autoComplete="organization"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create a password"
                          className="h-11 text-[15px] sm:text-sm"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          className="h-11 text-[15px] sm:text-sm"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-11 mt-1" disabled={isSigningUp}>
                  {isSigningUp ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
