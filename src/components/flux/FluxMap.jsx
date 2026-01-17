import React, { useEffect, useRef, useState } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CardEditDialog from './CardEditDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FluxMap({ data, onChange, onImport }) {
  const drawflowRef = useRef(null);
  const editorRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [editDialog, setEditDialog] = useState({ open: false, nodeId: null, data: {}, nodeType: null });
  const [importDialog, setImportDialog] = useState({ open: false, data: null });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [dragNodeType, setDragNodeType] = useState(null);
  const dragStartPosRef = useRef(null);
  const [dragPreviewPos, setDragPreviewPos] = useState({ x: 0, y: 0 });

  const createNodeHTML = (name, nodeData = {}) => {
    let html = '';
    let inputs = 2;
    let outputs = 2;

    switch (name) {
      case 'sticky-note':
        html = `
          <div style="width: 180px; min-height: 180px; background: #fef08a; padding: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); position: relative; resize: both; overflow: auto;">
            <textarea style="width: 100%; height: 140px; border: none; background: transparent; resize: vertical; font-size: 14px; line-height: 1.5; color: #78716c; font-family: 'Montserrat', sans-serif;" placeholder="Escreva aqui...">${nodeData.text || 'Nota'}</textarea>
          </div>
        `;
        break;

      case 'card-kanban':
        const title = nodeData.title || '';
        const priority = nodeData.priority || 'medium';
        const coverType = nodeData.coverType || 'none';
        const coverColor = nodeData.coverColor || '#3b82f6';
        const coverImage = nodeData.coverImage || '';
        const attachments = nodeData.attachments || [];
        const description = nodeData.description || '';
        
        const priorityBgMap = {
          low: '#f3f4f6',
          medium: '#fef3c7',
          high: '#fee2e2',
        };
        
        const priorityTextMap = {
          low: '#374151',
          medium: '#854d0e',
          high: '#991b1b',
        };
        
        const priorityLabel = priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa';
        
        const coverHTML = coverType === 'color' ? `<div style="height: 40px; background-color: ${coverColor};"></div>` :
                          coverType === 'image' && coverImage ? `<img src="${coverImage}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover;" />` : '';
        
        html = `
          <div style="width: 280px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
            ${coverHTML}
            <div style="padding: 12px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: ${description ? '4px' : '8px'}; font-family: 'Montserrat', sans-serif;">
                ${title || 'Título do card'}
              </p>
              ${description ? `<p style="font-size: 12px; color: #64748b; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Montserrat', sans-serif;">${description}</p>` : ''}
              <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                <span style="background: ${priorityBgMap[priority]}; color: ${priorityTextMap[priority]}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: 'Montserrat', sans-serif;">${priorityLabel}</span>
                ${attachments.length > 0 ? `<span style="border: 1px solid #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 11px; display: flex; align-items: center; gap: 4px; font-family: 'Montserrat', sans-serif;"><span style="font-size: 14px;">📎</span> ${attachments.length}</span>` : ''}
              </div>
            </div>
          </div>
        `;
        break;

      case 'rectangle-shape':
        html = `
          <div style="width: 180px; height: 100px; background: #93c5fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
            <span style="width: 100%; text-align: center; font-size: 14px; font-weight: 600; color: #1e40af; font-family: 'Montserrat', sans-serif;">${nodeData.text || 'Passo'}</span>
          </div>
        `;
        break;

      case 'circle-shape':
        html = `
          <div style="width: 140px; height: 140px; background: #fde047; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <span style="width: 100%; text-align: center; font-size: 14px; font-weight: 600; color: #854d0e; font-family: 'Montserrat', sans-serif;">${nodeData.text || 'Círculo'}</span>
          </div>
        `;
        break;

      case 'name-bubble':
        html = `
          <div style="background: white; border: 3px solid #a855f7; border-radius: 50px; padding: 12px 24px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <span style="text-align: center; font-size: 15px; font-weight: 600; color: #6b21a8; white-space: nowrap; font-family: 'Montserrat', sans-serif;">${nodeData.text || 'Nome'}</span>
          </div>
        `;
        break;

      case 'text-box':
        html = `
          <div style="background: transparent; padding: 8px;">
            <span style="font-size: 16px; font-weight: 600; color: #1e293b; font-family: 'Montserrat', sans-serif;">${nodeData.text || 'Texto'}</span>
          </div>
        `;
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
    const nodeId = editor.addNode(name, inputs, outputs, pos_x, pos_y, name, {}, html);

    // Add edit icon to all editable nodes
    const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box'];
    if (editableNodes.includes(name)) {
      setTimeout(() => {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement && !nodeElement.querySelector('.edit-icon')) {
          const editIcon = document.createElement('div');
          editIcon.className = 'edit-icon';
          editIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
          editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const nodeData = editor.getNodeFromId(nodeId);
            setEditDialog({ 
              open: true, 
              nodeId: nodeId, 
              data: nodeData.data || {},
              nodeType: nodeData.name
            });
          });
          nodeElement.appendChild(editIcon);
        }
      }, 10);
    }

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

  const handleMouseDownOnButton = (e, nodeType) => {
    e.preventDefault();
    setIsDraggingNew(true);
    setDragNodeType(nodeType);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (isDraggingNew && dragNodeType) {
      document.body.style.cursor = 'grabbing';
      setDragPreviewPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e) => {
    if (isDraggingNew && dragNodeType && drawflowRef.current) {
      const rect = drawflowRef.current.getBoundingClientRect();
      const isOverCanvas = 
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOverCanvas) {
        addNodeToDrawFlow(dragNodeType, e.clientX, e.clientY);
      }
    }
    
    setIsDraggingNew(false);
    setDragNodeType(null);
    dragStartPosRef.current = null;
    setDragPreviewPos({ x: 0, y: 0 });
    document.body.style.cursor = 'default';
  };

  useEffect(() => {
    if (isDraggingNew) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingNew, dragNodeType]);

  useEffect(() => {
    if (data && editorRef.current && data.drawflow) {
      editorRef.current.clear();
      editorRef.current.import(data);
      
      // Re-add edit icons after import
      setTimeout(() => {
        const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box'];
        Object.keys(data.drawflow.Home.data).forEach(nodeId => {
          const nodeData = data.drawflow.Home.data[nodeId];
          if (editableNodes.includes(nodeData.name)) {
            const nodeElement = document.getElementById(`node-${nodeId}`);
            if (nodeElement && !nodeElement.querySelector('.edit-icon')) {
              const editIcon = document.createElement('div');
              editIcon.className = 'edit-icon';
              editIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
              editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const nodeData = editorRef.current.getNodeFromId(nodeId);
                setEditDialog({ 
                  open: true, 
                  nodeId: nodeId, 
                  data: nodeData.data || {},
                  nodeType: nodeData.name
                });
              });
              nodeElement.appendChild(editIcon);
            }
          }
        });
      }, 100);
      return;
    }

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

        // Add edit icons to all editable nodes
        setTimeout(() => {
          const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box'];
          Object.keys(data.drawflow.Home.data).forEach(nodeId => {
            const nodeData = data.drawflow.Home.data[nodeId];
            if (editableNodes.includes(nodeData.name)) {
              const nodeElement = document.getElementById(`node-${nodeId}`);
              if (nodeElement && !nodeElement.querySelector('.edit-icon')) {
                const editIcon = document.createElement('div');
                editIcon.className = 'edit-icon';
                editIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
                editIcon.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const nodeData = editor.getNodeFromId(nodeId);
                  setEditDialog({ 
                    open: true, 
                    nodeId: nodeId, 
                    data: nodeData.data || {},
                    nodeType: nodeData.name
                  });
                });
                nodeElement.appendChild(editIcon);
              }
            }
          });
        }, 100);
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
    
    // Track selected node
    editor.on('nodeSelected', (id) => {
      setSelectedNodeId(id);
    });

    editor.on('nodeUnselected', () => {
      setSelectedNodeId(null);
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

    // Mouse wheel zoom
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          editor.zoom_in();
        } else {
          editor.zoom_out();
        }
        setZoom(Math.round(editor.zoom * 100));
      }
    };

    drawflowRef.current.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (editorRef.current) {
        editorRef.current.clear();
      }
      if (drawflowRef.current) {
        drawflowRef.current.removeEventListener('wheel', handleWheel);
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

  const handleDeleteClick = () => {
    if (selectedNodeId) {
      setDeleteDialog(true);
    }
  };

  const handleConfirmDelete = () => {
    if (editorRef.current && selectedNodeId) {
      editorRef.current.removeNodeId(`node-${selectedNodeId}`);
      setSelectedNodeId(null);
    }
    setDeleteDialog(false);
  };

  const handleEditSave = (newData) => {
    if (editorRef.current && editDialog.nodeId) {
      const node = editorRef.current.getNodeFromId(editDialog.nodeId);
      if (node) {
        console.log('=== SALVANDO DADOS DO CARD ===');
        console.log('Node ID:', editDialog.nodeId);
        console.log('Dados anteriores:', node.data);
        console.log('Novos dados:', newData);
        
        // Update node data
        node.data = { ...newData };
        
        // For card-kanban, regenerate the entire HTML with new data
        if (editDialog.nodeType === 'card-kanban') {
          const { html } = createNodeHTML('card-kanban', newData);
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
          if (nodeElement) {
            // Clear and re-add HTML
            nodeElement.innerHTML = html.trim();
            console.log('HTML do card atualizado');
          }
          
          // Re-add edit icon
          setTimeout(() => {
            const nodeContainer = document.getElementById(`node-${editDialog.nodeId}`);
            if (nodeContainer && !nodeContainer.querySelector('.edit-icon')) {
              const editIcon = document.createElement('div');
              editIcon.className = 'edit-icon';
              editIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
              editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const updatedNodeData = editorRef.current.getNodeFromId(editDialog.nodeId);
                setEditDialog({ 
                  open: true, 
                  nodeId: editDialog.nodeId, 
                  data: updatedNodeData.data || {},
                  nodeType: updatedNodeData.name
                });
              });
              nodeContainer.appendChild(editIcon);
            }
          }, 10);
        } else {
          // For other nodes (rectangle, circle, name-bubble, text-box), regenerate HTML
          const { html } = createNodeHTML(editDialog.nodeType, newData);
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
          if (nodeElement) {
            nodeElement.innerHTML = html.trim();
            console.log('HTML do elemento atualizado');
          }
        }
        
        // Update node data in drawflow
        editorRef.current.updateNodeDataFromId(editDialog.nodeId, newData);
        
        const exportedData = editorRef.current.export();
        console.log('Dados exportados após salvar:', exportedData);
        console.log('Node específico no export:', exportedData.drawflow.Home.data[editDialog.nodeId]);
        
        if (onChange) {
          onChange(exportedData);
        }
      }
    }
    setEditDialog({ open: false, nodeId: null, data: {}, nodeType: null });
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        setImportDialog({ open: true, data: importedData });
      } catch (error) {
        alert('Erro ao ler o arquivo. Certifique-se de que é um JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (importDialog.data) {
      if (onImport) {
        onImport(importDialog.data);
      } else if (editorRef.current) {
        editorRef.current.clear();
        try {
          editorRef.current.import(importDialog.data);
          if (onChange) {
            onChange(importDialog.data);
          }
        } catch (error) {
          alert('Erro ao importar o FluxMap');
        }
      }
    }
    setImportDialog({ open: false, data: null });
  };

  const getDragPreviewContent = () => {
    const previewStyles = {
      'sticky-note': { emoji: '📝', bg: '#fef3c7', border: '#fbbf24', text: 'Sticky Note' },
      'card-kanban': { emoji: '🎯', bg: '#dbeafe', border: '#3b82f6', text: 'Card' },
      'rectangle-shape': { emoji: '▭', bg: '#e0f2fe', border: '#0284c7', text: 'Retângulo' },
      'circle-shape': { emoji: '●', bg: '#fef9c3', border: '#eab308', text: 'Círculo' },
      'name-bubble': { emoji: '👤', bg: '#f3e8ff', border: '#a855f7', text: 'Nome' },
      'text-box': { emoji: 'T', bg: '#f1f5f9', border: '#64748b', text: 'Texto' },
    };

    const style = previewStyles[dragNodeType];
    if (!style) return null;

    return (
      <div
        style={{
          background: style.bg,
          borderColor: style.border,
          padding: '8px 10px',
          borderRadius: '6px',
          border: '1.5px solid',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '120px',
        }}
      >
        <span style={{ fontSize: '18px' }}>{style.emoji}</span>
        <span style={{ fontSize: '11px', fontWeight: '600' }}>{style.text}</span>
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {isDraggingNew && dragNodeType && (
        <div
          className="drag-preview"
          style={{
            left: dragPreviewPos.x,
            top: dragPreviewPos.y,
          }}
        >
          {getDragPreviewContent()}
        </div>
      )}
      <style>{`
        #drawflow {
          background: #f8fafc;
          position: relative;
        }
        
        .drawflow .drawflow-node {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          min-height: auto !important;
          width: auto !important;
          height: auto !important;
        }
        
        .drawflow .drawflow-node .drawflow_content_node {
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .drawflow .drawflow-node.selected .drawflow_content_node {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
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
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }

        .drawflow .drawflow-node:hover .input,
        .drawflow .drawflow-node:hover .output {
          opacity: 1;
        }

        .drawflow .drawflow-node .input:hover,
        .drawflow .drawflow-node .output:hover {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .drawflow .drawflow-node .edit-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s;
          z-index: 15;
          pointer-events: all;
        }

        .drawflow .drawflow-node:hover .edit-icon {
          opacity: 1;
        }

        .drawflow .drawflow-node .edit-icon:hover {
          background: #f3f4f6;
        }

        .drawflow .drawflow-node .edit-icon svg {
          width: 14px;
          height: 14px;
          color: #64748b;
        }
        
        .drawflow .drawflow-node .inputs {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .drawflow .drawflow-node .outputs {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .drawflow .drawflow-node .inputs .input,
        .drawflow .drawflow-node .outputs .output {
          pointer-events: all;
        }

        .drawflow .drawflow-node .inputs .input_1 {
          position: absolute !important;
          left: -5px !important;
          top: 50% !important;
          margin-top: -5px !important;
          transform: none !important;
        }

        .drawflow .drawflow-node .inputs .input_2 {
          position: absolute !important;
          left: 50% !important;
          top: -5px !important;
          margin-left: -5px !important;
          transform: none !important;
        }
        
        .drawflow .drawflow-node .outputs .output_1 {
          position: absolute !important;
          right: -5px !important;
          left: auto !important;
          top: 50% !important;
          margin-top: -5px !important;
          transform: none !important;
        }

        .drawflow .drawflow-node .outputs .output_2 {
          position: absolute !important;
          left: 50% !important;
          bottom: -5px !important;
          top: auto !important;
          margin-left: -5px !important;
          transform: none !important;
        }

        .drawflow .drawflow-node .inputs .input_1:hover {
          transform: scale(1.2) !important;
        }

        .drawflow .drawflow-node .inputs .input_2:hover {
          transform: scale(1.2) !important;
        }

        .drawflow .drawflow-node .outputs .output_1:hover {
          transform: scale(1.2) !important;
        }

        .drawflow .drawflow-node .outputs .output_2:hover {
          transform: scale(1.2) !important;
        }

        .sidebar-flux {
          width: 200px;
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 12px;
          overflow-y: auto;
        }

        .drag-drawflow {
          cursor: grab;
          user-select: none;
          margin-bottom: 6px;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1.5px solid;
          display: flex;
          align-items: center;
          gap: 8px;
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

        .drag-preview {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.5;
          transform: translate(-50%, -50%);
        }
      `}</style>

      <div className="sidebar-flux">
        <div className="mb-4">
          <h3 className="font-semibold text-xs text-gray-600 mb-2 uppercase tracking-wide">Elementos</h3>
          
          <div
            className="drag-drawflow"
            draggable="true"
            data-node="sticky-note"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'sticky-note')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('sticky-note');
            }}
            style={{ background: '#fef3c7', borderColor: '#fbbf24' }}
          >
            <span style={{ fontSize: '18px' }}>📝</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>Sticky Note</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="card-kanban"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'card-kanban')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('card-kanban');
            }}
            style={{ background: '#dbeafe', borderColor: '#3b82f6' }}
          >
            <span style={{ fontSize: '18px' }}>🎯</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af' }}>Card</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="rectangle-shape"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'rectangle-shape')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('rectangle-shape');
            }}
            style={{ background: '#e0f2fe', borderColor: '#0284c7' }}
          >
            <span style={{ fontSize: '18px' }}>▭</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#075985' }}>Retângulo</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="circle-shape"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'circle-shape')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('circle-shape');
            }}
            style={{ background: '#fef9c3', borderColor: '#eab308' }}
          >
            <span style={{ fontSize: '18px' }}>●</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#713f12' }}>Círculo</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="name-bubble"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'name-bubble')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('name-bubble');
            }}
            style={{ background: '#f3e8ff', borderColor: '#a855f7' }}
          >
            <span style={{ fontSize: '18px' }}>👤</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b21a8' }}>Nome</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="text-box"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'text-box')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('text-box');
            }}
            style={{ background: '#f1f5f9', borderColor: '#64748b' }}
          >
            <span style={{ fontSize: '18px' }}>T</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Texto</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <h3 className="font-semibold text-xs text-gray-600 mb-2 uppercase tracking-wide">Controles</h3>
          
          <div className="flex items-center gap-1 mb-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} className="flex-1 h-7 px-2">
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} className="flex-1 h-7 px-2">
              <Plus className="w-3 h-3" />
            </Button>
          </div>


        </div>
      </div>

      <div
        id="drawflow"
        ref={drawflowRef}
        className="flex-1 relative"
        onDrop={(e) => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
      >
        {selectedNodeId && (
          <div className="absolute top-4 right-4 z-50">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteClick}
              className="shadow-lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Item
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editDialog.nodeType === 'card-kanban' ? (
        <CardEditDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
          data={editDialog.data}
          onSave={handleEditSave}
        />
      ) : (
        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Elemento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Texto</label>
                <Input
                  value={editDialog.data.text || ''}
                  onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, text: e.target.value } })}
                  placeholder="Digite o texto"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialog({ open: false, nodeId: null, data: {}, nodeType: null })}>
                  Cancelar
                </Button>
                <Button onClick={() => handleEditSave(editDialog.data)}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Confirmation Dialog */}
      <AlertDialog open={importDialog.open} onOpenChange={(open) => !open && setImportDialog({ open: false, data: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja importar este FluxMap? O mapa atual será substituído e não poderá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportDialog({ open: false, data: null })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Sim, Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}