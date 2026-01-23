"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit2, Trash2, Eye, Home } from "lucide-react";
import { propertiesApi } from "@/features/properties/api"; // Ensure this matches export
import { toast } from "sonner";
import Link from "next/link";
import type { IPropertyListItem } from "@domaris/types";

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<IPropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchProperties = async () => {
    try {
        const data = await propertiesApi.getMyProperties();
        setProperties(data);
    } catch (error) {
        console.error("Failed to fetch properties:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to delete this property?")) return;
      
      try {
          await propertiesApi.delete(id);
          setProperties(prev => prev.filter(p => p.id !== id));
          toast.success("Property deleted");
      } catch {
          toast.error("Failed to delete property");
      }
  };

  const filteredProperties = properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || 
                            (filter === 'active' && p.status === 'ACTIVE') ||
                            (filter === 'draft' && p.status === 'DRAFT');
      return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold mb-2">My Properties</h1>
                <p className="text-muted-foreground">Manage your listings and view performance</p>
            </div>
            <Link href="/account/properties/create">
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Add Property
                </Button>
            </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search properties..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        {/* List */}
        {loading ? (
            <div className="text-center py-20">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No properties found</h3>
                <p className="text-muted-foreground mb-4">Get started by creating your first listing</p>
                <Link href="/account/properties/create">
                    <Button variant="outline">Create Listing</Button>
                </Link>
            </div>
        ) : (
            <div className="space-y-4">
                {filteredProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden flex flex-col md:flex-row gap-4 p-4 hover:border-primary/50 transition-colors">
                        {/* Image */}
                        <div className="w-full md:w-48 h-32 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                            {property.mainImage ? (
                                <img src={property.mainImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Home className="h-8 w-8" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={property.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {property.status}
                                            </Badge>
                                            <span className="text-sm text-slate-500">{new Date(property.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-lg truncate pr-4">{property.title}</h3>
                                        <p className="text-slate-600 text-sm">{property.city} {property.neighborhood && `, ${property.neighborhood}`}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">{property.displayPrice}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <div className="flex gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> 0 views</span>
                                    {/* Add more stats if available */}
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/account/properties/${property.id}/edit`}>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Edit2 className="h-4 w-4" /> Edit
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(property.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}
