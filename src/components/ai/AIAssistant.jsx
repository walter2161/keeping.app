import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export default function AIAssistant({ fileContext = null, fileType = null, currentFolderId = null, currentPage = 'Drive' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
    cacheTime: 0,
  });

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: fileContext 
        ? `Olá! Sou ${user?.assistant_name || 'sua secretária virtual'} especializada em ${getFileTypeLabel(fileType)}. Como posso ajudar?`
        : `Olá! Sou ${user?.assistant_name || 'a assistente virtual'} do Keeping. Como posso ajudar você hoje?`
    }
  ]);

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
    const assistantName = user?.assistant_name || 'Assistente Virtual';
    const assistantRole = user?.assistant_role || 'Assistente Executiva';
    const assistantExpertise = user?.assistant_expertise || 'Gestão de projetos, organização e produtividade';
    const assistantGuidelines = user?.assistant_guidelines || 'Seja sempre prestativa, objetiva e profissional.';
    
    let basePrompt = `Você é ${assistantName}, uma ${assistantRole}. 
Suas áreas de conhecimento incluem: ${assistantExpertise}

Diretrizes de comportamento: ${assistantGuidelines}`;

    if (!fileContext || !fileType) {
      return basePrompt + `\nVocê é a assistente virtual global do Keeping, um sistema de organização empresarial.
Você pode ajudar com navegação, organização de arquivos, e responder perguntas estratégicas sobre projetos e tarefas.`;
    }

    const contextPrompts = {
      docx: `Você pode ajudar a:
- Criar e revisar textos
- Padronizar políticas
- Gerar atas
- Melhorar redação
- Sugerir estruturas de documentos`,
      
      xlsx: `Você pode ajudar a:
- Criar fórmulas
- Gerar KPIs
- Analisar dados
- Criar gráficos e resumos
- Traduzir números em insights`,
      
      kbn: `Você pode ajudar a:
- Organizar tarefas
- Priorizar cards
- Detectar gargalos
- Sugerir melhorias no fluxo
- Gerar resumos de progresso`,
      
      gnt: `Você pode ajudar a:
- Criar cronogramas
- Ajustar dependências
- Simular atrasos
- Otimizar prazos
- Sugerir recursos`,
      
      crn: `Você pode ajudar a:
- Balancear cargas de trabalho
- Identificar conflitos
- Gerar visão executiva
- Coordenar equipes
- Otimizar entregas`,
      
      img: `Você pode ajudar a:
- Organizar e categorizar imagens
- Gerar descrições
- Criar tags
- Relacionar imagens a projetos
- Sugerir usos estratégicos`,
      
      video: `Você pode ajudar a:
- Gerar resumos
- Criar capítulos
- Extrair pontos-chave
- Relacionar vídeos a processos
- Sugerir organização`
    };

    return basePrompt + '\n\n' + (contextPrompts[fileType] || contextPrompts.docx);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Buscar todas as pastas e arquivos para contexto
      const folders = await base44.entities.Folder.list();
      const files = await base44.entities.File.list();
      
      const contextInfo = fileContext 
        ? `\n\nContexto do arquivo atual (${fileType}):\n${JSON.stringify(fileContext, null, 2)}`
        : '';

      const currentFolder = folders.find(f => f.id === currentFolderId);
      const currentLocationContext = `\n\nLocalização atual do usuário:\n- Página: ${currentPage}\n- Pasta atual: ${currentFolder ? currentFolder.name : 'Raiz (Meu Drive)'}\n- ID da pasta: ${currentFolderId || 'null (raiz)'}`;

      const driveContext = `\n\nEstrutura do Drive:\nPastas: ${JSON.stringify(folders.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, parent_id: f.parent_id })))}\nArquivos: ${JSON.stringify(files.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, type: f.type, folder_id: f.folder_id })))}`;

      const permissionsContext = `\n\nPermissões habilitadas:\n- Criar pastas: ${user?.assistant_can_create_folders !== false ? 'Sim' : 'Não'}\n- Criar arquivos: ${user?.assistant_can_create_files !== false ? 'Sim' : 'Não'}\n- Editar arquivos: ${user?.assistant_can_edit_files !== false ? 'Sim' : 'Não'}\n- Excluir itens: ${user?.assistant_can_delete_items !== false ? 'Sim' : 'Não'}`;

      const systemInstructions = `INSTRUÇÕES CRÍTICAS:
1. Você DEVE executar ações automaticamente quando solicitado pelo usuário
2. Quando o usuário pedir para criar/editar/excluir algo, retorne APENAS um objeto JSON válido, sem nenhum texto adicional
3. Formato do JSON: {"action": "create_folder|create_file|edit_file|delete_item", "data": {...}}
4. NUNCA adicione texto explicativo antes ou depois do JSON
5. NUNCA mostre ou explique o JSON ao usuário
6. Para conversas normais (sem ações), responda em português de forma natural
7. Você só pode falar sobre o aplicativo, pastas e arquivos do usuário
8. Use o contexto de localização atual para saber onde criar itens (pasta atual: ${currentFolderId || 'raiz'})

FORMATAÇÃO DE CONTEÚDO:
- Documentos (docx): Use \\n\\n entre seções e \\n entre parágrafos
- Planilhas (xlsx): Retorne dados em formato tabular organizado
- Para criar planilha, use: {"action": "create_file", "data": {"name": "Nome", "type": "xlsx", "content": "dados aqui"}}

EXEMPLOS DE AÇÕES:
- "crie uma pasta X" → {"action": "create_folder", "data": {"name": "X"}}
- "crie um documento" → {"action": "create_file", "data": {"name": "Nome", "type": "docx", "content": "texto..."}}
- "crie uma planilha" → {"action": "create_file", "data": {"name": "Nome", "type": "xlsx", "content": "dados..."}}
- "crie um kanban" → {"action": "create_file", "data": {"name": "Nome", "type": "kbn"}}`;

      const fullPrompt = `${getSystemPrompt()}\n\n${systemInstructions}${currentLocationContext}${driveContext}${permissionsContext}${contextInfo}\n\nUsuário: ${input}`;

      // Usar API Mistral
      const apiKey = user?.assistant_api_key || 'EYV4KepRDuEVj9YblJj5k3WXR07N100Y';
      const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: input }
          ],
        }),
      });

      const result = await mistralResponse.json();
      let responseText = result.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';

      // Tentar detectar e extrair JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*"action"[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const actionData = JSON.parse(jsonMatch[0]);
          if (actionData.action) {
            const actionResult = await executeAction(actionData, folders, files);
            const successMessage = { 
              role: 'assistant', 
              content: `✓ ${getActionSuccessMessage(actionData)}` 
            };
            setMessages(prev => [...prev, successMessage]);
            
            // Navegar para o item criado
            setTimeout(() => {
              if (actionData.action === 'create_file' && actionResult?.id) {
                window.location.href = `/file-viewer?id=${actionResult.id}`;
              } else if (actionData.action === 'create_folder' && actionResult?.id) {
                window.location.href = `/drive?folder=${actionResult.id}`;
              } else {
                window.location.reload();
              }
            }, 800);
            return; // Não mostrar o JSON
          }
        } catch (e) {
          console.error('Erro ao executar ação:', e);
          // Se falhar, continuar e mostrar resposta normal
        }
      }

      // Apenas mostrar resposta se não foi uma ação
      const assistantMessage = { 
        role: 'assistant', 
        content: responseText 
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

  const getActionSuccessMessage = (actionData) => {
    const { action, data } = actionData;
    switch (action) {
      case 'create_folder':
        return `Pasta "${data.name}" criada com sucesso!`;
      case 'create_file':
        return `Arquivo "${data.name}" criado com sucesso!`;
      case 'edit_file':
        return `Arquivo atualizado com sucesso!`;
      case 'delete_item':
        return `Item excluído com sucesso!`;
      default:
        return 'Operação realizada com sucesso!';
    }
  };

  const executeAction = async (actionData, folders, files) => {
    const { action, data } = actionData;

    if (action === 'create_folder' && user?.assistant_can_create_folders !== false) {
      const result = await base44.entities.Folder.create({
        name: data.name,
        parent_id: data.parent_id || currentFolderId || null,
        color: data.color || 'bg-blue-500',
      });
      return result;
    } else if (action === 'create_file' && user?.assistant_can_create_files !== false) {
      const defaultContent = {
        kbn: JSON.stringify({ columns: [], cards: [] }),
        gnt: JSON.stringify({ tasks: [] }),
        crn: JSON.stringify({ groups: [], items: [] }),
        flux: JSON.stringify({ drawflow: { Home: { data: {} } } }),
        docx: data.content || '',
        xlsx: data.content || '',
      };
      const result = await base44.entities.File.create({
        name: data.name,
        type: data.type,
        folder_id: data.folder_id || currentFolderId || null,
        content: data.content || defaultContent[data.type] || '',
      });
      return result;
    } else if (action === 'edit_file' && user?.assistant_can_edit_files !== false) {
      const result = await base44.entities.File.update(data.file_id, {
        content: typeof data.content === 'object' ? JSON.stringify(data.content) : data.content,
      });
      return result;
    } else if (action === 'delete_item' && user?.assistant_can_delete_items !== false) {
      if (data.type === 'folder') {
        return await base44.entities.Folder.update(data.id, { deleted: true, deleted_at: new Date().toISOString() });
      } else if (data.type === 'file') {
        return await base44.entities.File.update(data.id, { deleted: true, deleted_at: new Date().toISOString() });
      }
    } else {
      throw new Error('Permissão negada para esta ação');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const avatarUrl = user?.assistant_avatar || 'https://image.pollinations.ai/prompt/professional%20female%20assistant%2C%20business%20suit%2C%20elegant%20glasses%2C%20long%20dark%20hair%2C%20friendly%20confident%20smile%2C%20shoulder%20portrait%2C%20modern%20office%20background%2C%20professional%20corporate%20photo%2C%20studio%20lighting?width=350&height=350&model=flux&nologo=true&enhance=true';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0 overflow-hidden border-2 border-white hover:scale-110 transition-transform"
      >
        <img 
          src={avatarUrl} 
          alt="Assistente"
          className="w-full h-full object-cover"
        />
      </button>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            <img 
              src={avatarUrl} 
              alt="Assistente"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold">{user?.assistant_name || 'Assistente Virtual'}</h3>
            <p className="text-xs text-white/80">{user?.assistant_role || 'Online'}</p>
          </div>
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