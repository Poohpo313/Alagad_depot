import { useState, useEffect } from "react";
import { Bell, Check, Clock, Package, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/AuthContext";

type NotificationType = "match" | "logistics" | "completion" | "message";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  donationId?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
}

const NotificationCenter = ({
  notifications = [],
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onDismiss = () => {},
}: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { user } = useAuth();

  // Helper to check if a donation is new today
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper to load and save notifications from/to localStorage
  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem("notifications");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };
  const saveNotifications = (notifications: Notification[]) => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  };

  // Initialize notifications with real data and set up real-time updates
  useEffect(() => {
    // Load notifications from localStorage and merge with incoming notifications
    const stored = loadNotifications();
    const merged = [...notifications, ...stored.filter(n => !notifications.some(m => m.id === n.id))];
    setLocalNotifications(merged);
    saveNotifications(merged);
    let cleanupFunction: (() => void) | undefined;
    try {
      import("@/lib/api").then(({ setupDonationUpdates, setupDailyRefresh, fetchDonations }) => {
        setupDailyRefresh();
        cleanupFunction = setupDonationUpdates(async (donation) => {
          if (!user || donation.userId !== user.id) {
            const newNotification: Notification = {
              id: `notification-${Date.now()}`,
              type: donation?.status === "completed" ? "completion" : donation?.status === "urgent" ? "logistics" : "match",
              title: donation?.status === "completed" ? "Donation Completed" : donation?.status === "urgent" ? "Urgent Donation Need" : "New Donation Available",
              message: donation?.status === "completed"
                ? `The donation to ${donation?.organization || "Unknown"} has been completed.`
                : donation?.status === "urgent"
                ? `Urgent need: ${donation?.title || "Unknown"} requires immediate attention.`
                : `A new donation opportunity is available: ${donation?.title || "Unknown"}`,
              timestamp: donation.date || "Just now",
              read: false,
              donationId: donation?.id,
            };
            setLocalNotifications((prev) => {
              const updated = [newNotification, ...prev];
              saveNotifications(updated);
              return updated;
            });
          }
        });
        fetchDonations().then((donations) => {
          const todayDonations = donations.filter(d => isToday(d.date) && (!user || d.userId !== user.id));
          todayDonations.forEach((donation) => {
            const todayNotification: Notification = {
              id: `notification-today-${donation.id}`,
              type: "match",
              title: "New Donation Today",
              message: `A new donation was created today: ${donation.title}`,
              timestamp: donation.date,
              read: false,
              donationId: donation.id,
            };
            setLocalNotifications((prev) => {
              const updated = [todayNotification, ...prev];
              saveNotifications(updated);
              return updated;
            });
          });
        });
      });
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
    return () => {
      if (typeof cleanupFunction === "function") {
        cleanupFunction();
      }
    };
  }, [notifications, user]);

  // Update unread count whenever notifications change and store in localStorage
  useEffect(() => {
    const count = localNotifications.filter((n) => !n.read).length;
    setUnreadCount(count);

    // Store unread count in localStorage for the Header component to access
    localStorage.setItem("unreadNotifications", count.toString());
  }, [localNotifications]);

  // Initialize with empty notifications
  useEffect(() => {
    if (notifications.length === 0) {
      setUnreadCount(0);
      localStorage.setItem("unreadNotifications", "0");
    }
  }, [notifications]);

  // Clean up localStorage when component unmounts
  useEffect(() => {
    return () => {
      // Don't remove from localStorage on unmount as Header might still need it
      // Just update it if there are no unread notifications
      if (unreadCount === 0) {
        localStorage.setItem("unreadNotifications", "0");
      }
    };
  }, [unreadCount]);

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
    onMarkAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
    onMarkAllAsRead();
  };

  const handleDismiss = (id: string) => {
    setLocalNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
    onDismiss(id);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "match":
        return <User className="h-5 w-5 text-purple-500" />;
      case "logistics":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "completion":
        return <Check className="h-5 w-5 text-green-500" />;
      case "message":
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </div>
        <CardDescription>Stay updated on your donations</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-4">
          {localNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When you receive notifications, they will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence initial={false}>
                {localNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`py-3 ${notification.read ? "" : "bg-muted/30"}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDismiss(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        {notification.donationId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Donation ID: {notification.donationId}
                          </p>
                        )}
                        {!notification.read && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-6 p-0 mt-1"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-between py-3">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Hide" : "Show"} Notifications
        </Button>
        <Button variant="ghost" size="sm">
          Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationCenter;
