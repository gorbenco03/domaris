"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/profile/Avatar';
import { ChatWindow } from '@/components/messaging/ChatWindow';
import { messagingApi, IConversation, IMessage } from '@/features/messaging/api';
import { useAuth } from '@/contexts/AuthContext';
import { socketService } from '@/lib/socket';
import { toast } from 'sonner';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuth(); 
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSending] = useState(false);

  // Initialize socket
  useEffect(() => {
    if (accessToken) {
        socketService.connect(accessToken);
    }
  }, [accessToken]);

  // Join room and fetch initial data
  useEffect(() => {
    if (!conversationId || !user) return;

    const initChat = async () => {
      try {
        const [convData, msgsData] = await Promise.all([
          messagingApi.getConversation(conversationId),
          messagingApi.getMessages(conversationId)
        ]);
        setConversation(convData);
        setMessages(msgsData.reverse()); // Assuming backend sends newest first, we want oldest first for chat window
        
        socketService.joinConversation(Number(conversationId));
      } catch (error) {
        console.error('Failed to load chat', error);
        toast.error('Eroare la încărcarea conversației');
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Mark as read
    messagingApi.markMessagesAsRead(conversationId);

    // Socket Listeners
    const handleNewMessage = (newMsg: any) => {
        // Only if it belongs to this conversation
        if (String(newMsg.conversationId) === String(conversationId)) {
            // Map if necessary or cast
            setMessages(prev => [...prev, newMsg]);
            if (String(newMsg.senderId) !== String(user.id)) {
                 messagingApi.markMessagesAsRead(conversationId);
            }
        }
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.leaveConversation(Number(conversationId));
      socketService.off('message:new');
    };
  }, [conversationId, user]);


  const handleSendMessage = async (content: string) => {
    if (!user) return;
    
    // Optimistic Update
    const tempId = String(Date.now());
    const optimisticMsg: IMessage = {
        id: tempId,
        conversationId: conversationId,
        senderId: String(user.id),
        content: content,
        type: 'TEXT' as any,
        createdAt: new Date(),
        status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setSending(true);

    try {
        if (socketService.getIsConnected()) {
            socketService.sendMessage(Number(conversationId), content);
             setMessages(prev => prev.filter(m => m.id !== tempId)); 
        } else {
            // Fallback REST
            const sentMsg = await messagingApi.sendMessage(conversationId, content);
            setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
        }
    } catch (error) {
        console.error('Send failed', error);
        toast.error('Mesajul nu a putut fi trimis');
        setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
        setSending(false);
    }
  };

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
     );
  }

  if (!conversation) return <div>Conversația nu a fost găsită.</div>;

  const otherParticipant = conversation.otherParticipant || 
    conversation.participants.find(p => String(p.userId) !== String(user?.id));
  
  const participantName = (otherParticipant as any)?.firstName 
      ? `${(otherParticipant as any).firstName} ${(otherParticipant as any).lastName || ''}`
      : otherParticipant?.name || 'Utilizator';

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto shadow-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white z-10">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            
            <Avatar 
                source={otherParticipant?.avatar} 
                firstName={(otherParticipant as any)?.firstName || participantName.split(' ')[0]} 
                lastName={(otherParticipant as any)?.lastName || participantName.split(' ').slice(1).join(' ')} 
                size="sm"
            />
            
            <div>
                <h2 className="font-semibold text-sm md:text-base">
                    {participantName}
                </h2>
                {conversation.property && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        Ref: {conversation.property.title}
                    </p>
                )}
            </div>
        </div>

        <div className="flex gap-2">
            <Button variant="ghost" size="icon" title="Apelează">
                <Phone className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" title="Opțiuni">
                <MoreVertical className="w-5 h-5 text-gray-600" />
            </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden relative">
         <ChatWindow 
            messages={messages} 
            currentUserId={String(user?.id)}
            onSendMessage={handleSendMessage}
            isLoading={loading}
         />
      </div>
    </div>
  );
}
