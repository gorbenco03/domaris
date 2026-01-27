"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, Menu, User } from "lucide-react";

export const Header = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Home className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground hidden md:block">RentFinder</span>
        </button>

        {/* Search Pill */}


        <nav className="flex items-center gap-6">

          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="rounded-full text-sm font-medium">
              Airbnb your home
            </Button>
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border hover:shadow-md"
                onClick={() => router.push("/account/properties")}
              >
                  <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-semibold">
                      U
                  </div>
              </Button>
            ) : (
                <div className="flex items-center gap-1 border rounded-full p-1 pl-3 hover:shadow-md cursor-pointer transition-shadow" onClick={() => router.push("/auth")}>
                    <Menu className="h-4 w-4" />
                    <div className="h-7 w-7 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
