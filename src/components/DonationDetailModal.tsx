import { useState, useEffect } from "react";
import { X, ExternalLink, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchDonationById, DonationData } from "@/lib/api";
import PaymentIntegration from "./PaymentIntegration";
import Chat from "./Chat";

interface DonationDetailModalProps {
  donationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

const DonationDetailModal = ({
  donationId,
  isOpen,
  onClose,
  initialTab = "details",
}: DonationDetailModalProps) => {
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const loadDonation = async () => {
      if (!donationId) return;

      try {
        setIsLoading(true);
        setError(null);
        const fetchedDonation = await fetchDonationById(donationId);
        setDonation(fetchedDonation);
      } catch (err) {
        console.error("Error fetching donation:", err);
        setError("Failed to load donation details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && donationId) {
      loadDonation();
    }
  }, [donationId, isOpen]);

  const handleClose = () => {
    setShowPayment(false);
    onClose();
  };

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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold pr-8">
              {isLoading ? "Loading..." : donation?.title || "Donation Details"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {donation && (
            <DialogDescription className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(donation.status)}>
                {donation.status.charAt(0).toUpperCase() +
                  donation.status.slice(1)}
              </Badge>
              <span className="text-sm">{donation.date}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={() => {
                if (donationId) {
                  setIsLoading(true);
                  fetchDonationById(donationId)
                    .then(setDonation)
                    .catch(() => setError("Failed to reload donation details."))
                    .finally(() => setIsLoading(false));
                }
              }}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : donation ? (
          <AnimatePresence mode="wait">
            {showPayment ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PaymentIntegration
                  donation={donation}
                  onSuccess={handleClose}
                  onCancel={() => setShowPayment(false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="details-tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Tabs
                  defaultValue="details"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                    {donation.imageUrl && (
                      <div className="w-full h-48 relative rounded-md overflow-hidden mb-4">
                        <img
                          src={donation.imageUrl}
                          alt={donation.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">Description</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {donation.description}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium">Organization</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {donation.organization}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Category</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {donation.category.charAt(0).toUpperCase() +
                              donation.category.slice(1)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium">
                          Contact Information
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {donation.contactInfo}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium">Status</h3>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center">
                          <Badge
                            variant={getStatusBadgeVariant(donation.status)}
                            className="mr-2"
                          >
                            {donation.status.charAt(0).toUpperCase() +
                              donation.status.slice(1)}
                          </Badge>
                          {donation.status === "urgent" &&
                            "This donation requires immediate attention"}
                          {donation.status === "active" &&
                            "This donation is currently available"}
                          {donation.status === "completed" &&
                            "This donation has been completed"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium">Source</h3>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-muted-foreground">
                            {donation.source}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between pt-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            donation.sourceUrl &&
                            window.open(donation.sourceUrl, "_blank")
                          }
                        >
                          Open Source
                        </Button>
                        <Button onClick={() => setShowPayment(true)}>
                          Donate Now
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-4">
                    <Chat
                      donationId={donation.id}
                      donorId={donation.donorId}
                      recipientId={donation.recipientId}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No donation found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DonationDetailModal;
