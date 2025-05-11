import { useState, useEffect, useCallback } from "react";
import {
  Package,
  ArrowUpDown,
  Search,
  Filter,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fetchDonations, refreshDonations, DonationData } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilipinoDonationCard from "./FilipinoDonationCard";
import DonationDetailModal from "./DonationDetailModal";

// Use DonationData type from API
type Donation = DonationData;

interface DonationDashboardProps {
  donations?: Donation[];
  onCreateDonation?: () => void;
  onViewDonation?: (id: string) => void;
  userOnly?: boolean;
  showMessageButton?: boolean;
  onDonationDeleted?: () => void;
}

const DonationDashboard = ({
  donations: propDonations,
  onCreateDonation = () => (window.location.href = "/donate"),
  onViewDonation = () => {},
  userOnly = false,
  showMessageButton = true,
  onDonationDeleted,
}: DonationDashboardProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailModalTab, setDetailModalTab] = useState<string>("details");
  const [error, setError] = useState<string | null>(null);

  // Function to refresh donations
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const refreshedDonations = await refreshDonations();
      setDonations(refreshedDonations);
    } catch (err) {
      console.error("Error refreshing donations:", err);
      setError("Failed to refresh donations. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadDonations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (propDonations && propDonations.length > 0) {
          setDonations(propDonations);
        } else {
          const fetchedDonations = await fetchDonations();
          setDonations(fetchedDonations);
        }
      } catch (err) {
        setError("Failed to load donations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDonations();
    // Listen for donation update/delete events
    const handleDonationUpdate = () => loadDonations();
    window.addEventListener("donation-update", handleDonationUpdate);
    window.addEventListener("new-donation", handleDonationUpdate);
    return () => {
      window.removeEventListener("donation-update", handleDonationUpdate);
      window.removeEventListener("new-donation", handleDonationUpdate);
    };
  }, [propDonations]);

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filter donations based on active tab, search query, and category filter
  const filteredDonations = donations.filter((donation, index, self) =>
    index === self.findIndex((d) => d.id === donation.id)
  ).filter((donation) => {
    // Filter by tab (status)
    if (activeTab !== "all" && donation.status !== activeTab) return false;

    // Filter by search query
    if (
      searchQuery &&
      !donation.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !donation.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !donation.organization.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    // Filter by category
    if (categoryFilter !== "all" && donation.category !== categoryFilter)
      return false;

    return true;
  });

  // Sort donations
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Polling interval reduced for more real-time updates
  useEffect(() => {
    // Set up more frequent polling for real-time updates (every 5 seconds instead of 15)
    const pollingInterval = setInterval(async () => {
      try {
        const refreshedDonations = await refreshDonations();
        setDonations(refreshedDonations);
      } catch (err) {
        console.error("Error in polling refresh:", err);
      }
    }, 5000); // 5 seconds for more real-time updates

    // Set up real-time updates using the API
    let cleanupFunction: (() => void) | undefined;

    try {
      // Import the setupDonationUpdates function from the API
      import("@/lib/api")
        .then(({ setupDonationUpdates }) => {
          cleanupFunction = setupDonationUpdates((updatedDonation) => {
            // Update the donation in the list if it exists
            setDonations((prevDonations) => {
              const index = prevDonations.findIndex(
                (d) => d.id === updatedDonation.id,
              );
              if (index !== -1) {
                const newDonations = [...prevDonations];
                newDonations[index] = updatedDonation;
                return newDonations;
              }
              // If the donation doesn't exist in the list, add it
              return [updatedDonation, ...prevDonations];
            });
          });
        })
        .catch((error) => {
          console.error("Error importing setupDonationUpdates:", error);
        });
    } catch (error) {
      console.error("Error setting up real-time updates:", error);
    }

    // Clean up interval and real-time updates on unmount
    return () => {
      clearInterval(pollingInterval);
      if (typeof cleanupFunction === "function") {
        cleanupFunction();
      }
    };
  }, []);

  return (
    <>
      {selectedDonationId && (
        <DonationDetailModal
          donationId={selectedDonationId}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          initialTab={detailModalTab}
        />
      )}
      <Card className="w-full bg-white shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">My Donations</CardTitle>
              <CardDescription>Manage and track your donations</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button onClick={onCreateDonation}>
                <Plus className="mr-2 h-4 w-4" /> New Donation
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                Loading donations...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="urgent">Urgent</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search donations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex space-x-2">
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="disaster">Disaster Relief</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="livelihood">Livelihood</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {sortedDonations.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                    <h3 className="mt-4 text-lg font-medium">
                      No donations found
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchQuery || categoryFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Start by creating your first donation"}
                    </p>
                    {!searchQuery && categoryFilter === "all" && (
                      <Button onClick={onCreateDonation} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Create Donation
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedDonations.map((donation, index) => {
                      const isLocked = donation.status === "pending" && donation.matchedUserId && user && donation.matchedUserId !== user.id && donation.userId !== user.id;
                      return (
                        <motion.div
                          key={donation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <FilipinoDonationCard
                            donation={donation}
                            onClick={isLocked ? undefined : (tab = "details") => {
                              setSelectedDonationId(donation.id);
                              setDetailModalTab(tab);
                              setIsDetailModalOpen(true);
                            }}
                            showMessageButton={!isLocked && showMessageButton}
                            isUserDonation={!!donation.userId}
                            onDelete={() => {
                              if (onDonationDeleted) onDonationDeleted();
                              else handleRefresh();
                            }}
                            locked={isLocked}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            {!isLoading && !error && (
              <>
                Showing {sortedDonations.length} of {donations.length} donations
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default DonationDashboard;
