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
import URLLinkEditDialog from './URLLinkEditDialog';
import AreaEditDialog from './AreaEditDialog';
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
    
    // Areas don't have connections
    if (name === 'area') {
      inputs = 0;
      outputs = 0;
    }

    switch (name) {
      case 'sticky-note':
        const noteText = nodeData.text || 'Nota';
        const lineCount = noteText.split('\n').length;
        const minHeight = Math.max(180, lineCount * 24 + 40);
        const noteWidth = nodeData.width || 180;
        const noteHeight = nodeData.height || minHeight;
        html = `
          <div class="sticky-note-container" style="width: ${noteWidth}px; height: ${noteHeight}px; background: #fef08a; padding: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); position: relative; display: flex; flex-direction: column; overflow: hidden;">
            <span style="width: 100%; border: none; background: transparent; font-size: 14px; line-height: 1.5; color: #78716c; font-family: 'Montserrat', sans-serif; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;">${noteText}</span>
            <div class="sticky-resize-handle" style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 14L10 14M14 14L14 10M14 14L8 8M14 8L8 8M14 8L14 2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
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

      case 'url-link':
        const linkUrl = nodeData.url || 'https://google.com';
        const linkTitle = nodeData.title || 'Link';
        const linkImage = nodeData.image || '';
        const linkDescription = nodeData.description || '';
        
        const imageHTML = linkImage 
          ? `<img src="${linkImage}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
          : '';
        
        const fallbackIconHTML = `
          <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: ${linkImage ? 'none' : 'flex'}; align-items: center; justify-content: center;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
        `;
        
        html = `
          <div style="width: 280px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="height: 160px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; position: relative; overflow: hidden;">
              ${imageHTML}
              ${fallbackIconHTML}
            </div>
            <div style="padding: 12px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; font-family: 'Montserrat', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${linkTitle}
              </p>
              ${linkDescription ? `<p style="font-size: 11px; color: #64748b; font-family: 'Montserrat', sans-serif; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">${linkDescription}</p>` : ''}
              <p style="font-size: 11px; color: #94a3b8; font-family: 'Montserrat', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                🔗 ${linkUrl}
              </p>
            </div>
          </div>
        `;
        break;

      case 'area':
        const areaTitle = nodeData.title || 'Área';
        const areaWidth = nodeData.width || 400;
        const areaHeight = nodeData.height || 300;
        const areaColor = nodeData.color || 'rgba(59, 130, 246, 0.1)';
        
        html = `
          <div class="area-container" style="width: ${areaWidth}px; height: ${areaHeight}px; background: ${areaColor}; border: 2px dashed rgba(59, 130, 246, 0.4); border-radius: 8px; position: relative; display: flex; align-items: flex-start; justify-content: center; padding-top: 16px; pointer-events: all;">
            <span style="font-size: 16px; font-weight: 600; color: rgba(30, 41, 59, 0.7); font-family: 'Montserrat', sans-serif; user-select: none; pointer-events: none;">${areaTitle}</span>
            <div class="area-resize-handle" style="position: absolute; bottom: 4px; right: 4px; width: 24px; height: 24px; cursor: nwse-resize; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.8); border-radius: 4px; pointer-events: all;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 14L10 14M14 14L14 10M14 14L8 8M14 8L8 8M14 8L14 2" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
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
    
    // Initialize node data with default values
    const initialData = {};
    if (name === 'sticky-note') initialData.text = 'Nota';
    else if (name === 'card-kanban') initialData.title = '';
    else if (name === 'rectangle-shape') initialData.text = 'Passo';
    else if (name === 'circle-shape') initialData.text = 'Círculo';
    else if (name === 'name-bubble') initialData.text = 'Nome';
    else if (name === 'text-box') initialData.text = 'Texto';
    else if (name === 'url-link') {
      initialData.url = 'https://google.com';
      initialData.title = 'Link';
    }
    else if (name === 'area') {
      initialData.title = 'Área';
      initialData.width = 400;
      initialData.height = 300;
      initialData.color = 'rgba(59, 130, 246, 0.1)';
    }
    
    const nodeId = editor.addNode(name, inputs, outputs, pos_x, pos_y, name, initialData, html);

    // Set z-index for areas (background layer) and ensure they stay on bottom
    if (name === 'area') {
      setTimeout(() => {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement) {
          nodeElement.setAttribute('data-node-type', 'area');
          nodeElement.style.zIndex = '0 !important';
          // Move area to the beginning of parent to render first (below other elements)
          const parent = nodeElement.parentNode;
          if (parent && parent.firstChild !== nodeElement) {
            parent.insertBefore(nodeElement, parent.firstChild);
          }
        }
      }, 10);
    }

    // Add edit icon to all editable nodes and setup listeners
    const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link', 'area'];
    if (editableNodes.includes(name)) {
      setTimeout(() => {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement && !nodeElement.querySelector('.edit-icon')) {
          // Add edit icon
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

          // Add manual resize for sticky notes and areas
          if (name === 'sticky-note' || name === 'area') {
            const container = nodeElement.querySelector(name === 'sticky-note' ? '.sticky-note-container' : '.area-container');
            const resizeHandle = nodeElement.querySelector(name === 'sticky-note' ? '.sticky-resize-handle' : '.area-resize-handle');

            if (container && resizeHandle) {
              let isResizing = false;
              let startX, startY, startWidth, startHeight;

              resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = container.offsetWidth;
                startHeight = container.offsetHeight;
                document.body.style.cursor = 'nwse-resize';
                editor.editor_mode = 'fixed';
              }, true);

              const handleMouseMove = (e) => {
                if (!isResizing) return;
                e.preventDefault();
                e.stopPropagation();
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const minSize = name === 'area' ? 200 : 120;
                const newWidth = Math.max(minSize, startWidth + deltaX);
                const newHeight = Math.max(minSize, startHeight + deltaY);
                container.style.width = newWidth + 'px';
                container.style.height = newHeight + 'px';
              };

              const handleMouseUp = () => {
                if (!isResizing) return;
                isResizing = false;
                document.body.style.cursor = 'default';
                editor.editor_mode = 'edit';

                const currentData = editor.getNodeFromId(nodeId);
                editor.updateNodeDataFromId(nodeId, {
                  ...currentData.data,
                  width: container.offsetWidth,
                  height: container.offsetHeight
                });
                if (onChange) {
                  onChange(editor.export());
                }
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }
          }
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
    if (!drawflowRef.current) return;

    // Se já existe um editor, limpar e reimportar
    if (editorRef.current) {
      console.log('=== REIMPORTANDO DADOS NO FLUXMAP ===');
      if (data && data.drawflow) {
        try {
          editorRef.current.clear();
          editorRef.current.import(data);
          
          const nodeCount = Object.keys(data.drawflow.Home.data).length;
          console.log(`✓ FluxMap reimportado com ${nodeCount} nodes`);

          // Re-add edit icons
          setTimeout(() => {
            const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link', 'area'];
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
        } catch (e) {
          console.error('Erro ao reimportar dados:', e);
        }
      }
      return;
    }

    // Primeira inicialização
    console.log('=== INICIALIZANDO FLUXMAP ===');
    const editor = new Drawflow(drawflowRef.current);
    editor.reroute = true;
    editor.curvature = 0.5;
    editor.force_first_input = false;
    editor.start();
    
    editorRef.current = editor;

    if (data && data.drawflow) {
      try {
        editor.import(data);
        
        const nodeCount = Object.keys(data.drawflow.Home.data).length;
        console.log(`✓ FluxMap inicializado com ${nodeCount} nodes`);

        // Add edit icons to all editable nodes
        setTimeout(() => {
          const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link'];
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
                
                // Add manual resize for sticky notes and areas
                if (nodeData.name === 'sticky-note' || nodeData.name === 'area') {
                  const container = nodeElement.querySelector(nodeData.name === 'sticky-note' ? '.sticky-note-container' : '.area-container');
                  const resizeHandle = nodeElement.querySelector(nodeData.name === 'sticky-note' ? '.sticky-resize-handle' : '.area-resize-handle');
                  
                  if (container && resizeHandle) {
                    let isResizing = false;
                    let startX, startY, startWidth, startHeight;
                    
                    resizeHandle.addEventListener('mousedown', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      isResizing = true;
                      startX = e.clientX;
                      startY = e.clientY;
                      startWidth = container.offsetWidth;
                      startHeight = container.offsetHeight;
                      document.body.style.cursor = 'nwse-resize';
                      editor.editor_mode = 'fixed';
                    }, true);
                    
                    const handleMouseMove = (e) => {
                      if (!isResizing) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const deltaX = e.clientX - startX;
                      const deltaY = e.clientY - startY;
                      const minSize = nodeData.name === 'area' ? 200 : 120;
                      const newWidth = Math.max(minSize, startWidth + deltaX);
                      const newHeight = Math.max(minSize, startHeight + deltaY);
                      container.style.width = newWidth + 'px';
                      container.style.height = newHeight + 'px';
                    };
                    
                    const handleMouseUp = () => {
                      if (!isResizing) return;
                      isResizing = false;
                      document.body.style.cursor = 'default';
                      editor.editor_mode = 'edit';
                      
                      const currentData = editor.getNodeFromId(nodeId);
                      editor.updateNodeDataFromId(nodeId, {
                        ...currentData.data,
                        width: container.offsetWidth,
                        height: container.offsetHeight
                      });
                      if (onChange) {
                        onChange(editor.export());
                      }
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }
                }
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
    editor.on('nodeMoved', (id) => {
      // Keep areas on bottom layer when moved
      setTimeout(() => {
        const nodeElement = document.getElementById(`node-${id}`);
        if (nodeElement && nodeElement.getAttribute('data-node-type') === 'area') {
          nodeElement.style.zIndex = '0';
          const parent = nodeElement.parentNode;
          if (parent && parent.firstChild !== nodeElement) {
            parent.insertBefore(nodeElement, parent.firstChild);
          }
        }
      }, 0);
      saveData();
    });
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
        console.log('=== SALVANDO ELEMENTO ===');
        console.log('Node ID:', editDialog.nodeId);
        console.log('Tipo:', editDialog.nodeType);
        console.log('Dados novos:', newData);
        
        // CRITICAL: Update node data FIRST
        editorRef.current.updateNodeDataFromId(editDialog.nodeId, newData);
        
        // Then update HTML visualization
        if (editDialog.nodeType === 'card-kanban') {
          const { html } = createNodeHTML('card-kanban', newData);
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
          if (nodeElement) {
            nodeElement.innerHTML = html.trim();
            console.log('✓ Card HTML atualizado');
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
        } else if (editDialog.nodeType === 'sticky-note') {
          const { html } = createNodeHTML('sticky-note', newData);
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
          if (nodeElement) {
            nodeElement.innerHTML = html.trim();
            console.log('✓ Sticky note atualizado');
            
            // Add manual resize for sticky notes
            setTimeout(() => {
              const stickyContainer = nodeElement.querySelector('.sticky-note-container');
              const resizeHandle = nodeElement.querySelector('.sticky-resize-handle');
              
              if (stickyContainer && resizeHandle) {
                let isResizing = false;
                let startX, startY, startWidth, startHeight;
                
                resizeHandle.addEventListener('mousedown', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  isResizing = true;
                  startX = e.clientX;
                  startY = e.clientY;
                  startWidth = stickyContainer.offsetWidth;
                  startHeight = stickyContainer.offsetHeight;
                  document.body.style.cursor = 'nwse-resize';
                  editorRef.current.editor_mode = 'fixed';
                }, true);
                
                const handleMouseMove = (e) => {
                  if (!isResizing) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const deltaX = e.clientX - startX;
                  const deltaY = e.clientY - startY;
                  const newWidth = Math.max(120, startWidth + deltaX);
                  const newHeight = Math.max(120, startHeight + deltaY);
                  stickyContainer.style.width = newWidth + 'px';
                  stickyContainer.style.height = newHeight + 'px';
                };
                
                const handleMouseUp = () => {
                  if (!isResizing) return;
                  isResizing = false;
                  document.body.style.cursor = 'default';
                  editorRef.current.editor_mode = 'edit';
                  
                  editorRef.current.updateNodeDataFromId(editDialog.nodeId, {
                    ...newData,
                    width: stickyContainer.offsetWidth,
                    height: stickyContainer.offsetHeight
                  });
                  if (onChange) {
                    onChange(editorRef.current.export());
                  }
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }
            }, 50);
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
        } else if (editDialog.nodeType === 'area') {
          const { html } = createNodeHTML('area', newData);
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
          if (nodeElement) {
            nodeElement.innerHTML = html.trim();
            console.log('✓ Área atualizada');
            
            // Add manual resize for areas
            setTimeout(() => {
              const areaContainer = nodeElement.querySelector('.area-container');
              const resizeHandle = nodeElement.querySelector('.area-resize-handle');
              
              if (areaContainer && resizeHandle) {
                let isResizing = false;
                let startX, startY, startWidth, startHeight;
                
                resizeHandle.addEventListener('mousedown', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  isResizing = true;
                  startX = e.clientX;
                  startY = e.clientY;
                  startWidth = areaContainer.offsetWidth;
                  startHeight = areaContainer.offsetHeight;
                  document.body.style.cursor = 'nwse-resize';
                  editorRef.current.editor_mode = 'fixed';
                }, true);
                
                const handleMouseMove = (e) => {
                  if (!isResizing) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const deltaX = e.clientX - startX;
                  const deltaY = e.clientY - startY;
                  const newWidth = Math.max(200, startWidth + deltaX);
                  const newHeight = Math.max(200, startHeight + deltaY);
                  areaContainer.style.width = newWidth + 'px';
                  areaContainer.style.height = newHeight + 'px';
                };
                
                const handleMouseUp = () => {
                  if (!isResizing) return;
                  isResizing = false;
                  document.body.style.cursor = 'default';
                  editorRef.current.editor_mode = 'edit';
                  
                  editorRef.current.updateNodeDataFromId(editDialog.nodeId, {
                    ...newData,
                    width: areaContainer.offsetWidth,
                    height: areaContainer.offsetHeight
                  });
                  if (onChange) {
                    onChange(editorRef.current.export());
                  }
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }
            }, 50);
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
          // rectangle, circle, name-bubble, text-box, url-link
          const { html } = createNodeHTML(editDialog.nodeType, newData);
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId} .drawflow_content_node`);
          if (nodeElement) {
            nodeElement.innerHTML = html.trim();
            console.log('✓ Elemento HTML atualizado:', editDialog.nodeType);
          }
        }
        
        // Export and send to parent
        const exportedData = editorRef.current.export();
        console.log('✓ Exportando dados para salvar');
        console.log('Dados do node após edição:', exportedData.drawflow.Home.data[editDialog.nodeId]);
        
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
      'area': { emoji: '📦', bg: '#dcfce7', border: '#22c55e', text: 'Área' },
      'sticky-note': { emoji: '📝', bg: '#fef3c7', border: '#fbbf24', text: 'Note' },
      'card-kanban': { emoji: '🎯', bg: '#dbeafe', border: '#3b82f6', text: 'Card' },
      'rectangle-shape': { emoji: '▭', bg: '#e0f2fe', border: '#0284c7', text: 'Retângulo' },
      'circle-shape': { emoji: '●', bg: '#fef9c3', border: '#eab308', text: 'Círculo' },
      'name-bubble': { emoji: '👤', bg: '#f3e8ff', border: '#a855f7', text: 'Nome' },
      'text-box': { emoji: 'T', bg: '#f1f5f9', border: '#64748b', text: 'Texto' },
      'url-link': { emoji: '🔗', bg: '#dbeafe', border: '#3b82f6', text: 'Link' },
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
          z-index: 10 !important;
        }

        .drawflow .drawflow-node[data-node-type="area"] {
          z-index: 0 !important;
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
          width: 140px;
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 10px;
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
          gap: 6px;
          transition: all 0.2s;
          font-family: 'Montserrat', sans-serif;
        }

        .drag-drawflow:hover {
          transform: translateX(2px);
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
        <div className="mb-3">
          <div
            className="drag-drawflow"
            draggable="true"
            data-node="area"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'area')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('area');
            }}
            style={{ background: '#dcfce7', borderColor: '#22c55e' }}
            title="Área"
          >
            <span style={{ fontSize: '18px' }}>📦</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#166534' }}>Área</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="sticky-note"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'sticky-note')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('sticky-note');
            }}
            style={{ background: '#fef3c7', borderColor: '#fbbf24' }}
            title="Sticky Note"
          >
            <span style={{ fontSize: '18px' }}>📝</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>Note</span>
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
            title="Card"
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
            title="Retângulo"
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
            title="Círculo"
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
            title="Nome"
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
            title="Texto"
          >
            <span style={{ fontSize: '18px' }}>T</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Texto</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="url-link"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'url-link')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('url-link');
            }}
            style={{ background: '#dbeafe', borderColor: '#3b82f6' }}
            title="Link"
          >
            <span style={{ fontSize: '18px' }}>🔗</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af' }}>Link</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" size="sm" onClick={handleZoomOut} className="flex-1 h-7 px-2" title="Zoom -">
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs font-medium w-10 text-center text-gray-600">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} className="flex-1 h-7 px-2" title="Zoom +">
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
      ) : editDialog.nodeType === 'url-link' ? (
        <URLLinkEditDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
          data={editDialog.data}
          onSave={handleEditSave}
        />
      ) : editDialog.nodeType === 'area' ? (
        <AreaEditDialog
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
                <label className="text-sm font-medium mb-2 block">
                  {editDialog.nodeType === 'sticky-note' ? 'Nota' : 'Texto'}
                </label>
                {editDialog.nodeType === 'sticky-note' ? (
                  <Textarea
                    value={editDialog.data.text || ''}
                    onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, text: e.target.value } })}
                    placeholder="Digite a nota..."
                    rows={6}
                  />
                ) : (
                  <Input
                    value={editDialog.data.text || ''}
                    onChange={(e) => setEditDialog({ ...editDialog, data: { ...editDialog.data, text: e.target.value } })}
                    placeholder="Digite o texto"
                  />
                )}
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