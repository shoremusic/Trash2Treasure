import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authProvider";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { user, login, register } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Using useEffect for navigation to avoid React hooks rule violations
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: LoginValues) => {
    try {
      setIsLoggingIn(true);
      await login(values.username, values.password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    try {
      setIsRegistering(true);
      await register(values.username, values.email, values.password);
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container grid flex-1 items-center lg:grid-cols-2 gap-8 py-8">
        <div className="flex flex-col justify-center space-y-6 lg:p-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Welcome to StreetFinds
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Join our community-driven platform for discovering and sharing hard rubbish treasures in your neighborhood.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md space-y-6 lg:mx-0">
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoggingIn}>
                          {isLoggingIn ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            "Login"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => setActiveTab("register")}
                      >
                        Register
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>
                      Create an account to start sharing and discovering
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={isRegistering}>
                          {isRegistering ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Register"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => setActiveTab("login")}
                      >
                        Login
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="hidden lg:flex relative overflow-hidden rounded-lg bg-foreground/5 p-6">
          <div className="relative z-10 mx-auto flex max-w-[420px] flex-col items-center text-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Join our circular economy
                </h2>
                <p className="text-muted-foreground">
                  StreetFinds helps reduce waste by connecting people with unwanted items 
                  to those who can give them a second life.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">How it works:</h3>
                <ul className="space-y-2 text-left list-disc list-inside">
                  <li>Find discarded treasures in your neighborhood</li>
                  <li>Share your discoveries with the community</li>
                  <li>Mark items as taken when they've found a new home</li>
                  <li>Earn kudos from the community for your contributions</li>
                  <li>Participate actively to unlock immediate viewing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}