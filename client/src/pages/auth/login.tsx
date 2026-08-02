import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/schema";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type FormData = {
  username: string;
  password: string;
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoggingIn, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: FormData) => login(data);

  return (
    <AuthLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Sign in to manage your assessments.{" "}
            <Link href="/signup">
              <a className="font-medium text-primary hover:underline">Create account</a>
            </Link>
          </p>
        </div>

        <Card className="surface-card border-0 shadow-md">
          <CardContent className="pt-5 px-4 sm:pt-6 sm:px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] sm:text-sm">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-11 pr-10 text-[15px] sm:text-sm"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-0 top-0 h-11 w-10 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-11" disabled={isLoggingIn}>
                  {isLoggingIn ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 px-4 py-3 sm:px-6 sm:py-4 flex justify-center rounded-b-xl">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Demo: <span className="font-medium text-foreground">demo</span> / <span className="font-medium text-foreground">password</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
}
