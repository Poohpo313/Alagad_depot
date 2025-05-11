import React, { createContext, useContext, useState, useEffect } from "react";

type UserRole = "donor" | "charity" | "recipient" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setError("Failed to authenticate. Please log in again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Check demo users
      const mockUsers: Record<string, User & { password?: string }> = {
        "donor@example.com": {
          id: "user-1",
          name: "John Donor",
          email: "donor@example.com",
          role: "donor",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
          password: "password123",
        },
        "charity@example.com": {
          id: "user-2",
          name: "Hope Community Center",
          email: "charity@example.com",
          role: "charity",
          organization: "Hope Community Center",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hope",
          password: "password123",
        },
        "recipient@example.com": {
          id: "user-3",
          name: "Sam Recipient",
          email: "recipient@example.com",
          role: "recipient",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
          password: "password123",
        },
      };
      let user = mockUsers[email];
      // If not a demo user, check registered users in localStorage
      if (!user) {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        user = users.find((u: User & { password?: string }) => u.email === email && u.password === password);
      }
      if (!user) {
        throw new Error("Invalid email or password");
      }
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userEmail", user.email);
      if (!localStorage.getItem("memberSince")) {
        localStorage.setItem("memberSince", new Date().toISOString());
      }
      setUser(user);
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User>, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      // Prevent duplicate registration for the same email
      if (users.some((u: User & { password?: string }) => u.email === userData.email)) {
        throw new Error("An account with this email already exists.");
      }
      const newUser: User & { password?: string } = {
        id: `user-${Date.now()}`,
        name: userData.name || "New User",
        email: userData.email || "",
        role: userData.role || "donor",
        organization: userData.organization,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
        password,
      };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("userId", newUser.id);
      localStorage.setItem("userName", newUser.name);
      localStorage.setItem("userEmail", newUser.email);
      localStorage.setItem("memberSince", new Date().toISOString());
      setUser(newUser);
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
