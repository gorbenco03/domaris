import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FolderHeart, Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { normalizeImageUrl } from "@/lib/api";

interface Property {
  id: number;
  image: string;
  title: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
}

interface Wishlist {
  id: number;
  name: string;
  description: string;
  properties: Property[];
  isShared: boolean;
  shareLink?: string;
}

interface WishlistManagerProps {
  wishlists: Wishlist[];
  allFavorites: Property[];
  onCreateWishlist: (name: string, description: string) => void;
  onDeleteWishlist: (wishlistId: number) => void;
  onAddToWishlist: (wishlistId: number, propertyId: number) => void;
  onRemoveFromWishlist: (wishlistId: number, propertyId: number) => void;
  onShareWishlist: (wishlistId: number) => void;
  onRemoveFromFavorites: (propertyId: number) => void;
}

export default function WishlistManager({
  wishlists,
  allFavorites,
  onCreateWishlist,
  onDeleteWishlist,
  onAddToWishlist,
  onRemoveFromWishlist,
  onShareWishlist,
  onRemoveFromFavorites,
}: WishlistManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addToWishlistDialogOpen, setAddToWishlistDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [newWishlistDescription, setNewWishlistDescription] = useState("");

  const handleCreateWishlist = () => {
    if (newWishlistName.trim()) {
      onCreateWishlist(newWishlistName, newWishlistDescription);
      setNewWishlistName("");
      setNewWishlistDescription("");
      setCreateDialogOpen(false);
      toast.success("Listă creată cu succes");
    }
  };

  const handleShareWishlist = (wishlistId: number) => {
    onShareWishlist(wishlistId);
    toast.success("Link de partajare copiat în clipboard");
  };

  const uncategorizedFavorites = allFavorites.filter(
    (fav) => !wishlists.some((wl) => wl.properties.some((p) => p.id === fav.id))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Listele mele de dorințe</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Crează listă nouă
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crează o listă nouă</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nume listă</Label>
                <Input
                  placeholder="Ex: Pentru ianuarie, Cu colegi"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                />
              </div>
              <div>
                <Label>Descriere (opțional)</Label>
                <Input
                  placeholder="Adaugă o descriere"
                  value={newWishlistDescription}
                  onChange={(e) => setNewWishlistDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateWishlist} className="w-full">
                Crează listă
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {wishlists.map((wishlist) => (
          <Card key={wishlist.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FolderHeart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{wishlist.name}</CardTitle>
                  </div>
                  {wishlist.description && (
                    <p className="text-sm text-muted-foreground">{wishlist.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleShareWishlist(wishlist.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      onDeleteWishlist(wishlist.id);
                      toast.success("Listă ștearsă");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Badge variant="secondary">
                {wishlist.properties.length} {wishlist.properties.length === 1 ? "proprietate" : "proprietăți"}
              </Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {wishlist.properties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nicio proprietate în această listă</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishlist.properties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center gap-3 p-2 rounded-lg border"
                      >
                        <img
                          src={normalizeImageUrl(property.image)}
                          alt={property.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {property.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{property.location}</p>
                          <p className="text-sm font-semibold text-primary">{property.price}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            onRemoveFromWishlist(wishlist.id, property.id);
                            toast.success("Proprietate eliminată din listă");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {uncategorizedFavorites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Favorite necategorizate</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adaugă aceste proprietăți într-o listă de dorințe
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uncategorizedFavorites.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <img
                    src={normalizeImageUrl(property.image)}
                    alt={property.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{property.title}</p>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                    <p className="text-lg font-semibold text-primary">{property.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={addToWishlistDialogOpen && selectedProperty?.id === property.id}
                      onOpenChange={(open) => {
                        setAddToWishlistDialogOpen(open);
                        if (open) setSelectedProperty(property);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Adaugă în listă
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Selectează lista</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          {wishlists.map((wishlist) => (
                            <Button
                              key={wishlist.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                onAddToWishlist(wishlist.id, property.id);
                                setAddToWishlistDialogOpen(false);
                                toast.success(`Adăugat în ${wishlist.name}`);
                              }}
                            >
                              <FolderHeart className="h-4 w-4 mr-2" />
                              {wishlist.name}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onRemoveFromFavorites(property.id);
                        toast.success("Eliminat din favorite");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
