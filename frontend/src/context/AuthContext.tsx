"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearUserQueries = useCallback(async () => {
    await queryClient.cancelQueries();

    queryClient.removeQueries({
      predicate: (query) =>
        ["wishlist", "cart"].includes(String(query.queryKey[0])),
    });
  }, [queryClient]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");

      if (response.data?.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
        await clearUserQueries();
      }
    } catch {
      setUser(null);
      await clearUserQueries();
    } finally {
      setIsLoading(false);
    }
  }, [clearUserQueries]);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      await clearUserQueries();
    }
  };

  const refetchUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
