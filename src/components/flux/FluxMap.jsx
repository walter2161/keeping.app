import React, { useEffect, useRef, useState } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from 'lucide-react';

export default function FluxMap({ data, onChange }) {
  const drawflowRef = useRef(null);
  const editorRef = useRef(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!drawflowRef.current || editorRef.current) return;

    // Inicializar Drawflow
    const editor = new Drawflow(drawflowRef.current);
    editor.reroute = true;
    editor.curvature = 0.5;
    editor.force_first_input = false;
    editor.start();
    
    editorRef.current = editor;

    // Carregar dados existentes
    if (data && data.drawflow) {
      try {
        editor.import(data);
      } catch (e) {
        console.error('Erro ao importar dados:', e);
      }
    }

    // Salvar ao fazer alterações
    const saveData = () => {
      if (onChange) {
        const exportData = editor.export();
        onChange(exportData);
      }
    };

    editor.on('nodeCreated', saveData);
    editor.on('nodeRemoved', saveData);
    editor.on('nodeMoved', saveData);
    editor.on('connectionCreated', saveData);
    editor.on('connectionRemoved', saveData);

    // Atualizar zoom
    editor.on('zoom', () => {
      setZoom(Math.round(editor.zoom * 100));
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.clear();
      }
    };
  }, [onChange]);

  // Handlers de drag and drop
  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('node', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('node');
    if (!nodeType || !editorRef.current) return;

    const editor = editorRef.current;
    const rect = drawflowRef.current.getBoundingClientRect();
    
    // Calcular posição considerando zoom e pan
    const x = (e.clientX - rect.left - editor.canvas_x) / editor.zoom;
    const y = (e.clientY - rect.top - editor.canvas_y) / editor.zoom;

    createNode(nodeType, x, y);
  };

  const createNode = (type, posX, posY) => {
    const editor = editorRef.current;
    if (!editor) return;

    let html = '';
    let inputs = 1;
    let outputs = 1;
    let className = type;

    switch (type) {
      case 'card-trello':
        html = `
          <div style="padding: 12px; background: white; border-radius: 8px; min-width: 240px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #172b4d;">
              <input type="text" value="Nova Tarefa" style="width: 100%; border: none; font-size: 14px; font-weight: 600; padding: 4px;" />
            </div>
            <div style="font-size: 12px; color: #5e6c84; display: flex; gap: 12px;">
              <span>✔️ 0/3</span>
              <span>💬 1</span>
              <span>📎 2</span>
            </div>
          </div>
        `;
        className = 'node-trello';
        break;

      case 'card-fluxograma':
        html = `
          <div style="padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #6b7280; min-width: 180px;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">
              <input type="text" value="Passo do Fluxo" style="width: 100%; border: none; font-size: 13px; font-weight: 600;" />
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              <textarea style="width: 100%; border: none; font-size: 12px; resize: none;" rows="2">Descrição da ação</textarea>
            </div>
          </div>
        `;
        className = 'node-fluxo';
        break;

      case 'decisao':
        html = `
          <div style="width: 120px; height: 120px; background: #d1fae5; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #10b981;">
            <div style="transform: rotate(-45deg); font-size: 12px; font-weight: 600; text-align: center; padding: 10px;">
              <input type="text" value="Decisão?" style="width: 80px; border: none; background: transparent; text-align: center; font-size: 12px; font-weight: 600;" />
            </div>
          </div>
        `;
        outputs = 2;
        className = 'node-decisao';
        break;

      case 'ideia':
        html = `
          <div style="width: 140px; height: 140px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #f59e0b; padding: 20px;">
            <div style="font-size: 12px; font-weight: 600; text-align: center;">
              <textarea style="width: 100px; border: none; background: transparent; text-align: center; font-size: 12px; font-weight: 600; resize: none;" rows="3">Ideia Central</textarea>
            </div>
          </div>
        `;
        outputs = 3;
        className = 'node-ideia';
        break;

      case 'cargo':
        html = `
          <div style="padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; min-width: 200px; display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 24px;">👤</div>
            <div>
              <div style="font-size: 14px; font-weight: 600;">
                <input type="text" value="Gerente" style="width: 100%; border: none; background: transparent; color: white; font-size: 14px; font-weight: 600;" />
              </div>
              <div style="font-size: 12px; opacity: 0.9;">
                <input type="text" value="Coordenador" style="width: 100%; border: none; background: transparent; color: white; font-size: 12px;" />
              </div>
            </div>
          </div>
        `;
        outputs = 2;
        className = 'node-cargo';
        break;

      default:
        html = '<div style="padding: 12px;">Novo Item</div>';
        break;
    }

    editor.addNode(type, inputs, outputs, posX, posY, className, {}, html);
    
    if (onChange) {
      onChange(editor.export());
    }
  };

  const handleZoomIn = () => {
    if (editorRef.current) {
      editorRef.current.zoom_in();
      setZoom(Math.round(editorRef.current.zoom * 100));
    }
  };

  const handleZoomOut = () => {
    if (editorRef.current) {
      editorRef.current.zoom_out();
      setZoom(Math.round(editorRef.current.zoom * 100));
    }
  };

  const handleDelete = () => {
    if (editorRef.current && editorRef.current.node_selected) {
      editorRef.current.removeNodeId(`node-${editorRef.current.node_selected}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <style>{`
        #drawflow {
          background: radial-gradient(circle, #d1d5db 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .drawflow .drawflow-node {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .drawflow .drawflow-node.selected {
          box-shadow: 0 0 0 3px #3b82f6;
        }

        .drawflow .connection .main-path {
          stroke: #64748b;
          stroke-width: 2px;
        }

        .drawflow .connection .main-path:hover {
          stroke: #3b82f6;
        }
      `}</style>

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'card-trello')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-grab hover:bg-blue-100 transition-colors select-none"
          >
            <span className="text-xl">📋</span>
            <span className="text-sm font-medium">Card Trello</span>
          </div>

          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'card-fluxograma')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-100 transition-colors select-none"
          >
            <span className="text-xl">📝</span>
            <span className="text-sm font-medium">Passo Fluxo</span>
          </div>

          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'decisao')}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg cursor-grab hover:bg-green-100 transition-colors select-none"
          >
            <span className="text-xl">◆</span>
            <span className="text-sm font-medium">Decisão</span>
          </div>

          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'ideia')}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg cursor-grab hover:bg-yellow-100 transition-colors select-none"
          >
            <span className="text-xl">💡</span>
            <span className="text-sm font-medium">Ideia</span>
          </div>

          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'cargo')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg cursor-grab hover:bg-purple-100 transition-colors select-none"
          >
            <span className="text-xl">👤</span>
            <span className="text-sm font-medium">Cargo</span>
          </div>

          <div className="h-8 w-px bg-gray-300 mx-2" />

          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        id="drawflow"
        ref={drawflowRef}
        className="flex-1"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
    </div>
  );
}