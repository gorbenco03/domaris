import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import { useRouter } from "next/navigation";
import type { IUser } from "@domaris/types";

interface AuthContextType {
  user: IUser | null;
  login: (email: string, password: string) => Promise<void>;
  // loginWithPhone: (phone: string, password: string) => Promise<void>; // Add later
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  updateUser: (user: IUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user", error);
          localStorage.removeItem("accessToken");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.loginWithEmail({ email, password });
      
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        if (response.refreshToken) {
            localStorage.setItem("refreshToken", response.refreshToken);
        }
        // Fetch full user profile
        const userProfile = await authApi.getCurrentUser();
        setUser(userProfile);
      }
    } catch (error) {
       console.error("Login failed", error);
       throw error;
    }
  };

  const register = async (data: any) => {
       // Implement register logic
       await authApi.registerWithEmail(data);
       // Handle OTP flow etc. For now basic.
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/auth/login");
  };

  const updateUser = (userData: IUser) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
        accessToken: typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
