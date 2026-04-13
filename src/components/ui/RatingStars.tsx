import { Star, StarHalf } from "lucide-react";
import { generateRatingStars } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export default function RatingStars({
  rating,
  reviewCount,
  size = 14,
}: RatingStarsProps) {
  const { full, half, empty } = generateRatingStars(rating);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-hidden="true">
        {Array.from({ length: full }).map((_, index) => (
          <Star
            key={`full-${index}`}
            size={size}
            className="text-yellow-500 fill-yellow-500"
          />
        ))}
        {half && (
          <StarHalf size={size} className="text-yellow-500 fill-yellow-500" />
        )}
        {Array.from({ length: empty }).map((_, index) => (
          <Star key={`empty-${index}`} size={size} className="text-gray-300" />
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-500">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      )}
    </div>
  );
}
