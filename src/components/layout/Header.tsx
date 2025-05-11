import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Bell, Menu, X, LogIn, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthContext";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check localStorage for unread notifications count
  useEffect(() => {
    // Initial check
    const storedCount = localStorage.getItem("unreadNotifications");
    if (storedCount) {
      setNotificationCount(parseInt(storedCount));
    }

    // Set up event listener for storage changes
    const handleStorageChange = () => {
      const updatedCount = localStorage.getItem("unreadNotifications");
      if (updatedCount) {
        setNotificationCount(parseInt(updatedCount));
      }
    };

    // Check for updates every 5 seconds
    const interval = setInterval(handleStorageChange, 5000);

    // Clean up
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Donate", path: "/donate" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Notifications", path: "/notifications" },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Package className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">Alagad Depot</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium hover:text-primary"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/notifications" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  {localStorage.getItem("unreadNotifications") &&
                    parseInt(
                      localStorage.getItem("unreadNotifications") || "0",
                    ) > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                      >
                        {localStorage.getItem("unreadNotifications") || "0"}
                      </Badge>
                    )}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/profile?tab=donations")}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      My Donations
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/notifications")}
                      className="relative"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                      {notificationCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                        >
                          {notificationCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild>
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 space-y-4"
            >
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block py-2 text-sm font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {user ? (
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate("/profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start mt-2"
                    onClick={() => {
                      navigate("/profile?tab=donations");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    My Donations
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start mt-2 relative"
                    onClick={() => {
                      navigate("/notifications");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {notificationCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Link>
                </Button>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
