import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User, Loader2, Package, Plus } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DonationDashboard from "@/components/DonationDashboard";
import { fetchUserDonations, DonationData } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  organization: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [userDonations, setUserDonations] = useState<DonationData[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const { toast } = useToast();
  const [memberSince, setMemberSince] = useState<string>("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      organization: user?.organization || "",
      phone: localStorage.getItem("userPhone") || "",
      address: localStorage.getItem("userAddress") || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      // Save phone and address to localStorage
      localStorage.setItem("userPhone", values.phone || "");
      localStorage.setItem("userAddress", values.address || "");
      // Update user in localStorage and context
      const updatedUser = {
        ...user,
        name: values.name,
        email: values.email,
        organization: values.organization,
        phone: values.phone,
        address: values.address,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Optionally update user context if needed
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (err) {
      console.error("Profile update error:", err);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    const loadUserDonations = async () => {
      if (!user) return;
      try {
        setIsLoadingDonations(true);
        const donations = await fetchUserDonations(user.id);
        // Show all donations where user is creator (made) or recipient (received)
        setUserDonations(donations);
      } catch (error) {
        console.error("Error loading user donations:", error);
        toast({
          title: "Error",
          description: "Failed to load your donations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDonations(false);
      }
    };
    loadUserDonations();
    // Listen for new donation events
    const handleDonationUpdate = () => loadUserDonations();
    window.addEventListener("donation-update", handleDonationUpdate);
    window.addEventListener("new-donation", handleDonationUpdate);
    // Load member since date
    const since = localStorage.getItem("memberSince");
    if (since) setMemberSince(new Date(since).toLocaleDateString());
    return () => {
      window.removeEventListener("donation-update", handleDonationUpdate);
      window.removeEventListener("new-donation", handleDonationUpdate);
    };
  }, [user, activeTab, toast]);

  const handleDonationDeleted = async () => {
    if (!user) return;

    try {
      setIsLoadingDonations(true);
      const donations = await fetchUserDonations(user.id);
      setUserDonations(donations);
    } catch (error) {
      console.error("Error reloading user donations:", error);
    } finally {
      setIsLoadingDonations(false);
    }
  };

  const handleResetDonations = useCallback(() => {
    localStorage.removeItem("userDonations");
    // Trigger a UI refresh by dispatching a donation-update event
    window.dispatchEvent(new CustomEvent("donation-update"));
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Please log in to view your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check for URL parameters to set the active tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "donations") {
      setActiveTab("donations");
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="donations" className="flex items-center">
            <Package className="mr-2 h-4 w-4" /> My Donations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>
                    Manage your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.organization && (
                    <p className="mt-2 text-sm">
                      Organization: {user.organization}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Donations Made</p>
                      <p className="text-2xl font-bold">{userDonations.filter(donation => donation.userId === user.id && donation.type === "donation").length}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Donations Received</p>
                      <p className="text-2xl font-bold">{userDonations.filter(donation => donation.userId === user.id && donation.type === "request" && donation.status === "completed").length}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm">{memberSince || "-"}</p>
                    </div>
                    <Button variant="outline" className="mt-4 w-full" onClick={handleResetDonations}>
                      Reset My Donations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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

                      {user.role === "charity" && (
                        <FormField
                          control={form.control}
                          name="organization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Name of your organization"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                The name of your charity or organization
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your phone number"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Used for donation coordination
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Your address" {...field} />
                            </FormControl>
                            <FormDescription>
                              Used for donation pickup/delivery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Last changed: 3 months ago
                      </p>
                    </div>
                    <Button variant="outline">
                      <User className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="donations" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>My Donations</CardTitle>
              <CardDescription>Manage donations you've created</CardDescription>
            </CardHeader>
            <CardContent>
              {user.role === "recipient" ? (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">Request a donation below:</p>
                  <DonationForm />
                </>
              ) : isLoadingDonations ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Loading your donations...</p>
                </div>
              ) : userDonations.filter(d => d.userId === user.id).length > 0 ? (
                <DonationDashboard
                  donations={userDonations.filter(d => d.userId === user.id)}
                  userOnly={true}
                  showMessageButton={true}
                  onDonationDeleted={handleDonationDeleted}
                />
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                  <h3 className="mt-4 text-lg font-medium">No donations yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You haven't created any donations yet. Start by creating your first donation.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/donate")}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Donation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
