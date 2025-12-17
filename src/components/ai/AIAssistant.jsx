import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export default function AIAssistant({ fileContext = null, fileType = null, currentFolderId = null, currentPage = 'Drive' }) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('aiAssistant_isOpen');
    return saved === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('aiAssistant_isMinimized');
    return saved === 'true';
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
    cacheTime: 0,
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('aiAssistant_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: fileContext 
          ? `Olá! Sou ${user?.assistant_name || 'sua secretária virtual'} especializada em ${getFileTypeLabel(fileType)}. Como posso ajudar?`
          : `Olá! Sou ${user?.assistant_name || 'a assistente virtual'} do Keeping. Como posso ajudar você hoje?`
      }
    ];
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Salvar estado do chat
  useEffect(() => {
    localStorage.setItem('aiAssistant_isOpen', isOpen);
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('aiAssistant_isMinimized', isMinimized);
  }, [isMinimized]);

  // Salvar últimas 10 mensagens
  useEffect(() => {
    const last10 = messages.slice(-10);
    localStorage.setItem('aiAssistant_messages', JSON.stringify(last10));
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
      
      const currentFolder = folders.find(f => f.id === currentFolderId);
      
      // Detectar se é uma ação ou conversa
      const actionKeywords = ['crie', 'criar', 'faça', 'fazer', 'gere', 'gerar', 'adicione', 'adicionar', 'delete', 'deletar', 'exclua', 'excluir', 'edite', 'editar', 'atualize', 'atualizar', 'remova', 'remover', 'mova', 'mover', 'mude', 'mudar', 'altere', 'alterar', 'troque', 'trocar', 'substitua', 'substituir'];
      const isAction = actionKeywords.some(keyword => input.toLowerCase().includes(keyword));

      // Histórico das últimas mensagens para contexto
      const recentMessages = messages.slice(-9); // Últimas 9 + a atual = 10
      const conversationHistory = recentMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

      if (isAction) {
        // Usar InvokeLLM com JSON schema para forçar estrutura
        // Buscar o arquivo atual se estiver na página FileViewer
        const urlParams = new URLSearchParams(window.location.search);
        const currentFileId = urlParams.get('id');
        const currentFile = currentFileId ? files.find(f => f.id === currentFileId) : null;

        const actionPrompt = `Você é uma assistente que executa comandos.

Histórico da conversa:
${conversationHistory}

Contexto:
- Pasta atual: ${currentFolder ? currentFolder.name : 'Raiz'}
- ID da pasta: ${currentFolderId || null}
${currentFile ? `\n- ARQUIVO ABERTO: "${currentFile.name}" (ID: ${currentFile.id}, Tipo: ${currentFile.type})\n- CONTEÚDO ATUAL DO ARQUIVO:\n${currentFile.content || '(vazio)'}` : ''}

Pastas existentes: ${JSON.stringify(folders.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name })))}
Arquivos existentes: ${JSON.stringify(files.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, type: f.type })))}

Permissões:
- Criar pastas: ${user?.assistant_can_create_folders !== false}
- Criar arquivos: ${user?.assistant_can_create_files !== false}
- Editar arquivos: ${user?.assistant_can_edit_files !== false}
- Excluir itens: ${user?.assistant_can_delete_items !== false}

Comando do usuário: "${input}"

IMPORTANTE:
- Planilha/Excel = type: "xlsx", content vazio ""
- Documento/Word/Texto = type: "docx", SEMPRE use HTML formatado no content
- Kanban = type: "kbn"
- Gantt = type: "gnt"
- Cronograma = type: "crn"

FORMATAÇÃO DE DOCUMENTOS (type: docx):
Use HTML completo e bem formatado no campo content:

Exemplo de documento bem formatado:
{
  "action": "create_file",
  "data": {
    "name": "Política de Férias",
    "type": "docx",
    "content": "<h1 style=\\"text-align: center;\\"><strong>POLÍTICA DE FÉRIAS</strong></h1><p><br></p><h2><strong>1. Objetivo</strong></h2><p>Esta política estabelece as diretrizes para concessão de férias aos colaboradores.</p><p><br></p><h2><strong>2. Diretrizes</strong></h2><p>• Todo colaborador tem direito a 30 dias de férias após 12 meses de trabalho.</p><p>• As férias devem ser solicitadas com <strong>antecedência mínima de 30 dias</strong>.</p><p>• É permitido fracionamento em até 3 períodos.</p><p><br></p><h3><em>Observação Importante</em></h3><p>Para casos excepcionais, consultar o RH.</p>"
  }
}

EDITAR ARQUIVO ABERTO:
Se houver um arquivo aberto e o usuário pedir para mudar/editar algo nele:
{
  "action": "edit_file",
  "data": {
    "file_id": "ID_DO_ARQUIVO_ABERTO",
    "content": "NOVO_CONTEUDO_COMPLETO_COM_AS_ALTERACOES"
  }
}

IMPORTANTE para edições:
- SEMPRE pegue o conteúdo atual completo do arquivo
- Faça APENAS as alterações solicitadas
- Mantenha toda a formatação HTML original
- Retorne o conteúdo COMPLETO modificado no campo content
- Para documentos docx: mantenha o HTML formatado
- Para planilhas xlsx: mantenha o formato de texto/csv

Tags HTML permitidas:
- Títulos: <h1>, <h2>, <h3> (sempre com text-align: center para centralizar)
- Parágrafos: <p>conteúdo</p>
- Negrito: <strong>texto</strong>
- Itálico: <em>texto</em>
- Sublinhado: <u>texto</u>
- Quebra de linha: <p><br></p>
- Listas: <ul><li>item</li></ul> ou <ol><li>item</li></ol>

SEMPRE estruture documentos com:
1. Título principal centralizado (h1)
2. Seções com subtítulos (h2, h3)
3. Parágrafos separados
4. Formatação adequada (negrito, itálico)
5. Espaçamento entre seções (<p><br></p>)

Converta o comando em uma ação estruturada.`;

        const actionSchema = {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["create_folder", "create_file", "edit_file", "delete_item"]
            },
            data: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["docx", "xlsx", "kbn", "gnt", "crn", "flux", "pdf", "img", "video"] },
                content: { type: "string" },
                folder_id: { type: "string" },
                parent_id: { type: "string" },
                color: { type: "string" },
                file_id: { type: "string" },
                id: { type: "string" }
              }
            }
          },
          required: ["action", "data"]
        };

        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: actionPrompt,
          response_json_schema: actionSchema
        });

        if (llmResult && llmResult.action) {
          const actionResult = await executeAction(llmResult, folders, files);
          
          // Invalidar queries antes de navegar
          await queryClient.invalidateQueries({ queryKey: ['files'] });
          await queryClient.invalidateQueries({ queryKey: ['folders'] });
          
          const successMessage = { 
            role: 'assistant', 
            content: `✓ ${getActionSuccessMessage(llmResult)}` 
          };
          setMessages(prev => [...prev, successMessage]);
          
          // Navegar para o item criado após invalidar queries
          setTimeout(() => {
            if (llmResult.action === 'create_file' && actionResult?.id) {
              window.location.href = `/file-viewer?id=${actionResult.id}`;
            } else if (llmResult.action === 'create_folder' && actionResult?.id) {
              window.location.href = `/drive?folder=${actionResult.id}`;
            } else {
              window.location.reload();
            }
          }, 1200);
        }
      } else {
        // Conversa normal
        const contextInfo = fileContext 
          ? `\n\nArquivo aberto: ${fileType}`
          : '';

        const chatPrompt = `${getSystemPrompt()}

Você está conversando com o usuário sobre o app Keeping.

Histórico da conversa:
${conversationHistory}

Localização atual: ${currentFolder ? currentFolder.name : 'Raiz'}
${contextInfo}

Responda de forma natural e amigável em português. Não execute ações, apenas converse.

Usuário: ${input}`;

        const chatResult = await base44.integrations.Core.InvokeLLM({
          prompt: chatPrompt
        });

        const assistantMessage = { 
          role: 'assistant', 
          content: chatResult || 'Desculpe, não consegui processar sua mensagem.'
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Erro:', error);
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
        return `Arquivo editado com sucesso! Recarregando...`;
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
      // Forçar reload da página para mostrar as alterações
      setTimeout(() => window.location.reload(), 800);
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