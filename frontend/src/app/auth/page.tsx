"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home } from "lucide-react";

export default function AuthPage() {
    const [role, setRole] = useState<"landlord" | "tenant">("tenant");
    const { login } = useAuth();
    const router = useRouter();

    const handleEnter = async () => {
        await login("", "", role);
        router.push(role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Home className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold text-foreground">RentFinder</span>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Enter Dashboard</CardTitle>
                        <CardDescription>
                            Select your role to access your personal cabinet
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={role} onValueChange={(v) => setRole(v as "landlord" | "tenant")} className="mb-6">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="tenant">I'm a Tenant</TabsTrigger>
                                <TabsTrigger value="landlord">I'm a Landlord</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Button onClick={handleEnter} className="w-full">
                            Enter Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
