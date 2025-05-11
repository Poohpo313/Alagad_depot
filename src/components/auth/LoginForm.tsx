import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const LoginForm = () => {
  const { login, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      clearError();
      await login(values.email, values.password);
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });
      navigate("/dashboard");
    } catch (err) {
      // Error is handled by the AuthContext
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo credentials for easy testing
  const demoCredentials = [
    { email: "donor@example.com", role: "Donor" },
    { email: "charity@example.com", role: "Charity" },
    { email: "recipient@example.com", role: "Recipient" },
  ];

  const fillDemoCredentials = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", "password123"); // Demo password
  };

  // Change the reset button to remove all registered accounts and the current user session
  const handleFullAccountReset = () => {
    localStorage.removeItem("users");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("memberSince");
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
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
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      {...field}
                    />
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
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">Demo Accounts:</p>
          <div className="flex flex-col space-y-2">
            {demoCredentials.map((cred) => (
              <Button
                key={cred.email}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => fillDemoCredentials(cred.email)}
              >
                {cred.role}: {cred.email}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Password for all demo accounts: password123
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <div className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:underline mt-2"
          onClick={handleFullAccountReset}
        >
          Reset all accounts (remove all users and session)
        </button>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
