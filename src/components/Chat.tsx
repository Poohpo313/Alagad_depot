import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "./auth/AuthContext";
import { fetchDonationById } from "@/lib/api";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
}

interface ChatProps {
  donationId: string;
  recipientId?: string;
  donorId?: string;
}

const Chat = ({ donationId, recipientId, donorId: donorIdProp }: ChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [donation, setDonation] = useState<any>(null);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch donation object on mount
  useEffect(() => {
    const loadDonation = async () => {
      try {
        const fetched = await fetchDonationById(donationId);
        setDonation(fetched);
        if (fetched && fetched.status === "pending" && fetched.matchedUserId) {
          setMatchedUserId(fetched.matchedUserId);
        } else {
          setMatchedUserId(null);
        }
      } catch (error) {
        setDonation(null);
      }
    };
    if (donationId) loadDonation();
  }, [donationId]);

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoading(true);
      try {
        const chatKey = `chat_${donationId}`;
        const storedMessages = localStorage.getItem(chatKey);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(messagesWithDates);
        } else {
          const initialMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: "system",
            senderName: "System",
            content:
              "Start chatting about this donation. Be respectful and clear about your intentions.",
            timestamp: new Date(),
          };
          setMessages([initialMessage]);
          localStorage.setItem(chatKey, JSON.stringify([initialMessage]));
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (donationId) {
      loadChatHistory();
    }
  }, [donationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: newMessage.trim(),
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage("");
    const chatKey = `chat_${donationId}`;
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get donorId from donation object or prop
  const donorId = donation?.donorId || donorIdProp;

  // Unique users who have messaged (excluding system and donor)
  const uniqueUsers = Array.from(
    new Set(
      messages
        .filter((m) => m.senderId !== "system" && m.senderId !== donorId)
        .map((m) => m.senderId)
    )
  )
    .map((uid) => {
      const msg = messages.find((m) => m.senderId === uid);
      return msg ? { id: uid, name: msg.senderName, avatar: msg.senderAvatar } : null;
    })
    .filter(Boolean);

  // Match handler
  const handleMatch = async (matchedUser: { id: string; name: string }) => {
    try {
      const userDonations = JSON.parse(localStorage.getItem("userDonations") || "[]");
      const donationIndex = userDonations.findIndex((d: any) => d.id === donationId);
      if (donationIndex !== -1) {
        userDonations[donationIndex].status = "pending";
        userDonations[donationIndex].matchedUserId = matchedUser.id;
        localStorage.setItem("userDonations", JSON.stringify(userDonations));
        setMatchedUserId(matchedUser.id);
        // Notify matched user
        const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
        notifications.unshift({
          id: `notification-match-${Date.now()}`,
          type: "match",
          title: "You have been matched!",
          message: `You have been matched for donation ${userDonations[donationIndex].title}. Please coordinate with the donor.`,
          timestamp: new Date().toLocaleString(),
          read: false,
          donationId: donationId,
        });
        localStorage.setItem("notifications", JSON.stringify(notifications));
        localStorage.setItem(
          "unreadNotifications",
          (parseInt(localStorage.getItem("unreadNotifications") || "0") + 1).toString()
        );
        window.dispatchEvent(new CustomEvent("donation-update"));
      }
    } catch (error) {
      console.error("Error matching user:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Show matchable users if current user is donor and not already matched */}
      {user && donorId && user.id === donorId && !matchedUserId && uniqueUsers.length > 0 && (
        <div className="mb-2 p-2 bg-muted rounded">
          <div className="font-bold text-sm mb-1">Interested Users:</div>
          {uniqueUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-2 mb-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={u.avatar} />
                <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{u.name}</span>
              <Button size="xs" className="ml-2" onClick={() => handleMatch(u)}>
                Match
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden" ref={scrollAreaRef}>
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              No messages yet
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isCurrentUser = user && message.senderId === user.id;
                const isSystem = message.senderId === "system";
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : ""}`}
                    >
                      {!isSystem && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        {!isCurrentUser && !isSystem && (
                          <p className="text-xs text-muted-foreground mb-1">{message.senderName}</p>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 text-sm ${
                            isSystem
                              ? "bg-muted text-muted-foreground text-center w-full"
                              : isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          {message.content}
                          <span className="text-xs opacity-70 ml-2">{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="mt-4">
        {donation && donation.status === "completed" ? (
          <div className="text-center text-muted-foreground text-sm mb-2">Chat is closed for completed donations.</div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={!user || (donation && donation.status === "completed")}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || !user || (donation && donation.status === "completed")}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
