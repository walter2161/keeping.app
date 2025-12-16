import React, { useEffect, useRef, useState } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FluxMap({ data, onChange }) {
  const drawflowRef = useRef(null);
  const editorRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [editDialog, setEditDialog] = useState({ open: false, nodeId: null, data: {} });

  const createNodeHTML = (name) => {
    let html = '';
    let inputs = 1;
    let outputs = 1;

    switch (name) {
      case 'sticky-note':
        html = `
          <div style="width: 180px; min-height: 180px; background: #fef08a; padding: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); position: relative;">
            <textarea style="width: 100%; height: 140px; border: none; background: transparent; resize: none; font-size: 14px; line-height: 1.5; color: #78716c; font-family: 'Montserrat', sans-serif;" placeholder="Escreva aqui...">Nota</textarea>
          </div>
        `;
        inputs = 0;
        outputs = 0;
        break;

      case 'card-kanban':
        html = `
          <div style="width: 240px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 4px solid #3b82f6; overflow: hidden;">
            <div style="padding: 12px;">
              <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">
                <input type="text" value="Nome da tarefa" style="width: 100%; border: none; font-size: 14px; font-weight: 600; font-family: 'Montserrat', sans-serif;" />
              </div>
              <div style="display: flex; gap: 6px; margin-bottom: 12px;">
                <span style="background: #22c55e; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">Feature</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>👤</span>
                  <span>John</span>
                </div>
                <span>📅 Dec 16</span>
              </div>
            </div>
          </div>
        `;
        break;

      case 'rectangle-shape':
        html = `
          <div style="width: 180px; height: 100px; background: #93c5fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <input type="text" value="Passo" style="width: 100%; border: none; background: transparent; text-align: center; font-size: 14px; font-weight: 600; color: #1e40af; font-family: 'Montserrat', sans-serif;" />
          </div>
        `;
        break;

      case 'circle-shape':
        html = `
          <div style="width: 140px; height: 140px; background: #fde047; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <input type="text" value="Círculo" style="width: 100%; border: none; background: transparent; text-align: center; font-size: 14px; font-weight: 600; color: #854d0e; font-family: 'Montserrat', sans-serif;" />
          </div>
        `;
        outputs = 2;
        break;

      case 'name-bubble':
        html = `
          <div style="background: white; border: 3px solid #a855f7; border-radius: 50px; padding: 12px 24px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <input type="text" value="Nome" style="border: none; background: transparent; text-align: center; font-size: 15px; font-weight: 600; color: #6b21a8; width: 100px; font-family: 'Montserrat', sans-serif;" />
          </div>
        `;
        inputs = 0;
        outputs = 0;
        break;

      case 'text-box':
        html = `
          <div style="background: transparent; padding: 8px;">
            <input type="text" value="Texto" style="border: none; background: transparent; font-size: 16px; font-weight: 600; color: #1e293b; font-family: 'Montserrat', sans-serif; min-width: 120px;" />
          </div>
        `;
        inputs = 0;
        outputs = 0;
        break;

      default:
        html = '<div style="padding: 12px;">Novo Item</div>';
        break;
    }

    return { html, inputs, outputs };
  };

  const addNodeToDrawFlow = (name, pos_x, pos_y) => {
    const editor = editorRef.current;
    if (!editor || editor.editor_mode === 'fixed') {
      return false;
    }

    pos_x = pos_x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - 
            editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom));
    pos_y = pos_y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - 
            editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom));

    const { html, inputs, outputs } = createNodeHTML(name);
    editor.addNode(name, inputs, outputs, pos_x, pos_y, name, {}, html);
    
    if (onChange) {
      onChange(editor.export());
    }
  };

  const handleClickToAdd = (nodeType) => {
    if (!drawflowRef.current) return;
    
    const rect = drawflowRef.current.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    
    addNodeToDrawFlow(nodeType, centerX, centerY);
  };

  useEffect(() => {
    if (!drawflowRef.current || editorRef.current) return;

    const editor = new Drawflow(drawflowRef.current);
    editor.reroute = true;
    editor.curvature = 0.5;
    editor.force_first_input = false;
    editor.start();
    
    editorRef.current = editor;

    if (data && data.drawflow) {
      try {
        editor.import(data);
      } catch (e) {
        console.error('Erro ao importar dados:', e);
      }
    }

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
    
    // Double click to edit
    editor.on('nodeSelected', (id) => {
      const nodeElement = document.getElementById(`node-${id}`);
      if (nodeElement) {
        nodeElement.addEventListener('dblclick', () => {
          const nodeData = editor.getNodeFromId(id);
          setEditDialog({ 
            open: true, 
            nodeId: id, 
            data: nodeData.data || {}
          });
        });
      }
    });

    const elements = document.getElementsByClassName('drag-drawflow');
    for (let i = 0; i < elements.length; i++) {
      elements[i].addEventListener('touchend', drop, false);
      elements[i].addEventListener('touchmove', positionMobile, false);
      elements[i].addEventListener('touchstart', drag, false);
    }

    let mobile_item_selec = '';
    let mobile_last_move = null;

    function positionMobile(ev) {
      mobile_last_move = ev;
    }

    function drag(ev) {
      if (ev.type === 'touchstart') {
        mobile_item_selec = ev.target.closest('.drag-drawflow').getAttribute('data-node');
      } else {
        ev.dataTransfer.setData('node', ev.target.getAttribute('data-node'));
      }
    }

    function drop(ev) {
      if (ev.type === 'touchend') {
        const parentdrawflow = document.elementFromPoint(
          mobile_last_move.touches[0].clientX,
          mobile_last_move.touches[0].clientY
        ).closest('#drawflow');
        if (parentdrawflow != null) {
          addNodeToDrawFlow(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY);
        }
        mobile_item_selec = '';
      } else {
        ev.preventDefault();
        const nodeType = ev.dataTransfer.getData('node');
        addNodeToDrawFlow(nodeType, ev.clientX, ev.clientY);
      }
    }

    window.allowDrop = (ev) => {
      ev.preventDefault();
    };

    return () => {
      if (editorRef.current) {
        editorRef.current.clear();
      }
    };
  }, [data, onChange]);

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

  const handleEditSave = () => {
    if (editorRef.current && editDialog.nodeId) {
      const node = editorRef.current.getNodeFromId(editDialog.nodeId);
      if (node) {
        node.data = editDialog.data;
        
        // Update the visual content
        const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
        if (nodeElement) {
          const inputs = nodeElement.querySelectorAll('input, textarea');
          if (editDialog.data.title && inputs[0]) inputs[0].value = editDialog.data.title;
          if (editDialog.data.description && inputs[1]) inputs[1].value = editDialog.data.description;
        }
        
        if (onChange) {
          onChange(editorRef.current.export());
        }
      }
    }
    setEditDialog({ open: false, nodeId: null, data: {} });
  };

  return (
    <div className="h-full flex">
      <style>{`
        #drawflow {
          background: #f8fafc;
          position: relative;
        }
        
        .drawflow .drawflow-node {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        
        .drawflow .drawflow-node.selected {
          background: transparent !important;
        }
        
        .drawflow .drawflow-node.selected::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid #3b82f6;
          border-radius: 4px;
          pointer-events: none;
        }

        .drawflow .connection .main-path {
          stroke: #94a3b8;
          stroke-width: 2px;
        }

        .drawflow .connection .main-path:hover {
          stroke: #3b82f6;
          stroke-width: 3px;
        }

        .drawflow .drawflow-node .input,
        .drawflow .drawflow-node .output {
          width: 10px;
          height: 10px;
          border: 2px solid #94a3b8;
          background: white;
          border-radius: 50%;
        }

        .drawflow .drawflow-node .input:hover,
        .drawflow .drawflow-node .output:hover {
          background: #3b82f6;
          border-color: #3b82f6;
          transform: scale(1.2);
        }
        
        .drawflow .drawflow-node .outputs {
          right: -5px;
        }
        
        .drawflow .drawflow-node .inputs {
          left: -5px;
        }

        .sidebar-flux {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 20px;
          overflow-y: auto;
        }

        .drag-drawflow {
          cursor: grab;
          user-select: none;
          margin-bottom: 10px;
          padding: 14px 16px;
          border-radius: 8px;
          border: 2px solid;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
          font-family: 'Montserrat', sans-serif;
        }

        .drag-drawflow:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .drag-drawflow:active {
          cursor: grabbing;
        }
      `}</style>

      <div className="sidebar-flux">
        <div className="mb-6">
          <h3 className="font-bold text-sm text-gray-700 mb-4 uppercase tracking-wide">Elementos</h3>
          
          <div
            className="drag-drawflow"
            draggable="true"
            data-node="sticky-note"
            onClick={() => handleClickToAdd('sticky-note')}
            style={{ background: '#fef3c7', borderColor: '#fbbf24' }}
          >
            <span style={{ fontSize: '22px' }}>📝</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400e' }}>Sticky Note</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="card-kanban"
            onClick={() => handleClickToAdd('card-kanban')}
            style={{ background: '#dbeafe', borderColor: '#3b82f6' }}
          >
            <span style={{ fontSize: '22px' }}>🎯</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>Card Kanban</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="rectangle-shape"
            onClick={() => handleClickToAdd('rectangle-shape')}
            style={{ background: '#e0f2fe', borderColor: '#0284c7' }}
          >
            <span style={{ fontSize: '22px' }}>▭</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#075985' }}>Retângulo</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="circle-shape"
            onClick={() => handleClickToAdd('circle-shape')}
            style={{ background: '#fef9c3', borderColor: '#eab308' }}
          >
            <span style={{ fontSize: '22px' }}>●</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#713f12' }}>Círculo</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="name-bubble"
            onClick={() => handleClickToAdd('name-bubble')}
            style={{ background: '#f3e8ff', borderColor: '#a855f7' }}
          >
            <span style={{ fontSize: '22px' }}>👤</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b21a8' }}>Nome</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="text-box"
            onClick={() => handleClickToAdd('text-box')}
            style={{ background: '#f1f5f9', borderColor: '#64748b' }}
          >
            <span style={{ fontSize: '22px' }}>T</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Texto</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">Controles</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={handleZoomOut} className="flex-1">
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} className="flex-1">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div
        id="drawflow"
        ref={drawflowRef}
        className="flex-1"
        onDrop={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Elemento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                value={editDialog.data.title || ''}
                onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, title: e.target.value } })}
                placeholder="Digite o título"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                value={editDialog.data.description || ''}
                onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, description: e.target.value } })}
                placeholder="Digite a descrição"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog({ open: false, nodeId: null, data: {} })}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}