import React, { useState, useRef, useEffect } from 'react';
import { onhub } from '@/api/onhubClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export default function AIAssistant({ fileContext = null, fileType = null, currentFolderId = null, currentPage = 'Drive', openFileId = null, openFileName = null, onExecuteTerminalCommand = null }) {
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
  const [terminalMode, setTerminalMode] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => onhub.auth.me(),
    staleTime: 0,
    cacheTime: 0,
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('aiAssistant_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filtrar mensagens com mais de 24h
        const now = Date.now();
        const filtered = parsed.filter(msg => {
          if (!msg.timestamp) return true; // Manter mensagens sem timestamp
          return (now - msg.timestamp) < 24 * 60 * 60 * 1000; // 24 horas
        });
        // Manter apenas as últimas 10 interações (20 mensagens = 10 pares user+assistant)
        return filtered.slice(-20);
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: fileContext 
          ? `Olá! Sou ${user?.assistant_name || 'sua secretária virtual'} especializada em ${getFileTypeLabel(fileType)}. Como posso ajudar?`
          : `Olá! Sou ${user?.assistant_name || 'a assistente virtual'} do Keeping. Como posso ajudar você hoje?`,
        timestamp: Date.now()
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

  // Salvar últimas 20 mensagens (10 interações), limpar antigas
  useEffect(() => {
    const now = Date.now();
    const filtered = messages.filter(msg => {
      if (!msg.timestamp) return true;
      return (now - msg.timestamp) < 24 * 60 * 60 * 1000;
    });
    const last20 = filtered.slice(-20);
    localStorage.setItem('aiAssistant_messages', JSON.stringify(last20));
  }, [messages]);

  function getFileTypeLabel(type) {
    const labels = {
      docx: 'documentos',
      xlsx: 'planilhas',
      pptx: 'apresentações',
      kbn: 'Kanban',
      gnt: 'Gantt',
      crn: 'cronogramas',
      img: 'imagens',
      video: 'vídeos'
    };
    return labels[type] || 'arquivos';
  }

  const parseXMLStructure = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const actions = [];
    const tempRefs = {};

    const processNode = (node, parentRef = null) => {
      if (node.nodeType !== 1) return; // Only process element nodes

      const tagName = node.tagName.toLowerCase();
      const name = node.getAttribute('name');

      if (tagName === 'folder') {
        const tempRef = name.replace(/\s+/g, '') + '_folder';
        actions.push({
          action: 'create_folder',
          temp_ref: tempRef,
          data: {
            name: name,
            parent_id: parentRef
          }
        });

        // Process children
        Array.from(node.children).forEach(child => processNode(child, tempRef));
      } else if (tagName === 'file') {
        const extension = name.split('.').pop();
        const typeMap = {
          'docx': 'docx', 'doc': 'docx',
          'xlsx': 'xlsx', 'xls': 'xlsx',
          'pptx': 'pptx', 'ppt': 'pptx',
          'kbn': 'kbn', 'gnt': 'gnt', 'crn': 'crn', 'flux': 'flux',
          'pdf': 'pdf', 'jpg': 'img', 'jpeg': 'img', 'png': 'img', 'gif': 'img',
          'mp4': 'video', 'mov': 'video', 'avi': 'video'
        };

        actions.push({
          action: 'create_file',
          data: {
            name: name,
            type: typeMap[extension] || 'other',
            folder_id: parentRef
          }
        });
      }
    };

    const rootNode = xmlDoc.querySelector('root');
    if (rootNode) {
      Array.from(rootNode.children).forEach(child => processNode(child, null));
    }

    return { actions };
  };

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
      
      pptx: `Você pode ajudar a:
- Criar apresentações
- Estruturar slides
- Formatar conteúdo
- Gerar roteiros
- Sugerir layouts`,
      
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

    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Buscar todas as pastas, arquivos e equipes para contexto
      const folders = await onhub.entities.Folder.list();
      const files = await onhub.entities.File.list();
      const teams = await onhub.entities.Team.list();
      
      const currentFolder = folders.find(f => f.id === currentFolderId);
      
      // Determinar o team_id da pasta atual (herdado)
      const getFolderTeam = (folderId) => {
        if (!folderId) return null;
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return null;
        if (folder.team_id) return folder.team_id;
        return getFolderTeam(folder.parent_id);
      };
      
      const currentTeamId = getFolderTeam(currentFolderId);
      
      // Verificar se é uma automação personalizada
      const automations = user?.assistant_automations || [];
      const matchedAutomation = automations.find(auto => 
        input.toLowerCase().trim() === auto.keyword.toLowerCase().trim()
      );

      if (matchedAutomation) {
        // Usar o tipo definido pelo usuário ou detectar automaticamente
        let detectedType = matchedAutomation.type || null;
        
        // Se não tem tipo definido, detectar baseado em palavras-chave
        if (!detectedType) {
          const actionTypes = {
            create: ['criar', 'crie', 'gerar', 'gere', 'adicionar', 'adicione', 'novo', 'nova'],
            search: ['pesquisar', 'pesquise', 'buscar', 'busque', 'encontrar', 'encontre', 'procurar', 'procure', 'listar', 'liste'],
            write: ['escrever', 'escreva', 'redigir', 'redija', 'compor', 'componha', 'formular', 'formule'],
            edit: ['editar', 'edite', 'modificar', 'modifique', 'alterar', 'altere', 'atualizar', 'atualize', 'mudar', 'mude'],
            delete: ['deletar', 'delete', 'excluir', 'exclua', 'remover', 'remova', 'apagar', 'apague'],
            analyze: ['analisar', 'analise', 'avaliar', 'avalie', 'revisar', 'revise', 'verificar', 'verifique'],
          };

          for (const [type, keywords] of Object.entries(actionTypes)) {
            if (keywords.some(word => matchedAutomation.action.toLowerCase().includes(word))) {
              detectedType = type;
              break;
            }
          }
        }

        const isActionAutomation = detectedType !== null && detectedType !== 'response';

        if (isActionAutomation) {
          // Montar prompt específico baseado no tipo de ação
          const typePrompts = {
            create: `
TIPO DE AÇÃO: CRIAÇÃO
- Crie novos arquivos/pastas conforme solicitado
- Preencha com conteúdo relevante e estruturado
- Use nomes descritivos e organizados
- Para planilhas: sempre adicione dados de exemplo
- Para documentos: use formatação HTML profissional`,
            
            search: `
TIPO DE AÇÃO: PESQUISA
- Busque nos arquivos e pastas existentes
- Retorne informações relevantes encontradas
- Se não encontrar, sugira criar ou informe que não existe
- Liste resultados de forma organizada`,
            
            write: `
TIPO DE AÇÃO: ESCRITA/REDAÇÃO
- Crie conteúdo textual elaborado e profissional
- Use formatação adequada (títulos, parágrafos, listas)
- Para documentos: HTML bem estruturado
- Para apresentações: slides bem organizados com conteúdo relevante`,
            
            edit: `
TIPO DE AÇÃO: EDIÇÃO
- Localize o arquivo mencionado
- Faça APENAS as modificações solicitadas
- Mantenha o resto do conteúdo intacto
- Preserve a formatação original`,
            
            delete: `
TIPO DE AÇÃO: EXCLUSÃO
- Identifique o item a ser excluído
- Marque como deleted com timestamp
- Confirme a exclusão na resposta`,
            
            analyze: `
TIPO DE AÇÃO: ANÁLISE
- Examine os arquivos/dados mencionados
- Forneça insights e observações relevantes
- Identifique padrões ou problemas
- Sugira melhorias se apropriado`
          };

          const specificPrompt = typePrompts[detectedType] || '';

          // Executar automação com ação
          const actionPrompt = `Você é uma assistente que executa comandos.

Contexto:
- Pasta atual: ${currentFolder ? currentFolder.name : 'Raiz (Meu Drive)'}
- ID da pasta: ${currentFolderId || null}
- Localização: ${currentTeamId ? `Equipe (team_id: ${currentTeamId})` : 'Meu Drive (sem equipe)'}

IMPORTANTE SOBRE EQUIPES:
- Se estiver em "Meu Drive" (sem team_id): Criar arquivos/pastas SEM team_id
- Se estiver dentro de uma pasta de equipe (tem team_id): SEMPRE incluir team_id ao criar arquivos/pastas

Equipes disponíveis: ${JSON.stringify(teams.map(t => ({ id: t.id, name: t.name })))}
Pastas existentes: ${JSON.stringify(folders.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, team_id: f.team_id || null })))}
Arquivos existentes: ${JSON.stringify(files.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, type: f.type, team_id: f.team_id || null })))}

AUTOMAÇÃO ATIVADA: "${matchedAutomation.keyword}"
Descrição: ${matchedAutomation.description || 'Não especificada'}
${specificPrompt}

Ação a executar: ${matchedAutomation.action}

FORMATO XML:
Se a ação envolver criar múltiplas pastas/arquivos organizados, você pode usar XML:
<root>
  <folder name="Nome"><file name="arquivo.docx" /></folder>
</root>

IMPORTANTE - ESTRUTURA HIERÁRQUICA COM INDENTAÇÃO:
Quando houver indentação ou traços mostrando hierarquia, INTERPRETE ASSIM:

EXEMPLO:
- Vendas
  - Clientes
    - cliente1.docx
  - Propostas
    - proposta.xlsx

INTERPRETAÇÃO CORRETA:
[
  { "action": "create_folder", "temp_ref": "Vendas_folder", "data": { "name": "Vendas" } },
  { "action": "create_folder", "temp_ref": "Clientes_folder", "data": { "name": "Clientes", "parent_id": "Vendas_folder" } },
  { "action": "create_file", "data": { "name": "cliente1.docx", "type": "docx", "folder_id": "Clientes_folder" } },
  { "action": "create_folder", "temp_ref": "Propostas_folder", "data": { "name": "Propostas", "parent_id": "Vendas_folder" } },
  { "action": "create_file", "data": { "name": "proposta.xlsx", "type": "xlsx", "folder_id": "Propostas_folder" } }
]

REGRAS:
- Pastas: temp_ref = "NomeSemEspacos_folder"
- Subpastas: parent_id = temp_ref da pasta pai
- Arquivos: folder_id = temp_ref da pasta
- Indentação = hierarquia (mais espaços = mais dentro)
- Criar pastas ANTES de conteúdos

IMPORTANTE:
- Execute EXATAMENTE a ação descrita
- Se precisar criar um arquivo, use o formato apropriado (docx, xlsx, pptx, kbn, gnt, crn)
- Para planilhas, sempre preencha com dados exemplo se não especificado
- Para documentos, use HTML formatado

IMPORTANTE: Se o usuário pedir múltiplos itens, retorne um array com múltiplas ações.
Se for apenas um item, ainda assim retorne um array com 1 ação.

Converta a ação em uma ou mais estruturas JSON executáveis em formato array.`;

          const actionSchema = {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: {
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
                        type: { type: "string", enum: ["docx", "xlsx", "pptx", "kbn", "gnt", "crn", "flux", "pdf", "img", "video"] },
                        content: { type: "string" },
                        folder_id: { type: "string" },
                        parent_id: { type: "string" },
                        team_id: { type: "string" },
                        color: { type: "string" },
                        file_id: { type: "string" },
                        id: { type: "string" },
                        temp_ref: { type: "string" }
                      }
                    },
                    temp_ref: { type: "string" }
                  },
                  required: ["action", "data"]
                }
              }
            },
            required: ["actions"]
          };

          const llmResult = await onhub.integrations.Core.InvokeLLM({
            prompt: actionPrompt,
            response_json_schema: actionSchema
          });

          if (llmResult && llmResult.actions && llmResult.actions.length > 0) {
            const results = [];
            const tempRefs = {}; // Armazena ID real de pastas criadas
            
            for (const actionItem of llmResult.actions) {
              try {
                // Substituir referências temporárias por IDs reais
                if (actionItem.data.parent_id && tempRefs[actionItem.data.parent_id]) {
                  actionItem.data.parent_id = tempRefs[actionItem.data.parent_id];
                }
                
                if (actionItem.data.folder_id && tempRefs[actionItem.data.folder_id]) {
                  actionItem.data.folder_id = tempRefs[actionItem.data.folder_id];
                }
                
                // Validar se parent_id/folder_id são IDs reais existentes ou null
                if (actionItem.data.parent_id && !actionItem.data.parent_id.match(/^[a-f0-9]{24}$/)) {
                  console.warn('⚠️ parent_id inválido ou não resolvido:', actionItem.data.parent_id);
                  actionItem.data.parent_id = currentFolderId;
                }
                
                if (actionItem.data.folder_id && !actionItem.data.folder_id.match(/^[a-f0-9]{24}$/)) {
                  console.warn('⚠️ folder_id inválido ou não resolvido:', actionItem.data.folder_id);
                  actionItem.data.folder_id = currentFolderId;
                }
                
                const result = await executeAction(actionItem, folders, files);
                results.push({ action: actionItem, result, success: true });
                
                // Armazenar ID real da pasta criada
                if (actionItem.action === 'create_folder' && actionItem.temp_ref && result?.id) {
                  tempRefs[actionItem.temp_ref] = result.id;
                  console.log(`✓ Mapeado ${actionItem.temp_ref} → ${result.id}`);
                }
              } catch (error) {
                console.error('❌ Erro ao executar ação:', error);
                results.push({ action: actionItem, error: error.message, success: false });
              }
            }

            await queryClient.invalidateQueries({ queryKey: ['files'] });
            await queryClient.invalidateQueries({ queryKey: ['folders'] });

            const successCount = results.filter(r => r.success).length;
            const errorCount = results.filter(r => !r.success).length;
            
            let statusMessage = `✓ ${successCount} item(ns) criado(s) com sucesso`;
            if (errorCount > 0) {
              statusMessage += `\n⚠️ ${errorCount} erro(s) encontrado(s)`;
            }
            
            const successMessage = { 
              role: 'assistant', 
              content: statusMessage,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, successMessage]);

            // Só navegar se for uma única ação
            if (results.length === 1) {
              const singleAction = results[0];
              setTimeout(() => {
                if (singleAction.action.action === 'create_file' && singleAction.result?.id) {
                  window.location.href = createPageUrl(`FileViewer?id=${singleAction.result.id}`);
                } else if (singleAction.action.action === 'create_folder' && singleAction.result?.id) {
                  window.location.href = createPageUrl(`Drive?folder=${singleAction.result.id}`);
                } else {
                  window.location.reload();
                }
              }, 1200);
            } else {
              // Múltiplas ações: apenas recarregar
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            }
          }
        } else {
          // Resposta simples de automação
          const assistantMessage = { 
            role: 'assistant', 
            content: matchedAutomation.action
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
        setLoading(false);
        return;
      }
      
      // Detectar se é XML
      const isXML = input.trim().startsWith('<root>') && input.trim().endsWith('</root>');

      if (isXML) {
        // Processar XML diretamente
        try {
          const llmResult = parseXMLStructure(input);

          if (llmResult && llmResult.actions && llmResult.actions.length > 0) {
            const results = [];
            const tempRefs = {};

            // Pegar o team_id da pasta atual se houver
            const currentTeamId = getFolderTeam(currentFolderId);

            for (const actionItem of llmResult.actions) {
              // Substituir referências temporárias por IDs reais
              if (actionItem.data.parent_id && tempRefs[actionItem.data.parent_id]) {
                actionItem.data.parent_id = tempRefs[actionItem.data.parent_id];
              } else if (!actionItem.data.parent_id) {
                // Se não tem parent_id, usar a pasta atual
                actionItem.data.parent_id = currentFolderId;
              }

              if (actionItem.data.folder_id && tempRefs[actionItem.data.folder_id]) {
                actionItem.data.folder_id = tempRefs[actionItem.data.folder_id];
              } else if (!actionItem.data.folder_id && actionItem.action === 'create_file') {
                // Se não tem folder_id, usar a pasta atual
                actionItem.data.folder_id = currentFolderId;
              }

              // Adicionar team_id se estiver em uma pasta de equipe
              if (currentTeamId) {
                actionItem.data.team_id = currentTeamId;
              }

              // Adicionar owner
              actionItem.data.owner = user.email;

              try {
                const result = await executeAction(actionItem, folders, files);
                results.push({ action: actionItem, result, success: true });

                if (actionItem.action === 'create_folder' && actionItem.temp_ref && result?.id) {
                  tempRefs[actionItem.temp_ref] = result.id;
                }
              } catch (error) {
                console.error('Erro ao executar ação:', error);
                results.push({ action: actionItem, error: error.message, success: false });
              }
            }

            await queryClient.invalidateQueries({ queryKey: ['files'] });
            await queryClient.invalidateQueries({ queryKey: ['folders'] });

            const successCount = results.filter(r => r.success).length;
            const errorCount = results.filter(r => !r.success).length;

            let message = `✓ XML executado: ${successCount} item(ns) criado(s)`;
            if (errorCount > 0) {
              message += `\n⚠️ ${errorCount} erro(s) encontrado(s)`;
            }

            const successMessage = { 
              role: 'assistant', 
              content: message
            };
            setMessages(prev => [...prev, successMessage]);

            setTimeout(() => window.location.reload(), 1500);
          } else {
            const errorMessage = { 
              role: 'assistant', 
              content: '❌ XML vazio ou inválido.' 
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } catch (error) {
          console.error('Erro ao processar XML:', error);
          const errorMessage = { 
            role: 'assistant', 
            content: `❌ Erro ao processar XML: ${error.message}` 
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        setLoading(false);
        return;
      }

      // Detectar se é uma ação ou conversa
      const actionKeywords = ['crie', 'criar', 'faça', 'fazer', 'gere', 'gerar', 'adicione', 'adicionar', 'delete', 'deletar', 'exclua', 'excluir', 'edite', 'editar', 'atualize', 'atualizar', 'remova', 'remover', 'mova', 'mover', 'mude', 'mudar', 'altere', 'alterar', 'troque', 'trocar', 'substitua', 'substituir', 'monte', 'montar', 'estrutura', 'estruture', 'planilha', 'documento', 'pasta', 'arquivo', 'adiciona', 'monta'];
      const isAction = actionKeywords.some(keyword => input.toLowerCase().includes(keyword));
      
      console.log('🔍 Detectando tipo:', { input, isAction, actionKeywords: actionKeywords.filter(k => input.toLowerCase().includes(k)) });

      // Histórico das últimas mensagens para contexto
      const recentMessages = messages.slice(-9); // Últimas 9 + a atual = 10
      const conversationHistory = recentMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

      if (isAction) {
        // Usar InvokeLLM com JSON schema para forçar estrutura
        // Buscar o arquivo atual se estiver na página FileViewer
        const currentFile = openFileId ? files.find(f => f.id === openFileId) : null;

        const actionPrompt = `Você é uma assistente que executa comandos.

Histórico da conversa:
${conversationHistory}

Contexto:
- Página atual: ${currentPage}
- Pasta atual: ${currentFolder ? currentFolder.name : 'Raiz (Meu Drive)'}
- ID da pasta: ${currentFolderId || null}
- Localização: ${currentTeamId ? `Equipe (team_id: ${currentTeamId})` : 'Meu Drive (sem equipe)'}
${currentFile ? `\n📄 ARQUIVO ABERTO AGORA: "${currentFile.name}" (ID: ${currentFile.id}, Tipo: ${currentFile.type})\n📝 CONTEÚDO COMPLETO ATUAL:\n${currentFile.content || '(vazio)'}\n\n⚠️ IMPORTANTE: Quando o usuário pedir para editar/mudar/corrigir algo neste arquivo, você DEVE usar "edit_file" com file_id: "${currentFile.id}"` : ''}

IMPORTANTE SOBRE EQUIPES:
- Se estiver em "Meu Drive" (sem team_id): Criar arquivos/pastas SEM team_id
- Se estiver dentro de uma pasta de equipe (tem team_id): SEMPRE incluir team_id ao criar arquivos/pastas

Equipes disponíveis: ${JSON.stringify(teams.map(t => ({ id: t.id, name: t.name })))}
Pastas existentes: ${JSON.stringify(folders.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, team_id: f.team_id || null })))}
Arquivos existentes: ${JSON.stringify(files.filter(f => !f.deleted).map(f => ({ id: f.id, name: f.name, type: f.type, team_id: f.team_id || null })))}

Permissões:
- Criar pastas: ${user?.assistant_can_create_folders !== false}
- Criar arquivos: ${user?.assistant_can_create_files !== false}
- Editar arquivos: ${user?.assistant_can_edit_files !== false}
- Excluir itens: ${user?.assistant_can_delete_items !== false}

Comando do usuário: "${input}"

⚠️⚠️⚠️ ALERTA CRÍTICO SOBRE PLANILHAS ⚠️⚠️⚠️
Se o usuário pediu para criar uma planilha (xlsx, excel, spreadsheet):
- VOCÊ ESTÁ PROIBIDO de criar planilhas vazias
- VOCÊ DEVE SEMPRE preencher com dados relevantes
- Mínimo 5 linhas de dados + cabeçalho
- Formato CSV com vírgulas e \\n
- Exemplo: "Categoria,Valor\\nItem 1,100\\nItem 2,200"

IMPORTANTE - FORMATO XML PARA ESTRUTURAS COMPLEXAS:
Se o usuário pedir para "montar", "estruturar" ou "gerar código/xml", você deve PRIMEIRO criar um XML estruturado e retornar na conversa para o usuário visualizar, SEM executar ainda.

Use este formato XML:
<root>
  <folder name="Nome da Pasta">
    <file name="arquivo.docx" />
    <folder name="Subpasta">
      <file name="outro.xlsx" />
    </folder>
  </folder>
</root>

O XML será executado automaticamente quando o usuário colar de volta no chat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGRA CRÍTICA: ESTRUTURA HIERÁRQUICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quando o usuário enviar estrutura com indentação, barras (/) ou traços (├──, │):

EXEMPLO DO USUÁRIO:
EMPRESA/
├── Administrativo/
│   ├── Contratos/
│   │   ├── Contrato_Social.docx
│   │   └── Contratos_Fornecedores.docx
│   └── Atas/
│       └── Ata_2024.docx
└── Financeiro/
    └── Relatorio.xlsx

📋 COMO VOCÊ DEVE INTERPRETAR (ordem exata):

1️⃣ Criar EMPRESA (pasta raiz)
   temp_ref: "EMPRESA_folder"
   parent_id: null (ou currentFolderId se já estiver em pasta)

2️⃣ Criar Administrativo DENTRO de EMPRESA
   temp_ref: "Administrativo_folder"
   parent_id: "EMPRESA_folder" ← REFERÊNCIA À PASTA PAI

3️⃣ Criar Contratos DENTRO de Administrativo
   temp_ref: "Contratos_folder"
   parent_id: "Administrativo_folder" ← REFERÊNCIA À PASTA PAI

4️⃣ Criar Contrato_Social.docx DENTRO de Contratos
   folder_id: "Contratos_folder" ← REFERÊNCIA À PASTA ONDE FICA

5️⃣ Criar Contratos_Fornecedores.docx DENTRO de Contratos
   folder_id: "Contratos_folder"

6️⃣ Criar Atas DENTRO de Administrativo
   temp_ref: "Atas_folder"
   parent_id: "Administrativo_folder" ← VOLTA PARA ADMINISTRATIVO

7️⃣ Criar Ata_2024.docx DENTRO de Atas
   folder_id: "Atas_folder"

8️⃣ Criar Financeiro DENTRO de EMPRESA
   temp_ref: "Financeiro_folder"
   parent_id: "EMPRESA_folder" ← VOLTA PARA EMPRESA

9️⃣ Criar Relatorio.xlsx DENTRO de Financeiro
   folder_id: "Financeiro_folder"

JSON FINAL QUE VOCÊ DEVE RETORNAR:
{
  "actions": [
    { "action": "create_folder", "temp_ref": "EMPRESA_folder", "data": { "name": "EMPRESA", "parent_id": null }},
    { "action": "create_folder", "temp_ref": "Administrativo_folder", "data": { "name": "Administrativo", "parent_id": "EMPRESA_folder" }},
    { "action": "create_folder", "temp_ref": "Contratos_folder", "data": { "name": "Contratos", "parent_id": "Administrativo_folder" }},
    { "action": "create_file", "data": { "name": "Contrato_Social.docx", "type": "docx", "folder_id": "Contratos_folder" }},
    { "action": "create_file", "data": { "name": "Contratos_Fornecedores.docx", "type": "docx", "folder_id": "Contratos_folder" }},
    { "action": "create_folder", "temp_ref": "Atas_folder", "data": { "name": "Atas", "parent_id": "Administrativo_folder" }},
    { "action": "create_file", "data": { "name": "Ata_2024.docx", "type": "docx", "folder_id": "Atas_folder" }},
    { "action": "create_folder", "temp_ref": "Financeiro_folder", "data": { "name": "Financeiro", "parent_id": "EMPRESA_folder" }},
    { "action": "create_file", "data": { "name": "Relatorio.xlsx", "type": "xlsx", "folder_id": "Financeiro_folder" }}
  ]
}

🔴 REGRAS ABSOLUTAS:
1. temp_ref = nome sem espaços + "_folder" (ex: "Minha_Pasta_folder")
2. Pasta dentro de outra = parent_id = temp_ref da pasta pai
3. Arquivo dentro de pasta = folder_id = temp_ref da pasta
4. A ordem importa: SEMPRE crie a pasta PAI antes dos filhos
5. Se tem extensão (.docx, .xlsx) = arquivo, senão = pasta
6. NUNCA use folder_id ou parent_id com valores que ainda não existem no temp_ref

IMPORTANTE:
- Planilha/Excel = type: "xlsx", SEMPRE preencha com dados CSV se o usuário pediu dados
- Documento/Word/Texto = type: "docx", SEMPRE use HTML formatado no content
- Apresentação/PowerPoint = type: "pptx", use o formato JSON de slides
- Kanban = type: "kbn"
- Gantt = type: "gnt"
- Cronograma = type: "crn"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGRA INQUEBRÁVEL: PLANILHAS (type: xlsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SE O TIPO FOR "xlsx" (PLANILHA/EXCEL):
→ É PROIBIDO deixar content vazio ou apenas com cabeçalho
→ SEMPRE criar com dados completos e relevantes
→ Mínimo: 1 linha de cabeçalho + 5 linhas de dados

FORMATO OBRIGATÓRIO:
"content": "Coluna1,Coluna2,Coluna3\\nValor1,Valor2,Valor3\\nValor4,Valor5,Valor6"

EXEMPLO EXATO que você DEVE seguir:
{
  "action": "create_file",
  "data": {
    "name": "Controle Financeiro.xlsx",
    "type": "xlsx",
    "content": "Categoria,Janeiro,Fevereiro,Março\\nReceitas,15000,18000,16500\\nDespesas,8000,9000,8500\\nAluguel,2000,2000,2000\\nSalários,4000,4000,4000\\nLucro,1000,3000,2000"
  }
}

Se usuário pedir "controle financeiro pequena empresa":
"content": "Categoria,Mês 1,Mês 2,Mês 3\\nReceitas,5000,6000,5500\\nCustos,-1500,-1600,-1550\\nDespesas Fixas,-2000,-2000,-2000\\nMarketing,-500,-600,-550\\nLucro,1000,1800,1400"

SE NÃO HOUVER CONTENT COM DADOS = ERRO GRAVE!

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
${currentFile ? `
⚠️ O USUÁRIO ESTÁ COM O ARQUIVO "${currentFile.name}" ABERTO AGORA!
Quando ele pedir "corrija", "mude", "adicione", "tire", "edite" ou similares, ele está se referindo a ESTE arquivo!

Exemplo de edição:
{
  "action": "edit_file",
  "data": {
    "file_id": "${currentFile.id}",
    "content": "NOVO_CONTEUDO_COMPLETO_COM_AS_ALTERACOES"
  }
}

IMPORTANTE para edições:
- SEMPRE use o conteúdo atual completo como base
- Faça APENAS as alterações solicitadas pelo usuário
- Mantenha toda a formatação original
- Para documentos docx: mantenha TODO o HTML e faça apenas a mudança pedida
- Para planilhas xlsx: mantenha o formato array de arrays
- Para Kanban/Gantt/Cronograma/FluxMap: mantenha a estrutura JSON completa
- Retorne o conteúdo COMPLETO modificado no campo content
` : `
Se houver um arquivo aberto e o usuário pedir para mudar/editar algo nele:
{
  "action": "edit_file",
  "data": {
    "file_id": "ID_DO_ARQUIVO_ABERTO",
    "content": "NOVO_CONTEUDO_COMPLETO_COM_AS_ALTERACOES"
  }
}`}

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

CRIAR CARDS NO FLUXMAP ABERTO:
${currentFile && currentFile.type === 'flux' ? `
⚠️ FLUXMAP ESTÁ ABERTO! Para criar cards conectados:
{
  "action": "edit_file",
  "data": {
    "file_id": "${currentFile.id}",
    "content": {
      "drawflow": {
        "Home": {
          "data": {
            "1": {
              "id": 1,
              "name": "card",
              "data": {
                "title": "Card 1",
                "description": "Descrição do card 1",
                "priority": "medium",
                "cover": { "type": "color", "value": "#3b82f6" }
              },
              "class": "card",
              "html": "...",
              "typenode": false,
              "inputs": {},
              "outputs": { "output_1": { "connections": [{ "node": "2", "output": "input_1" }] } },
              "pos_x": 100,
              "pos_y": 100
            },
            "2": {
              "id": 2,
              "name": "card",
              "data": {
                "title": "Card 2",
                "description": "Descrição do card 2",
                "priority": "high"
              },
              "class": "card",
              "html": "...",
              "typenode": false,
              "inputs": { "input_1": { "connections": [{ "node": "1", "input": "output_1" }] } },
              "outputs": {},
              "pos_x": 400,
              "pos_y": 100
            }
          }
        }
      }
    }
  }
}
` : ''}

FORMATAÇÃO DE APRESENTAÇÕES (type: pptx):
Use formato JSON com estrutura de slides:

Exemplo de apresentação:
{
  "action": "create_file",
  "data": {
    "name": "Apresentação Vendas",
    "type": "pptx",
    "content": "{\\"slides\\":[{\\"background\\":\\"#ffffff\\",\\"elements\\":[{\\"id\\":\\"1\\",\\"type\\":\\"title\\",\\"content\\":\\"Resultados de Vendas\\",\\"x\\":100,\\"y\\":250,\\"width\\":1000,\\"height\\":100,\\"fontSize\\":48,\\"fontWeight\\":\\"bold\\",\\"color\\":\\"#1e293b\\"}]},{\\"background\\":\\"#f8fafc\\",\\"elements\\":[{\\"id\\":\\"2\\",\\"type\\":\\"title\\",\\"content\\":\\"Principais Indicadores\\",\\"x\\":100,\\"y\\":50,\\"width\\":1000,\\"height\\":80,\\"fontSize\\":36,\\"fontWeight\\":\\"bold\\",\\"color\\":\\"#1e293b\\"},{\\"id\\":\\"3\\",\\"type\\":\\"text\\",\\"content\\":\\"Crescimento de 35% no trimestre\\",\\"x\\":100,\\"y\\":200,\\"width\\":1000,\\"height\\":60,\\"fontSize\\":24,\\"color\\":\\"#475569\\"}]}]}"
  }
}

Estrutura do JSON de slides:
{
  "slides": [
    {
      "background": "#ffffff" ou "url(https://...)",
      "elements": [
        {
          "id": "único_id",
          "type": "title" | "text" | "image" | "shape",
          "content": "texto do elemento",
          "x": 100,
          "y": 100,
          "width": 400,
          "height": 100,
          "fontSize": 24,
          "fontWeight": "bold" | "normal",
          "color": "#000000",
          "backgroundColor": "#ffffff" (para shapes)
        }
      ]
    }
  ]
}

IMPORTANTE para apresentações:
- SEMPRE crie pelo menos 3 slides
- Slide 1: Título principal (title, fontSize: 48)
- Slides seguintes: Conteúdo com title + text
- Use cores harmônicas
- Posicione elementos de forma organizada

IMPORTANTE: Se o usuário pedir múltiplos itens (ex: "crie 3 pastas", "crie pasta X e arquivo Y"), retorne um array com múltiplas ações.
Se for apenas um item, ainda assim retorne um array com 1 ação.

Converta o comando em uma ou mais ações estruturadas em formato array.`;

        const actionSchema = {
          type: "object",
          properties: {
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["create_folder", "create_file", "edit_file", "delete_item"]
                  },
                  temp_ref: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", enum: ["docx", "xlsx", "pptx", "kbn", "gnt", "crn", "flux", "pdf", "img", "video"] },
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
              }
            }
          },
          required: ["actions"]
        };

        // Ativar modo terminal ANTES de chamar LLM
        setTerminalMode(true);
        
        const llmResult = await onhub.integrations.Core.InvokeLLM({
          prompt: actionPrompt,
          response_json_schema: actionSchema
        });
        
        console.log('📋 LLM retornou ações:', JSON.stringify(llmResult, null, 2));

        if (llmResult && llmResult.actions && llmResult.actions.length > 0) {
          const results = [];
          const tempRefs = {}; // Armazena ID real de pastas criadas

          console.log('📦 Iniciando processamento de', llmResult.actions.length, 'ações');
          console.log('📋 Ações recebidas:', JSON.stringify(llmResult.actions, null, 2));

          for (const actionItem of llmResult.actions) {
            try {
              console.log('\n🔄 Processando:', actionItem.action, actionItem.data.name);
              console.log('   temp_ref:', actionItem.temp_ref);
              console.log('   parent_id original:', actionItem.data.parent_id);
              console.log('   folder_id original:', actionItem.data.folder_id);

              // Substituir referências temporárias por IDs reais
              if (actionItem.data.parent_id) {
                if (tempRefs[actionItem.data.parent_id]) {
                  const resolvedId = tempRefs[actionItem.data.parent_id];
                  console.log(`   ✓ Resolvendo parent_id: ${actionItem.data.parent_id} → ${resolvedId}`);
                  actionItem.data.parent_id = resolvedId;
                } else if (actionItem.data.parent_id.match(/^[a-f0-9]{24}$/)) {
                  // Já é um ID real válido, manter
                  console.log(`   ℹ️ parent_id já é ID real: ${actionItem.data.parent_id}`);
                } else {
                  // Não é ID válido e não está nos tempRefs - usar pasta atual
                  console.warn(`   ⚠️ parent_id "${actionItem.data.parent_id}" não foi resolvido! Usando currentFolderId: ${currentFolderId}`);
                  actionItem.data.parent_id = currentFolderId;
                }
              }

              if (actionItem.data.folder_id) {
                if (tempRefs[actionItem.data.folder_id]) {
                  const resolvedId = tempRefs[actionItem.data.folder_id];
                  console.log(`   ✓ Resolvendo folder_id: ${actionItem.data.folder_id} → ${resolvedId}`);
                  actionItem.data.folder_id = resolvedId;
                } else if (actionItem.data.folder_id.match(/^[a-f0-9]{24}$/)) {
                  // Já é um ID real válido, manter
                  console.log(`   ℹ️ folder_id já é ID real: ${actionItem.data.folder_id}`);
                } else {
                  // CRÍTICO: Não é ID válido e não está nos tempRefs
                  console.error(`   ❌ ERRO CRÍTICO: folder_id "${actionItem.data.folder_id}" NÃO RESOLVIDO!`);
                  console.error(`   📍 tempRefs disponíveis:`, Object.keys(tempRefs));
                  console.error(`   🔄 Usando currentFolderId como fallback: ${currentFolderId}`);
                  actionItem.data.folder_id = currentFolderId;
                }
              }

              // Se não tem folder_id especificado e estamos em uma pasta, usar a pasta atual
              if (actionItem.action === 'create_file' && !actionItem.data.folder_id) {
                actionItem.data.folder_id = currentFolderId;
                console.log(`   ℹ️ Arquivo sem folder_id, usando pasta atual: ${currentFolderId}`);
              }

              // Se estamos em uma pasta de equipe, herdar o team_id
              if (currentTeamId && !actionItem.data.team_id) {
                actionItem.data.team_id = currentTeamId;
              }

              let actionResult;
              // Se a ação é edit_file e temos callback de terminal, executar via terminal
              if (actionItem.action === 'edit_file' && onExecuteTerminalCommand && openFileId) {
                const commands = generateTerminalCommands(actionItem, fileType);
                for (const cmd of commands) {
                  if (onExecuteTerminalCommand) {
                    await onExecuteTerminalCommand(cmd);
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                }
                actionResult = { success: true, method: 'terminal' };
                results.push({ action: actionItem, result: actionResult, success: true });
              } else {
                console.log('   ⚙️ Executando com dados finais:', {
                  name: actionItem.data.name,
                  parent_id: actionItem.data.parent_id,
                  folder_id: actionItem.data.folder_id,
                  team_id: actionItem.data.team_id
                });
                actionResult = await executeAction(actionItem, folders, files);
                console.log('   ✅ Criado com ID:', actionResult?.id);
                results.push({ action: actionItem, result: actionResult, success: true });
              }

              // Armazenar ID real da pasta criada IMEDIATAMENTE
              if (actionItem.action === 'create_folder' && actionItem.temp_ref && actionResult?.id) {
                tempRefs[actionItem.temp_ref] = actionResult.id;
                console.log(`   ✓✓✓ MAPEADO: ${actionItem.temp_ref} → ${actionResult.id}`);
                console.log('   📍 tempRefs atuais:', tempRefs);
              }
            } catch (error) {
              console.error('   ❌ ERRO:', error.message);
              results.push({ action: actionItem, error: error.message, success: false });
            }
          }

          // Desligar modo terminal
          setTerminalMode(false);
          
          // Invalidar queries antes de navegar
          await queryClient.invalidateQueries({ queryKey: ['files'] });
          await queryClient.invalidateQueries({ queryKey: ['folders'] });

          const successCount = results.filter(r => r.success).length;
          const errorCount = results.filter(r => !r.success).length;
          
          let statusMessage = `✓ ${successCount} item(ns) criado(s) com sucesso`;
          if (errorCount > 0) {
            statusMessage += `\n⚠️ ${errorCount} erro(s) encontrado(s)`;
          }
          
          const successMessage = { 
            role: 'assistant', 
            content: statusMessage,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, successMessage]);
          
          console.log('✅ Ações concluídas com sucesso!');

          // Só navegar se for uma única ação
          if (results.length === 1) {
            const singleAction = results[0];
            setTimeout(() => {
              if (singleAction.action.action === 'create_file' && singleAction.result?.id) {
                window.location.href = createPageUrl(`FileViewer?id=${singleAction.result.id}`);
              } else if (singleAction.action.action === 'create_folder' && singleAction.result?.id) {
                window.location.href = createPageUrl(`Drive?folder=${singleAction.result.id}`);
              } else {
                window.location.reload();
              }
            }, 1200);
          } else {
            // Múltiplas ações: apenas recarregar
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      } else {
        // Conversa normal
        const contextInfo = fileContext 
          ? `\n\nArquivo aberto: ${fileType}`
          : '';

        // Criar lista detalhada de pastas com caminho completo
        const buildFolderPath = (folderId) => {
          if (!folderId) return 'Raiz';
          const folder = folders.find(f => f.id === folderId);
          if (!folder) return 'Desconhecido';
          const parentPath = buildFolderPath(folder.parent_id);
          return parentPath === 'Raiz' ? folder.name : `${parentPath} > ${folder.name}`;
        };

        const foldersInfo = folders
          .filter(f => !f.deleted)
          .map(f => ({
            id: f.id,
            name: f.name,
            path: buildFolderPath(f.parent_id),
            team: f.team_id ? teams.find(t => t.id === f.team_id)?.name : 'Meu Drive',
            owner: f.owner
          }));

        const filesInfo = files
          .filter(f => !f.deleted)
          .map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            path: buildFolderPath(f.folder_id),
            team: f.team_id ? teams.find(t => t.id === f.team_id)?.name : 'Meu Drive',
            content_preview: f.content ? f.content.substring(0, 500) : '(vazio)',
            owner: f.owner
          }));

        const chatPrompt = `${getSystemPrompt()}

Você está conversando com o usuário sobre o app Keeping.

Histórico da conversa:
${conversationHistory}

Localização atual: ${currentFolder ? currentFolder.name : 'Raiz'}
${contextInfo}

INFORMAÇÕES COMPLETAS DO DRIVE:

PASTAS DISPONÍVEIS (${foldersInfo.length} pastas):
${JSON.stringify(foldersInfo, null, 2)}

ARQUIVOS DISPONÍVEIS (${filesInfo.length} arquivos):
${JSON.stringify(filesInfo, null, 2)}

EQUIPES DO USUÁRIO:
${JSON.stringify(teams.filter(t => t.members && t.members.includes(user.email)).map(t => ({ id: t.id, name: t.name, members: t.members })), null, 2)}

IMPORTANTE:
- Você tem acesso a TODOS os arquivos e pastas listados acima
- Você pode ver o conteúdo parcial (preview) de cada arquivo
- Você sabe onde cada arquivo/pasta está localizado
- Você sabe a qual equipe cada item pertence
- Use essas informações para responder perguntas sobre organização, localização e conteúdo

FORMATO DE RESPOSTA COM LINKS:
- Quando mencionar uma PASTA, use: [PASTA:id:nome]
- Quando mencionar um ARQUIVO, use: [ARQUIVO:id:nome]
- Exemplo: "Encontrei a pasta [PASTA:${foldersInfo[0]?.id || 'id'}:Marketing] com 3 arquivos"
- Exemplo: "O arquivo [ARQUIVO:${filesInfo[0]?.id || 'id'}:Relatório Vendas] está na pasta X"

Responda de forma natural e amigável em português. Use o formato de links sempre que mencionar pastas ou arquivos específicos.

Usuário: ${input}`;

        const chatResult = await onhub.integrations.Core.InvokeLLM({
          prompt: chatPrompt
        });

        const assistantMessage = { 
          role: 'assistant', 
          content: chatResult || 'Desculpe, não consegui processar sua mensagem.',
          folders: foldersInfo,
          files: filesInfo,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação.',
        timestamp: Date.now()
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
      console.log('Criando pasta:', data);
      const result = await onhub.entities.Folder.create({
        name: data.name,
        parent_id: data.parent_id || null,
        team_id: data.team_id || null,
        color: data.color || 'bg-blue-500',
        owner: data.owner || user.email,
      });
      console.log('Pasta criada:', result);
      return result;
    } else if (action === 'create_file' && user?.assistant_can_create_files !== false) {
      console.log('Criando arquivo:', data);
      console.log('Pasta de destino:', data.folder_id);
      console.log('Team ID:', data.team_id);
      
      // Conteúdo padrão rico para cada tipo
      const defaultContent = {
        kbn: JSON.stringify({ columns: [], cards: [] }),
        gnt: JSON.stringify({ tasks: [] }),
        crn: JSON.stringify({ groups: [], items: [] }),
        flux: JSON.stringify({ drawflow: { Home: { data: {} } } }),
        pptx: data.content || JSON.stringify({ slides: [{ background: '#ffffff', elements: [] }] }),
        docx: data.content || '<h1><strong>Documento de Exemplo</strong></h1><p>Este é um documento criado automaticamente. Edite conforme necessário.</p>',
        xlsx: data.content || 'Item,Descrição,Valor\nItem 1,Descrição do item 1,100\nItem 2,Descrição do item 2,200\nItem 3,Descrição do item 3,300\nTotal,Total dos itens,600',
      };
      
      // Validação especial para planilhas
      let finalContent = data.content || defaultContent[data.type] || '';
      if (data.type === 'xlsx') {
        // Verificar se tem dados suficientes
        const lines = finalContent.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          console.warn('⚠️ Planilha sem dados suficientes, usando default rico');
          finalContent = 'Categoria,Janeiro,Fevereiro,Março,Total\nReceitas,5000,6000,5500,16500\nDespesas,3000,3200,3100,9300\nAluguel,1000,1000,1000,3000\nSalários,1500,1500,1500,4500\nLucro,500,1300,900,2700';
        }
        console.log('📊 Planilha criada com', lines.length, 'linhas');
      }
      
      const result = await onhub.entities.File.create({
        name: data.name,
        type: data.type,
        folder_id: data.folder_id || null,
        team_id: data.team_id || null,
        content: finalContent,
        owner: data.owner || user.email,
      });
      console.log('✅ Arquivo criado com sucesso:', result.id);
      return result;
    } else if (action === 'edit_file' && user?.assistant_can_edit_files !== false) {
      const result = await onhub.entities.File.update(data.file_id, {
        content: typeof data.content === 'object' ? JSON.stringify(data.content) : data.content,
      });
      setTimeout(() => window.location.reload(), 800);
      return result;
    } else if (action === 'delete_item' && user?.assistant_can_delete_items !== false) {
      if (data.type === 'folder') {
        return await onhub.entities.Folder.update(data.id, { deleted: true, deleted_at: new Date().toISOString() });
      } else if (data.type === 'file') {
        return await onhub.entities.File.update(data.id, { deleted: true, deleted_at: new Date().toISOString() });
      }
    } else {
      throw new Error('Permissão negada para esta ação');
    }
  };

  const generateTerminalCommands = (actionItem, fileType) => {
    const commands = [];
    const { action, data } = actionItem;
    
    if (action !== 'edit_file') return commands;
    
    // Para cada tipo de arquivo, gerar comandos específicos baseado nas mudanças
    // Esta é uma simplificação - na prática seria mais sofisticado
    switch (fileType) {
      case 'docx':
        if (data.content) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.content;
          const paragraphs = tempDiv.querySelectorAll('p, h1, h2, h3');
          paragraphs.forEach(p => {
            if (p.tagName.startsWith('H')) {
              const level = p.tagName[1];
              commands.push(`add-heading ${level} ${p.textContent}`);
            } else {
              commands.push(`add-text ${p.textContent}`);
            }
          });
        }
        break;
      
      case 'xlsx':
        if (data.content) {
          const lines = data.content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              commands.push(`add-row ${line}`);
            }
          });
        }
        break;
      
      case 'kbn':
        // Kanban commands
        break;
      
      case 'flux':
        // FluxMap commands
        break;
    }
    
    return commands;
  };

  const renderMessageContent = (message) => {
    if (!message.content) return null;
    
    let content = message.content;
    const parts = [];
    let lastIndex = 0;

    // Regex para encontrar [PASTA:id:nome] e [ARQUIVO:id:nome]
    const regex = /\[(PASTA|ARQUIVO):([^:]+):([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // Adicionar link
      const [, type, id, name] = match;
      parts.push({
        type: 'link',
        linkType: type,
        id,
        name
      });

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    if (parts.length === 0) {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }

    return (
      <p className="text-sm whitespace-pre-wrap">
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <span key={idx}>{part.content}</span>;
          } else {
            const url = part.linkType === 'PASTA' 
              ? createPageUrl(`Drive?folder=${part.id}`)
              : createPageUrl(`FileViewer?id=${part.id}`);
            
            return (
              <a
                key={idx}
                href={url}
                className="text-blue-600 hover:text-blue-800 underline font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = url;
                }}
              >
                {part.name}
              </a>
            );
          }
        })}
      </p>
    );
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
      className={`fixed bottom-6 right-6 rounded-2xl shadow-2xl border z-50 flex flex-col transition-all ${
        terminalMode ? 'bg-gray-900 border-green-500' : 'bg-white border-gray-200'
      } ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b rounded-t-2xl ${
        terminalMode 
          ? 'bg-gray-800 border-gray-700 text-green-400' 
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            <img 
              src={avatarUrl} 
              alt="Assistente"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold font-mono">{terminalMode ? 'TERMINAL MODE' : (user?.assistant_name || 'Assistente Virtual')}</h3>
            <p className={`text-xs ${terminalMode ? 'text-green-300' : 'text-white/80'}`}>
              {terminalMode ? 'Executando comandos...' : (user?.assistant_role || 'Online')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${terminalMode ? 'text-green-400 hover:bg-gray-700' : 'text-white hover:bg-white/20'}`}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${terminalMode ? 'text-green-400 hover:bg-gray-700' : 'text-white hover:bg-white/20'}`}
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${terminalMode ? 'bg-black' : ''}`}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    terminalMode 
                      ? (msg.role === 'user' ? 'bg-gray-800 text-green-400 border border-green-500' : 'bg-gray-900 text-green-300 border border-green-700')
                      : (msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800')
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-2 ${terminalMode ? 'bg-gray-900 border border-green-700' : 'bg-gray-100'}`}>
                  <Loader2 className={`w-4 h-4 animate-spin ${terminalMode ? 'text-green-400' : 'text-gray-600'}`} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${terminalMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
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
