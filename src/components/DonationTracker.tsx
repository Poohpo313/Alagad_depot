import React from "react";
import { CheckCircle, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StatusItem from "@/components/StatusItem";
import {
  DonationStatusType,
  useDonationStatus,
} from "@/hooks/useDonationStatus";

interface DonationStatus {
  id: string;
  status: DonationStatusType;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface DonationTrackerProps {
  donationId?: string;
  donationTitle?: string;
  currentStatus?: DonationStatusType;
  statusHistory?: DonationStatus[];
}

const DonationTracker = ({
  donationId = "DON-12345",
  donationTitle = "Winter Clothing Bundle",
  currentStatus = "matched",
  statusHistory = [
    {
      id: "1",
      status: "listed",
      title: "Donation Listed",
      description:
        "Your donation has been successfully listed on the platform.",
      timestamp: "2023-11-15 09:30 AM",
    },
    {
      id: "2",
      status: "matched",
      title: "Matched with Recipient",
      description: "Your donation has been matched with Hope Community Center.",
      timestamp: "2023-11-16 02:45 PM",
      user: "Hope Community Center",
    },
  ],
}: DonationTrackerProps) => {
  const { progressPercentage } = useDonationStatus(currentStatus);

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Donation Tracker</CardTitle>
          <Badge variant="outline" className="text-xs">
            {donationId}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{donationTitle}</p>
        <div className="mt-4">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Listed</span>
            <span>Matched</span>
            <span>Arranged</span>
            <span>Completed</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6 mt-4">
          {statusHistory.map((status, index) => (
            <StatusItem
              key={status.id}
              status={status}
              index={index}
              isLast={index === statusHistory.length - 1}
            />
          ))}

          {/* Upcoming stages */}
          {currentStatus !== "completed" && (
            <div className="mt-8">
              <Separator className="my-4" />
              <h3 className="text-sm font-medium mb-4">Upcoming Stages</h3>

              {currentStatus !== "arranged" &&
                currentStatus !== "completed" && (
                  <div className="flex items-start gap-4 opacity-50">
                    <div className="flex-shrink-0 mt-1">
                      <Truck className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        Pickup/Delivery Arrangement
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Logistics will be arranged for your donation.
                      </p>
                    </div>
                  </div>
                )}

              {currentStatus !== "completed" && (
                <div className="flex items-start gap-4 opacity-50 mt-6">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Donation Completed</h3>
                    <p className="text-sm text-muted-foreground">
                      Your donation will be marked as successfully delivered.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationTracker;
