"use client";

import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Star,
  Clock,
  MessageSquare,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface BusinessResultsProps {
  data: {
    business: BusinessData | null;
    reviews: ReviewsData | null;
    maps: MapsResult[];
  };
  query: string;
}

interface BusinessData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  hours: Record<string, string> | null;
}

interface ReviewsData {
  rating: number;
  totalReviews: number;
  reviews: Review[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
  profileImage: string | null;
}

interface MapsResult {
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  category: string;
  phone: string;
  website: string;
}

export function BusinessResults({ data, query }: BusinessResultsProps) {
  const { business, reviews, maps } = data;

  if (!business && maps.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Business Found</h3>
        <p className="text-slate-400">
          {"We couldn't find business information for \""}{query}{"\""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Business Card */}
      {business && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{business.name}</h2>
              {business.category && (
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm mb-4">
                  {business.category}
                </span>
              )}

              <div className="space-y-2 text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <span>
                    {business.address}
                    {business.city && `, ${business.city}`}
                    {business.state && `, ${business.state}`}
                    {business.zip && ` ${business.zip}`}
                  </span>
                </div>
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-slate-500" />
                    <a href={`tel:${business.phone}`} className="hover:text-white">
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-slate-500" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {business.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Card */}
            {business.rating && (
              <div className="flex-shrink-0 text-center p-4 rounded-xl bg-slate-700/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                  <span className="text-3xl font-bold text-white">
                    {business.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {formatNumber(business.reviewCount)} reviews
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {reviews && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sentiment Overview */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              Review Sentiment
            </h3>
            <div className="space-y-3">
              <SentimentBar
                label="Positive"
                count={reviews.sentiment.positive}
                total={reviews.totalReviews}
                color="bg-green-500"
                icon={ThumbsUp}
              />
              <SentimentBar
                label="Neutral"
                count={reviews.sentiment.neutral}
                total={reviews.totalReviews}
                color="bg-slate-500"
              />
              <SentimentBar
                label="Negative"
                count={reviews.sentiment.negative}
                total={reviews.totalReviews}
                color="bg-red-500"
                icon={ThumbsDown}
              />
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="md:col-span-2 rounded-xl bg-slate-800/50 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Reviews ({reviews.reviews.length})
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reviews.reviews.slice(0, 10).map((review, index) => (
                <div
                  key={index}
                  className="pb-4 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {review.profileImage ? (
                      <img
                        src={review.profileImage}
                        alt={review.author}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <span className="text-slate-400 text-sm">
                          {review.author.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{review.author}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-3 w-3",
                                star <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-slate-600"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm line-clamp-3">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other Business Results from Maps */}
      {maps.length > 1 && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Similar Businesses Nearby
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {maps.slice(1, 7).map((biz, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <h4 className="font-medium text-white mb-1">{biz.name}</h4>
                <p className="text-sm text-slate-400 mb-2">{biz.address}</p>
                <div className="flex items-center gap-3 text-sm">
                  {biz.rating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" />
                      {biz.rating.toFixed(1)}
                    </span>
                  )}
                  {biz.category && (
                    <span className="text-slate-500">{biz.category}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Hours */}
      {business?.hours && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-400" />
            Business Hours
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(business.hours).map(([day, hours]) => (
              <div key={day}>
                <p className="text-sm text-slate-400 capitalize">{day}</p>
                <p className="text-white">{hours}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SentimentBar({
  label,
  count,
  total,
  color,
  icon: Icon,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  icon?: typeof ThumbsUp;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-400 flex items-center gap-1">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </span>
        <span className="text-sm text-slate-300">{count}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
