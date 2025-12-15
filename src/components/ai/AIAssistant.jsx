import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export default function AIAssistant({ fileContext = null, fileType = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: fileContext 
        ? `Olá! Sou sua secretária virtual especializada em ${getFileTypeLabel(fileType)}. Como posso ajudar?`
        : 'Olá! Sou a assistente virtual do Keeping. Como posso ajudar você hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function getFileTypeLabel(type) {
    const labels = {
      docx: 'documentos',
      xlsx: 'planilhas',
      kbn: 'Kanban',
      gnt: 'Gantt',
      crn: 'cronogramas',
      img: 'imagens',
      video: 'vídeos'
    };
    return labels[type] || 'arquivos';
  }

  const getSystemPrompt = () => {
    if (!fileContext || !fileType) {
      return `Você é a assistente virtual global do Keeping, um sistema de organização empresarial.
Você pode ajudar com navegação, organização de arquivos, e responder perguntas estratégicas sobre projetos e tarefas.`;
    }

    const prompts = {
      docx: `Você é uma secretária virtual especializada em documentos. Pode ajudar a:
- Criar e revisar textos
- Padronizar políticas
- Gerar atas
- Melhorar redação
- Sugerir estruturas de documentos`,
      
      xlsx: `Você é uma secretária virtual especializada em planilhas. Pode ajudar a:
- Criar fórmulas
- Gerar KPIs
- Analisar dados
- Criar gráficos e resumos
- Traduzir números em insights`,
      
      kbn: `Você é uma secretária virtual especializada em Kanban. Pode ajudar a:
- Organizar tarefas
- Priorizar cards
- Detectar gargalos
- Sugerir melhorias no fluxo
- Gerar resumos de progresso`,
      
      gnt: `Você é uma secretária virtual especializada em Gantt. Pode ajudar a:
- Criar cronogramas
- Ajustar dependências
- Simular atrasos
- Otimizar prazos
- Sugerir recursos`,
      
      crn: `Você é uma secretária virtual especializada em cronogramas. Pode ajudar a:
- Balancear cargas de trabalho
- Identificar conflitos
- Gerar visão executiva
- Coordenar equipes
- Otimizar entregas`,
      
      img: `Você é uma secretária virtual especializada em imagens. Pode ajudar a:
- Organizar e categorizar imagens
- Gerar descrições
- Criar tags
- Relacionar imagens a projetos
- Sugerir usos estratégicos`,
      
      video: `Você é uma secretária virtual especializada em vídeos. Pode ajudar a:
- Gerar resumos
- Criar capítulos
- Extrair pontos-chave
- Relacionar vídeos a processos
- Sugerir organização`
    };

    return prompts[fileType] || prompts.docx;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const contextInfo = fileContext 
        ? `\n\nContexto do arquivo (${fileType}):\n${JSON.stringify(fileContext, null, 2)}`
        : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${getSystemPrompt()}\n\nUsuário: ${input}${contextInfo}`,
      });

      const assistantMessage = { 
        role: 'assistant', 
        content: response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border z-50 flex flex-col transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">
            {fileContext ? `Assistente ${getFileTypeLabel(fileType)}` : 'Assistente Virtual'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none min-h-[60px]"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 h-[60px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}