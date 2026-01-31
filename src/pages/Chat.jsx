import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Send, Search, MessageCircle, Headphones, User, 
  Circle, Loader2, Users, Mail
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.DirectMessage.list('-created_date'),
    enabled: !!currentUser,
    refetchInterval: 3000,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    enabled: !!currentUser,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage('');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.DirectMessage.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  // Criar ID único da conversa
  const getConversationId = (email1, email2) => {
    return [email1, email2].sort().join('_');
  };

  // Obter conversas únicas
  const conversations = React.useMemo(() => {
    if (!currentUser) return [];

    const convMap = new Map();
    const supportEmail = 'walter2161@gmail.com';

    allMessages.forEach(msg => {
      if (msg.from_email === currentUser.email || msg.to_email === currentUser.email) {
        const otherEmail = msg.from_email === currentUser.email ? msg.to_email : msg.from_email;
        const convId = getConversationId(currentUser.email, otherEmail);

        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            email: otherEmail,
            lastMessage: msg.message,
            lastDate: msg.created_date,
            unread: msg.to_email === currentUser.email && !msg.read ? 1 : 0,
            isSupport: otherEmail === supportEmail,
          });
        } else {
          const conv = convMap.get(convId);
          if (new Date(msg.created_date) > new Date(conv.lastDate)) {
            conv.lastMessage = msg.message;
            conv.lastDate = msg.created_date;
          }
          if (msg.to_email === currentUser.email && !msg.read) {
            conv.unread++;
          }
        }
      }
    });

    return Array.from(convMap.values()).sort((a, b) => 
      new Date(b.lastDate) - new Date(a.lastDate)
    );
  }, [allMessages, currentUser]);

  // Obter membros das equipes
  const teamMembers = React.useMemo(() => {
    if (!currentUser || !teams.length) return [];
    
    const members = new Set();
    teams.forEach(team => {
      if (team.members && team.members.includes(currentUser.email)) {
        team.members.forEach(email => {
          if (email !== currentUser.email) {
            members.add(email);
          }
        });
      }
    });
    
    return Array.from(members);
  }, [teams, currentUser]);

  // Mensagens da conversa selecionada
  const currentMessages = React.useMemo(() => {
    if (!selectedConversation || !currentUser) return [];

    return allMessages
      .filter(msg => 
        (msg.from_email === currentUser.email && msg.to_email === selectedConversation.email) ||
        (msg.to_email === currentUser.email && msg.from_email === selectedConversation.email)
      )
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [allMessages, selectedConversation, currentUser]);

  // Marcar mensagens como lidas
  useEffect(() => {
    if (selectedConversation && currentUser) {
      const unreadMessages = currentMessages.filter(
        msg => msg.to_email === currentUser.email && !msg.read
      );
      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate({ id: msg.id });
      });
    }
  }, [selectedConversation, currentMessages, currentUser]);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || !currentUser) return;

    await sendMessageMutation.mutateAsync({
      from_email: currentUser.email,
      to_email: selectedConversation.email,
      message: message.trim(),
      conversation_id: getConversationId(currentUser.email, selectedConversation.email),
      read: false,
    });
  };

  const handleStartConversation = (email) => {
    const convId = getConversationId(currentUser.email, email);
    const existing = conversations.find(c => c.id === convId);
    
    if (existing) {
      setSelectedConversation(existing);
    } else {
      setSelectedConversation({
        id: convId,
        email,
        lastMessage: '',
        lastDate: new Date().toISOString(),
        unread: 0,
        isSupport: email === 'walter2161@gmail.com',
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Drive')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mensagens</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Lista de Conversas */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversas..."
                className="pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Suporte */}
          <div className="p-4 border-b dark:border-gray-700">
            <Button
              onClick={() => handleStartConversation('walter2161@gmail.com')}
              variant="outline"
              className="w-full justify-start gap-2 dark:border-gray-600 dark:text-gray-300"
            >
              <Headphones className="w-4 h-4 text-blue-600" />
              Suporte Técnico
            </Button>
          </div>

          {/* Membros da Equipe */}
          {teamMembers.length > 0 && (
            <div className="border-b dark:border-gray-700">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Membros da Equipe
              </div>
              <ScrollArea className="max-h-40">
                {teamMembers.map(email => (
                  <button
                    key={email}
                    onClick={() => handleStartConversation(email)}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                        {email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Conversas */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full px-4 py-3 flex items-start gap-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className={`${conv.isSupport ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {conv.isSupport ? <Headphones className="w-5 h-5" /> : conv.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {conv.isSupport ? 'Suporte Técnico' : conv.email}
                      </span>
                      {conv.unread > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs">{conv.unread}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedConversation ? (
            <>
              {/* Header da Conversa */}
              <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`${selectedConversation.isSupport ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {selectedConversation.isSupport ? <Headphones className="w-5 h-5" /> : selectedConversation.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.isSupport ? 'Suporte Técnico' : selectedConversation.email}
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      Online
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {currentMessages.map(msg => {
                    const isOwn = msg.from_email === currentUser.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${isOwn ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'} rounded-2xl px-4 py-2 shadow-sm`}>
                          <p className="text-sm">{msg.message}</p>
                          <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} mt-1 block`}>
                            {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}