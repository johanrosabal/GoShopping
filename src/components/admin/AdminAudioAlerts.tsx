'use client';

import { useEffect, useRef } from 'react';
import { subscribeToAllChats, ChatSession } from '@/lib/services/chat';

export default function AdminAudioAlerts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevChatsRef = useRef<ChatSession[]>([]);

  useEffect(() => {
    // Elite notification bell sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const unsubscribe = subscribeToAllChats((updatedChats) => {
      // Logic to detect new messages from clients
      const hasNewMessage = updatedChats.some(chat => {
        const prevChat = prevChatsRef.current.find(pc => pc.id === chat.id);
        const prevUnread = prevChat?.unreadCountAdmin || 0;
        return chat.unreadCountAdmin > prevUnread;
      });

      if (hasNewMessage && audioRef.current) {
        audioRef.current.play().catch(e => {
          // Usually fails because user hasn't interacted with the page yet
          console.log("Audio alert blocked by browser - requires initial user interaction.");
        });
      }

      prevChatsRef.current = updatedChats;
    });

    return () => unsubscribe();
  }, []);

  return null; // Hidden component
}
