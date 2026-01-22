import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
        ArrowLeft, Save, Download, FileText, FileSpreadsheet,
        LayoutGrid, GanttChart as GanttChartIcon, Calendar, Loader2, Check, 
        Image as ImageIcon, Video, ArrowRight, Upload, Presentation, Printer,
        FileImage, FileType, ZoomIn, ZoomOut, Sparkles, FileStack
      } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import KanbanBoard from '../components/kanban/KanbanBoard';
import GanttChartComponent from '../components/gantt/GanttChart';
import CronogramaBoard from '../components/cronograma/CronogramaBoard';
import FluxMap from '../components/flux/FluxMap';
import DocxEditor from '../components/editors/DocxEditor';
import XlsxEditor from '../components/editors/XlsxEditor';
import PptxEditor from '../components/editors/PptxEditor';
import PhotoSmartEditor from '../components/editors/PhotoSmartEditor';
import AIAssistant from '../components/ai/AIAssistant';
import CollaborationBar from '../components/collaboration/CollaborationBar';
import { useSyncData } from '../components/sync/useSyncData';
import MiniTerminal from '../components/terminal/MiniTerminal';

const fileTypeConfig = {
  docx: { icon: FileText, color: 'text-blue-600', label: 'Documento' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', label: 'Planilha' },
  pptx: { icon: Presentation, color: 'text-amber-600', label: 'Apresentação' },
  kbn: { icon: LayoutGrid, color: 'text-purple-600', label: 'Kanban' },
  gnt: { icon: GanttChartIcon, color: 'text-orange-600', label: 'Gantt' },
  crn: { icon: Calendar, color: 'text-pink-600', label: 'Cronograma' },
  flux: { icon: ArrowRight, color: 'text-teal-600', label: 'FluxMap' },
  psd: { icon: Sparkles, color: 'text-indigo-600', label: 'PhotoSmart' },
  img: { icon: ImageIcon, color: 'text-cyan-600', label: 'Imagem' },
  video: { icon: Video, color: 'text-purple-600', label: 'Vídeo' },
};

const fileTemplates = {
  docx: [
    {
      name: 'Contrato',
      content: '<h1 style="text-align: center;"><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong></h1><p><br></p><p><strong>Contrato nº:</strong> ___/2026</p><p><strong>Data:</strong> ___/___/2026</p><p><br></p><h2><strong>1. DAS PARTES</strong></h2><p><strong>CONTRATANTE:</strong> [Nome da Empresa], CNPJ ___.___.___/____-__</p><p>Endereço: [Endereço completo]</p><p><br></p><p><strong>CONTRATADA:</strong> [Nome da Empresa], CNPJ ___.___.___/____-__</p><p>Endereço: [Endereço completo]</p><p><br></p><h2><strong>2. DO OBJETO</strong></h2><p>O presente contrato tem por objeto: [Descrever objeto do contrato]</p><p><br></p><h2><strong>3. DO VALOR E FORMA DE PAGAMENTO</strong></h2><p>O valor total é de <strong>R$ ___________</strong>, a ser pago conforme:</p><p>• [Forma de pagamento]</p><p><br></p><h2><strong>4. DO PRAZO</strong></h2><p>O prazo de execução é de ___ dias/meses, com início em ___/___/___ e término em ___/___/___.</p><p><br></p><h2><strong>5. DAS OBRIGAÇÕES</strong></h2><p><strong>Da CONTRATADA:</strong></p><p>• [Listar obrigações]</p><p><br></p><p><strong>Da CONTRATANTE:</strong></p><p>• [Listar obrigações]</p>'
    },
    {
      name: 'Recibo',
      content: '<h1 style="text-align: center;"><strong>RECIBO DE PAGAMENTO</strong></h1><p><br></p><p style="text-align: right;"><strong>Valor: R$ __________</strong></p><p><br></p><p>Recebi de <strong>[Nome do Pagador]</strong>, CPF/CNPJ <strong>___.___.___-__</strong>, a quantia de <strong>R$ __________ ([valor por extenso])</strong>, referente a <strong>[descrição do serviço/produto]</strong>.</p><p><br></p><p><br></p><p><strong>Forma de Pagamento:</strong> [ ] Dinheiro [ ] PIX [ ] Transferência [ ] Cartão</p><p><br></p><p><strong>Data do Pagamento:</strong> ___/___/2026</p><p><br></p><p><br></p><p><br></p><p>_________________________________________</p><p><strong>Assinatura do Recebedor</strong></p><p>Nome: [Nome completo]</p><p>CPF: ___.___.___-__</p><p><br></p><p style="text-align: center;"><em>Para maior validade jurídica, é recomendável reconhecer firma em cartório.</em></p>'
    },
    {
      name: 'Currículo',
      content: '<h1 style="text-align: center;"><strong>[SEU NOME COMPLETO]</strong></h1><p style="text-align: center;">[Sua Profissão/Área]</p><p style="text-align: center;">Email: [seu.email@exemplo.com] | Telefone: (11) 9____-____ | LinkedIn: linkedin.com/in/____</p><p style="text-align: center;">Endereço: [Cidade, Estado]</p><p><br></p><h2><strong>OBJETIVO PROFISSIONAL</strong></h2><p>[Descreva seu objetivo profissional em 2-3 linhas]</p><p><br></p><h2><strong>FORMAÇÃO ACADÊMICA</strong></h2><p><strong>[Nome do Curso]</strong> - [Nome da Instituição]</p><p>[Ano de início] - [Ano de conclusão ou "Em andamento"]</p><p><br></p><h2><strong>EXPERIÊNCIA PROFISSIONAL</strong></h2><p><strong>[Nome da Empresa]</strong> - [Cargo]</p><p>[Mês/Ano] - [Mês/Ano ou "Atual"]</p><p>• [Responsabilidade/conquista 1]</p><p>• [Responsabilidade/conquista 2]</p><p>• [Responsabilidade/conquista 3]</p><p><br></p><h2><strong>COMPETÊNCIAS</strong></h2><p>• [Competência 1]</p><p>• [Competência 2]</p><p>• [Competência 3]</p><p><br></p><h2><strong>IDIOMAS</strong></h2><p>• Português: Nativo</p><p>• Inglês: [Nível]</p><p><br></p><h2><strong>CURSOS E CERTIFICAÇÕES</strong></h2><p>• [Nome do curso] - [Instituição] ([Ano])</p>'
    }
  ],
  xlsx: [
    {
      name: 'Controle Financeiro',
      content: 'Data,Descrição,Categoria,Tipo,Valor\n2026-01-22,Salário Recebido,Receita,Entrada,5000\n2026-01-22,Aluguel,Moradia,Saída,1500\n2026-01-23,Supermercado,Alimentação,Saída,350\n2026-01-24,Freelance,Receita,Entrada,800\n2026-01-25,Internet,Contas,Saída,100\n2026-01-26,Restaurante,Alimentação,Saída,85\n2026-01-27,Transporte,Transporte,Saída,150\n2026-01-28,Academia,Saúde,Saída,120\n2026-01-29,Consultoria,Receita,Entrada,1200\n2026-01-30,Luz,Contas,Saída,180'
    },
    {
      name: 'Controle de Produtos',
      content: 'Código,Produto,Categoria,Estoque Atual,Estoque Mínimo,Preço Compra,Preço Venda,Fornecedor,Status\nP001,Notebook Dell,Informática,15,5,2500,3500,Tech Distribuidora,Ativo\nP002,Mouse Logitech,Acessórios,45,10,35,65,Tech Distribuidora,Ativo\nP003,Teclado Mecânico,Acessórios,22,8,180,320,Periféricos SA,Ativo\nP004,Monitor LG 24",Informática,8,3,650,950,LG Brasil,Ativo\nP005,Webcam HD,Acessórios,30,15,120,210,Tech Distribuidora,Ativo\nP006,Headset Gamer,Acessórios,18,5,220,380,Gamer Store,Ativo\nP007,SSD 500GB,Hardware,25,10,280,420,Storage Plus,Ativo\nP008,Memória RAM 8GB,Hardware,40,20,180,290,Hardware Brasil,Ativo\nP009,Cadeira Ergonômica,Móveis,5,2,850,1350,Móveis Office,Ativo\nP010,Mesa para PC,Móveis,3,1,450,750,Móveis Office,Baixo Estoque'
    },
    {
      name: 'Lista de Tarefas',
      content: 'Tarefa,Responsável,Prioridade,Status,Data Início,Prazo,Progresso %,Observações\nReunião com cliente,João Silva,Alta,Em andamento,2026-01-22,2026-01-22,100,Concluída\nElaborar proposta,Maria Santos,Alta,Em andamento,2026-01-22,2026-01-25,60,Em revisão\nAtualizar website,Pedro Costa,Média,Pendente,2026-01-23,2026-01-30,0,Aguardando briefing\nRelatório mensal,Ana Oliveira,Alta,Em andamento,2026-01-20,2026-01-31,75,Faltam gráficos\nTreinamento equipe,Carlos Lima,Baixa,Pendente,2026-02-01,2026-02-15,0,Agendar data\nRevisão contratos,João Silva,Média,Concluído,2026-01-15,2026-01-20,100,Aprovado pela diretoria'
    }
  ],
  kbn: [
    {
      name: 'Mapa Mental',
      content: JSON.stringify({
        columns: [
          { id: 'central', title: 'Ideia Central', color: '#8b5cf6' },
          { id: 'subtopics', title: 'Subtópicos', color: '#3b82f6' },
          { id: 'details', title: 'Detalhes', color: '#10b981' },
          { id: 'actions', title: 'Ações', color: '#f59e0b' }
        ],
        cards: [
          { id: '1', columnId: 'central', title: 'Projeto Principal', description: 'Objetivo principal do projeto', priority: 'high', tags: ['principal'] },
          { id: '2', columnId: 'subtopics', title: 'Planejamento', description: 'Definir escopo e prazos', priority: 'high', tags: ['planejamento'] },
          { id: '3', columnId: 'subtopics', title: 'Execução', description: 'Implementar as atividades', priority: 'medium', tags: ['execução'] },
          { id: '4', columnId: 'details', title: 'Recursos Necessários', description: 'Listar ferramentas e equipe', priority: 'medium', tags: ['recursos'] },
          { id: '5', columnId: 'details', title: 'Riscos Identificados', description: 'Mapear possíveis problemas', priority: 'low', tags: ['riscos'] },
          { id: '6', columnId: 'actions', title: 'Próximos Passos', description: 'Definir ações imediatas', priority: 'high', tags: ['ações'] }
        ]
      })
    },
    {
      name: 'Planejamento de Marketing',
      content: JSON.stringify({
        columns: [
          { id: 'research', title: 'Pesquisa', color: '#6366f1' },
          { id: 'planning', title: 'Planejamento', color: '#8b5cf6' },
          { id: 'creation', title: 'Criação', color: '#f59e0b' },
          { id: 'execution', title: 'Execução', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'research', title: 'Análise de Mercado', description: 'Estudar concorrência e público-alvo', priority: 'high', tags: ['análise'] },
          { id: '2', columnId: 'research', title: 'Definir Personas', description: 'Criar perfis de clientes ideais', priority: 'high', tags: ['personas'] },
          { id: '3', columnId: 'planning', title: 'Estratégia de Conteúdo', description: 'Planejar temas e formatos', priority: 'high', tags: ['conteúdo'] },
          { id: '4', columnId: 'planning', title: 'Orçamento', description: 'Definir investimento por canal', priority: 'medium', tags: ['financeiro'] },
          { id: '5', columnId: 'creation', title: 'Design de Posts', description: 'Criar artes para redes sociais', priority: 'medium', tags: ['design'] },
          { id: '6', columnId: 'execution', title: 'Lançar Campanhas', description: 'Ativar anúncios e posts', priority: 'low', tags: ['lançamento'] }
        ]
      })
    },
    {
      name: 'Planejamento de Campanha',
      content: JSON.stringify({
        columns: [
          { id: 'briefing', title: 'Briefing', color: '#ef4444' },
          { id: 'concept', title: 'Conceito', color: '#f59e0b' },
          { id: 'production', title: 'Produção', color: '#3b82f6' },
          { id: 'launch', title: 'Lançamento', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'briefing', title: 'Objetivo da Campanha', description: 'Aumentar vendas em 30%', priority: 'high', tags: ['objetivo'] },
          { id: '2', columnId: 'briefing', title: 'Público-Alvo', description: 'Jovens de 18-35 anos', priority: 'high', tags: ['público'] },
          { id: '3', columnId: 'concept', title: 'Tema Central', description: 'Inovação e Tecnologia', priority: 'high', tags: ['tema'] },
          { id: '4', columnId: 'concept', title: 'Mensagem Principal', description: 'Transforme seu futuro hoje', priority: 'medium', tags: ['mensagem'] },
          { id: '5', columnId: 'production', title: 'Criar Vídeos', description: '3 vídeos para Instagram', priority: 'medium', tags: ['vídeo'] },
          { id: '6', columnId: 'launch', title: 'Campanha Google Ads', description: 'Configurar e lançar anúncios', priority: 'high', tags: ['ads'] }
        ]
      })
    }
  ],
  gnt: [
    {
      name: 'Tarefas da Equipe',
      content: JSON.stringify({
        tasks: [
          { id: 't1', name: 'Planejamento Inicial', start: '2026-01-22', end: '2026-01-24', progress: 100, dependencies: [] },
          { id: 't2', name: 'Design e Prototipagem', start: '2026-01-25', end: '2026-02-05', progress: 60, dependencies: ['t1'] },
          { id: 't3', name: 'Desenvolvimento Backend', start: '2026-02-06', end: '2026-03-10', progress: 20, dependencies: ['t2'] },
          { id: 't4', name: 'Desenvolvimento Frontend', start: '2026-02-10', end: '2026-03-15', progress: 10, dependencies: ['t2'] },
          { id: 't5', name: 'Testes e Correções', start: '2026-03-16', end: '2026-03-25', progress: 0, dependencies: ['t3', 't4'] },
          { id: 't6', name: 'Deploy e Lançamento', start: '2026-03-26', end: '2026-03-31', progress: 0, dependencies: ['t5'] }
        ]
      })
    },
    {
      name: 'Projeto Desenvolvimento',
      content: JSON.stringify({
        tasks: [
          { id: 't1', name: 'Kickoff e Alinhamento', start: '2026-01-22', end: '2026-01-23', progress: 100, dependencies: [] },
          { id: 't2', name: 'Levantamento de Requisitos', start: '2026-01-24', end: '2026-01-31', progress: 80, dependencies: ['t1'] },
          { id: 't3', name: 'Arquitetura do Sistema', start: '2026-02-01', end: '2026-02-10', progress: 50, dependencies: ['t2'] },
          { id: 't4', name: 'Setup de Infraestrutura', start: '2026-02-11', end: '2026-02-20', progress: 30, dependencies: ['t3'] },
          { id: 't5', name: 'Sprint 1 - MVP', start: '2026-02-21', end: '2026-03-10', progress: 0, dependencies: ['t4'] },
          { id: 't6', name: 'Sprint 2 - Funcionalidades', start: '2026-03-11', end: '2026-03-31', progress: 0, dependencies: ['t5'] },
          { id: 't7', name: 'Testes de Qualidade', start: '2026-04-01', end: '2026-04-15', progress: 0, dependencies: ['t6'] },
          { id: 't8', name: 'Homologação Cliente', start: '2026-04-16', end: '2026-04-25', progress: 0, dependencies: ['t7'] },
          { id: 't9', name: 'Go Live', start: '2026-04-26', end: '2026-04-30', progress: 0, dependencies: ['t8'] }
        ]
      })
    }
  ],
  crn: [
    {
      name: 'Cronograma Semanal',
      content: JSON.stringify({
        groups: [
          { id: 'g1', name: 'Segunda-feira', color: '#3b82f6' },
          { id: 'g2', name: 'Terça-feira', color: '#8b5cf6' },
          { id: 'g3', name: 'Quarta-feira', color: '#ec4899' },
          { id: 'g4', name: 'Quinta-feira', color: '#f59e0b' },
          { id: 'g5', name: 'Sexta-feira', color: '#10b981' }
        ],
        items: [
          { id: 'i1', groupId: 'g1', name: 'Reunião de Equipe', start: '2026-01-27', end: '2026-01-27', progress: 0 },
          { id: 'i2', groupId: 'g2', name: 'Desenvolvimento Feature A', start: '2026-01-28', end: '2026-01-28', progress: 0 },
          { id: 'i3', groupId: 'g3', name: 'Code Review', start: '2026-01-29', end: '2026-01-29', progress: 0 },
          { id: 'i4', groupId: 'g4', name: 'Testes e Ajustes', start: '2026-01-30', end: '2026-01-30', progress: 0 },
          { id: 'i5', groupId: 'g5', name: 'Deploy Semanal', start: '2026-01-31', end: '2026-01-31', progress: 0 }
        ]
      })
    }
  ],
  flux: [
    {
      name: 'Fluxo de Processo',
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Início' }, class: 'start', html: 'Início', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Processo 1' }, class: 'process', html: 'Processo 1', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'decision', data: { text: 'Decisão?' }, class: 'decision', html: 'Decisão?', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] }, output_2: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'process', data: { text: 'Caminho Sim' }, class: 'process', html: 'Caminho Sim', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 130 },
              '5': { id: 5, name: 'process', data: { text: 'Caminho Não' }, class: 'process', html: 'Caminho Não', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 270 },
              '6': { id: 6, name: 'end', data: { text: 'Fim' }, class: 'end', html: 'Fim', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }, { node: '5', input: 'output_1' }] } }, outputs: {}, pos_x: 1100, pos_y: 200 }
            }
          }
        }
      })
    }
  ],
  pptx: [
    {
      name: 'Apresentação Empresarial',
      content: JSON.stringify({
        slides: [
          {
            background: '#1e3a8a',
            elements: [
              { type: 'text', content: 'Título da Apresentação', x: 100, y: 200, fontSize: 48, color: '#ffffff', bold: true },
              { type: 'text', content: 'Subtítulo ou Nome da Empresa', x: 100, y: 280, fontSize: 24, color: '#93c5fd' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Tópico 1', x: 50, y: 50, fontSize: 36, color: '#1e3a8a', bold: true },
              { type: 'text', content: '• Ponto importante\n• Outro ponto relevante\n• Terceiro ponto', x: 50, y: 150, fontSize: 20, color: '#1f2937' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Conclusão', x: 50, y: 50, fontSize: 36, color: '#1e3a8a', bold: true },
              { type: 'text', content: 'Resumo dos pontos principais', x: 50, y: 150, fontSize: 20, color: '#1f2937' }
            ]
          }
        ]
      })
    }
  ]
};

export default function FileViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get('id');
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localContent, setLocalContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [mediaPopup, setMediaPopup] = useState({ open: false, url: '', type: '' });
  const pptxEditorRef = useRef(null);
  const docxEditorRef = useRef(null);
  const xlsxEditorRef = useRef(null);
  const [docOrientation, setDocOrientation] = useState('portrait');
  const [slideOrientation, setSlideOrientation] = useState('landscape');
  const [docZoom, setDocZoom] = useState(100);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const terminalRef = useRef(null);
  
  const queryClient = useQueryClient();
  
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: file, isLoading, error } = useQuery({
    queryKey: ['file', fileId],
    queryFn: async () => {
      const files = await base44.entities.File.list();
      const file = files.find(f => f.id === fileId);
      console.log('Loaded file from DB:', file);
      console.log('Content length:', file?.content?.length || 0);
      return file;
    },
    enabled: !!fileId,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: hasChanges ? false : 5000, // CRÍTICO: Desabilitar auto-refresh quando houver mudanças não salvas
  });
  
  // Store fluxFileId globally for FluxMap nodes to access
  useEffect(() => {
    if (file?.type === 'flux') {
      window.fluxFileId = fileId;
    }
    return () => {
      if (window.fluxFileId === fileId) {
        delete window.fluxFileId;
      }
    };
  }, [file, fileId]);
  
  // SYNC DIRECTIVE: Real-time synchronization with database
  useSyncData();

  // Listener para abrir popup de mídia
  useEffect(() => {
    const handleOpenMedia = (e) => {
      if (e.detail?.url && e.detail?.type) {
        setMediaPopup({ open: true, url: e.detail.url, type: e.detail.type });
      }
    };

    window.addEventListener('openMedia', handleOpenMedia);
    return () => window.removeEventListener('openMedia', handleOpenMedia);
  }, []);

  useEffect(() => {
    if (file) {
      console.log('=== CARREGANDO ARQUIVO ===');
      console.log('Tipo:', file.type);
      console.log('hasChanges:', hasChanges);
      console.log('Content length:', file.content?.length || 0);
      
      // SEMPRE carregar do banco quando não há mudanças locais
      if (!hasChanges) {
        setFileName(file.name);
        
        if (file.content && file.content.trim() !== '') {
          if (file.type === 'docx' || file.type === 'xlsx') {
            setLocalContent(file.content);
            console.log('✓ Conteúdo texto carregado');
          } else {
            try {
              const parsed = JSON.parse(file.content);
              
              if (file.type === 'flux') {
                const nodeCount = parsed?.drawflow?.Home?.data ? Object.keys(parsed.drawflow.Home.data).length : 0;
                console.log(`✓ FluxMap carregado com ${nodeCount} nodes`);
              }
              
              setLocalContent(parsed);
            } catch (e) {
              console.error('ERRO ao parsear JSON do arquivo:', e);
              console.error('Content:', file.content.substring(0, 500));
              setLocalContent(file.content);
            }
          }
        } else {
          console.log('Conteúdo vazio - inicializando padrão');
          if (file.type === 'flux') {
            setLocalContent({ drawflow: { Home: { data: {} } } });
          } else if (file.type === 'pptx') {
            setLocalContent({ slides: [{ title: '', content: '' }] });
          } else if (file.type === 'docx' || file.type === 'xlsx') {
            setLocalContent('');
          } else {
            setLocalContent({});
          }
        }
      }
    }
  }, [file, hasChanges]);

  const updateFileMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Updating file with data:', data);
      const result = await base44.entities.File.update(fileId, data);
      console.log('Update result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('File saved successfully:', data);
      setHasChanges(false);
    },
  });

  const handleContentChange = (newContent) => {
    console.log('=== CONTENT CHANGE DETECTADO ===');
    console.log('Tipo de arquivo:', file?.type);
    
    if (file?.type === 'flux') {
      console.log('FluxMap exportou:', newContent);
      if (newContent?.drawflow?.Home?.data) {
        const nodeCount = Object.keys(newContent.drawflow.Home.data).length;
        console.log(`FluxMap tem ${nodeCount} nodes`);
      } else {
        console.warn('FluxMap exportou estrutura inválida!');
      }
    }
    
    setLocalContent(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let contentToSave;
      
      if (file.type === 'docx' || file.type === 'xlsx') {
        contentToSave = localContent || '';
      } else if (typeof localContent === 'object' && localContent !== null) {
        contentToSave = JSON.stringify(localContent);
      } else {
        contentToSave = localContent || '';
      }
      
      console.log('=== SALVANDO ARQUIVO ===');
      console.log('Tipo:', file.type);
      console.log('localContent:', localContent);
      console.log('Conteúdo serializado (tamanho):', contentToSave.length, 'chars');
      
      if (file.type === 'flux') {
        console.log('FluxMap - primeiros 1000 chars:', contentToSave.substring(0, 1000));
        try {
          const parsed = JSON.parse(contentToSave);
          const nodeCount = parsed?.drawflow?.Home?.data ? Object.keys(parsed.drawflow.Home.data).length : 0;
          console.log(`FluxMap sendo salvo com ${nodeCount} nodes`);
        } catch (e) {
          console.error('ERRO: FluxMap tem JSON inválido!', e);
        }
      }
      
      const updateData = { 
        name: fileName,
        content: contentToSave
      };
      
      // Garantir que o owner está presente
      if (!file.owner && currentUser?.email) {
        updateData.owner = currentUser.email;
      }
      
      await updateFileMutation.mutateAsync(updateData);
      
      // Invalidar query para forçar reload
      await queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setHasChanges(false);
      
      console.log('✓ Arquivo salvo e query invalidada');
    } catch (error) {
      console.error('ERRO AO SALVAR:', error);
      alert('Erro ao salvar o arquivo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasChanges || !file) return;
    
    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [hasChanges, localContent, fileName, file]);

  const handleExport = () => {
    // Para imagens, vídeos e PDFs, fazer download direto do arquivo original
    if ((file.type === 'img' || file.type === 'video' || file.type === 'pdf') && file.file_url) {
      const a = document.createElement('a');
      a.href = file.file_url;
      a.download = file.name;
      a.target = '_blank';
      a.click();
      return;
    }
    
    // Para docx, exportar como texto
    if (file.type === 'docx') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = localContent || '';
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    
    // Para xlsx, exportar como CSV
    if (file.type === 'xlsx') {
      const blob = new Blob([localContent || ''], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Para pptx, chamar a função de exportar do editor
    if (file.type === 'pptx' && pptxEditorRef.current) {
      pptxEditorRef.current.exportPptx();
      return;
    }
    
    // Para outros tipos (kbn, gnt, crn, flux), exportar como JSON
    const exportData = {
      type: 'single_file',
      file: {
        name: file.name,
        type: file.type,
        content: file.content,
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const importFile = e.target.files[0];
    if (!importFile) return;

    const fileName = importFile.name.toLowerCase();

    // Para arquivos docx/txt
    if (file.type === 'docx' && (fileName.endsWith('.txt') || fileName.endsWith('.doc') || fileName.endsWith('.docx'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalContent(event.target.result);
        setHasChanges(true);
      };
      reader.readAsText(importFile);
      e.target.value = '';
      return;
    }

    // Para arquivos xlsx/csv
    if (file.type === 'xlsx' && (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalContent(event.target.result);
        setHasChanges(true);
      };
      reader.readAsText(importFile);
      e.target.value = '';
      return;
    }

    // Para arquivos pptx nativos usando IA do assistente
    if (file.type === 'pptx' && (fileName.endsWith('.pptx') || fileName.endsWith('.ppt'))) {
      const handlePptxImport = async () => {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: importFile });
          
          const user = await base44.auth.me();
          
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Você é um especialista em extração de dados de apresentações PowerPoint. Extraia o conteúdo deste arquivo PPTX e retorne no formato JSON especificado. Para cada slide, extraia o texto e organize-o em elementos de texto/título com posições aproximadas.`,
            response_json_schema: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      background: { type: "string", default: "#ffffff" },
                      elements: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            type: { type: "string" },
                            content: { type: "string" },
                            x: { type: "number", default: 100 },
                            y: { type: "number", default: 100 },
                            width: { type: "number", default: 400 },
                            height: { type: "number", default: 100 },
                            fontSize: { type: "number", default: 24 },
                            fontWeight: { type: "string", default: "normal" },
                            fontStyle: { type: "string", default: "normal" },
                            textDecoration: { type: "string", default: "none" },
                            color: { type: "string", default: "#000000" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            file_urls: [file_url]
          });
          
          if (result && result.slides) {
            setLocalContent(result);
            setHasChanges(true);
            alert('Arquivo importado com sucesso!');
          } else {
            alert('Não foi possível extrair dados do arquivo.');
          }
        } catch (error) {
          alert('Erro ao importar: ' + error.message);
        }
      };
      
      handlePptxImport();
      e.target.value = '';
      return;
    }

    // Para outros tipos (JSON)
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        console.log('=== IMPORTANDO JSON ===');
        const rawContent = event.target.result;
        console.log('Conteúdo bruto (primeiros 500 chars):', rawContent.substring(0, 500));
        
        const importedData = JSON.parse(rawContent);
        console.log('JSON parseado:', importedData);
        
        if (importedData.type === 'single_file' && importedData.file) {
          console.log('Tipo do arquivo importado:', importedData.file.type);
          console.log('Tipo do arquivo atual:', file.type);
          
          if (importedData.file.type === file.type) {
            const content = importedData.file.content;
            console.log('Conteúdo a ser importado:', typeof content);
            
            try {
              const parsed = JSON.parse(content);
              console.log('Conteúdo parseado com sucesso:', parsed);
              setLocalContent(parsed);
            } catch {
              console.log('Conteúdo já é string/objeto, usando diretamente');
              setLocalContent(content);
            }
            
            setHasChanges(true);
            console.log('✓ Importação concluída - hasChanges=true');
            alert('✓ Arquivo importado com sucesso!');
          } else {
            console.error('Tipo incompatível!');
            alert(`Tipo de arquivo incompatível! Esperado: ${file.type}, Recebido: ${importedData.file.type}`);
          }
        } else {
          console.error('Formato inválido - estrutura incorreta');
          alert('Formato de arquivo inválido! O arquivo deve ter a estrutura: { type: "single_file", file: {...} }');
        }
      } catch (error) {
        console.error('Erro ao ler o arquivo:', error);
        alert('Erro ao ler o arquivo: ' + error.message + '\n\nCertifique-se de que é um JSON válido.');
      }
    };
    reader.readAsText(importFile);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Arquivo não encontrado</p>
        <Link to={createPageUrl('Drive')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Drive
          </Button>
        </Link>
      </div>
    );
  }

  const config = fileTypeConfig[file.type] || fileTypeConfig.docx;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <Link to={createPageUrl(`Drive${file.folder_id ? `?folder=${file.folder_id}` : ''}`)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          <div className={`p-2 rounded-lg bg-gray-100 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <Input
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value);
                setHasChanges(true);
              }}
              className="font-semibold text-gray-800 border-none bg-transparent p-0 h-auto text-lg focus-visible:ring-0"
            />
            <span className={`text-xs ${config.color} font-medium`}>
              {config.label}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium mr-2">
              Alterações não salvas
            </span>
          )}
          
          {/* Orientação para Documento */}
          {file.type === 'docx' && (
            <>
              <Button
                size="icon"
                variant={docOrientation === 'portrait' ? 'default' : 'outline'}
                onClick={() => {
                  setDocOrientation('portrait');
                  docxEditorRef.current?.setOrientation('portrait');
                }}
                className="h-9 w-9"
                title="A4 Vertical"
              >
                <FileType className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={docOrientation === 'landscape' ? 'default' : 'outline'}
                onClick={() => {
                  setDocOrientation('landscape');
                  docxEditorRef.current?.setOrientation('landscape');
                }}
                className="h-9 w-9"
                title="A4 Horizontal"
              >
                <FileImage className="w-4 h-4 rotate-90" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setDocZoom(Math.max(50, docZoom - 10))}
                disabled={docZoom <= 50}
                className="h-9 w-9"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 min-w-[45px] text-center">
                {docZoom}%
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setDocZoom(Math.min(200, docZoom + 10))}
                disabled={docZoom >= 200}
                className="h-9 w-9"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {/* Orientação para Apresentação */}
          {file.type === 'pptx' && (
            <>
              <Button
                size="icon"
                variant={slideOrientation === 'landscape' ? 'default' : 'outline'}
                onClick={() => setSlideOrientation('landscape')}
                className="h-9 w-9"
                title="Slide Horizontal"
              >
                <FileImage className="w-4 h-4 rotate-90" />
              </Button>
              <Button
                size="icon"
                variant={slideOrientation === 'portrait' ? 'default' : 'outline'}
                onClick={() => setSlideOrientation('portrait')}
                className="h-9 w-9"
                title="Slide Vertical"
              >
                <FileType className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {/* Botão de Impressão */}
          {(file.type === 'docx' || file.type === 'xlsx' || file.type === 'pptx') && (
            <Button 
              size="icon" 
              variant="outline"
              onClick={() => {
                if (file.type === 'docx') docxEditorRef.current?.print();
                else if (file.type === 'xlsx') xlsxEditorRef.current?.print();
                else if (file.type === 'pptx') pptxEditorRef.current?.print();
              }}
              className="h-9 w-9"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </Button>
          )}
          
          {/* Template Dropdown */}
          {fileTemplates[file.type] && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileStack className="w-4 h-4 mr-2" />
                  Modelos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {fileTemplates[file.type].map((template, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => {
                      if (window.confirm(`Deseja carregar o modelo "${template.name}"? O conteúdo atual será substituído.`)) {
                        if (file.type === 'docx' || file.type === 'xlsx') {
                          setLocalContent(template.content);
                        } else {
                          setLocalContent(JSON.parse(template.content));
                        }
                        setHasChanges(true);
                      }
                    }}
                  >
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <input
            type="file"
            accept={file.type === 'docx' ? '.txt,.doc,.docx' : file.type === 'xlsx' ? '.csv,.xlsx,.xls' : file.type === 'pptx' ? '.pptx,.ppt' : '.json'}
            onChange={handleImportFile}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </span>
            </Button>
          </label>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : hasChanges ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Salvando...' : hasChanges ? 'Salvar' : 'Salvo'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {file.type === 'kbn' && localContent && (
          <KanbanBoard 
            data={localContent} 
            onChange={handleContentChange}
          />
        )}
        
        {file.type === 'gnt' && localContent && (
          <GanttChartComponent 
            data={localContent} 
            onChange={handleContentChange}
          />
        )}
        
        {file.type === 'crn' && localContent && (
          <CronogramaBoard 
            data={localContent} 
            onChange={handleContentChange}
          />
        )}
        
        {file.type === 'flux' && (
          <FluxMap 
            data={localContent} 
            onChange={handleContentChange}
            onImport={(importedData) => {
              setLocalContent(importedData);
              setHasChanges(true);
            }}
            folderId={file.folder_id}
          />
        )}
        
        {file.type === 'docx' && (
          <div className="p-6 max-w-5xl mx-auto">
            <DocxEditor
              ref={docxEditorRef}
              value={typeof localContent === 'string' ? localContent : ''}
              onChange={handleContentChange}
              zoom={docZoom}
            />
          </div>
        )}

        {file.type === 'xlsx' && (
          <XlsxEditor
            ref={xlsxEditorRef}
            value={localContent || ''}
            onChange={handleContentChange}
          />
        )}

        {file.type === 'pptx' && (
          <PptxEditor
            ref={pptxEditorRef}
            value={typeof localContent === 'object' ? JSON.stringify(localContent) : (localContent || '')}
            onChange={handleContentChange}
            fileName={fileName}
          />
        )}

        {file.type === 'psd' && localContent && (
          <PhotoSmartEditor
            data={localContent}
            onChange={handleContentChange}
            fileName={fileName}
          />
        )}

        {file.type === 'img' && file.file_url && (
          <div className="p-6 flex items-center justify-center min-h-[500px]">
            <img
              src={file.file_url}
              alt={file.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg cursor-pointer"
              onClick={() => setMediaPopup({ open: true, url: file.file_url, type: 'img' })}
            />
          </div>
        )}

        {file.type === 'video' && file.file_url && (
          <div className="p-6 flex items-center justify-center min-h-[500px]">
            <video
              src={file.file_url}
              controls
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg cursor-pointer"
              onClick={() => setMediaPopup({ open: true, url: file.file_url, type: 'video' })}
            >
              Seu navegador não suporta a reprodução de vídeos.
            </video>
          </div>
        )}
      </div>

      {/* Media Popup */}
      <Dialog open={mediaPopup.open} onOpenChange={(open) => setMediaPopup({ ...mediaPopup, open })}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <div className="w-full h-full flex items-center justify-center bg-black">
            {mediaPopup.type === 'img' && (
              <img src={mediaPopup.url} alt="Preview" className="max-w-full max-h-full object-contain" />
            )}
            {mediaPopup.type === 'video' && (
              <video src={mediaPopup.url} controls autoPlay className="max-w-full max-h-full">
                Seu navegador não suporta a reprodução de vídeos.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaboration Bar */}
      {currentUser && (file.type === 'docx' || file.type === 'xlsx' || file.type === 'pptx') && (
        <CollaborationBar fileId={fileId} currentUser={currentUser} />
      )}

      {/* Mini Terminal */}
      <MiniTerminal
        ref={terminalRef}
        fileType={file.type}
        fileId={fileId}
        fileName={fileName}
        content={localContent}
        onContentChange={handleContentChange}
        visible={terminalVisible}
      />

      {/* AI Assistant with file context */}
      <AIAssistant 
        fileContext={localContent} 
        fileType={file.type}
        currentFolderId={file.folder_id}
        currentPage="FileViewer"
        openFileId={fileId}
        openFileName={fileName}
        onExecuteTerminalCommand={(cmd) => {
          setTerminalVisible(true);
          setTimeout(() => {
            if (terminalRef.current?.executeCommand) {
              terminalRef.current.executeCommand(cmd);
            }
          }, 100);
        }}
      />
    </div>
  );
}