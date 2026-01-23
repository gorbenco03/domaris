"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Search } from 'lucide-react';

import { ProfileWrapper } from '@/components/profile/ProfileWrapper';
import { Avatar } from '@/components/profile/Avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { messagingApi } from '@/features/messaging/api';
import { IConversationListItem } from '@domaris/types';
import { cn } from '@/lib/utils';
import { socketService } from '@/lib/socket';
export default function MessagesPage() {
  const [conversations, setConversations] = useState<IConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchConversations = async () => {
    try {
      const data = await messagingApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Listen for real-time updates to list
    if (socketService.getIsConnected()) {
        socketService.onNewMessageNotification(() => {
            // Optimistically update or refetch
            fetchConversations();
        });
    }
    
    return () => {
        socketService.off('new_message_notification');
    };
  }, []);

  const filteredConversations = conversations.filter(c => {
    const other = c.otherParticipant;
    const name = `${other?.firstName || ''} ${other?.lastName || ''}`.toLowerCase();
    const propTitle = c.property?.title?.toLowerCase() || '';
    const term = search.toLowerCase();
    return name.includes(term) || propTitle.includes(term);
  });

  return (
    <ProfileWrapper title="Mesaje">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Caută conversații..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="space-y-2 mt-4">
          {loading ? (
             <div className="flex justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
              <p>Nu ai nicio conversație activă.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherParticipant = conv.otherParticipant;
              const lastMessage = conv.lastMessage;
              const isUnread = (conv.unreadCount || 0) > 0;

              return (
                <Link 
                  key={conv.id} 
                  href={`/messages/${conv.id}`}
                  className={cn(
                    "block p-4 rounded-xl border transition-all hover:shadow-md bg-white",
                    isUnread ? "border-l-4 border-l-primary" : "border-gray-200"
                  )}
                >
                  <div className="flex gap-4 items-center">
                    <Avatar 
                      source={otherParticipant?.avatar} 
                      firstName={otherParticipant?.firstName} 
                      lastName={otherParticipant?.lastName} 
                      size="md"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={cn("text-base truncate", isUnread ? "font-bold" : "font-semibold")}>
                          {otherParticipant?.firstName} {otherParticipant?.lastName}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {lastMessage?.sentAt && formatDistanceToNow(new Date(lastMessage.sentAt), { addSuffix: true, locale: ro })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col min-w-0 pr-4">
                            {conv.property && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5 truncate">
                                    {conv.property.title}
                                </span>
                            )}
                            <p className={cn("text-sm truncate", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                              {lastMessage?.isFromMe ? 'Tu: ' : ''}
                              {lastMessage?.text || 'Începe conversația...'}
                            </p>
                        </div>

                        {isUnread && (
                          <Badge className="rounded-full h-5 w-5 p-0 flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </ProfileWrapper>
  );
}
