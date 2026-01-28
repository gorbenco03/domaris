"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src="/logotype.png" alt="Riva" className="h-8 w-auto" />
          <span className="text-xl font-bold text-foreground hidden md:block">Riva</span>
        </button>

        {/* Search Pill */}


        <nav className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="rounded-full text-sm font-medium">
              Airbnb your home
            </Button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border hover:shadow-md h-10 w-10 p-0"
                  >
                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-semibold overflow-hidden">
                          {user?.avatar ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <span>{user?.firstName?.[0] || 'U'}</span>
                          )}
                      </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/messages")}>
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/properties")}>
                    My Properties
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/account/viewings")}>
                    Viewings
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push("/account/verification")}>
                    Verification
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={logout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
