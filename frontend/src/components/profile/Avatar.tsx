import React from 'react';
import { User, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  source?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
  showEditButton?: boolean;
  onEditPress?: () => void;
  className?: string;
}

export function Avatar({
  firstName,
  lastName,
  source,
  size = 'md',
  verified = false,
  showEditButton = false,
  onEditPress,
  className,
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-32 h-32 text-2xl',
  };

  const getInitials = () => {
    if (!firstName) return '?';
    return `${firstName[0]}${lastName ? lastName[0] : ''}`.toUpperCase();
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm bg-gray-100",
          sizeClasses[size]
        )}
      >
        {source ? (
          <img
            src={source}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold">
             {firstName ? getInitials() : <User className="w-1/2 h-1/2" />}
          </div>
        )}
      </div>

      {verified && (
        <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3 h-3"
          >
            <path
              fillRule="evenodd"
              d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {showEditButton && onEditPress && (
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md"
          onClick={onEditPress}
        >
          <Pen className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
