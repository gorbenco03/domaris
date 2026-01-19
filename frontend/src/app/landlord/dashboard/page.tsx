"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Home, Plus, Edit, Trash2, Eye, LogOut, Calendar, Check, X, Clock, Mail, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TourCalendar from "@/components/TourCalendar";
import livingRoomImage from "@/assets/living-room.jpg";
import kitchenImage from "@/assets/kitchen.jpg";
import { normalizeImageUrl } from "@/lib/api";

type PropertyStatus = "Available" | "Rented" | "Under Maintenance";
type TourRequestStatus = "Pending" | "Accepted" | "Declined";

interface TourRequest {
    id: number;
    propertyId: number;
    propertyTitle: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    message?: string;
    status: TourRequestStatus;
}

export default function LandlordDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [properties, setProperties] = useState([
        {
            id: 1,
            image: livingRoomImage,
            title: "Modern Downtown Apartment",
            location: "123 Main St, City Center",
            price: "$2,400/mo",
            status: "Available" as PropertyStatus,
        },
        {
            id: 2,
            image: kitchenImage,
            title: "Luxury Penthouse Suite",
            location: "456 Park Ave, Downtown",
            price: "$4,800/mo",
            status: "Rented" as PropertyStatus,
        },
    ]);

    const [tourRequests, setTourRequests] = useState<TourRequest[]>([
        {
            id: 1,
            propertyId: 1,
            propertyTitle: "Modern Downtown Apartment",
            name: "John Smith",
            email: "john.smith@example.com",
            phone: "+1 (555) 123-4567",
            date: "2025-11-20",
            time: "2:00 PM",
            message: "I'm interested in viewing this property. I have a family of 3.",
            status: "Pending",
        },
        {
            id: 2,
            propertyId: 1,
            propertyTitle: "Modern Downtown Apartment",
            name: "Sarah Johnson",
            email: "sarah.j@example.com",
            phone: "+1 (555) 987-6543",
            date: "2025-11-22",
            time: "10:00 AM",
            status: "Pending",
        },
        {
            id: 3,
            propertyId: 2,
            propertyTitle: "Luxury Penthouse Suite",
            name: "Michael Brown",
            email: "m.brown@example.com",
            phone: "+1 (555) 456-7890",
            date: "2025-11-25",
            time: "4:00 PM",
            message: "Looking for a luxury apartment. Can we schedule a tour?",
            status: "Accepted",
        },
    ]);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleDelete = (propertyId: number, propertyTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${propertyTitle}"?`)) {
            setProperties(properties.filter((p) => p.id !== propertyId));
            toast({
                title: "Success",
                description: "Property deleted successfully",
            });
        }
    };

    const handleStatusChange = (propertyId: number, newStatus: PropertyStatus) => {
        setProperties(properties.map((p) =>
            p.id === propertyId ? { ...p, status: newStatus } : p
        ));
        toast({
            title: "Status Updated",
            description: `Property status changed to ${newStatus}`,
        });
    };

    const handleAcceptRequest = (requestId: number) => {
        setTourRequests(tourRequests.map(req =>
            req.id === requestId ? { ...req, status: "Accepted" } : req
        ));
        toast({
            title: "Tour Request Accepted",
            description: "The tenant will be notified of your acceptance.",
        });
    };

    const handleDeclineRequest = (requestId: number) => {
        setTourRequests(tourRequests.map(req =>
            req.id === requestId ? { ...req, status: "Declined" } : req
        ));
        toast({
            title: "Tour Request Declined",
            description: "The tenant will be notified.",
        });
    };

    const getStatusVariant = (status: PropertyStatus) => {
        switch (status) {
            case "Available":
                return "default";
            case "Rented":
                return "secondary";
            case "Under Maintenance":
                return "destructive";
            default:
                return "default";
        }
    };

    const getTourStatusVariant = (status: TourRequestStatus) => {
        switch (status) {
            case "Pending":
                return "default";
            case "Accepted":
                return "default";
            case "Declined":
                return "destructive";
            default:
                return "default";
        }
    };

    const pendingRequests = tourRequests.filter(req => req.status === "Pending");

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold text-foreground">RentFinder</span>
                    </div>

                    <div className="flex items-center gap-4">
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
                <Tabs defaultValue="overview" className="mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        <TabsTrigger value="properties">Properties</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">
                        {/* Tour Requests Section */}
                        {pendingRequests.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Calendar className="h-6 w-6 text-primary" />
                                    Pending Tour Requests ({pendingRequests.length})
                                </h2>
                                <div className="space-y-4">
                                    {pendingRequests.map((request) => (
                                        <Card key={request.id}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-foreground mb-1">
                                                            {request.propertyTitle}
                                                        </h3>
                                                        <Badge variant={getTourStatusVariant(request.status)} className="mb-3">
                                                            {request.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{request.date} at {request.time}</span>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-foreground">{request.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                                                                {request.email}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                                                                {request.phone}
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {request.message && (
                                                        <div className="bg-muted p-3 rounded-md">
                                                            <p className="text-sm text-foreground italic">"{request.message}"</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAcceptRequest(request.id)}
                                                        className="gap-2"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeclineRequest(request.id)}
                                                        className="gap-2"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Decline
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Tour Requests History */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-foreground mb-4">
                                All Tour Requests
                            </h2>
                            <div className="space-y-4">
                                {tourRequests.map((request) => (
                                    <Card key={request.id} className={request.status === "Pending" ? "" : "opacity-75"}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-foreground">{request.name}</h4>
                                                        <Badge variant={getTourStatusVariant(request.status)}>
                                                            {request.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-1">{request.propertyTitle}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {request.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {request.time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <a href={`mailto:${request.email}`} className="block hover:text-primary">
                                                        {request.email}
                                                    </a>
                                                    <a href={`tel:${request.phone}`} className="block hover:text-primary">
                                                        {request.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Properties
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {properties.length}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Available
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {properties.filter((p) => p.status === "Available").length}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Under Maintenance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {properties.filter((p) => p.status === "Under Maintenance").length}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar">
                        <TourCalendar
                            tourRequests={tourRequests}
                            onAcceptRequest={handleAcceptRequest}
                            onDeclineRequest={handleDeclineRequest}
                        />
                    </TabsContent>

                    <TabsContent value="properties">
                        {/* Properties Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground mb-2">
                                        My Properties
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Manage your rental listings
                                    </p>
                                </div>
                                <Button className="gap-2" onClick={() => router.push("/landlord/add-property")}>
                                    <Plus className="h-4 w-4" />
                                    Add New Property
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {properties.map((property) => (
                                    <Card key={property.id}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={typeof property.image === 'string' ? normalizeImageUrl(property.image) : property.image.src}
                                                    alt={property.title}
                                                    className="w-32 h-32 object-cover rounded-lg"
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
                                                            <h3 className="text-xl font-semibold text-foreground mb-1">
                                                                {property.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {property.location}
                                                            </p>
                                                        </div>
                                                        <Badge variant={getStatusVariant(property.status)}>
                                                            {property.status}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-lg font-semibold text-primary mb-4">
                                                        {property.price}
                                                    </p>

                                                    <div className="mb-4">
                                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                                            Change Status
                                                        </label>
                                                        <Select
                                                            value={property.status}
                                                            onValueChange={(value) => handleStatusChange(property.id, value as PropertyStatus)}
                                                        >
                                                            <SelectTrigger className="w-[200px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-background">
                                                                <SelectItem value="Available">Available</SelectItem>
                                                                <SelectItem value="Rented">Rented</SelectItem>
                                                                <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/property/${property.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/landlord/edit-property/${property.id}`)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(property.id, property.title)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
