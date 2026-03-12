"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Star,
  Calendar,
  CheckCircle,
  Home,
  MapPin,
  User as UserIcon,
  MessageCircle,
  Shield,
} from "lucide-react";
import {
  getPublicProfile,
  getUserListings,
  PublicUserProfile,
  UserListing,
} from "@/lib/userApi";
import { getUserReviews, getUserReviewStats } from "@/lib/reviewsApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Review {
  id: number;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

type Tab = "listings" | "reviews";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("listings");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [profileData, listingsData] = await Promise.all([
          getPublicProfile(userId),
          getUserListings(userId),
        ]);
        setProfile(profileData);
        setListings(listingsData);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Nu am putut încărca profilul");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  // Load reviews lazily when tab switches
  useEffect(() => {
    if (activeTab !== "reviews" || reviews.length > 0) return;
    Promise.all([
      getUserReviews(userId).catch(() => []),
      getUserReviewStats(userId).catch(() => null),
    ]).then(([rev, stats]) => {
      setReviews(rev as Review[]);
      setReviewStats(stats as ReviewStats | null);
    });
  }, [activeTab, userId, reviews.length]);

  const getFullName = () => {
    if (!profile) return "Utilizator";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  };

  const getInitials = () => {
    if (!profile) return "U";
    const initials = [profile.firstName?.[0], profile.lastName?.[0]]
      .filter(Boolean)
      .join("");
    return initials.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <UserIcon className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Profil negăsit</h1>
          <p className="mt-2 text-muted-foreground">
            {error ||
              "Acest utilizator nu există sau profilul nu este disponibil."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Înapoi acasă</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        {/* Profile Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(213,50%,25%)]">
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold text-white">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold">{getFullName()}</h1>
                <div className="mt-1 flex flex-col gap-1 text-sm text-white/70 sm:flex-row sm:gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Membru din{" "}
                    {formatDistanceToNow(new Date(profile.memberSince), {
                      addSuffix: false,
                      locale: ro,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">
                  <CheckCircle className="h-4 w-4" />
                  Verificat
                </span>
              )}
              {profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white"
                >
                  <Shield className="h-4 w-4" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">
                {profile.rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.reviewsCount} recenzii
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <span className="text-2xl font-bold">
              {profile.activeListingsCount}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">Anunțuri active</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <span className="text-2xl font-bold">
              Nivel {profile.verificationLevel}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">Verificare</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 font-semibold">Despre</h2>
            <p className="text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Contact Button */}
        <div className="mb-8">
          <Button asChild className="w-full" size="lg">
            <Link href={`/messages?chat=${userId}`}>
              <MessageCircle className="mr-2 h-5 w-5" />
              Contactează
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("listings")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === "listings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anunțuri ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === "reviews"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Recenzii ({profile.reviewsCount})
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "listings" ? (
          listings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/property/${listing.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    {listing.image ? (
                      <img
                        src={listing.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-primary">
                      {listing.priceEur.toLocaleString()} €
                      {listing.transactionType === "RENT" && (
                        <span className="text-sm font-normal">/lună</span>
                      )}
                    </p>
                    <h3 className="mt-1 font-medium line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.city}
                      {listing.neighborhood && `, ${listing.neighborhood}`}
                    </div>
                    <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                      <span>{listing.rooms} camere</span>
                      <span>·</span>
                      <span>{listing.surfaceSqm} m²</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card py-12 text-center">
              <Home className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Niciun anunț activ</p>
            </div>
          )
        ) : (
          /* Reviews tab */
          <div className="space-y-6">
            {/* Rating distribution */}
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold">
                      {reviewStats.averageRating.toFixed(1)}
                    </p>
                    <div className="mt-1 flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= Math.round(reviewStats.averageRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reviewStats.totalReviews} recenzii
                    </p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count =
                        reviewStats.distribution[String(star)] || 0;
                      const pct =
                        reviewStats.totalReviews > 0
                          ? (count / reviewStats.totalReviews) * 100
                          : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-3 text-right text-muted-foreground">
                            {star}
                          </span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-xs text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {review.authorAvatar ? (
                          <img
                            src={review.authorAvatar}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          review.authorName?.[0]?.toUpperCase() || "U"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {review.authorName}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "h-3 w-3",
                                  s <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(review.createdAt),
                              { addSuffix: true, locale: ro }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card py-12 text-center">
                <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Nicio recenzie încă
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
