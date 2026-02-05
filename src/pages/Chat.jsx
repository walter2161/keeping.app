import React, { useState, useEffect, useRef } from 'react';
import { onhub } from '@/api/onhubClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Send, Search, MessageCircle, User, 
  Circle, Loader2, Users, Image, Mic, Paperclip, Plus,
  Check, CheckCheck, X, File
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
  const [selectedTab, setSelectedTab] = useState('contacts'); // 'contacts' ou 'teams'
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => onhub.auth.me(),
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => onhub.entities.DirectMessage.list('-created_date'),
    enabled: !!currentUser,
    refetchInterval: 2000,
  });

  const { data: chatRequests = [] } = useQuery({
    queryKey: ['chatRequests'],
    queryFn: () => onhub.entities.ChatRequest.list(),
    enabled: !!currentUser,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => onhub.entities.Team.list(),
    enabled: !!currentUser,
  });

  const { data: myFiles = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => onhub.entities.File.list(),
    enabled: !!currentUser && shareFileDialog,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await onhub.entities.User.list();
      return users;
    },
    enabled: !!currentUser,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => onhub.entities.DirectMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage('');
    },
  });

  const sendRequestMutation = useMutation({
    mutationFn: (data) => onhub.entities.ChatRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRequests'] });
      setNewUserEmail('');
      setAddUserDialog(false);
      alert('Solicitação enviada!');
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }) => onhub.entities.ChatRequest.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatRequests'] }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ id }) => onhub.entities.DirectMessage.update(id, { read: true }),
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

    allMessages.forEach(msg => {
      if (msg.from_email === currentUser.email || msg.to_email === currentUser.email) {
        const otherEmail = msg.from_email === currentUser.email ? msg.to_email : msg.from_email;
        
        // Verificar se é contato aceito
        if (!acceptedContacts.includes(otherEmail)) return;

        const convId = getConversationId(currentUser.email, otherEmail);

        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            email: otherEmail,
            lastMessage: msg.message || (msg.message_type === 'image' ? '📷 Foto' : msg.message_type === 'audio' ? '🎤 Áudio' : '📎 Arquivo'),
            lastDate: msg.created_date,
            unread: msg.to_email === currentUser.email && !msg.read ? 1 : 0,
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

  const myTeams = React.useMemo(() => {
    if (!currentUser) return [];
    return teams.filter(t => t.members && t.members.includes(currentUser.email));
  }, [teams, currentUser]);

  const teamMembers = React.useMemo(() => {
    if (!currentUser || !allUsers.length || !myTeams.length) return [];
    
    const memberEmails = new Set();
    myTeams.forEach(team => {
      if (team.members) {
        team.members.forEach(email => {
          if (email !== currentUser.email) {
            memberEmails.add(email);
          }
        });
      }
    });
    
    return allUsers.filter(u => memberEmails.has(u.email));
  }, [myTeams, allUsers, currentUser]);

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
      const { file_url } = await onhub.integrations.Core.UploadFile({ file });
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
        audioRecorderRef.current = { recorder: mediaRecorder, stream: stream };
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          const file = new File([blob], `audio.${blob.type.split('/')[1]}`, { type: blob.type });
          
          try {
            const { file_url } = await onhub.integrations.Core.UploadFile({ file });
            await handleSendMessage('audio', file_url, file.name);
          } catch (error) {
            console.error('Erro ao enviar áudio:', error);
            alert('Erro ao enviar áudio: ' + error.message);
          }
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        alert('Erro ao acessar microfone: ' + error.message);
      }
    } else {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.recorder.stop();
        audioRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setRecording(false);
      }
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

  const filteredTeams = myTeams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeamMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    
    return teamMembers.filter(member => 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamMembers, searchQuery]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00a884] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col">
      <div className="bg-[#202c33] border-b border-[#2a3942] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Drive')}>
            <Button variant="ghost" size="icon" className="text-[#aebac1] hover:bg-[#2a3942]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <MessageCircle className="w-6 h-6 text-[#00a884]" />
          <h1 className="text-xl font-semibold text-white">onHub Chat</h1>
        </div>
        <Button onClick={() => setAddUserDialog(true)} className="bg-[#00a884] hover:bg-[#00a884]/90 text-black font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-full">
        {/* Sidebar */}
        <div className={`w-full md:w-80 bg-[#111b21] border-r border-[#2a3942] flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Tabs */}
          <div className="flex border-b border-[#2a3942]">
            <button
              onClick={() => setSelectedTab('contacts')}
              className={`flex-1 py-3 text-sm font-medium ${
                selectedTab === 'contacts' 
                  ? 'text-[#00a884] border-b-2 border-[#00a884]' 
                  : 'text-[#aebac1] hover:bg-[#202c33]'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Contatos
            </button>
            <button
              onClick={() => setSelectedTab('teams')}
              className={`flex-1 py-3 text-sm font-medium ${
                selectedTab === 'teams' 
                  ? 'text-[#00a884] border-b-2 border-[#00a884]' 
                  : 'text-[#aebac1] hover:bg-[#202c33]'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Equipes
            </button>
          </div>

          {/* Search */}
          <div className="p-3 bg-[#111b21]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aebac1]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-10 bg-[#202c33] border-[#2a3942] text-white placeholder:text-[#667781]"
              />
            </div>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="border-b border-[#2a3942] bg-[#005c4b]/20">
              <div className="px-4 py-2 text-xs font-semibold text-[#00a884] uppercase">
                Solicitações ({pendingRequests.length})
              </div>
              {pendingRequests.map(req => (
                <div key={req.id} className="px-4 py-3 border-b border-[#2a3942]">
                  <p className="text-sm font-medium text-white mb-2">{req.from_email}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'accepted' })}
                      className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-black"
                    >
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                      className="flex-1 border-[#2a3942] text-[#aebac1] hover:bg-[#2a3942]"
                    >
                      Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contacts/Teams List */}
          <ScrollArea className="flex-1">
            {selectedTab === 'contacts' ? (
              filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#667781]">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma conversa ainda</p>
                  <p className="text-xs mt-2">Adicione contatos para começar a conversar</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full px-4 py-3 flex items-start gap-3 border-b border-[#2a3942] hover:bg-[#202c33] transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-[#2a3942]' : ''
                    }`}
                  >
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-[#00a884] text-black font-semibold">
                        {conv.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">
                          {conv.email.split('@')[0]}
                        </span>
                        {conv.unread > 0 && (
                          <Badge className="bg-[#00a884] text-black text-xs">{conv.unread}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#667781] truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )
            ) : (
              filteredTeamMembers.length === 0 ? (
                <div className="p-8 text-center text-[#667781]">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum membro de equipe</p>
                  <p className="text-xs mt-2">Adicione membros às suas equipes no Drive</p>
                </div>
              ) : (
                filteredTeamMembers.map(member => {
                  const conv = conversations.find(c => c.email === member.email);
                  const unread = conv?.unread || 0;
                  
                  return (
                    <button
                      key={member.email}
                      onClick={() => setSelectedConversation({ id: getConversationId(currentUser.email, member.email), email: member.email })}
                      className={`w-full px-4 py-3 flex items-start gap-3 border-b border-[#2a3942] hover:bg-[#202c33] transition-colors ${
                        selectedConversation?.email === member.email ? 'bg-[#2a3942]' : ''
                      }`}
                    >
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-[#00a884] text-black font-semibold">
                          {member.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white text-sm">
                            {member.full_name || member.email.split('@')[0]}
                          </span>
                          {unread > 0 && (
                            <Badge className="bg-[#00a884] text-black text-xs">{unread}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#667781] truncate">
                          {conv?.lastMessage || 'Membro da equipe'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col bg-[#0b141a] ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              <div className="bg-[#202c33] border-b border-[#2a3942] px-4 md:px-6 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden text-[#aebac1] hover:bg-[#2a3942]" onClick={() => setSelectedConversation(null)}>
            <ArrowLeft />
          </Button>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#00a884] text-black font-semibold">
                      {selectedConversation.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-white">
                      {selectedConversation.email.split('@')[0]}
                    </h2>
                    <div className="flex items-center gap-1 text-xs text-[#667781]">
                      <Circle className="w-2 h-2 fill-[#00a884] text-[#00a884]" />
                      online
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6" style={{ backgroundImage: 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)' }}>
                <div className="space-y-2">
                  {currentMessages.map(msg => {
                    const isOwn = msg.from_email === currentUser.email;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${isOwn ? 'bg-[#005c4b]' : 'bg-[#202c33]'} rounded-lg px-3 py-2 shadow-md`}>
                          {msg.message_type === 'image' && msg.file_url && (
                            <img src={msg.file_url} alt="Imagem" className="rounded-lg mb-2 max-w-xs" />
                          )}
                          {msg.message_type === 'audio' && msg.file_url && (
                            <audio controls className="mb-2">
                              <source src={msg.file_url} type="audio/webm" />
                            </audio>
                          )}
                          {msg.message_type === 'file' && (
                            <Link to={createPageUrl(`FileViewer?id=${msg.file_id}`)} className="flex items-center gap-2 mb-2 text-[#00a884] hover:underline">
                              <File className="w-4 h-4" />
                              <span className="text-sm">{msg.file_name}</span>
                            </Link>
                          )}
                          {msg.message && <p className="text-sm text-white">{msg.message}</p>}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[10px] text-[#667781]">
                              {new Date(msg.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              msg.read ? <CheckCheck className="w-4 h-4 text-[#53bdeb]" /> : <Check className="w-4 h-4 text-[#667781]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="bg-[#202c33] border-t border-[#2a3942] p-3">
                <div className="flex gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => imageInputRef.current?.click()}
                    className="text-[#aebac1] hover:bg-[#2a3942]"
                  >
                    <Image className="w-5 h-5" />
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
                    className={`${recording ? 'text-red-500' : 'text-[#aebac1]'} hover:bg-[#2a3942]`}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShareFileDialog(true)}
                    className="text-[#aebac1] hover:bg-[#2a3942]"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Mensagem"
                    className="flex-1 bg-[#2a3942] border-none text-white placeholder:text-[#667781]"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-[#00a884] hover:bg-[#00a884]/90 text-black"
                    size="icon"
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
            <div className="flex-1 flex items-center justify-center text-[#667781]">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p className="text-xl mb-2">Bem-vindo ao onHub Chat</p>
                <p className="text-sm">Selecione um contato para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={addUserDialog} onOpenChange={setAddUserDialog}>
        <DialogContent className="bg-[#202c33] border-[#2a3942] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Novo Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Digite o email do usuário"
              type="email"
              className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#667781]"
            />
            <Button onClick={handleAddUser} className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-black" disabled={sendRequestMutation.isPending}>
              {sendRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Solicitação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareFileDialog} onOpenChange={setShareFileDialog}>
        <DialogContent className="max-w-2xl bg-[#202c33] border-[#2a3942] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Compartilhar Arquivo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {myFiles.filter(f => !f.deleted).map(file => (
                <button
                  key={file.id}
                  onClick={() => handleShareFile(file.id, file.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#2a3942] rounded-lg transition-colors"
                >
                  <File className="w-5 h-5 text-[#00a884]" />
                  <span className="text-sm text-white">{file.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
