"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Heart, Calendar, MessageSquare, LogOut, Search, X } from "lucide-react";
import { toast } from "sonner";
import TenantTourCalendar from "@/components/TenantTourCalendar";
import MessagesInbox from "@/components/MessagesInbox";
import WishlistManager from "@/components/WishlistManager";
import { normalizeImageUrl } from "@/lib/api";

export default function TenantDashboard() {
    const { user, logout } = useAuth();
    const {
        favorites,
        wishlists,
        removeFavorite,
        createWishlist,
        deleteWishlist,
        addToWishlist,
        removeFromWishlist,
        shareWishlist,
    } = useFavorites();
    const router = useRouter();

    // Mock data for tours
    const [tours, setTours] = useState<Array<{
        id: number;
        propertyId: number;
        propertyTitle: string;
        propertyAddress: string;
        date: string;
        time: string;
        landlordName: string;
        status: "Scheduled" | "Cancelled";
    }>>([
        {
            id: 1,
            propertyId: 1,
            propertyTitle: "Apartament modern 2 camere",
            propertyAddress: "Str. Principală nr. 123, București",
            date: "2025-11-15",
            time: "14:00",
            landlordName: "Ion Popescu",
            status: "Scheduled",
        },
        {
            id: 2,
            propertyId: 2,
            propertyTitle: "Garsonieră centrală",
            propertyAddress: "Bd. Unirii nr. 45, București",
            date: "2025-11-18",
            time: "10:00",
            landlordName: "Maria Ionescu",
            status: "Scheduled",
        },
    ]);

    // Mock data for messages
    const [conversations, setConversations] = useState([
        {
            id: 1,
            propertyId: 1,
            propertyTitle: "Apartament modern 2 camere",
            landlordId: 1,
            landlordName: "Ion Popescu",
            lastMessage: "Putem programa o vizionare pentru săptămâna viitoare?",
            lastMessageTime: "2025-11-12T10:30:00",
            unreadCount: 2,
            messages: [
                {
                    id: 1,
                    senderId: 1,
                    senderName: "Ion Popescu",
                    senderType: "landlord" as const,
                    content: "Bună ziua! Cu plăcere vă arăt apartamentul.",
                    timestamp: "2025-11-12T09:00:00",
                    read: true,
                },
                {
                    id: 2,
                    senderId: 2,
                    senderName: user?.name || "Tu",
                    senderType: "tenant" as const,
                    content: "Mulțumesc! Când ar fi disponibil pentru o vizionare?",
                    timestamp: "2025-11-12T09:15:00",
                    read: true,
                },
                {
                    id: 3,
                    senderId: 1,
                    senderName: "Ion Popescu",
                    senderType: "landlord" as const,
                    content: "Putem programa o vizionare pentru săptămâna viitoare?",
                    timestamp: "2025-11-12T10:30:00",
                    read: false,
                },
            ],
        },
    ]);

    const handleRemoveFavorite = (id: number) => {
        removeFavorite(id);
        toast.success("Eliminat din favorite");
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleRescheduleTour = (tourId: number, newDate: string, newTime: string) => {
        setTours((prev) =>
            prev.map((tour) =>
                tour.id === tourId ? { ...tour, date: newDate, time: newTime } : tour
            )
        );
    };

    const handleCancelTour = (tourId: number) => {
        setTours((prev) =>
            prev.map((tour) =>
                tour.id === tourId ? { ...tour, status: "Cancelled" } : tour
            )
        );
    };

    const handleSendMessage = (conversationId: number, message: string) => {
        const newMessage = {
            id: Date.now(),
            senderId: 2,
            senderName: user?.name || "Tu",
            senderType: "tenant" as const,
            content: message,
            timestamp: new Date().toISOString(),
            read: true,
        };

        setConversations((prev) =>
            prev.map((conv) => {
                if (conv.id === conversationId) {
                    return {
                        ...conv,
                        messages: [...conv.messages, newMessage],
                        lastMessage: message,
                        lastMessageTime: newMessage.timestamp,
                    };
                }
                return conv;
            })
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold text-foreground">RentFinder</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/")}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Browse Properties
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Welcome, {user?.name}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container py-8">
                <div className="mb-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Panoul meu
                        </h1>
                        <p className="text-muted-foreground">
                            Gestionează favoritele, tururile și mesajele tale
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Proprietăți favorite
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {favorites.length}
                                    </div>
                                    <Heart className="h-5 w-5 text-primary" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Tururi programate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {tours.filter((t) => t.status === "Scheduled").length}
                                    </div>
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Mesaje
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-bold text-foreground">
                                        {conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)}
                                    </div>
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="favorites" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="favorites">Favorite</TabsTrigger>
                            <TabsTrigger value="wishlists">Liste de dorințe</TabsTrigger>
                            <TabsTrigger value="calendar">Calendar</TabsTrigger>
                            <TabsTrigger value="messages">Mesaje</TabsTrigger>
                        </TabsList>

                        <TabsContent value="favorites" className="mt-6">
                            <div className="space-y-4">
                                {favorites.length === 0 ? (
                                    <Card>
                                        <CardContent className="p-12 text-center">
                                            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground mb-4">
                                                Nu ai proprietăți favorite încă
                                            </p>
                                            <Button onClick={() => router.push("/")}>
                                                <Search className="h-4 w-4 mr-2" />
                                                Caută proprietăți
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    favorites.map((property) => (
                                        <Card key={property.id}>
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={normalizeImageUrl(property.image)}
                                                        alt={property.title}
                                                        className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => router.push(`/property/${property.id}`)}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            if (target.src !== '/placeholder.svg') {
                                                                target.src = '/placeholder.svg';
                                                            }
                                                        }}
                                                    />

                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <h3
                                                                    className="text-xl font-semibold text-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
                                                                    onClick={() => router.push(`/property/${property.id}`)}
                                                                >
                                                                    {property.title}
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {property.location}
                                                                </p>
                                                            </div>
                                                            <Badge variant="secondary">
                                                                {property.type}
                                                            </Badge>
                                                        </div>

                                                        <p className="text-lg font-semibold text-primary mb-4">
                                                            {property.price}
                                                        </p>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => router.push(`/property/${property.id}`)}
                                                            >
                                                                Vezi detalii
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleRemoveFavorite(property.id)}
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                Elimină
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="wishlists" className="mt-6">
                            <WishlistManager
                                wishlists={wishlists}
                                allFavorites={favorites}
                                onCreateWishlist={createWishlist}
                                onDeleteWishlist={deleteWishlist}
                                onAddToWishlist={addToWishlist}
                                onRemoveFromWishlist={removeFromWishlist}
                                onShareWishlist={shareWishlist}
                                onRemoveFromFavorites={removeFavorite}
                            />
                        </TabsContent>

                        <TabsContent value="calendar" className="mt-6">
                            <TenantTourCalendar
                                tours={tours}
                                onReschedule={handleRescheduleTour}
                                onCancel={handleCancelTour}
                            />
                        </TabsContent>

                        <TabsContent value="messages" className="mt-6">
                            <MessagesInbox
                                conversations={conversations}
                                onSendMessage={handleSendMessage}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
