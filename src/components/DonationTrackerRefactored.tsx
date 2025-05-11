import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusItem from "./StatusItem";
import { fetchDonationById, refreshDonations, DonationData } from "@/lib/api";

interface DonationTrackerProps {
  donationId?: string;
  onBack?: () => void;
}

const DonationTrackerRefactored = ({
  donationId: propDonationId,
  onBack,
}: DonationTrackerProps) => {
  const params = useParams<{ donationId: string }>();
  const id = propDonationId || params.donationId;

  const [donation, setDonation] = useState<DonationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate status timeline based on donation status
  const generateStatusTimeline = (donation: DonationData) => {
    const now = new Date();
    const baseDate = new Date(donation.date);

    // Create status items based on the current status
    const statusItems = [
      {
        id: "1",
        status: "active" as const,
        title: "Donation Listed",
        description: `${donation.title} has been listed for donation.`,
        timestamp: donation.date,
        user: donation.organization,
      },
    ];

    // Add a matched status (simulating real-time tracking)
    const matchedDate = new Date(baseDate);
    matchedDate.setHours(matchedDate.getHours() + 12);
    if (
      matchedDate <= now ||
      donation.status === "urgent" ||
      donation.status === "completed"
    ) {
      statusItems.push({
        id: "2",
        status: "matched" as const,
        title: "Potential Recipients Found",
        description: `Potential recipients for ${donation.title} have been identified.`,
        timestamp: matchedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        user: "System",
      });
    }

    // If urgent, add an urgent status
    if (donation.status === "urgent") {
      const urgentDate = new Date(baseDate);
      urgentDate.setHours(urgentDate.getHours() + 24);
      statusItems.push({
        id: "3",
        status: "urgent" as const,
        title: "Urgent Need Identified",
        description: `This donation has been marked as urgent by ${donation.organization}.`,
        timestamp: urgentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        user: donation.organization,
      });

      // Add an arranged status for urgent donations
      const arrangedDate = new Date(urgentDate);
      arrangedDate.setHours(arrangedDate.getHours() + 6);
      if (arrangedDate <= now || donation.status === "completed") {
        statusItems.push({
          id: "4",
          status: "arranged" as const,
          title: "Pickup/Delivery Arranged",
          description: `Logistics for ${donation.title} have been arranged.`,
          timestamp: arrangedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          user: "Logistics Team",
        });
      }
    }

    // If completed, add a completed status
    if (donation.status === "completed") {
      const completedDate = new Date(baseDate);
      completedDate.setDate(completedDate.getDate() + 7);
      statusItems.push({
        id: "5",
        status: "completed" as const,
        title: "Donation Completed",
        description: `The donation to ${donation.organization} has been successfully completed.`,
        timestamp: completedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        user: donation.organization,
      });
    }

    return statusItems;
  };

  useEffect(() => {
    const loadDonation = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        const fetchedDonation = await fetchDonationById(id);

        if (fetchedDonation) {
          setDonation(fetchedDonation);
        } else {
          setError("Donation not found. It may have been removed.");
        }
      } catch (err) {
        console.error("Error fetching donation:", err);
        setError("Failed to load donation. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDonation();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (id) {
        fetchDonationById(id).then((updatedDonation) => {
          if (updatedDonation) {
            setDonation(updatedDonation);
          }
        });
      }
    }, 30000); // Check for updates every 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  const handleRefresh = async () => {
    if (!id) return;

    try {
      setIsRefreshing(true);
      await refreshDonations(); // Refresh all donations data
      const refreshedDonation = await fetchDonationById(id);

      if (refreshedDonation) {
        setDonation(refreshedDonation);
      } else {
        setError("Donation not found after refresh.");
      }
    } catch (err) {
      console.error("Error refreshing donation:", err);
      setError("Failed to refresh donation. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate progress based on status
  const calculateProgress = (status: string) => {
    switch (status) {
      case "active":
        return 33;
      case "urgent":
        return 66;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Card className="w-full bg-white shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-2xl font-bold">
                Donation Tracker
              </CardTitle>
              <CardDescription>
                {donation
                  ? `Tracking ${donation.title}`
                  : "Loading donation details..."}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Loading donation details...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : donation ? (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Donation Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {calculateProgress(donation.status)}%
                </span>
              </div>
              <Progress value={calculateProgress(donation.status)} />
            </div>

            <div className="space-y-6 mt-6">
              {generateStatusTimeline(donation).map((status, index, array) => (
                <motion.div
                  key={status.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatusItem
                    status={status}
                    index={index}
                    isLast={index === array.length - 1}
                  />
                </motion.div>
              ))}
            </div>

            <div className="bg-muted/50 p-4 rounded-md mt-6">
              <h3 className="text-sm font-medium mb-2">Donation Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Organization</p>
                  <p className="font-medium">{donation.organization}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {donation.category.charAt(0).toUpperCase() +
                      donation.category.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{donation.contactInfo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-medium">{donation.source}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No donation found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DonationTrackerRefactored;
