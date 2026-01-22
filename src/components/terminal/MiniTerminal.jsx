import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function MiniTerminal({ fileType, fileId, fileName, content, onContentChange, visible = false }) {
  const [history, setHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const addToHistory = (cmd, output, isError = false) => {
    setHistory(prev => [...prev, { cmd, output, isError, timestamp: Date.now() }]);
  };

  const executeCommand = async (cmd) => {
    if (!cmd.trim()) return;

    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    addToHistory(cmd, '', false);

    try {
      switch (fileType) {
        case 'docx':
          await executeDocxCommand(command, args);
          break;
        case 'xlsx':
          await executeXlsxCommand(command, args);
          break;
        case 'pptx':
          await executePptxCommand(command, args);
          break;
        case 'kbn':
          await executeKanbanCommand(command, args);
          break;
        case 'gnt':
          await executeGanttCommand(command, args);
          break;
        case 'crn':
          await executeCronogramaCommand(command, args);
          break;
        case 'flux':
          await executeFluxCommand(command, args);
          break;
        case 'psd':
          await executePhotoSmartCommand(command, args);
          break;
        default:
          addToHistory('', `Tipo de arquivo não suportado: ${fileType}`, true);
      }
    } catch (error) {
      addToHistory('', `Erro: ${error.message}`, true);
    }
  };

  const executeDocxCommand = async (command, args) => {
    let newContent = content || '';
    
    switch (command) {
      case 'add-heading':
        const level = parseInt(args[0]) || 1;
        const headingText = args.slice(1).join(' ');
        newContent += `<h${level}><strong>${headingText}</strong></h${level}>`;
        onContentChange(newContent);
        addToHistory('', `✓ Título nível ${level} adicionado`);
        break;
        
      case 'add-text':
      case 'add-paragraph':
        const text = args.join(' ');
        newContent += `<p>${text}</p>`;
        onContentChange(newContent);
        addToHistory('', '✓ Parágrafo adicionado');
        break;
        
      case 'add-bold':
        const boldText = args.join(' ');
        newContent += `<p><strong>${boldText}</strong></p>`;
        onContentChange(newContent);
        addToHistory('', '✓ Texto em negrito adicionado');
        break;
        
      case 'add-list':
        const items = args.join(' ').split(',').map(i => i.trim());
        newContent += '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
        onContentChange(newContent);
        addToHistory('', `✓ Lista com ${items.length} itens adicionada`);
        break;
        
      case 'clear':
        onContentChange('');
        addToHistory('', '✓ Documento limpo');
        break;
        
      case 'replace':
        const [search, replace] = args.join(' ').split('->').map(s => s.trim());
        if (search && replace) {
          newContent = newContent.split(search).join(replace);
          onContentChange(newContent);
          addToHistory('', `✓ Substituído "${search}" por "${replace}"`);
        } else {
          addToHistory('', 'Uso: replace texto_antigo -> texto_novo', true);
        }
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos disponíveis: add-heading, add-text, add-bold, add-list, clear, replace`, true);
    }
  };

  const executeXlsxCommand = async (command, args) => {
    const lines = (content || '').split('\n');
    
    switch (command) {
      case 'add-row':
        const newRow = args.join(',');
        lines.push(newRow);
        onContentChange(lines.join('\n'));
        addToHistory('', '✓ Linha adicionada');
        break;
        
      case 'add-header':
        const headers = args.join(',');
        lines.unshift(headers);
        onContentChange(lines.join('\n'));
        addToHistory('', '✓ Cabeçalho adicionado');
        break;
        
      case 'set-cell':
        const [row, col, ...valueParts] = args;
        const value = valueParts.join(' ');
        const rowIndex = parseInt(row) - 1;
        const colIndex = parseInt(col) - 1;
        
        if (lines[rowIndex]) {
          const cells = lines[rowIndex].split(',');
          cells[colIndex] = value;
          lines[rowIndex] = cells.join(',');
          onContentChange(lines.join('\n'));
          addToHistory('', `✓ Célula [${row},${col}] definida`);
        } else {
          addToHistory('', 'Linha não existe', true);
        }
        break;
        
      case 'clear':
        onContentChange('');
        addToHistory('', '✓ Planilha limpa');
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-row, add-header, set-cell, clear`, true);
    }
  };

  const executePptxCommand = async (command, args) => {
    let slides = typeof content === 'string' ? JSON.parse(content || '{"slides":[]}') : content;
    if (!slides.slides) slides = { slides: [] };
    
    switch (command) {
      case 'add-slide':
        slides.slides.push({
          background: '#ffffff',
          elements: []
        });
        onContentChange(slides);
        addToHistory('', `✓ Slide ${slides.slides.length} adicionado`);
        break;
        
      case 'add-title':
        const slideNum = parseInt(args[0]) - 1;
        const titleText = args.slice(1).join(' ');
        
        if (slides.slides[slideNum]) {
          slides.slides[slideNum].elements.push({
            id: Date.now().toString(),
            type: 'title',
            content: titleText,
            x: 100,
            y: 100,
            width: 800,
            height: 100,
            fontSize: 48,
            fontWeight: 'bold',
            color: '#000000'
          });
          onContentChange(slides);
          addToHistory('', `✓ Título adicionado ao slide ${slideNum + 1}`);
        } else {
          addToHistory('', 'Slide não existe', true);
        }
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-slide, add-title`, true);
    }
  };

  const executeKanbanCommand = async (command, args) => {
    let data = typeof content === 'object' ? content : JSON.parse(content || '{"columns":[],"cards":[]}');
    
    switch (command) {
      case 'add-column':
        const colName = args.join(' ');
        data.columns.push({
          id: Date.now().toString(),
          title: colName,
          color: '#3b82f6'
        });
        onContentChange(data);
        addToHistory('', `✓ Coluna "${colName}" adicionada`);
        break;
        
      case 'add-card':
        const [colId, ...titleParts] = args;
        const cardTitle = titleParts.join(' ');
        data.cards.push({
          id: Date.now().toString(),
          columnId: colId,
          title: cardTitle,
          description: '',
          priority: 'medium'
        });
        onContentChange(data);
        addToHistory('', `✓ Card "${cardTitle}" adicionado`);
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-column, add-card`, true);
    }
  };

  const executeGanttCommand = async (command, args) => {
    let data = typeof content === 'object' ? content : JSON.parse(content || '{"tasks":[]}');
    
    switch (command) {
      case 'add-task':
        const taskName = args.join(' ');
        data.tasks.push({
          id: Date.now().toString(),
          name: taskName,
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: 0
        });
        onContentChange(data);
        addToHistory('', `✓ Tarefa "${taskName}" adicionada`);
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-task`, true);
    }
  };

  const executeCronogramaCommand = async (command, args) => {
    let data = typeof content === 'object' ? content : JSON.parse(content || '{"groups":[],"items":[]}');
    
    switch (command) {
      case 'add-group':
        const groupName = args.join(' ');
        data.groups.push({
          id: Date.now().toString(),
          title: groupName
        });
        onContentChange(data);
        addToHistory('', `✓ Grupo "${groupName}" adicionado`);
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-group`, true);
    }
  };

  const executeFluxCommand = async (command, args) => {
    let data = typeof content === 'object' ? content : JSON.parse(content || '{"drawflow":{"Home":{"data":{}}}}');
    
    switch (command) {
      case 'add-card':
        const [x, y, ...titleParts] = args;
        const cardTitle = titleParts.join(' ');
        const nodeId = Date.now().toString();
        
        if (!data.drawflow) data.drawflow = { Home: { data: {} } };
        if (!data.drawflow.Home) data.drawflow.Home = { data: {} };
        if (!data.drawflow.Home.data) data.drawflow.Home.data = {};
        
        data.drawflow.Home.data[nodeId] = {
          id: parseInt(nodeId),
          name: 'card',
          data: {
            title: cardTitle,
            description: '',
            priority: 'medium'
          },
          class: 'card',
          html: '',
          typenode: false,
          inputs: {},
          outputs: {},
          pos_x: parseInt(x) || 100,
          pos_y: parseInt(y) || 100
        };
        
        onContentChange(data);
        addToHistory('', `✓ Card "${cardTitle}" adicionado na posição [${x},${y}]`);
        break;
        
      case 'connect':
        const [node1Id, node2Id] = args;
        if (data.drawflow?.Home?.data?.[node1Id] && data.drawflow?.Home?.data?.[node2Id]) {
          if (!data.drawflow.Home.data[node1Id].outputs) data.drawflow.Home.data[node1Id].outputs = {};
          if (!data.drawflow.Home.data[node2Id].inputs) data.drawflow.Home.data[node2Id].inputs = {};
          
          data.drawflow.Home.data[node1Id].outputs['output_1'] = {
            connections: [{ node: node2Id, output: 'input_1' }]
          };
          data.drawflow.Home.data[node2Id].inputs['input_1'] = {
            connections: [{ node: node1Id, input: 'output_1' }]
          };
          
          onContentChange(data);
          addToHistory('', `✓ Nodes ${node1Id} e ${node2Id} conectados`);
        } else {
          addToHistory('', 'Um ou ambos os nodes não existem', true);
        }
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-card x y titulo, connect node1 node2`, true);
    }
  };

  const executePhotoSmartCommand = async (command, args) => {
    let data = typeof content === 'object' ? content : JSON.parse(content || '{"layers":[]}');
    
    switch (command) {
      case 'add-layer':
        const layerName = args.join(' ');
        data.layers = data.layers || [];
        data.layers.push({
          id: Date.now().toString(),
          name: layerName,
          visible: true,
          opacity: 1
        });
        onContentChange(data);
        addToHistory('', `✓ Camada "${layerName}" adicionada`);
        break;
        
      default:
        addToHistory('', `Comando desconhecido: ${command}\nComandos: add-layer`, true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
      setCurrentCommand('');
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-6 w-[500px] h-[300px] bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-40">
      <div className="bg-gray-800 px-4 py-2 rounded-t-lg flex items-center gap-2 border-b border-gray-700">
        <Terminal className="w-4 h-4 text-green-400" />
        <span className="text-sm text-gray-300 font-mono">Terminal: {fileName}</span>
      </div>
      
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {history.map((entry, idx) => (
          <div key={idx} className="mb-2">
            {entry.cmd && (
              <div className="text-green-400">
                <span className="text-blue-400">$</span> {entry.cmd}
              </div>
            )}
            {entry.output && (
              <div className={entry.isError ? 'text-red-400' : 'text-gray-300'}>
                {entry.output}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-gray-800 px-4 py-2 rounded-b-lg border-t border-gray-700 flex items-center">
        <span className="text-blue-400 mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm"
          placeholder="Digite um comando..."
        />
      </div>
    </div>
  );
}