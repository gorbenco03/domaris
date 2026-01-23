"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Upload, X, Home, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { propertiesApi } from "@/features/properties/api";
import type { ICreatePropertyDto, IUpdatePropertyDto } from "@domaris/types";

// Types for form state matching shared DTO structure roughly, adjusted for wizard state
export interface WizardData {
  transactionType: 'SALE' | 'RENT';
  propertyType: string;
  location: {
    city: string;
    neighborhood: string;
    street: string;
    number: string;
  };
  characteristics: {
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    totalArea: number;
    floor: number;
    totalFloors: number;
    yearBuilt: number;
    amenities: string[];
  };
  pricing: {
    price: number;
    currency: 'EUR' | 'RON';
    negotiable: boolean;
  };
  details: {
    title: string;
    description: string;
  };
  photos: File[]; // For new uploads
  existingPhotos?: string[]; // For editing
}

const INITIAL_DATA: WizardData = {
  transactionType: 'SALE',
  propertyType: 'APARTMENT',
  location: { city: '', neighborhood: '', street: '', number: '' },
  characteristics: { rooms: 1, bedrooms: 1, bathrooms: 1, totalArea: 0, floor: 0, totalFloors: 0, yearBuilt: 2000, amenities: [] },
  pricing: { price: 0, currency: 'EUR', negotiable: false },
  details: { title: '', description: '' },
  photos: [],
};

const STEPS = ['Type', 'Location', 'Features', 'Photos', 'Details'];

interface PropertyWizardProps {
  initialData?: Partial<WizardData>;
  isEditing?: boolean;
  propertyId?: string;
}

export function PropertyWizard({ initialData, isEditing = false, propertyId }: PropertyWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...INITIAL_DATA, ...initialData });
  const [isLoading, setIsLoading] = useState(false);

  const updateData = (section: keyof WizardData, updates: any) => {
    setData(prev => ({ ...prev, [section]: { ...(prev[section] as any), ...updates } }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
        // Construct DTO
        const dto: ICreatePropertyDto = {
            title: data.details.title,
            description: data.details.description,
            transactionType: data.transactionType as any,
            propertyType: data.propertyType as any,
            location: {
                country: 'Romania', // Default
                city: data.location.city,
                neighborhood: data.location.neighborhood,
                street: data.location.street,
                streetNumber: data.location.number,
                lat: 0, lng: 0, // Should be geocoded or selected on map
            },
            characteristics: {
                totalArea: Number(data.characteristics.totalArea),
                rooms: Number(data.characteristics.rooms),
                bedrooms: Number(data.characteristics.bedrooms),
                bathrooms: Number(data.characteristics.bathrooms),
                floor: Number(data.characteristics.floor),
                totalFloors: Number(data.characteristics.totalFloors),
                yearBuilt: Number(data.characteristics.yearBuilt),
                isFurnished: false, // Add field to wizard
                amenities: data.characteristics.amenities
            },
            pricing: {
                price: Number(data.pricing.price),
                currency: data.pricing.currency as any,
                utilitiesIncluded: false,
                isNegotiable: data.pricing.negotiable
            }
        };

        let resultId = propertyId;

        if (isEditing && propertyId) {
            await propertiesApi.update(propertyId, dto as unknown as IUpdatePropertyDto);
            toast.success("Property updated successfully");
        } else {
            const newProp = await propertiesApi.create(dto);
            resultId = newProp.id;
            toast.success("Property created successfully");
        }

        // Handle Photo Uploads separately if backend requires
        if (data.photos.length > 0 && resultId) {
             const formData = new FormData();
             data.photos.forEach(file => formData.append('photos', file));
             await propertiesApi.uploadPhotos(resultId, formData);
        }

        router.push('/account/properties');
    } catch (err) {
        console.error(err);
        toast.error("Failed to save property. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  // Step Components
  const renderStep = () => {
    switch(currentStep) {
        case 0: // Type
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant={data.transactionType === 'SALE' ? 'default' : 'outline'} 
                            className="h-24 text-lg"
                            onClick={() => setData(prev => ({ ...prev, transactionType: 'SALE' }))}
                        >
                            <Banknote className="mr-2 h-6 w-6" /> For Sale
                        </Button>
                        <Button 
                            variant={data.transactionType === 'RENT' ? 'default' : 'outline'}
                            className="h-24 text-lg"
                            onClick={() => setData(prev => ({ ...prev, transactionType: 'RENT' }))}
                        >
                             <Home className="mr-2 h-6 w-6" /> For Rent
                        </Button>
                    </div>
                    <div>
                        <Label>Property Type</Label>
                        <Select 
                            value={data.propertyType} 
                            onValueChange={(val) => setData(prev => ({ ...prev, propertyType: val }))}
                        >
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="APARTMENT">Apartment</SelectItem>
                                <SelectItem value="HOUSE">House</SelectItem>
                                <SelectItem value="LAND">Land</SelectItem>
                                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            );
        case 1: // Location
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>City</Label>
                             <Input 
                                placeholder="e.g. Bucharest" 
                                value={data.location.city}
                                onChange={(e) => updateData('location', { city: e.target.value })}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label>Neighborhood</Label>
                             <Input 
                                placeholder="e.g. Pipera" 
                                value={data.location.neighborhood}
                                onChange={(e) => updateData('location', { neighborhood: e.target.value })}
                             />
                        </div>
                    </div>
                     <div className="space-y-2">
                             <Label>Street Address</Label>
                             <Input 
                                placeholder="Street name" 
                                value={data.location.street}
                                onChange={(e) => updateData('location', { street: e.target.value })}
                             />
                        </div>
                </div>
            );
        case 2: // Features
            return (
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Rooms</Label>
                            <Input type="number" value={data.characteristics.rooms} onChange={(e) => updateData('characteristics', { rooms: e.target.value })} />
                        </div>
                         <div className="space-y-2">
                            <Label>Bedrooms</Label>
                            <Input type="number" value={data.characteristics.bedrooms} onChange={(e) => updateData('characteristics', { bedrooms: e.target.value })} />
                        </div>
                         <div className="space-y-2">
                            <Label>Bathrooms</Label>
                            <Input type="number" value={data.characteristics.bathrooms} onChange={(e) => updateData('characteristics', { bathrooms: e.target.value })} />
                        </div>
                         <div className="space-y-2">
                            <Label>Area (m²)</Label>
                            <Input type="number" value={data.characteristics.totalArea} onChange={(e) => updateData('characteristics', { totalArea: e.target.value })} />
                        </div>
                    </div>
                 </div>
            );
        case 3: // Photos
            return (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const newFiles = Array.from(e.target.files);
                                    setData(prev => ({ ...prev, photos: [...prev.photos, ...newFiles] }));
                                }
                            }}
                        />
                        <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                    </div>

                    {data.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {data.photos.map((file, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }))}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        case 4: // Details
            return (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Title</Label>
                         <Input 
                            placeholder="e.g. Modern Apartment in City Center" 
                            value={data.details.title}
                            onChange={(e) => updateData('details', { title: e.target.value })}
                         />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                            className="min-h-[150px]"
                            placeholder="Describe your property..."
                            value={data.details.description}
                            onChange={(e) => updateData('details', { description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input 
                                type="number" 
                                value={data.pricing.price}
                                onChange={(e) => updateData('pricing', { price: e.target.value })}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select 
                                value={data.pricing.currency} 
                                onValueChange={(val) => updateData('pricing', { currency: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="RON">RON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            );
        default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
        {/* Progress */}
        <div className="mb-8">
            <div className="flex justify-between mb-2">
                {STEPS.map((step, idx) => (
                    <div key={step} className={`text-sm font-medium ${idx <= currentStep ? 'text-primary' : 'text-slate-300'}`}>
                        {step}
                    </div>
                ))}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} 
                />
            </div>
        </div>

        <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>{STEPS[currentStep]}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                {renderStep()}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                
                {currentStep === STEPS.length - 1 ? (
                     <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Property' : 'Publish Property')}
                    </Button>
                ) : (
                    <Button onClick={handleNext}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
