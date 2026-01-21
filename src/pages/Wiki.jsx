import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { 
  BookOpen, FileText, Code, Folder, LayoutGrid, 
  GanttChart, Calendar, ArrowRight, Settings, Trash2, ArrowLeft
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Wiki() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <Link to={createPageUrl('Drive')}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Drive
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Keeping Wiki</h1>
              <p className="text-gray-600">Documentação completa do aplicativo</p>
            </div>
          </div>
          

        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Accordion type="multiple" className="space-y-4">
            
            {/* Introdução */}
            <AccordionItem value="intro" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                📚 Introdução ao Keeping
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-3 pt-4">
                <p>
                  O <strong>Keeping</strong> é uma plataforma completa de gerenciamento de projetos e documentos, 
                  integrando múltiplas ferramentas de produtividade em um único lugar.
                </p>
                <p>
                  Com o Keeping você pode organizar arquivos, gerenciar tarefas com quadros Kanban, 
                  criar cronogramas Gantt, montar fluxogramas interativos e muito mais.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <strong>💡 Dica:</strong> Comece criando uma pasta no Drive e depois adicione seus primeiros arquivos!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Drive */}
            <AccordionItem value="drive" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-600" />
                  Drive - Gestão de Arquivos
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <h3 className="font-semibold text-lg">Como usar o Drive:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Criar Pastas:</strong> Clique em "Nova Pasta" e escolha um nome e cor</li>
                  <li><strong>Organizar:</strong> Arraste e solte arquivos/pastas para reorganizar</li>
                  <li><strong>Buscar:</strong> Use a barra de pesquisa para encontrar rapidamente</li>
                  <li><strong>Visualizações:</strong> Alterne entre grade e lista</li>
                  <li><strong>Lixeira:</strong> Itens deletados ficam na lixeira por 30 dias</li>
                </ul>
                
                <h3 className="font-semibold text-lg mt-6">Tipos de Arquivo Suportados:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 mb-2" />
                    <strong>Documentos (.docx)</strong>
                    <p className="text-sm text-gray-600">Editor de texto rico</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <FileText className="w-5 h-5 text-green-600 mb-2" />
                    <strong>Planilhas (.xlsx)</strong>
                    <p className="text-sm text-gray-600">Tabelas e cálculos</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <LayoutGrid className="w-5 h-5 text-purple-600 mb-2" />
                    <strong>Kanban (.kbn)</strong>
                    <p className="text-sm text-gray-600">Gestão de tarefas</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <GanttChart className="w-5 h-5 text-orange-600 mb-2" />
                    <strong>Gantt (.gnt)</strong>
                    <p className="text-sm text-gray-600">Cronograma de projetos</p>
                  </div>
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-pink-600 mb-2" />
                    <strong>Cronograma (.crn)</strong>
                    <p className="text-sm text-gray-600">Timeline visual</p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-teal-600 mb-2" />
                    <strong>FluxMap (.flux)</strong>
                    <p className="text-sm text-gray-600">Fluxogramas e diagramas</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-600 mb-2" />
                    <strong>PhotoSmart (.psd)</strong>
                    <p className="text-sm text-gray-600">Editor de imagens com IA</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Kanban */}
            <AccordionItem value="kanban" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-purple-600" />
                  Kanban - Gestão de Tarefas
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  O Kanban permite visualizar e gerenciar tarefas em colunas (To Do, In Progress, Done).
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criar colunas personalizadas</li>
                  <li>Adicionar cards com título, descrição e prioridade</li>
                  <li>Upload de anexos e imagens de capa</li>
                  <li><strong>✨ Gerar capas com IA:</strong> Clique no botão estrela para criar imagens por prompt</li>
                  <li>Cores de capa customizáveis</li>
                  <li>Zoom na imagem de capa (50%-200%)</li>
                  <li>Baixar anexos individualmente</li>
                  <li>Arrastar e soltar cards entre colunas</li>
                  <li>Edição rápida ao clicar no card</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Gantt */}
            <AccordionItem value="gantt" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <GanttChart className="w-5 h-5 text-orange-600" />
                  Gantt - Cronograma de Projetos
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Visualize tarefas em uma linha do tempo com início e fim definidos.
                </p>
                <h3 className="font-semibold text-lg">Como usar:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Adicione tarefas com data de início e fim</li>
                  <li>Defina status (Pendente, Em Progresso, Concluído, Atrasado)</li>
                  <li>Acompanhe o progresso em porcentagem</li>
                  <li>Navegue pelas semanas com as setas</li>
                  <li>Cores indicam o status de cada tarefa</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* FluxMap */}
            <AccordionItem value="fluxmap" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-teal-600" />
                  FluxMap - Fluxogramas Interativos
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Crie diagramas, fluxogramas e mapas mentais com conexões visuais.
                </p>
                <h3 className="font-semibold text-lg">Elementos disponíveis:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Sticky Note:</strong> Notas adesivas amarelas</li>
                  <li><strong>Card:</strong> Cards estilo Kanban com capas customizáveis e <strong>✨ geração de imagens por IA</strong></li>
                  <li><strong>Retângulo:</strong> Formas para processos</li>
                  <li><strong>Círculo:</strong> Destacar pontos importantes</li>
                  <li><strong>Nome:</strong> Bolhas para nomes/etiquetas</li>
                  <li><strong>Texto:</strong> Caixas de texto simples</li>
                  <li><strong>Link:</strong> Hyperlinks para URLs externas ou arquivos internos</li>
                  <li><strong>Documento:</strong> Miniaturas de documentos que abrem o editor DOCX</li>
                  <li><strong>Planilha:</strong> Miniaturas de planilhas que abrem o editor XLSX</li>
                  <li><strong>Apresentação:</strong> Miniaturas de apresentações que abrem o editor PPTX</li>
                </ul>
                
                <h3 className="font-semibold text-lg mt-4">Recursos dos Cards:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Capas com cores ou imagens</li>
                  <li><strong>✨ Geração de capas com IA:</strong> Botão estrela para criar imagens por prompt</li>
                  <li>Anexar arquivos ou gerar imagens com IA para anexar</li>
                  <li>Download individual de anexos</li>
                  <li>Zoom nas imagens de capa</li>
                </ul>
                <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                  <strong>💡 Dica:</strong> Conecte elementos clicando nas bolinhas que aparecem ao passar o mouse!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* PhotoSmart */}
            <AccordionItem value="photosmart" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  ✨ PhotoSmart - Editor de Imagens com IA
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Editor profissional de imagens com ferramentas completas e geração de imagens por IA.
                </p>
                <h3 className="font-semibold text-lg">Menu Superior:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Arquivo:</strong> Novo documento, importar, salvar, exportar (PNG/JPG/WebP)</li>
                  <li><strong>Editar:</strong> Desfazer, refazer, duplicar/excluir camadas</li>
                  <li><strong>IA:</strong> Gerar imagens por prompt, histórico de gerações</li>
                  <li><strong>Visualizar:</strong> Zoom, grade, tela cheia</li>
                  <li><strong>Ajuda:</strong> Atalhos do teclado e sobre</li>
                </ul>
                
                <h3 className="font-semibold text-lg mt-4">Ferramentas Disponíveis:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Mover (V):</strong> Move objetos e textos pelo canvas</li>
                  <li><strong>Pincel (B):</strong> Desenho livre com controle de cor e tamanho</li>
                  <li><strong>Lápis (P):</strong> Traços finos e precisos</li>
                  <li><strong>Borracha (E):</strong> Apaga elementos desenhados</li>
                  <li><strong>Retângulo (R):</strong> Cria retângulos vetoriais</li>
                  <li><strong>Círculo (C):</strong> Cria círculos perfeitos</li>
                  <li><strong>Linha (L):</strong> Linhas retas de ponto a ponto</li>
                  <li><strong>Texto (T):</strong> Adiciona texto com controle de tamanho e cor</li>
                  <li><strong>Lupa (Z):</strong> Controla zoom da visualização</li>
                </ul>

                <h3 className="font-semibold text-lg mt-4">Controles:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Cor:</strong> Seletor de cores no topo</li>
                  <li><strong>Tamanho do Brush:</strong> 1-50px ajustável</li>
                  <li><strong>Tamanho da Fonte:</strong> 12-120px para textos</li>
                  <li><strong>Camadas:</strong> Painel direito com visibilidade, lock e opacidade</li>
                  <li><strong>Zoom:</strong> 25% a 200%</li>
                </ul>

                <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                  <strong>✨ IA Integrada:</strong> Digite um prompt na barra superior e clique em "Gerar" para criar imagens com inteligência artificial!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cronograma */}
            <AccordionItem value="cronograma" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-600" />
                  Cronograma - Timeline Visual
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Organize itens em grupos com visualização de linha do tempo.
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criar grupos com cores personalizadas</li>
                  <li>Adicionar itens com data de início e fim</li>
                  <li>Status visual (Não Iniciado, No Prazo, Em Risco, Atrasado, Concluído)</li>
                  <li>Atribuir responsáveis aos itens</li>
                  <li>Navegar por períodos de 21 dias</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Importar/Exportar */}
            <AccordionItem value="import" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                📤 Importar e Exportar
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <h3 className="font-semibold text-lg">Exportar:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Arquivo único:</strong> Clique em "Exportar" no visualizador</li>
                  <li><strong>Pasta inteira:</strong> Exporta como ZIP com estrutura preservada</li>
                  <li><strong>Drive completo:</strong> Exporta tudo em JSON estruturado</li>
                </ul>
                
                <h3 className="font-semibold text-lg mt-4">Importar:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Clique em "Importar" e selecione o arquivo JSON</li>
                  <li>Arraste arquivos do PC diretamente para o Drive</li>
                  <li>Suporta imagens, vídeos, PDFs e mais</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Lixeira */}
            <AccordionItem value="trash" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Lixeira - Recuperação de Arquivos
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Arquivos e pastas deletados vão para a lixeira onde podem ser restaurados ou excluídos permanentemente.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Restaurar:</strong> Retorna o item para sua localização original</li>
                  <li><strong>Excluir permanentemente:</strong> Remove definitivamente (não pode ser desfeito)</li>
                  <li><strong>Esvaziar lixeira:</strong> Remove tudo de uma vez</li>
                </ul>
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <strong>⚠️ Atenção:</strong> Itens excluídos permanentemente não podem ser recuperados!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Equipes */}
            <AccordionItem value="teams" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  👥 Equipes - Colaboração em Tempo Real
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Crie equipes para colaborar com outros usuários em pastas e arquivos compartilhados.
                </p>
                <h3 className="font-semibold text-lg">Como usar:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Criar equipe:</strong> Clique em "Nova Equipe", escolha nome, ícone, cor e adicione membros por email</li>
                  <li><strong>Gerenciar membros:</strong> Adicione ou remova membros pelo menu da equipe na sidebar</li>
                  <li><strong>Pastas de equipe:</strong> Arquivos/pastas criados dentro de equipes são automaticamente compartilhados</li>
                  <li><strong>Permissões:</strong> Apenas o dono pode deletar pastas/arquivos, mas todos podem editar</li>
                  <li><strong>Notificações:</strong> Receba alertas de atividades da equipe no sino de notificações</li>
                </ul>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <strong>💡 Dica:</strong> Use equipes para projetos colaborativos e Meu Drive para arquivos pessoais!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Terminal */}
            <AccordionItem value="terminal" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  💻 Terminal - Interface de Comando
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Acesse o Keeping via linha de comando para criar, editar e gerenciar arquivos/pastas de forma avançada. Perfeito para automações e AIs externas (Manus, NotebookLM, etc).
                </p>

                {/* Navegação Básica */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-300">
                  <h3 className="font-bold text-gray-900 text-lg mb-3">📁 Navegação e Sistema de Arquivos</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[120px]">ls / dir</code>
                      <span>Lista todos os arquivos e pastas na pasta atual</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[120px]">cd [pasta]</code>
                      <span>Navega para uma pasta (use nome ou ID)</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[120px]">cd ..</code>
                      <span>Volta para a pasta anterior</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[120px]">cd /</code>
                      <span>Volta para a raiz (Meu Drive)</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[120px]">pwd</code>
                      <span>Mostra o caminho atual</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[120px]">tree</code>
                      <span>Exibe árvore hierárquica de pastas</span>
                    </div>
                  </div>
                </div>

                {/* Criação e Gerenciamento */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-300">
                  <h3 className="font-bold text-blue-900 text-lg mb-3">✨ Criar e Gerenciar</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[200px]">mkdir [nome]</code>
                      <span>Cria uma nova pasta</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[200px]">touch [nome] [tipo]</code>
                      <span>Cria arquivo (kbn, gnt, crn, flux, docx, xlsx, pptx)</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[200px]">rm [nome]</code>
                      <span>Move para lixeira (pasta ou arquivo)</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[200px]">mv [origem] [destino]</code>
                      <span>Renomeia arquivo ou pasta</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[200px]">cat [arquivo]</code>
                      <span>Exibe conteúdo do arquivo</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-blue-600 font-mono font-semibold min-w-[200px]">echo "..." &gt; [arquivo]</code>
                      <span>Escreve conteúdo (aceita JSON completo)</span>
                    </div>
                  </div>
                </div>

                {/* Comandos Kanban */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-300">
                  <h3 className="font-bold text-purple-900 text-lg mb-3">📋 Kanban (.kbn)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-purple-600 font-mono font-semibold">kanban-add-list [arquivo] "Nome da Lista"</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona nova coluna ao quadro</p>
                    </div>
                    <div>
                      <code className="text-purple-600 font-mono font-semibold">kanban-add-card [arquivo] [list_id] "Título" "Descrição" [priority:low|medium|high]</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona card em uma lista (copie o list_id do comando list)</p>
                    </div>
                    <div>
                      <code className="text-purple-600 font-mono font-semibold">kanban-list [arquivo]</code>
                      <p className="text-gray-600 ml-4 mt-1">Lista todas as colunas e seus IDs</p>
                    </div>
                    <div className="bg-purple-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo completo:</p>
                      <code className="text-xs block mt-1">kanban-add-list board "To Do"</code>
                      <code className="text-xs block">kanban-list board  # copie o ID</code>
                      <code className="text-xs block">kanban-add-card board abc123 "Tarefa 1" "Descrição" priority:high</code>
                    </div>
                  </div>
                </div>

                {/* Comandos Gantt */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-300">
                  <h3 className="font-bold text-orange-900 text-lg mb-3">📊 Gantt Chart (.gnt)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-orange-600 font-mono font-semibold">gantt-add-task [arquivo] "Nome" [início] [fim] [progresso%]</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona tarefa com datas (formato: YYYY-MM-DD)</p>
                    </div>
                    <div>
                      <code className="text-orange-600 font-mono font-semibold">gantt-add-milestone [arquivo] "Nome" [data]</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona marco importante (milestone)</p>
                    </div>
                    <div>
                      <code className="text-orange-600 font-mono font-semibold">gantt-list [arquivo]</code>
                      <p className="text-gray-600 ml-4 mt-1">Lista todas as tarefas</p>
                    </div>
                    <div className="bg-orange-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo:</p>
                      <code className="text-xs block mt-1">gantt-add-task projeto "Planejamento" 2026-01-20 2026-02-15 50</code>
                      <code className="text-xs block">gantt-add-milestone projeto "Lançamento" 2026-03-01</code>
                    </div>
                  </div>
                </div>

                {/* Comandos Cronograma */}
                <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border-2 border-pink-300">
                  <h3 className="font-bold text-pink-900 text-lg mb-3">📅 Cronograma (.crn)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-pink-600 font-mono font-semibold">crn-add-group [arquivo] "Nome" [cor]</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona grupo/categoria (cores: blue, green, purple, orange, red)</p>
                    </div>
                    <div>
                      <code className="text-pink-600 font-mono font-semibold">crn-add-item [arquivo] [group_id] "Nome" [início] [fim] "Responsável"</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona item ao cronograma</p>
                    </div>
                    <div>
                      <code className="text-pink-600 font-mono font-semibold">crn-list [arquivo]</code>
                      <p className="text-gray-600 ml-4 mt-1">Lista grupos e IDs</p>
                    </div>
                    <div className="bg-pink-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo:</p>
                      <code className="text-xs block mt-1">crn-add-group timeline "Marketing" purple</code>
                      <code className="text-xs block">crn-list timeline  # copie group_id</code>
                      <code className="text-xs block">crn-add-item timeline xyz789 "Campanha" 2026-02-01 2026-02-28 "João"</code>
                    </div>
                  </div>
                </div>

                {/* Comandos FluxMap */}
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border-2 border-teal-300">
                  <h3 className="font-bold text-teal-900 text-lg mb-3">🔀 FluxMap (.flux)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-teal-600 font-mono font-semibold">flux-add-node [arquivo] [tipo] [x] [y] "Texto"</code>
                      <p className="text-gray-600 ml-4 mt-1">Tipos: sticky-note, card, rectangle, circle, name, text, link, document, spreadsheet, presentation</p>
                    </div>
                    <div>
                      <code className="text-teal-600 font-mono font-semibold">flux-connect [arquivo] [node_from_id] [node_to_id]</code>
                      <p className="text-gray-600 ml-4 mt-1">Conecta dois nós (copie IDs do comando list)</p>
                    </div>
                    <div>
                      <code className="text-teal-600 font-mono font-semibold">flux-list [arquivo]</code>
                      <p className="text-gray-600 ml-4 mt-1">Lista todos os nós e seus IDs</p>
                    </div>
                    <div className="bg-teal-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo:</p>
                      <code className="text-xs block mt-1">flux-add-node diagrama sticky-note 100 100 "Início"</code>
                      <code className="text-xs block">flux-add-node diagrama rectangle 300 100 "Processo"</code>
                      <code className="text-xs block">flux-list diagrama  # copie IDs dos nodes</code>
                      <code className="text-xs block">flux-connect diagrama node-1 node-2</code>
                    </div>
                  </div>
                </div>

                {/* Comandos Documentos */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-lg border-2 border-blue-300">
                  <h3 className="font-bold text-blue-900 text-lg mb-3">📝 Documentos (.docx)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-blue-600 font-mono font-semibold">docx-add-text [arquivo] "Texto"</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona parágrafo</p>
                    </div>
                    <div>
                      <code className="text-blue-600 font-mono font-semibold">docx-add-heading [arquivo] level:[1-6] "Título"</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona título (H1 a H6)</p>
                    </div>
                    <div>
                      <code className="text-blue-600 font-mono font-semibold">docx-add-list [arquivo] "Item 1" "Item 2" "Item 3"</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona lista com marcadores</p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo:</p>
                      <code className="text-xs block mt-1">docx-add-heading doc level:1 "Relatório Anual"</code>
                      <code className="text-xs block">docx-add-text doc "Este é o relatório..."</code>
                      <code className="text-xs block">docx-add-list doc "Ponto 1" "Ponto 2" "Ponto 3"</code>
                    </div>
                  </div>
                </div>

                {/* Comandos Planilhas */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-300">
                  <h3 className="font-bold text-green-900 text-lg mb-3">📊 Planilhas (.xlsx)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-green-600 font-mono font-semibold">xlsx-set-cell [arquivo] [linha] [coluna] "Valor"</code>
                      <p className="text-gray-600 ml-4 mt-1">Define valor de célula (linha/coluna começam em 0)</p>
                    </div>
                    <div>
                      <code className="text-green-600 font-mono font-semibold">xlsx-add-row [arquivo] "Col1" "Col2" "Col3" ...</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona linha completa</p>
                    </div>
                    <div>
                      <code className="text-green-600 font-mono font-semibold">xlsx-list [arquivo]</code>
                      <p className="text-gray-600 ml-4 mt-1">Exibe conteúdo da planilha</p>
                    </div>
                    <div className="bg-green-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo:</p>
                      <code className="text-xs block mt-1">xlsx-set-cell vendas 0 0 "Mês"</code>
                      <code className="text-xs block">xlsx-set-cell vendas 0 1 "Valor"</code>
                      <code className="text-xs block">xlsx-add-row vendas "Janeiro" "5000"</code>
                      <code className="text-xs block">xlsx-add-row vendas "Fevereiro" "6200"</code>
                    </div>
                  </div>
                </div>

                {/* Comandos Apresentações */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-100 p-4 rounded-lg border-2 border-amber-300">
                  <h3 className="font-bold text-amber-900 text-lg mb-3">🎬 Apresentações (.pptx)</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code className="text-amber-600 font-mono font-semibold">pptx-add-slide [arquivo] "Título" "Conteúdo"</code>
                      <p className="text-gray-600 ml-4 mt-1">Adiciona novo slide</p>
                    </div>
                    <div>
                      <code className="text-amber-600 font-mono font-semibold">pptx-list [arquivo]</code>
                      <p className="text-gray-600 ml-4 mt-1">Lista todos os slides</p>
                    </div>
                    <div className="bg-amber-200 p-2 rounded mt-2">
                      <p className="text-xs font-semibold">Exemplo:</p>
                      <code className="text-xs block mt-1">pptx-add-slide deck "Introdução" "Bem-vindos"</code>
                      <code className="text-xs block">pptx-add-slide deck "Objetivos" "Metas do projeto"</code>
                    </div>
                  </div>
                </div>

                {/* JSON Completo */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-100 p-4 rounded-lg border-2 border-indigo-400">
                  <h3 className="font-bold text-indigo-900 text-lg mb-3">📋 Escrever JSON Completo</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      Para arquivos complexos, você pode colar o JSON completo diretamente:
                    </p>
                    <code className="text-indigo-600 font-mono font-semibold block bg-white p-2 rounded">
                      echo '{`'{"lists":[{"id":"1","title":"To Do","cards":[]}]}'`} &gt; board
                    </code>
                    <p className="text-gray-600 text-xs mt-2">
                      ✓ O terminal valida automaticamente o JSON<br/>
                      ✓ Funciona para todos os tipos: Kanban, Gantt, FluxMap, Cronograma<br/>
                      ✓ Ideal para criar estruturas complexas de uma vez
                    </p>
                  </div>
                </div>

                {/* Utilitários */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-300">
                  <h3 className="font-bold text-gray-900 text-lg mb-3">🛠️ Comandos Utilitários</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-4">
                      <code className="text-gray-600 font-mono font-semibold min-w-[120px]">help</code>
                      <span>Mostra lista resumida de comandos</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-gray-600 font-mono font-semibold min-w-[120px]">docs</code>
                      <span>Abre documentação completa no terminal</span>
                    </div>
                    <div className="flex gap-4">
                      <code className="text-gray-600 font-mono font-semibold min-w-[120px]">clear</code>
                      <span>Limpa o histórico do terminal</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-100 p-4 rounded-lg border-2 border-yellow-400 mt-4">
                  <p className="font-semibold text-yellow-900 mb-2">💡 Dicas Importantes:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Use <strong>aspas duplas</strong> para textos com espaços</li>
                    <li>IDs de listas/grupos podem ser copiados com o comando <strong>*-list</strong></li>
                    <li>Datas usam formato <strong>YYYY-MM-DD</strong> (ex: 2026-01-20)</li>
                    <li>O terminal funciona em <strong>tempo real</strong> com o Drive</li>
                    <li>Mudanças aparecem instantaneamente em todas as interfaces</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Assistente Virtual */}
            <AccordionItem value="assistant" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  🤖 Assistente Virtual AI
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Uma assistente AI personalizável que ajuda você a criar, editar e organizar arquivos por chat.
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Personalização:</strong> Configure nome, avatar, papel, expertise e diretrizes nas configurações</li>
                  <li><strong>Permissões:</strong> Controle o que a assistente pode fazer (criar, editar, deletar)</li>
                  <li><strong>Criação automática:</strong> "Crie uma planilha de vendas", "Faça um kanban de tarefas"</li>
                  <li><strong>Edição inteligente:</strong> "Adicione uma coluna de valores", "Mude o título para..."</li>
                  <li><strong>Automações:</strong> Crie até 15 atalhos personalizados com palavras-chave e ações</li>
                  <li><strong>Contexto:</strong> Entende onde você está (pasta, equipe) e cria arquivos no lugar certo</li>
                  <li><strong>✨ IA Integrada:</strong> Pode gerar imagens com Pollinations.ai para capas e conteúdos</li>
                </ul>

                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
                    ✨ Criar Estruturas Hierárquicas Completas
                  </h4>
                  <p className="text-gray-700 mb-3">
                    A assistente entende <strong>indentação</strong> e <strong>código XML</strong>! Você pode criar várias pastas e arquivos organizados de uma só vez.
                  </p>
                  
                  {/* Método 1: Indentação */}
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Método 1: Indentação Simples</p>
                    <div className="font-mono text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                      <div className="text-blue-600 mb-2">Crie essa estrutura:</div>
                      <div>- Marketing</div>
                      <div>&nbsp;&nbsp;- Campanhas</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;- Social Media.pptx</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;- Email Marketing.docx</div>
                      <div>&nbsp;&nbsp;- Budget</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;- Planejamento.xlsx</div>
                    </div>
                  </div>

                  {/* Método 2: XML */}
                  <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Método 2: Código XML (mais preciso) ⭐
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        1️⃣ Peça à assistente: <span className="font-semibold text-blue-700">"Monte o código XML para..."</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        2️⃣ Ela vai gerar o XML estruturado para você revisar
                      </p>
                      <p className="text-sm text-gray-600">
                        3️⃣ Cole o XML de volta e ela criará tudo na ordem correta!
                      </p>
                    </div>
                    <div className="font-mono text-xs text-gray-800 bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto mt-3">
                      <div className="text-green-600 mb-1">Exemplo de XML:</div>
                      <div>&lt;root&gt;</div>
                      <div>&nbsp;&nbsp;&lt;folder name="Marketing"&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;folder name="Campanhas"&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;file name="Social Media.pptx" /&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;file name="Email Marketing.docx" /&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/folder&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;folder name="Budget"&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;file name="Planejamento.xlsx" /&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/folder&gt;</div>
                      <div>&nbsp;&nbsp;&lt;/folder&gt;</div>
                      <div>&nbsp;&nbsp;&lt;folder name="Projetos"&gt;</div>
                      <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;file name="Cronograma.gnt" /&gt;</div>
                      <div>&nbsp;&nbsp;&lt;/folder&gt;</div>
                      <div>&lt;/root&gt;</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      <p>✅ <strong>Vantagens do XML:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Estrutura visualmente clara e organizada</li>
                        <li>Execução na ordem correta garantida</li>
                        <li>Fácil de revisar antes de criar</li>
                        <li>Pode ser salvo e reutilizado depois</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mt-4">
                  <strong>💡 Exemplo simples:</strong> Dentro de uma pasta de equipe, diga "Crie um documento de política" e a assistente criará automaticamente compartilhado com a equipe!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Colaboração */}
            <AccordionItem value="collaboration" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  💬 Colaboração em Tempo Real
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Trabalhe simultaneamente com sua equipe em arquivos compartilhados.
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Presença em tempo real:</strong> Veja quem está editando o arquivo com avatares no topo</li>
                  <li><strong>Chat integrado:</strong> Converse com a equipe sem sair do arquivo</li>
                  <li><strong>Histórico:</strong> Acompanhe todas as atividades da equipe pelo feed de atividades</li>
                  <li><strong>Auto-refresh:</strong> Configure intervalo de atualização automática nas configurações</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Upload */}
            <AccordionItem value="upload" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  📤 Upload de Arquivos
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Importe arquivos do seu computador diretamente para o Keeping.
                </p>
                <h3 className="font-semibold text-lg">Métodos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Botão Upload:</strong> Selecione múltiplos arquivos de uma vez</li>
                  <li><strong>Arrastar e soltar:</strong> Arraste arquivos do PC para o Drive ou dentro de pastas</li>
                  <li><strong>Formatos suportados:</strong> Imagens (JPG, PNG, GIF), vídeos (MP4, MOV), PDFs, Office (DOCX, XLSX, PPTX)</li>
                </ul>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <strong>💡 Dica:</strong> Arraste arquivos diretamente para pastas específicas para organizá-los automaticamente!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sincronização em Tempo Real */}
            <AccordionItem value="sync" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  🔄 Sincronização em Tempo Real
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  O Keeping sincroniza automaticamente todas as mudanças em tempo real entre Drive, Terminal e Assistente AI.
                </p>
                <h3 className="font-semibold text-lg">Como funciona:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Real-time subscriptions:</strong> Usa WebSockets para detectar mudanças instantaneamente</li>
                  <li><strong>Auto-refresh:</strong> Páginas se atualizam sozinhas quando alguém muda algo</li>
                  <li><strong>Sincronização cruzada:</strong> Mudanças no Terminal aparecem no Drive e vice-versa</li>
                  <li><strong>Consistência garantida:</strong> Todas as interfaces sempre mostram os mesmos dados</li>
                </ul>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <strong>✨ Benefício:</strong> Você e sua equipe veem as mudanças na hora, sem precisar recarregar a página!
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dashboard */}
            <AccordionItem value="dashboard" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  📊 Dashboard - Visão Geral
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Acompanhe estatísticas e acesse rapidamente seus arquivos recentes.
                </p>
                <h3 className="font-semibold text-lg">Informações exibidas:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Total de pastas ativas</li>
                  <li>Total de arquivos por tipo (Kanbans, Documentos, Planilhas, etc.)</li>
                  <li>5 arquivos mais recentemente atualizados</li>
                  <li>Ações rápidas para criar novos itens</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Apresentações */}
            <AccordionItem value="presentations" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  🎬 Apresentações (PPTX)
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Crie apresentações profissionais com slides personalizáveis.
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Elementos:</strong> Adicione textos, títulos, imagens e formas</li>
                  <li><strong>Formatação:</strong> Customize fontes, cores, tamanhos e posições</li>
                  <li><strong>Layouts:</strong> Escolha orientação (landscape/portrait)</li>
                  <li><strong>Backgrounds:</strong> Adicione cores ou imagens de fundo aos slides</li>
                  <li><strong>Modo apresentação:</strong> Visualize em tela cheia com navegação</li>
                  <li><strong>Exportar:</strong> Baixe como PowerPoint (.pptx) ou PDF</li>
                  <li><strong>Impressão:</strong> Imprima slides direto do navegador</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Documentos */}
            <AccordionItem value="documents" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  📝 Documentos (DOCX)
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Editor de texto completo com formatação rica e visual A4 profissional.
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Formatação rica:</strong> Negrito, itálico, sublinhado, cores, tamanhos</li>
                  <li><strong>Títulos:</strong> 6 níveis de títulos (H1-H6)</li>
                  <li><strong>Listas:</strong> Numeradas e com marcadores</li>
                  <li><strong>Orientação A4:</strong> Vertical ou horizontal com visualização real</li>
                  <li><strong>Zoom:</strong> Ajuste de 50% a 200%</li>
                  <li><strong>Impressão:</strong> Formato A4 pronto para impressão</li>
                  <li><strong>Exportar:</strong> Baixe como TXT</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Planilhas */}
            <AccordionItem value="spreadsheets" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                <div className="flex items-center gap-2">
                  📊 Planilhas (XLSX)
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <p>
                  Planilhas estilo Excel com interface familiar e poderosa.
                </p>
                <h3 className="font-semibold text-lg">Recursos:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Grid interativo:</strong> Navegação com mouse e teclado</li>
                  <li><strong>Edição de células:</strong> Duplo clique ou F2 para editar</li>
                  <li><strong>Formatação:</strong> Negrito, cores, alinhamentos</li>
                  <li><strong>Fórmulas:</strong> Suporte a cálculos e funções</li>
                  <li><strong>Colunas redimensionáveis:</strong> Ajuste largura das colunas</li>
                  <li><strong>Impressão:</strong> Layout otimizado para papel</li>
                  <li><strong>Exportar:</strong> Baixe como CSV</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Atalhos */}
            <AccordionItem value="shortcuts" className="border rounded-lg px-4">
              <AccordionTrigger className="text-xl font-semibold">
                ⌨️ Atalhos e Dicas
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 space-y-4 pt-4">
                <h3 className="font-semibold text-lg">Atalhos úteis:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Ctrl/Cmd + V:</strong> Colar item copiado</li>
                  <li><strong>Drag & Drop:</strong> Arrastar arquivos/pastas para reorganizar</li>
                  <li><strong>Ctrl/Cmd + Scroll:</strong> Zoom no FluxMap</li>
                  <li><strong>Duplo clique:</strong> Menu rápido em arquivos/pastas</li>
                </ul>
                
                <h3 className="font-semibold text-lg mt-4">Dicas de produtividade:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use cores para organizar pastas por projeto ou categoria</li>
                  <li>Nomeie arquivos de forma clara e descritiva</li>
                  <li>Crie uma estrutura de pastas lógica desde o início</li>
                  <li>Faça backups regulares usando a função de exportar</li>
                  <li>Use o assistente AI para ajudar com tarefas complexas</li>
                  <li>Configure automações personalizadas para tarefas repetitivas</li>
                  <li>Use equipes para projetos colaborativos</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Precisa de mais ajuda? Entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}