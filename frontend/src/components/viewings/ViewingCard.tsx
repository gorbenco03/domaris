'use client';

/**
 * Viewing Card Component
 * Displays a viewing appointment with status and actions
 */

import React from 'react';
import {
  Clock,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertCircle,
  Home,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Viewing, STATUS_INFO, ViewingStatus } from '@/features/viewings/types';
import Link from 'next/link';

interface ViewingCardProps {
  viewing: Viewing;
  onPress?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  viewType?: 'seeker' | 'owner';
}

export function ViewingCard({
  viewing,
  onPress,
  onReschedule,
  onCancel,
  showActions = true,
  viewType = 'seeker',
}: ViewingCardProps) {
  const statusInfo = STATUS_INFO[viewing.status];

  const formatDate = (slot: { date: string; startTime: string; endTime: string }) => {
    const date = new Date(slot.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (slot.date === todayStr) {
      return 'Astăzi';
    } else if (slot.date === tomorrowStr) {
      return 'Mâine';
    }

    return date.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  };

  const slot = viewing.confirmedSlot || viewing.requestedSlots[0];
  const contact = viewType === 'seeker' ? viewing.owner : viewing.seeker;

  const getStatusIcon = (status: ViewingStatus) => {
    const className = 'w-4 h-4';
    switch (status) {
      case 'pending':
        return <Clock className={className} />;
      case 'confirmed':
        return <CheckCircle className={className} />;
      case 'rescheduled':
        return <RefreshCw className={className} />;
      case 'cancelled':
        return <XCircle className={className} />;
      case 'no_show':
        return <AlertCircle className={className} />;
      default:
        return <CheckCircle className={className} />;
    }
  };

  const cardContent = (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {/* Status Badge */}
        <div className="p-4 pb-0">
          <Badge
            variant="secondary"
            className="gap-1.5"
            style={{
              backgroundColor: statusInfo.color + '20',
              color: statusInfo.color,
            }}
          >
            {getStatusIcon(viewing.status)}
            {statusInfo.label}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="p-4 pt-3 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            >
              <Clock className="w-4 h-4" />
              {slot.startTime} - {slot.endTime}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(slot)}
            </div>
          </div>

          {/* Property Info */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {viewing.property.imageUrl ? (
                <img
                  src={viewing.property.imageUrl}
                  alt={viewing.property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Home className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {viewing.property.title}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{viewing.property.address}</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              {contact.avatar ? (
                <AvatarImage src={contact.avatar} alt={contact.name} />
              ) : null}
              <AvatarFallback className="text-xs bg-primary/20">
                <User className="w-3.5 h-3.5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{contact.name}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (viewing.status === 'pending' || viewing.status === 'confirmed') && (
          <div className="flex gap-3 p-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReschedule?.();
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Reprogramează
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel?.();
              }}
            >
              <XCircle className="w-4 h-4" />
              Anulează
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onPress) {
    return (
      <button className="w-full text-left" onClick={onPress}>
        {cardContent}
      </button>
    );
  }

  return (
    <Link href={`/account/viewings/${viewing.id}`} className="block">
      {cardContent}
    </Link>
  );
}

export default ViewingCard;
