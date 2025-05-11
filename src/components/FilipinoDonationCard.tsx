import {
  ExternalLink,
  Calendar,
  Info,
  MapPin,
  Phone,
  Mail,
  Tag,
  Globe,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DonationData, deleteUserDonation } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthContext";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface FilipinoDonationCardProps {
  donation: DonationData & { userId?: string };
  onClick?: (tab?: string) => void;
  showMessageButton?: boolean;
  onDelete?: () => void;
  isUserDonation?: boolean;
}

const FilipinoDonationCard = ({
  donation,
  onClick,
  showMessageButton = false,
  onDelete,
  isUserDonation = false,
}: FilipinoDonationCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !donation.userId) return;

    try {
      setIsDeleting(true);
      const success = await deleteUserDonation(donation.id, user.id);

      if (success) {
        toast({
          title: "Donation deleted",
          description: "Your donation has been successfully deleted.",
        });
        if (onDelete) onDelete();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete donation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting donation:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    // In a real app, this would update the donation status in the database
    // For now, we'll just update it in local storage
    try {
      if (!user || !donation.userId) return;

      const userDonations = JSON.parse(
        localStorage.getItem("userDonations") || "[]",
      );
      const donationIndex = userDonations.findIndex(
        (d: any) => d.id === donation.id,
      );

      if (donationIndex !== -1) {
        userDonations[donationIndex].status = status;
        localStorage.setItem("userDonations", JSON.stringify(userDonations));

        toast({
          title: "Status updated",
          description: `Donation status changed to ${status}`,
        });

        if (onDelete) onDelete(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating donation status:", error);
      toast({
        title: "Error",
        description: "Failed to update donation status.",
        variant: "destructive",
      });
    }
  };
  // Get status badge color based on status
  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "active":
        return "default";
      case "urgent":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col relative"
        onClick={(e) => {
          // Always use onClick to show donation details modal
          if (onClick) {
            onClick("details");
          }
        }}
      >
        {/* Always show status badge at top right */}
        <div className="absolute top-2 right-2 z-10">
          <Badge variant={getStatusBadgeVariant(donation.status)}>
            {donation.status === "active" && "Active"}
            {donation.status === "urgent" && "Urgent"}
            {donation.status === "completed" && "Completed"}
          </Badge>
        </div>
        {donation.imageUrl && (
          <div className="w-full h-48 relative">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${donation.imageUrl})`,
              }}
            />
          </div>
        )}
        <CardHeader className={donation.imageUrl ? "pt-4" : "pt-6"}>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold line-clamp-2">
                {donation.title}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                {donation.date}
              </CardDescription>
              <div className="flex items-center mt-1">
                <Phone className="h-4 w-4 mr-1" />
                {donation.contactInfo && donation.contactInfo !== "No contact info provided"
                  ? donation.contactInfo
                  : localStorage.getItem("userPhone") || "No contact info provided"}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm line-clamp-3 mb-4">{donation.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <span className="font-medium">{donation.organization}</span>
            </div>

            {donation.category && (
              <div className="flex items-start">
                <Tag className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <span>
                  {donation.category.charAt(0).toUpperCase() +
                    donation.category.slice(1)}
                </span>
              </div>
            )}

            <div className="flex items-start">
              <Globe className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <span>Source: {donation.source}</span>
            </div>

            <div className="flex items-start">
              <Phone className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <span className="break-all">{donation.contactInfo}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex justify-between flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-auto flex-grow"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (donation.sourceUrl) {
                      window.open(donation.sourceUrl, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Source
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Opens the original article or website</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {donation.donationLink && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="w-auto flex-grow ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(donation.donationLink, "_blank");
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Donate Now
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Opens the donation page</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Only show message button for user-created donations */}
          {isUserDonation && showMessageButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="w-auto flex-grow ml-2"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClick) {
                        // Pass chat tab info to parent component
                        onClick("chat");
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat with donor/recipient</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Status change dropdown for user's own donations */}
          {isUserDonation && user && donation.userId === user.id && (
            <div className="w-full mt-2 flex justify-between">
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          {donation.status === "urgent" && (
                            <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                          )}
                          {donation.status === "active" && (
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                          )}
                          {donation.status === "completed" && (
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          Update Status
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Change donation status</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("active")}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("urgent")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" /> Mark as Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("completed")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark as Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete this donation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FilipinoDonationCard;
