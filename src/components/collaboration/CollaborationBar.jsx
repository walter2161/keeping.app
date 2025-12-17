import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CollaborationBar({ fileId, currentUser }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch active sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['activeSessions', fileId],
    queryFn: async () => {
      const allSessions = await base44.entities.ActiveSession.list();
      const now = new Date();
      // Filter sessions active in last 30 seconds
      return allSessions.filter(s => {
        if (s.file_id !== fileId) return false;
        const lastHeartbeat = new Date(s.last_heartbeat);
        const diff = (now - lastHeartbeat) / 1000;
        return diff < 30;
      });
    },
    refetchInterval: 3000,
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', fileId],
    queryFn: async () => {
      const allMessages = await base44.entities.ChatMessage.list();
      return allMessages
        .filter(m => m.file_id === fileId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },
    refetchInterval: 2000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.ChatMessage.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', fileId] });
      setMessage('');
    },
  });

  // Update heartbeat
  useEffect(() => {
    if (!currentUser) return;

    const updateHeartbeat = async () => {
      const existingSessions = await base44.entities.ActiveSession.list();
      const mySession = existingSessions.find(
        s => s.file_id === fileId && s.user_email === currentUser.email
      );

      if (mySession) {
        await base44.entities.ActiveSession.update(mySession.id, {
          last_heartbeat: new Date().toISOString(),
        });
      } else {
        await base44.entities.ActiveSession.create({
          file_id: fileId,
          user_email: currentUser.email,
          user_name: currentUser.full_name,
          user_avatar: currentUser.profile_picture || '',
          last_heartbeat: new Date().toISOString(),
        });
      }
    };

    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 10000);

    return () => {
      clearInterval(interval);
      // Clean up session on unmount
      base44.entities.ActiveSession.list().then(sessions => {
        const mySession = sessions.find(
          s => s.file_id === fileId && s.user_email === currentUser.email
        );
        if (mySession) {
          base44.entities.ActiveSession.delete(mySession.id);
        }
      });
    };
  }, [fileId, currentUser]);

  // Auto scroll chat
  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      file_id: fileId,
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      user_avatar: currentUser.profile_picture || '',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });
  };

  const otherUsers = sessions.filter(s => s.user_email !== currentUser?.email);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Active Users Indicator */}
      {otherUsers.length > 0 && (
        <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border border-gray-200">
          <Users className="w-4 h-4 text-green-600" />
          <div className="flex -space-x-2">
            {otherUsers.slice(0, 3).map((session, idx) => (
              <div
                key={session.id}
                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold"
                title={session.user_name}
              >
                {session.user_avatar ? (
                  <img src={session.user_avatar} alt={session.user_name} className="w-full h-full object-cover" />
                ) : (
                  session.user_name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-700 font-medium">
            {otherUsers.length} editando
          </span>
        </div>
      )}

      {/* Chat Panel */}
      {chatOpen ? (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Chat do Documento</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setChatOpen(false)}
              className="h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                <MessageCircle className="w-8 h-8 mb-2" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-xs">Inicie a conversa!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.user_email === currentUser?.email;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {msg.user_avatar ? (
                        <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full object-cover" />
                      ) : (
                        msg.user_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={`flex-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-lg px-3 py-2 max-w-[85%] ${
                        isMe 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {!isMe && (
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {msg.user_name}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-1">
                        {format(new Date(msg.timestamp), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setChatOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}