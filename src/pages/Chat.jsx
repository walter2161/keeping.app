import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Send, Search, MessageCircle, Headphones, User, 
  Circle, Loader2, Users, Mail, Image, Mic, Paperclip, Plus,
  Check, CheckCheck, X, Download, File
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [shareFileDialog, setShareFileDialog] = useState(false);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.DirectMessage.list('-created_date'),
    enabled: !!currentUser,
    refetchInterval: 2000,
  });

  const { data: chatRequests = [] } = useQuery({
    queryKey: ['chatRequests'],
    queryFn: () => base44.entities.ChatRequest.list(),
    enabled: !!currentUser,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    enabled: !!currentUser,
  });

  const { data: myFiles = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
    enabled: !!currentUser && shareFileDialog,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage('');
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      setNewUserEmail('');
      setAddUserDialog(false);
      alert('Solicitação enviada!');
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ChatRequest.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatRequests'] }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.DirectMessage.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const getConversationId = (email1, email2) => {
    return [email1, email2].sort().join('_');
  };

  // Contatos aceitos
  const acceptedContacts = React.useMemo(() => {
    if (!currentUser) return [];
    const accepted = chatRequests.filter(r => 
      r.status === 'accepted' && 
      (r.from_email === currentUser.email || r.to_email === currentUser.email)
    );
    return accepted.map(r => r.from_email === currentUser.email ? r.to_email : r.from_email);
  }, [chatRequests, currentUser]);

  const conversations = React.useMemo(() => {
    if (!currentUser) return [];

    const convMap = new Map();
    const supportEmail = 'walter2161@gmail.com';

    allMessages.forEach(msg => {
      if (msg.from_email === currentUser.email || msg.to_email === currentUser.email) {
        const otherEmail = msg.from_email === currentUser.email ? msg.to_email : msg.from_email;
        
        // Verificar se é contato aceito ou suporte
        if (!acceptedContacts.includes(otherEmail) && otherEmail !== supportEmail) return;

        const convId = getConversationId(currentUser.email, otherEmail);

        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            email: otherEmail,
            lastMessage: msg.message || (msg.message_type === 'image' ? '📷 Foto' : msg.message_type === 'audio' ? '🎤 Áudio' : '📎 Arquivo'),
            lastDate: msg.created_date,
            unread: msg.to_email === currentUser.email && !msg.read ? 1 : 0,
            isSupport: otherEmail === supportEmail,
          });
        } else {
          const conv = convMap.get(convId);
          if (new Date(msg.created_date) > new Date(conv.lastDate)) {
            conv.lastMessage = msg.message || (msg.message_type === 'image' ? '📷 Foto' : msg.message_type === 'audio' ? '🎤 Áudio' : '📎 Arquivo');
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
  }, [allMessages, currentUser, acceptedContacts]);

  const pendingRequests = chatRequests.filter(r => 
    r.to_email === currentUser?.email && r.status === 'pending'
  );

  const currentMessages = React.useMemo(() => {
    if (!selectedConversation || !currentUser) return [];

    return allMessages
      .filter(msg => 
        (msg.from_email === currentUser.email && msg.to_email === selectedConversation.email) ||
        (msg.to_email === currentUser.email && msg.from_email === selectedConversation.email)
      )
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [allMessages, selectedConversation, currentUser]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = async (type = 'text', fileUrl = null, fileName = null, fileId = null) => {
    if (type === 'text' && !message.trim()) return;
    if (!selectedConversation || !currentUser) return;

    await sendMessageMutation.mutateAsync({
      from_email: currentUser.email,
      to_email: selectedConversation.email,
      message: type === 'text' ? message.trim() : '',
      message_type: type,
      file_url: fileUrl,
      file_name: fileName,
      file_id: fileId,
      conversation_id: getConversationId(currentUser.email, selectedConversation.email),
      read: false,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await handleSendMessage('image', file_url, file.name);
    } catch (error) {
      alert('Erro ao enviar imagem: ' + error.message);
    }
  };

  const handleAudioRecord = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
          
          try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await handleSendMessage('audio', file_url, 'audio.webm');
          } catch (error) {
            alert('Erro ao enviar áudio: ' + error.message);
          }
          
          stream.getTracks().forEach(track => track.stop());
        };

        audioRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setRecording(true);
      } catch (error) {
        alert('Erro ao acessar microfone: ' + error.message);
      }
    } else {
      audioRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  const handleShareFile = async (fileId, fileName) => {
    await handleSendMessage('file', null, fileName, fileId);
    setShareFileDialog(false);
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return;

    const existing = chatRequests.find(r =>
      (r.from_email === currentUser.email && r.to_email === newUserEmail) ||
      (r.to_email === currentUser.email && r.from_email === newUserEmail)
    );

    if (existing) {
      alert('Solicitação já existe!');
      return;
    }

    await sendRequestMutation.mutateAsync({
      from_email: currentUser.email,
      to_email: newUserEmail.trim(),
    });
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
        <Button onClick={() => setAddUserDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Contato
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
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

          {pendingRequests.length > 0 && (
            <div className="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                Solicitações Pendentes ({pendingRequests.length})
              </div>
              {pendingRequests.map(req => (
                <div key={req.id} className="px-4 py-3 border-b dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{req.from_email}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'accepted' })}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                      className="flex-1"
                    >
                      Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-2 border-b dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
            <Link 
              to="https://api.whatsapp.com/send?phone=5585981350090"
              target="_blank"
              className="flex items-center gap-2 p-2 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-colors"
            >
              <Headphones className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Suporte Técnico</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">walter2161@gmail.com</p>
              </div>
            </Link>
          </div>

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
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className={`${conv.isSupport ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {conv.isSupport ? <Headphones className="w-6 h-6" /> : conv.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm block">
                          {conv.isSupport ? 'Suporte Técnico' : conv.email.split('@')[0]}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conv.email}
                        </span>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs ml-2">{conv.unread}</Badge>
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

        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedConversation ? (
            <>
              <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`${selectedConversation.isSupport ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {selectedConversation.isSupport ? <Headphones className="w-6 h-6" /> : selectedConversation.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.isSupport ? 'Suporte Técnico' : selectedConversation.email.split('@')[0]}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedConversation.email}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      Online
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6 bg-[#e5ddd5] dark:bg-gray-900">
                <div className="space-y-3">
                  {currentMessages.map(msg => {
                    const isOwn = msg.from_email === currentUser.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${isOwn ? 'bg-[#d9fdd3]' : 'bg-white'} rounded-lg px-4 py-2 shadow-sm`}>
                          {msg.message_type === 'image' && msg.file_url && (
                            <img src={msg.file_url} alt="Imagem" className="rounded-lg mb-2 max-w-xs" />
                          )}
                          {msg.message_type === 'audio' && msg.file_url && (
                            <audio controls className="mb-2">
                              <source src={msg.file_url} type="audio/webm" />
                            </audio>
                          )}
                          {msg.message_type === 'file' && (
                            <Link to={createPageUrl(`FileViewer?id=${msg.file_id}`)} className="flex items-center gap-2 mb-2 text-blue-600 hover:underline">
                              <File className="w-4 h-4" />
                              <span className="text-sm">{msg.file_name}</span>
                            </Link>
                          )}
                          {msg.message && <p className="text-sm text-gray-900">{msg.message}</p>}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs text-gray-600">
                              {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              msg.read ? <CheckCheck className="w-4 h-4 text-blue-600" /> : <Check className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                <div className="flex gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Image className="w-5 h-5 text-gray-500" />
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAudioRecord}
                    className={recording ? 'text-red-600' : ''}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShareFileDialog(true)}
                  >
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
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

      <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Digite o email do usuário"
              type="email"
            />
            <Button onClick={handleAddUser} className="w-full" disabled={sendRequestMutation.isPending}>
              {sendRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Solicitação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareFileDialog} onOpenChange={setShareFileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compartilhar Arquivo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {myFiles.filter(f => !f.deleted).map(file => (
                <button
                  key={file.id}
                  onClick={() => handleShareFile(file.id, file.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <File className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}