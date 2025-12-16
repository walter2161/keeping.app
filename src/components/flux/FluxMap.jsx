import React, { useEffect, useRef, useState } from 'react';
import Drawflow from 'drawflow';
import { 
  Trello, GripVertical, Diamond, Lightbulb, UserCog,
  Trash2, Plus, Minus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import 'drawflow/dist/drawflow.min.css';

export default function FluxMap({ data, onChange }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = new Drawflow(containerRef.current);
    editor.reroute = true;
    editor.start();
    
    editorRef.current = editor;

    // Carregar dados salvos
    if (data && data.drawflow) {
      editor.import(data);
    }

    // Salvar alterações
    const saveData = () => {
      if (onChange) {
        onChange(editor.export());
      }
    };

    editor.on('nodeCreated', saveData);
    editor.on('nodeRemoved', saveData);
    editor.on('nodeMoved', saveData);
    editor.on('connectionCreated', saveData);
    editor.on('connectionRemoved', saveData);

    // Expor funções globais para callbacks HTML
    window.openFluxModal = (nodeId) => {
      setCurrentNodeId(nodeId);
      const titleEl = document.getElementById(`title-${nodeId}`);
      if (titleEl) {
        setNodeTitle(titleEl.textContent.trim());
      }
      setModalOpen(true);
    };

    window.toggleFluxIcon = (nodeId, iconType) => {
      const iconEl = document.getElementById(`${iconType}-${nodeId}`);
      if (iconEl) {
        iconEl.classList.toggle('has-data');
      }
    };

    window.addFluxLabel = (nodeId, color) => {
      const labelsContainer = document.getElementById(`labels-${nodeId}`);
      if (labelsContainer) {
        const label = document.createElement('div');
        label.className = 'card-label';
        label.style.background = color;
        labelsContainer.appendChild(label);
      }
    };

    window.clearFluxLabels = (nodeId) => {
      const labelsContainer = document.getElementById(`labels-${nodeId}`);
      if (labelsContainer) {
        labelsContainer.innerHTML = '';
      }
    };

    window.setFluxCover = (nodeId, color) => {
      const coverEl = document.getElementById(`cover-${nodeId}`);
      if (coverEl) {
        coverEl.style.height = '60px';
        coverEl.style.background = color;
      }
    };

    window.clearFluxCover = (nodeId) => {
      const coverEl = document.getElementById(`cover-${nodeId}`);
      if (coverEl) {
        coverEl.style.height = '0';
        coverEl.style.background = 'none';
      }
    };

    return () => {
      if (editorRef.current) {
        editorRef.current.clear();
      }
    };
  }, []);

  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('node', nodeType);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('node');
    if (!nodeType || !editorRef.current) return;

    const editor = editorRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    
    let pos_x = (e.clientX - rect.x) * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom));
    let pos_y = (e.clientY - rect.y) * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom));

    addNode(nodeType, pos_x, pos_y);
  };

  const addNode = (type, x, y) => {
    const editor = editorRef.current;
    if (!editor) return;

    let html, inputs = 1, outputs = 1, className = type;
    const tempId = Date.now();

    const templates = {
      'card-trello': () => ({
        html: `
          <button class="edit-btn" onclick="openFluxModal('${tempId}')">✏️</button>
          <div class="card-cover" id="cover-${tempId}" style="height:0;"></div>
          <div class="card-content">
            <div class="card-labels" id="labels-${tempId}"></div>
            <div class="card-title-trello" id="title-${tempId}" contenteditable="true">Nova Tarefa</div>
            <div class="card-icons">
              <span id="check-${tempId}">✔️ 0</span>
              <span id="comment-${tempId}">💬 0</span>
              <span id="attach-${tempId}">📎 0</span>
              <span id="date-${tempId}">📅</span>
            </div>
          </div>
        `,
        className: 'card-trello',
        inputs: 1,
        outputs: 1
      }),
      'card-fluxograma': () => ({
        html: `
          <div>
            <div class="node-title-simple" contenteditable="true">Passo do Fluxo</div>
            <div class="node-body-simple" contenteditable="true">Detalhe da ação</div>
          </div>
        `,
        className: 'card-fluxograma',
        inputs: 1,
        outputs: 1
      }),
      'decisao': () => ({
        html: `<div class="node-content"><div class="node-body-simple" contenteditable="true">É aprovado?</div></div>`,
        className: 'decisao',
        inputs: 1,
        outputs: 2
      }),
      'ideia': () => ({
        html: `<div class="node-content"><div class="node-body-simple" contenteditable="true">Ideia Central</div></div>`,
        className: 'ideia',
        inputs: 1,
        outputs: 3
      }),
      'cargo': () => ({
        html: `
          <div class="cargo-content">
            <div class="cargo-icon">👤</div>
            <div class="cargo-info">
              <div class="cargo-title" contenteditable="true">Gerente</div>
              <div class="cargo-subtitle" contenteditable="true">Coordenador</div>
            </div>
          </div>
        `,
        className: 'cargo',
        inputs: 1,
        outputs: 2
      })
    };

    const config = templates[type] ? templates[type]() : templates['card-fluxograma']();
    
    const nodeId = editor.addNode(
      type,
      config.inputs,
      config.outputs,
      x,
      y,
      config.className,
      {},
      config.html
    );

    // Inicializar card trello
    if (type === 'card-trello') {
      setTimeout(() => {
        window.addFluxLabel(nodeId, '#61bd4f');
        window.setFluxCover(nodeId, '#0079bf');
        window.toggleFluxIcon(nodeId, 'check');
      }, 10);
    }

    if (onChange) {
      onChange(editor.export());
    }
  };

  const saveModalChanges = () => {
    if (currentNodeId && nodeTitle) {
      const titleEl = document.getElementById(`title-${currentNodeId}`);
      if (titleEl) {
        titleEl.textContent = nodeTitle;
      }
      if (onChange && editorRef.current) {
        onChange(editorRef.current.export());
      }
    }
    setModalOpen(false);
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

  const deleteSelected = () => {
    if (editorRef.current && editorRef.current.node_selected) {
      editorRef.current.removeNodeId(`node-${editorRef.current.node_selected}`);
      if (onChange) {
        onChange(editorRef.current.export());
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <style>{`
        .drawflow {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .drawflow-node {
          background: white;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          min-width: 200px;
          max-width: 280px;
          box-shadow: 0 4px 12px rgba(0,0,0,.08);
          padding: 0;
        }
        
        .drawflow-node.selected {
          outline: 3px solid #4b5563;
          border: 1px solid #4b5563;
        }
        
        .node-title-simple {
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .node-body-simple {
          padding: 12px;
          font-size: 13px;
          color: #374151;
        }
        
        [contenteditable="true"]:focus {
          outline: none;
          background: #eef2ff;
          border-radius: 4px;
        }
        
        .card-fluxograma {
          border-left: 6px solid #6b7280;
        }
        
        .decisao {
          min-width: 120px;
          height: 120px;
          background-color: #d1fae5;
          border-radius: 4px;
          transform: rotate(45deg);
          border: 1px solid #34d399;
        }
        
        .decisao .node-content {
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .ideia {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 50%;
          min-width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .cargo {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .cargo-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
        }
        
        .cargo-icon {
          font-size: 24px;
        }
        
        .cargo-title {
          font-weight: 600;
          font-size: 14px;
        }
        
        .cargo-subtitle {
          font-size: 12px;
          opacity: 0.9;
        }
        
        .card-trello {
          min-width: 260px;
        }
        
        .edit-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #f4f5f7;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          z-index: 10;
        }
        
        .card-cover {
          height: 0;
          background-size: cover;
          background-position: center;
          border-radius: 8px 8px 0 0;
          transition: height 0.2s;
        }
        
        .card-content {
          padding: 10px;
        }
        
        .card-labels {
          display: flex;
          gap: 4px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        
        .card-label {
          height: 8px;
          width: 40px;
          border-radius: 4px;
        }
        
        .card-title-trello {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .card-icons {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #5e6c84;
        }
        
        .card-icons span {
          display: none;
        }
        
        .card-icons span.has-data {
          display: inline-block;
        }
      `}</style>

      <div className="bg-white border-b px-4 py-2 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'card-trello')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-grab hover:bg-blue-50 transition-colors"
          >
            <Trello className="w-4 h-4" />
            <span className="text-sm font-medium">Card Trello</span>
          </div>
          
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'card-fluxograma')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-grab hover:bg-blue-50 transition-colors"
          >
            <GripVertical className="w-4 h-4" />
            <span className="text-sm font-medium">Fluxo</span>
          </div>
          
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'decisao')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-grab hover:bg-blue-50 transition-colors"
          >
            <Diamond className="w-4 h-4" />
            <span className="text-sm font-medium">Decisão</span>
          </div>
          
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'ideia')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-grab hover:bg-blue-50 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">Ideia</span>
          </div>
          
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'cargo')}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-grab hover:bg-blue-50 transition-colors"
          >
            <UserCog className="w-4 h-4" />
            <span className="text-sm font-medium">Cargo</span>
          </div>

          <Button variant="destructive" size="sm" onClick={deleteSelected}>
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

      <div
        ref={containerRef}
        className="flex-1"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Card</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                value={nodeTitle}
                onChange={(e) => setNodeTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Checklist</label>
              <Button onClick={() => window.toggleFluxIcon(currentNodeId, 'check')}>
                Toggle Checklist
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Etiquetas</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="w-16 h-8 rounded"
                  style={{ background: '#61bd4f' }}
                  onClick={() => window.addFluxLabel(currentNodeId, '#61bd4f')}
                />
                <button
                  className="w-16 h-8 rounded"
                  style={{ background: '#f2d600' }}
                  onClick={() => window.addFluxLabel(currentNodeId, '#f2d600')}
                />
                <button
                  className="w-16 h-8 rounded"
                  style={{ background: '#eb5a46' }}
                  onClick={() => window.addFluxLabel(currentNodeId, '#eb5a46')}
                />
                <Button variant="outline" onClick={() => window.clearFluxLabels(currentNodeId)}>
                  Limpar
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Capa</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="w-20 h-12 rounded"
                  style={{ background: '#0079bf' }}
                  onClick={() => window.setFluxCover(currentNodeId, '#0079bf')}
                />
                <button
                  className="w-20 h-12 rounded"
                  style={{ background: '#61bd4f' }}
                  onClick={() => window.setFluxCover(currentNodeId, '#61bd4f')}
                />
                <button
                  className="w-20 h-12 rounded"
                  style={{ background: '#eb5a46' }}
                  onClick={() => window.setFluxCover(currentNodeId, '#eb5a46')}
                />
                <Button variant="outline" onClick={() => window.clearFluxCover(currentNodeId)}>
                  Remover
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => window.toggleFluxIcon(currentNodeId, 'attach')}>
                Toggle Anexo
              </Button>
              <Button onClick={() => window.toggleFluxIcon(currentNodeId, 'comment')}>
                Toggle Comentário
              </Button>
              <Button onClick={() => window.toggleFluxIcon(currentNodeId, 'date')}>
                Toggle Data
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveModalChanges}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}