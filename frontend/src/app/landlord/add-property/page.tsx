"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { listingsService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddPropertyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        location: "",
        bedrooms: "",
        bathrooms: "",
    });
    const [imagePreview, setImagePreview] = useState<string>("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title || !formData.price || !formData.location) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            await listingsService.create({
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                addressText: formData.location,
                formattedAddress: formData.location, // Assuming frontend field
                city: "Unknown", // Default or extract from location
                rooms: Number(formData.bedrooms) || 0,
                surface: 0, // Default
                isFurnished: false, // Default
                currency: "EUR",
                isAgency: false,
                photos: [], // TODO: Implement image upload
            } as any); // Casting to any to avoid strict partial checks if types mismatch slightly

            toast({
                title: "Success",
                description: "Property listing created successfully",
            });

            router.push("/landlord/dashboard");
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to create listing. Please try again.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        if (user?.role !== "landlord") {
            router.push("/");
        }
    }, [user, router]);

    if (user?.role !== "landlord") {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold text-foreground">RentFinder</span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => router.push("/landlord/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <div className="container max-w-2xl py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Add New Property</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Property Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Modern Downtown Apartment"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe your property..."
                                    rows={4}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Monthly Rent *</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="2400"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 123 Main St, City"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Bedrooms</Label>
                                    <Input
                                        id="bedrooms"
                                        name="bedrooms"
                                        type="number"
                                        value={formData.bedrooms}
                                        onChange={handleInputChange}
                                        placeholder="2"
                                        min="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bathrooms">Bathrooms</Label>
                                    <Input
                                        id="bathrooms"
                                        name="bathrooms"
                                        type="number"
                                        value={formData.bathrooms}
                                        onChange={handleInputChange}
                                        placeholder="1"
                                        min="0"
                                        step="0.5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Property Image</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="cursor-pointer"
                                    />
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                </div>
                                {imagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex-1">
                                    Create Listing
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/landlord/dashboard")}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
