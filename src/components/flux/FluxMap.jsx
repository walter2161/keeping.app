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

    // Setup drag and drop
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

    function addNodeToDrawFlow(name, pos_x, pos_y) {
      if (editor.editor_mode === 'fixed') {
        return false;
      }

      pos_x = pos_x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - 
              editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom));
      pos_y = pos_y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - 
              editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom));

      let html = '';
      let inputs = 1;
      let outputs = 1;

      switch (name) {
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
          break;

        default:
          html = '<div style="padding: 12px;">Novo Item</div>';
          break;
      }

      editor.addNode(name, inputs, outputs, pos_x, pos_y, name, {}, html);
      
      if (onChange) {
        onChange(editor.export());
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

  return (
    <div className="h-full flex">
      <style>{`
        #drawflow {
          background: radial-gradient(circle, #d1d5db 1px, transparent 1px);
          background-size: 20px 20px;
          position: relative;
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

        .sidebar-flux {
          width: 260px;
          background: white;
          border-right: 1px solid #e5e7eb;
          padding: 16px;
          overflow-y: auto;
        }

        .drag-drawflow {
          cursor: grab;
          user-select: none;
          margin-bottom: 8px;
          padding: 12px;
          border-radius: 8px;
          border: 2px solid;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .drag-drawflow:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .drag-drawflow:active {
          cursor: grabbing;
        }
      `}</style>

      {/* Sidebar com itens arrastáveis */}
      <div className="sidebar-flux">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-gray-700 mb-3">ELEMENTOS</h3>
          
          <div
            className="drag-drawflow"
            draggable="true"
            data-node="card-trello"
            style={{ background: '#dbeafe', borderColor: '#3b82f6' }}
          >
            <span style={{ fontSize: '20px' }}>📋</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>Card Trello</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="card-fluxograma"
            style={{ background: '#f3f4f6', borderColor: '#6b7280' }}
          >
            <span style={{ fontSize: '20px' }}>📝</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Passo Fluxo</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="decisao"
            style={{ background: '#d1fae5', borderColor: '#10b981' }}
          >
            <span style={{ fontSize: '20px' }}>◆</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#047857' }}>Decisão</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="ideia"
            style={{ background: '#fef3c7', borderColor: '#f59e0b' }}
          >
            <span style={{ fontSize: '20px' }}>💡</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#d97706' }}>Ideia</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="cargo"
            style={{ background: '#ede9fe', borderColor: '#8b5cf6' }}
          >
            <span style={{ fontSize: '20px' }}>👤</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#6d28d9' }}>Cargo</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-bold text-sm text-gray-700 mb-3">CONTROLES</h3>
          
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
            Excluir Selecionado
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        id="drawflow"
        ref={drawflowRef}
        className="flex-1"
        onDrop={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
      />
    </div>
  );
}