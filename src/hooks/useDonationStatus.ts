import { CheckCircle, Clock, Package, Truck, User } from "lucide-react";
import * as React from "react";

// Define the types for donation status
export type DonationStatusType =
  | "listed"
  | "matched"
  | "arranged"
  | "completed";
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/**
 * Custom hook for handling donation status logic
 */
export const useDonationStatus = (currentStatus: DonationStatusType) => {
  // Calculate progress percentage based on current status
  const getProgressPercentage = () => {
    const stages = ["listed", "matched", "arranged", "completed"];
    const currentIndex = stages.indexOf(currentStatus);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  // Get status icon based on status type
  const getStatusIcon = (status: DonationStatusType) => {
    switch (status) {
      case "listed":
        return React.createElement(Package, {
          className: "h-6 w-6 text-blue-500",
        });
      case "matched":
        return React.createElement(User, {
          className: "h-6 w-6 text-purple-500",
        });
      case "arranged":
        return React.createElement(Truck, {
          className: "h-6 w-6 text-orange-500",
        });
      case "completed":
        return React.createElement(CheckCircle, {
          className: "h-6 w-6 text-green-500",
        });
      default:
        return React.createElement(Clock, {
          className: "h-6 w-6 text-gray-500",
        });
    }
  };

  // Get status badge color based on status type
  const getStatusBadgeVariant = (status: DonationStatusType): BadgeVariant => {
    switch (status) {
      case "listed":
        return "default";
      case "matched":
        return "secondary";
      case "arranged":
        return "outline";
      case "completed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const progressPercentage = getProgressPercentage();

  return {
    progressPercentage,
    getStatusIcon,
    getStatusBadgeVariant,
  };
};
