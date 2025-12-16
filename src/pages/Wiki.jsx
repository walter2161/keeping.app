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
          
          <Link to={createPageUrl('WikiDev')}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Code className="w-4 h-4 mr-2" />
              Documentação para Desenvolvedores
            </Button>
          </Link>
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
                  <li>Cores de capa customizáveis</li>
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
                  <li><strong>Card:</strong> Cards estilo Kanban com detalhes</li>
                  <li><strong>Retângulo:</strong> Formas para processos</li>
                  <li><strong>Círculo:</strong> Destacar pontos importantes</li>
                  <li><strong>Nome:</strong> Bolhas para nomes/etiquetas</li>
                  <li><strong>Texto:</strong> Caixas de texto simples</li>
                </ul>
                <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                  <strong>💡 Dica:</strong> Conecte elementos clicando nas bolinhas que aparecem ao passar o mouse!
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
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Precisa de mais ajuda? Entre em contato com o suporte ou acesse a{' '}
            <Link to={createPageUrl('WikiDev')} className="text-indigo-600 font-semibold hover:underline">
              documentação técnica
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}