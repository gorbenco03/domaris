"use client";

/**
 * RIVA Frontend - Reviews Page
 * Dedicated reviews page for user profile
 * Aligned with mobile/src/features/profile/screens/ReviewsScreen.tsx
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  Star,
  ThumbsUp,
  Flag,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserReviews,
  getUserReviewStats,
  toggleHelpful,
  reportReview,
  Review,
  ReviewStats,
} from "@/lib/reviewsApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

export default function ReviewsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Report dialog
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const [reviewsData, statsData] = await Promise.all([
          getUserReviews(String(user.id)).catch(() => []),
          getUserReviewStats(String(user.id)).catch(() => null),
        ]);
        setReviews(reviewsData);
        setStats(statsData);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading && isAuthenticated) fetchData();
  }, [user?.id, isAuthenticated, isAuthLoading]);

  const handleToggleHelpful = async (reviewId: string) => {
    try {
      const result = await toggleHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, helpfulCount: result.helpfulCount, isHelpful: result.isHelpful }
            : r
        )
      );
    } catch {
      // silently fail
    }
  };

  const handleReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      await reportReview(reportTarget, reportReason.trim());
      toast.success("Recenzia a fost raportată.");
      setReportTarget(null);
      setReportReason("");
    } catch {
      toast.error("Nu am putut raporta recenzia.");
    } finally {
      setIsReporting(false);
    }
  };

  if (isAuthLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Star className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">Trebuie să fii autentificat pentru a vedea recenziile.</p>
          <Button asChild className="mt-6"><Link href="/auth">Autentifică-te</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la profil
          </Link>
        </div>

        <h1 className="mb-6 text-3xl font-bold">Recenziile mele</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Rating Summary */}
            {stats && stats.totalCount > 0 && (
              <div className="mb-8 flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-foreground">{stats.averageRating.toFixed(1)}</p>
                  <div className="mt-1 flex gap-0.5 justify-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-4 w-4",
                          s <= Math.round(stats.averageRating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stats.totalCount} recenzii</p>
                </div>
                <div className="flex-1 space-y-1">
                  {([5, 4, 3, 2, 1] as const).map((rating) => {
                    const count = stats.distribution[rating] || 0;
                    const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="w-3 text-muted-foreground">{rating}</span>
                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.authorAvatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {review.authorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{review.authorName}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    "h-3 w-3",
                                    s <= review.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-muted-foreground"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), "d MMM yyyy", { locale: ro })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-foreground mb-3">{review.comment}</p>

                    {review.response && (
                      <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                        <p className="mb-1 font-medium text-foreground">Răspunsul tău:</p>
                        <p className="text-muted-foreground">{review.response}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => handleToggleHelpful(review.id)}
                        className={cn(
                          "flex items-center gap-1 text-xs transition-colors",
                          review.isHelpful
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ThumbsUp className={cn("h-3.5 w-3.5", review.isHelpful && "fill-current")} />
                        <span>Util ({review.helpfulCount})</span>
                      </button>
                      <button
                        onClick={() => setReportTarget(review.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>Raportează</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card py-16 text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">Nicio recenzie încă</h2>
                <p className="mt-2 text-muted-foreground">
                  Recenziile vor apărea după ce utilizatorii îți evaluează proprietățile.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Report Dialog */}
      <Dialog open={reportTarget !== null} onOpenChange={(open) => !open && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raportează recenzia</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium">Motivul raportării</label>
            <Textarea
              placeholder="Descrie motivul pentru care dorești să raportezi această recenzie..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportTarget(null)}>Anulează</Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason.trim() || isReporting}
              variant="destructive"
            >
              {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Raportează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
