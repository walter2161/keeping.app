import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
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

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Buscar todas as pastas, arquivos e equipes para contexto
      const folders = await base44.entities.Folder.list();
      const files = await base44.entities.File.list();
      const teams = await base44.entities.Team.list();
      
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

          const llmResult = await base44.integrations.Core.InvokeLLM({
            prompt: actionPrompt,
            response_json_schema: actionSchema
          });

          if (llmResult && llmResult.actions && llmResult.actions.length > 0) {
            const results = [];
            const tempRefs = {}; // Armazena ID real de pastas criadas
            
            for (const actionItem of llmResult.actions) {
              // Substituir referências temporárias por IDs reais
              if (actionItem.data.parent_id && tempRefs[actionItem.data.parent_id]) {
                actionItem.data.parent_id = tempRefs[actionItem.data.parent_id];
              }
              
              if (actionItem.data.folder_id && tempRefs[actionItem.data.folder_id]) {
                actionItem.data.folder_id = tempRefs[actionItem.data.folder_id];
              }
              
              const result = await executeAction(actionItem, folders, files);
              results.push({ action: actionItem, result });
              
              // Armazenar ID real da pasta criada
              if (actionItem.action === 'create_folder' && actionItem.temp_ref && result?.id) {
                tempRefs[actionItem.temp_ref] = result.id;
              }
            }

            await queryClient.invalidateQueries({ queryKey: ['files'] });
            await queryClient.invalidateQueries({ queryKey: ['folders'] });

            const successMessages = results.map(r => getActionSuccessMessage(r.action)).join('\n');
            const successMessage = { 
              role: 'assistant', 
              content: `✓ Automação executada:\n${successMessages}` 
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

            for (const actionItem of llmResult.actions) {
              if (actionItem.data.parent_id && tempRefs[actionItem.data.parent_id]) {
                actionItem.data.parent_id = tempRefs[actionItem.data.parent_id];
              }

              if (actionItem.data.folder_id && tempRefs[actionItem.data.folder_id]) {
                actionItem.data.folder_id = tempRefs[actionItem.data.folder_id];
              }

              const result = await executeAction(actionItem, folders, files);
              results.push({ action: actionItem, result });

              if (actionItem.action === 'create_folder' && actionItem.temp_ref && result?.id) {
                tempRefs[actionItem.temp_ref] = result.id;
              }
            }

            await queryClient.invalidateQueries({ queryKey: ['files'] });
            await queryClient.invalidateQueries({ queryKey: ['folders'] });

            const successMessages = results.map(r => getActionSuccessMessage(r.action)).join('\n');
            const successMessage = { 
              role: 'assistant', 
              content: `✓ Estrutura XML criada com sucesso:\n${successMessages}` 
            };
            setMessages(prev => [...prev, successMessage]);

            setTimeout(() => window.location.reload(), 1500);
          }
        } catch (error) {
          const errorMessage = { 
            role: 'assistant', 
            content: '❌ Erro ao processar XML. Verifique a formatação.' 
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        setLoading(false);
        return;
      }

      // Detectar se é uma ação ou conversa
      const actionKeywords = ['crie', 'criar', 'faça', 'fazer', 'gere', 'gerar', 'adicione', 'adicionar', 'delete', 'deletar', 'exclua', 'excluir', 'edite', 'editar', 'atualize', 'atualizar', 'remova', 'remover', 'mova', 'mover', 'mude', 'mudar', 'altere', 'alterar', 'troque', 'trocar', 'substitua', 'substituir', 'monte', 'montar', 'estrutura', 'estruture'];
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
- Pasta atual: ${currentFolder ? currentFolder.name : 'Raiz (Meu Drive)'}
- ID da pasta: ${currentFolderId || null}
- Localização: ${currentTeamId ? `Equipe (team_id: ${currentTeamId})` : 'Meu Drive (sem equipe)'}
${currentFile ? `\n- ARQUIVO ABERTO: "${currentFile.name}" (ID: ${currentFile.id}, Tipo: ${currentFile.type})\n- CONTEÚDO ATUAL DO ARQUIVO:\n${currentFile.content || '(vazio)'}` : ''}

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

IMPORTANTE - ESTRUTURA HIERÁRQUICA COM INDENTAÇÃO:
Quando o usuário usar indentação ou traços (-) mostrando hierarquia, INTERPRETE ASSIM:

EXEMPLO DE ESTRUTURA:
- Projetos
  - Projeto A
    - Documentos
      - Proposta.docx
      - Contrato.docx
    - Planilhas
      - Orcamento.xlsx
  - Projeto B
    - arquivo.pptx

INTERPRETAÇÃO CORRETA (ordem de criação):
[
  { "action": "create_folder", "temp_ref": "Projetos_folder", "data": { "name": "Projetos", "parent_id": null } },
  { "action": "create_folder", "temp_ref": "ProjetoA_folder", "data": { "name": "Projeto A", "parent_id": "Projetos_folder" } },
  { "action": "create_folder", "temp_ref": "Documentos_folder", "data": { "name": "Documentos", "parent_id": "ProjetoA_folder" } },
  { "action": "create_file", "data": { "name": "Proposta.docx", "type": "docx", "folder_id": "Documentos_folder" } },
  { "action": "create_file", "data": { "name": "Contrato.docx", "type": "docx", "folder_id": "Documentos_folder" } },
  { "action": "create_folder", "temp_ref": "Planilhas_folder", "data": { "name": "Planilhas", "parent_id": "ProjetoA_folder" } },
  { "action": "create_file", "data": { "name": "Orcamento.xlsx", "type": "xlsx", "folder_id": "Planilhas_folder" } },
  { "action": "create_folder", "temp_ref": "ProjetoB_folder", "data": { "name": "Projeto B", "parent_id": "Projetos_folder" } },
  { "action": "create_file", "data": { "name": "arquivo.pptx", "type": "pptx", "folder_id": "ProjetoB_folder" } }
]

REGRAS OBRIGATÓRIAS:
1. Cada PASTA precisa de temp_ref único (formato: "NomeSemEspacos_folder")
2. Subpastas usam parent_id com o temp_ref da pasta pai
3. Arquivos usam folder_id com o temp_ref da pasta onde estão
4. A indentação define o nível: mais espaços = mais dentro
5. SEMPRE crie pastas ANTES de seus conteúdos no array
6. Se termina com extensão (.docx, .xlsx, etc) = arquivo, senão = pasta

IMPORTANTE:
- Planilha/Excel = type: "xlsx", SEMPRE preencha com dados CSV se o usuário pediu dados
- Documento/Word/Texto = type: "docx", SEMPRE use HTML formatado no content
- Apresentação/PowerPoint = type: "pptx", use o formato JSON de slides
- Kanban = type: "kbn"
- Gantt = type: "gnt"
- Cronograma = type: "crn"

FORMATAÇÃO DE PLANILHAS (type: xlsx):
SEMPRE preencha com dados em formato de array de arrays (JSON).
Cada linha é um array, primeira linha são os cabeçalhos.

Exemplo CORRETO de planilha COM DADOS:
{
  "action": "create_file",
  "data": {
    "name": "Controle de Vendas",
    "type": "xlsx",
    "content": "[[\\"Produto\\",\\"Quantidade\\",\\"Valor Unitário\\",\\"Total\\"],[\\"Notebook\\",\\"5\\",\\"3500\\",\\"17500\\"],[\\"Mouse\\",\\"20\\",\\"50\\",\\"1000\\"],[\\"Teclado\\",\\"15\\",\\"150\\",\\"2250\\"],[\\"TOTAL\\",\\"40\\",\\"\\",\\"20750\\"]]"
  }
}

IMPORTANTE: content deve ser uma STRING JSON de array de arrays.
NUNCA crie planilhas vazias quando o usuário pedir dados específicos!

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

        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: actionPrompt,
          response_json_schema: actionSchema
        });

        if (llmResult && llmResult.actions && llmResult.actions.length > 0) {
          const results = [];
          const tempRefs = {}; // Armazena ID real de pastas criadas
          
          for (const actionItem of llmResult.actions) {
            // Substituir referências temporárias por IDs reais
            if (actionItem.data.parent_id && tempRefs[actionItem.data.parent_id]) {
              actionItem.data.parent_id = tempRefs[actionItem.data.parent_id];
            }
            
            if (actionItem.data.folder_id && tempRefs[actionItem.data.folder_id]) {
              actionItem.data.folder_id = tempRefs[actionItem.data.folder_id];
            }
            
            const result = await executeAction(actionItem, folders, files);
            results.push({ action: actionItem, result });
            
            // Armazenar ID real da pasta criada
            if (actionItem.action === 'create_folder' && actionItem.temp_ref && result?.id) {
              tempRefs[actionItem.temp_ref] = result.id;
            }
          }

          // Invalidar queries antes de navegar
          await queryClient.invalidateQueries({ queryKey: ['files'] });
          await queryClient.invalidateQueries({ queryKey: ['folders'] });

          const successMessages = results.map(r => getActionSuccessMessage(r.action)).join('\n');
          const successMessage = { 
            role: 'assistant', 
            content: `✓ ${successMessages}` 
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

        const chatResult = await base44.integrations.Core.InvokeLLM({
          prompt: chatPrompt
        });

        const assistantMessage = { 
          role: 'assistant', 
          content: chatResult || 'Desculpe, não consegui processar sua mensagem.',
          folders: foldersInfo,
          files: filesInfo
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
        team_id: data.team_id || null,
        color: data.color || 'bg-blue-500',
        owner: user.email,
      });
      return result;
    } else if (action === 'create_file' && user?.assistant_can_create_files !== false) {
      const defaultContent = {
        kbn: JSON.stringify({ columns: [], cards: [] }),
        gnt: JSON.stringify({ tasks: [] }),
        crn: JSON.stringify({ groups: [], items: [] }),
        flux: JSON.stringify({ drawflow: { Home: { data: {} } } }),
        pptx: data.content || JSON.stringify({ slides: [{ background: '#ffffff', elements: [] }] }),
        docx: data.content || '',
        xlsx: data.content || '',
      };
      const result = await base44.entities.File.create({
        name: data.name,
        type: data.type,
        folder_id: data.folder_id || currentFolderId || null,
        team_id: data.team_id || null,
        content: data.content || defaultContent[data.type] || '',
        owner: user.email,
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
                  {renderMessageContent(msg)}
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