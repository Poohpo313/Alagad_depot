import { Check, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DonationStatusType } from "@/hooks/useDonationStatus";

interface Status {
  id: string;
  status: DonationStatusType;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface StatusItemProps {
  status: Status;
  index: number;
  isLast: boolean;
}

const StatusItem = ({ status, index, isLast }: StatusItemProps) => {
  const getStatusIcon = (status: DonationStatusType) => {
    switch (status) {
      case "listed":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "matched":
        return <Clock className="h-5 w-5 text-purple-500" />;
      case "arranged":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "completed":
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: DonationStatusType) => {
    switch (status) {
      case "listed":
        return "bg-blue-500";
      case "matched":
        return "bg-purple-500";
      case "arranged":
        return "bg-amber-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getBadgeVariant = (status: DonationStatusType) => {
    switch (status) {
      case "listed":
        return "default";
      case "matched":
        return "secondary";
      case "arranged":
        return "outline";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex">
      <div className="flex flex-col items-center mr-4">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(
            status.status,
          )} text-white`}
        >
          {getStatusIcon(status.status)}
        </div>
        {!isLast && (
          <div className="w-px h-full bg-border mt-2 mb-2 flex-grow" />
        )}
      </div>
      <div className="pb-6">
        <div className="flex items-center">
          <h3 className="text-base font-semibold">{status.title}</h3>
          <Badge
            variant={getBadgeVariant(status.status) as any}
            className="ml-2"
          >
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {status.description}
        </p>
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <span>{status.timestamp}</span>
          {status.user && (
            <>
              <span className="mx-1">•</span>
              <span>{status.user}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusItem;
