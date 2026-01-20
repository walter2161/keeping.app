import React, { useEffect, useRef, useState } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, Upload, Edit2, Copy, MoreVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CardEditDialog from './CardEditDialog';
import URLLinkEditDialog from './URLLinkEditDialog';

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
        const coverImageZoom = nodeData.coverImageZoom || 100;
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
                          coverType === 'image' && coverImage ? `<div style="width: 100%; height: 160px; overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center;"><img src="${coverImage}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; transform: scale(${coverImageZoom / 100}); transform-origin: center center;" /></div>` : '';

        html = `
          <div style="width: 280px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
            ${coverHTML}
            <div style="padding: 12px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: ${description ? '4px' : '8px'}; font-family: 'Montserrat', sans-serif;">
                ${title || 'Título do card'}
              </p>
              ${description ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Montserrat', sans-serif;">${description}</p>` : ''}
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

      case 'document':
        const docTitle = nodeData.title || 'Documento';
        html = `
          <div style="width: 200px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); height: 100px; display: flex; align-items: center; justify-content: center;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>
            <div style="padding: 12px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; font-family: 'Montserrat', sans-serif; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${docTitle}
              </p>
              <p style="font-size: 11px; color: #64748b; font-family: 'Montserrat', sans-serif; margin-top: 4px;">
                📄 Documento
              </p>
            </div>
          </div>
        `;
        break;

      case 'spreadsheet':
        const sheetTitle = nodeData.title || 'Planilha';
        html = `
          <div style="width: 200px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); height: 100px; display: flex; align-items: center; justify-content: center;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <rect x="8" y="12" width="8" height="8"/>
                <line x1="12" y1="12" x2="12" y2="20"/>
                <line x1="8" y1="16" x2="16" y2="16"/>
              </svg>
            </div>
            <div style="padding: 12px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; font-family: 'Montserrat', sans-serif; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${sheetTitle}
              </p>
              <p style="font-size: 11px; color: #64748b; font-family: 'Montserrat', sans-serif; margin-top: 4px;">
                📊 Planilha
              </p>
            </div>
          </div>
        `;
        break;

      case 'presentation':
        const presTitle = nodeData.title || 'Apresentação';
        html = `
          <div style="width: 200px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); height: 100px; display: flex; align-items: center; justify-content: center;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <rect x="6" y="7" width="12" height="6" rx="1"/>
              </svg>
            </div>
            <div style="padding: 12px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; font-family: 'Montserrat', sans-serif; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${presTitle}
              </p>
              <p style="font-size: 11px; color: #64748b; font-family: 'Montserrat', sans-serif; margin-top: 4px;">
                📽️ Apresentação
              </p>
            </div>
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
    else if (name === 'document') {
      initialData.title = 'Documento';
      initialData.content = '';
    }
    else if (name === 'spreadsheet') {
      initialData.title = 'Planilha';
      initialData.content = '';
    }
    else if (name === 'presentation') {
      initialData.title = 'Apresentação';
      initialData.content = JSON.stringify({ slides: [{ background: '#ffffff', elements: [] }] });
    }
    
    const nodeId = editor.addNode(name, inputs, outputs, pos_x, pos_y, name, initialData, html);

    // Add edit icon to all editable nodes and setup listeners
    const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link', 'document', 'spreadsheet', 'presentation'];
    if (editableNodes.includes(name)) {
      setTimeout(() => {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement && !nodeElement.querySelector('.edit-icon')) {
          // Add menu button using React component approach
          const menuContainer = document.createElement('div');
          menuContainer.className = 'node-menu-container';
          
          // Create menu trigger button
          const menuButton = document.createElement('button');
          menuButton.className = 'node-menu-trigger';
          menuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
          
          menuButton.setAttribute('data-node-id', nodeId);
          menuButton.setAttribute('data-node-type', name);
          
          let menuLeaveTimer;
          
          menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Close all other menus
            document.querySelectorAll('.node-menu-content.open').forEach(menu => {
              menu.classList.remove('open');
            });
            
            // Toggle this menu
            const menuContent = menuButton.nextElementSibling;
            menuContent.classList.toggle('open');
          });
          
          // Close menu when mouse leaves
          menuContainer.addEventListener('mouseleave', () => {
            menuLeaveTimer = setTimeout(() => {
              const menuContent = menuButton.nextElementSibling;
              menuContent.classList.remove('open');
            }, 700);
          });
          
          menuContainer.addEventListener('mouseenter', () => {
            clearTimeout(menuLeaveTimer);
          });
          
          // Create menu content
          const menuContent = document.createElement('div');
          menuContent.className = 'node-menu-content';
          menuContent.innerHTML = `
            <div class="node-menu-item" data-action="edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Editar</span>
            </div>
            <div class="node-menu-item" data-action="clone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clonar</span>
            </div>
            <div class="node-menu-item node-menu-delete" data-action="delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Excluir</span>
            </div>
          `;
          
          menuContent.addEventListener('click', (e) => {
            e.stopPropagation();
            const menuItem = e.target.closest('.node-menu-item');
            if (!menuItem) return;
            
            const action = menuItem.dataset.action;
            const currentNodeData = editor.getNodeFromId(nodeId);
            
            if (action === 'edit') {
              // Para document, spreadsheet e presentation - abrir editor dedicado
              if (['document', 'spreadsheet', 'presentation'].includes(currentNodeData.name)) {
                const editorType = currentNodeData.name === 'document' ? 'docx' : 
                                   currentNodeData.name === 'spreadsheet' ? 'xlsx' : 'pptx';
                const editorUrl = `/flux-editor?nodeId=${nodeId}&type=${editorType}&fluxFileId=${window.fluxFileId || ''}`;
                window.location.href = editorUrl;
              } else {
                setEditDialog({ 
                  open: true, 
                  nodeId: nodeId, 
                  data: currentNodeData.data || {},
                  nodeType: currentNodeData.name
                });
              }
            } else if (action === 'clone') {
              const { html, inputs, outputs } = createNodeHTML(currentNodeData.name, currentNodeData.data);
              editor.addNode(
                currentNodeData.name, 
                inputs, 
                outputs, 
                currentNodeData.pos_x + 50, 
                currentNodeData.pos_y + 50, 
                currentNodeData.name, 
                {...currentNodeData.data}, 
                html
              );
              if (onChange) onChange(editor.export());
            } else if (action === 'delete') {
              editor.removeNodeId(`node-${nodeId}`);
              if (onChange) onChange(editor.export());
            }
            
            menuContent.classList.remove('open');
          });
          
          menuContainer.appendChild(menuButton);
          menuContainer.appendChild(menuContent);
          nodeElement.appendChild(menuContainer);
          
          // Close menu when clicking outside
          document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target)) {
              menuContent.classList.remove('open');
            }
          });

          // Add manual resize for sticky notes
          if (name === 'sticky-note') {
            const container = nodeElement.querySelector('.sticky-note-container');
            const resizeHandle = nodeElement.querySelector('.sticky-resize-handle');

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
                const minSize = 120;
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
      console.log('Data recebido:', data);
      
      if (data && data.drawflow) {
        try {
          console.log('Nodes no data:', Object.keys(data.drawflow.Home.data || {}).length);
          
          editorRef.current.clear();
          editorRef.current.import(data);
          
          const nodeCount = Object.keys(data.drawflow.Home.data).length;
          console.log(`✓ FluxMap reimportado com ${nodeCount} nodes`);

          // Recreate HTML and re-add edit icons
          setTimeout(() => {
            const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link'];
            Object.keys(data.drawflow.Home.data).forEach(nodeId => {
              const nodeData = data.drawflow.Home.data[nodeId];
              console.log(`Recriando node ${nodeId}:`, nodeData.name);
              
              if (editableNodes.includes(nodeData.name)) {
                const nodeElement = document.getElementById(`node-${nodeId}`);
                if (nodeElement) {
                  // Recreate HTML with current data
                  const contentNode = nodeElement.querySelector('.drawflow_content_node');
                  if (contentNode) {
                    const { html } = createNodeHTML(nodeData.name, nodeData.data || {});
                    contentNode.innerHTML = html.trim();
                    console.log(`✓ HTML recriado para node ${nodeId}`);
                  } else {
                    console.warn(`⚠ Não encontrou .drawflow_content_node para node ${nodeId}`);
                  }
                  
                  // Add menu if not exists
                  if (!nodeElement.querySelector('.node-menu-container')) {
                    const menuContainer = document.createElement('div');
                    menuContainer.className = 'node-menu-container';
                    
                    const menuButton = document.createElement('button');
                    menuButton.className = 'node-menu-trigger';
                    menuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
                    
                    let menuLeaveTimer;
                    
                    menuButton.addEventListener('click', (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      document.querySelectorAll('.node-menu-content.open').forEach(menu => {
                        menu.classList.remove('open');
                      });
                      const menuContent = menuButton.nextElementSibling;
                      menuContent.classList.toggle('open');
                    });
                    
                    menuContainer.addEventListener('mouseleave', () => {
                      menuLeaveTimer = setTimeout(() => {
                        const menuContent = menuButton.nextElementSibling;
                        menuContent.classList.remove('open');
                      }, 700);
                    });
                    
                    menuContainer.addEventListener('mouseenter', () => {
                      clearTimeout(menuLeaveTimer);
                    });
                    
                    const menuContent = document.createElement('div');
                    menuContent.className = 'node-menu-content';
                    menuContent.innerHTML = `
                      <div class="node-menu-item" data-action="edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Editar</span>
                      </div>
                      <div class="node-menu-item" data-action="clone">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clonar</span>
                      </div>
                      <div class="node-menu-item node-menu-delete" data-action="delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Excluir</span>
                      </div>
                    `;
                    
                    menuContent.addEventListener('click', (e) => {
                      e.stopPropagation();
                      const menuItem = e.target.closest('.node-menu-item');
                      if (!menuItem) return;
                      
                      const action = menuItem.dataset.action;
                      const currentNodeData = editorRef.current.getNodeFromId(nodeId);
                      
                      if (action === 'edit') {
                        setEditDialog({ 
                          open: true, 
                          nodeId: nodeId, 
                          data: currentNodeData.data || {},
                          nodeType: currentNodeData.name
                        });
                      } else if (action === 'clone') {
                        const { html, inputs, outputs } = createNodeHTML(currentNodeData.name, currentNodeData.data);
                        editorRef.current.addNode(
                          currentNodeData.name, 
                          inputs, 
                          outputs, 
                          currentNodeData.pos_x + 50, 
                          currentNodeData.pos_y + 50, 
                          currentNodeData.name, 
                          {...currentNodeData.data}, 
                          html
                        );
                        if (onChange) onChange(editorRef.current.export());
                      } else if (action === 'delete') {
                        editorRef.current.removeNodeId(`node-${nodeId}`);
                        if (onChange) onChange(editorRef.current.export());
                      }
                      
                      menuContent.classList.remove('open');
                    });
                    
                    menuContainer.appendChild(menuButton);
                    menuContainer.appendChild(menuContent);
                    nodeElement.appendChild(menuContainer);
                    
                    menuContainer.addEventListener('mouseleave', () => {
                      menuLeaveTimer = setTimeout(() => {
                        menuContent.classList.remove('open');
                      }, 700);
                    });
                    
                    menuContainer.addEventListener('mouseenter', () => {
                      clearTimeout(menuLeaveTimer);
                    });
                    
                    document.addEventListener('click', (e) => {
                      if (!menuContainer.contains(e.target)) {
                        menuContent.classList.remove('open');
                      }
                    });
                    
                    console.log(`✓ Menu adicionado ao node ${nodeId}`);
                  } else {
                    console.log(`Menu já existe para node ${nodeId}`);
                  }
                } else {
                  console.warn(`⚠ Elemento node-${nodeId} não encontrado no DOM`);
                }
              }
            });
            console.log('✓ Todos os nodes foram processados');
          }, 150);
        } catch (e) {
          console.error('❌ Erro ao reimportar dados:', e);
          alert('Erro ao importar FluxMap: ' + e.message);
        }
      } else {
        console.warn('⚠ Data não tem estrutura drawflow válida');
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

        // Recreate HTML for all nodes with updated data and add edit icons
        setTimeout(() => {
          const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link'];
          Object.keys(data.drawflow.Home.data).forEach(nodeId => {
            const nodeData = data.drawflow.Home.data[nodeId];
            if (editableNodes.includes(nodeData.name)) {
              const nodeElement = document.getElementById(`node-${nodeId}`);
              if (nodeElement) {
                // Recreate HTML with current data
                const contentNode = nodeElement.querySelector('.drawflow_content_node');
                if (contentNode) {
                  const { html } = createNodeHTML(nodeData.name, nodeData.data || {});
                  contentNode.innerHTML = html.trim();
                }
                
                // Add menu if not exists
                if (!nodeElement.querySelector('.node-menu-container')) {
                  const menuContainer = document.createElement('div');
                  menuContainer.className = 'node-menu-container';
                  
                  const menuButton = document.createElement('button');
                  menuButton.className = 'node-menu-trigger';
                  menuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
                  
                  let menuLeaveTimer;

                  menuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    document.querySelectorAll('.node-menu-content.open').forEach(menu => {
                      menu.classList.remove('open');
                    });
                    const menuContent = menuButton.nextElementSibling;
                    menuContent.classList.toggle('open');
                  });

                  const menuContent = document.createElement('div');
                  menuContent.className = 'node-menu-content';
                  menuContent.innerHTML = `
                  <div class="node-menu-item" data-action="edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Editar</span>
                  </div>
                  <div class="node-menu-item" data-action="clone">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clonar</span>
                  </div>
                  <div class="node-menu-item node-menu-delete" data-action="delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Excluir</span>
                  </div>
                  `;
                  
                  menuContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const menuItem = e.target.closest('.node-menu-item');
                    if (!menuItem) return;
                    
                    const action = menuItem.dataset.action;
                    const currentNodeData = editor.getNodeFromId(nodeId);
                    
                    if (action === 'edit') {
                      setEditDialog({ 
                        open: true, 
                        nodeId: nodeId, 
                        data: currentNodeData.data || {},
                        nodeType: currentNodeData.name
                      });
                    } else if (action === 'clone') {
                      const { html, inputs, outputs } = createNodeHTML(currentNodeData.name, currentNodeData.data);
                      editor.addNode(
                        currentNodeData.name, 
                        inputs, 
                        outputs, 
                        currentNodeData.pos_x + 50, 
                        currentNodeData.pos_y + 50, 
                        currentNodeData.name, 
                        {...currentNodeData.data}, 
                        html
                      );
                      if (onChange) onChange(editor.export());
                    } else if (action === 'delete') {
                      editor.removeNodeId(`node-${nodeId}`);
                      if (onChange) onChange(editor.export());
                    }
                    
                    menuContent.classList.remove('open');
                  });
                  
                  menuContainer.appendChild(menuButton);
                  menuContainer.appendChild(menuContent);
                  nodeElement.appendChild(menuContainer);
                  
                  document.addEventListener('click', (e) => {
                    if (!menuContainer.contains(e.target)) {
                      menuContent.classList.remove('open');
                    }
                  });
                }
                
                // Add manual resize for sticky notes
                if (nodeData.name === 'sticky-note') {
                  const container = nodeElement.querySelector('.sticky-note-container');
                  const resizeHandle = nodeElement.querySelector('.sticky-resize-handle');
                  
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
                      const minSize = 120;
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
        console.log('=== SALVANDO ELEMENTO ===');
        console.log('Node ID:', editDialog.nodeId);
        console.log('Tipo:', editDialog.nodeType);
        console.log('Dados novos:', newData);
        
        // CRITICAL: Update node data FIRST
        editorRef.current.updateNodeDataFromId(editDialog.nodeId, newData);

        // Then update HTML visualization
        if (editDialog.nodeType === 'card-kanban') {
          const nodeElement = document.querySelector(`#node-${editDialog.nodeId}`);
          if (nodeElement) {
            const contentNode = nodeElement.querySelector('.drawflow_content_node');
            if (contentNode) {
              const { html } = createNodeHTML('card-kanban', newData);
              contentNode.innerHTML = html.trim();
              console.log('✓ Card HTML atualizado com novos dados');
            }
          }
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
        try {
          console.log('=== IMPORTANDO FLUXMAP ===');
          console.log('Dados importados:', importDialog.data);
          
          editorRef.current.clear();
          editorRef.current.import(importDialog.data);
          
          // Recriar HTML e menus dos nodes
          setTimeout(() => {
            const editableNodes = ['card-kanban', 'rectangle-shape', 'circle-shape', 'name-bubble', 'text-box', 'sticky-note', 'url-link'];
            if (importDialog.data.drawflow && importDialog.data.drawflow.Home) {
              Object.keys(importDialog.data.drawflow.Home.data).forEach(nodeId => {
                const nodeData = importDialog.data.drawflow.Home.data[nodeId];
                if (editableNodes.includes(nodeData.name)) {
                  const nodeElement = document.getElementById(`node-${nodeId}`);
                  if (nodeElement) {
                    const contentNode = nodeElement.querySelector('.drawflow_content_node');
                    if (contentNode) {
                      const { html } = createNodeHTML(nodeData.name, nodeData.data || {});
                      contentNode.innerHTML = html.trim();
                    }
                  }
                }
              });
            }
          }, 100);
          
          if (onChange) {
            onChange(importDialog.data);
          }
          
          console.log('✓ FluxMap importado com sucesso');
        } catch (error) {
          console.error('Erro ao importar:', error);
          alert('Erro ao importar o FluxMap: ' + error.message);
        }
      }
    }
    setImportDialog({ open: false, data: null });
  };

  const getDragPreviewContent = () => {
    const previewStyles = {
      'sticky-note': { emoji: '📝', bg: '#fef3c7', border: '#fbbf24', text: 'Note' },
      'card-kanban': { emoji: '🎯', bg: '#dbeafe', border: '#3b82f6', text: 'Card' },
      'rectangle-shape': { emoji: '▭', bg: '#e0f2fe', border: '#0284c7', text: 'Retângulo' },
      'circle-shape': { emoji: '●', bg: '#fef9c3', border: '#eab308', text: 'Círculo' },
      'name-bubble': { emoji: '👤', bg: '#f3e8ff', border: '#a855f7', text: 'Nome' },
      'text-box': { emoji: 'T', bg: '#f1f5f9', border: '#64748b', text: 'Texto' },
      'url-link': { emoji: '🔗', bg: '#dbeafe', border: '#3b82f6', text: 'Link' },
      'document': { emoji: '📄', bg: '#dbeafe', border: '#3b82f6', text: 'Documento' },
      'spreadsheet': { emoji: '📊', bg: '#d1fae5', border: '#10b981', text: 'Planilha' },
      'presentation': { emoji: '📽️', bg: '#fef3c7', border: '#f59e0b', text: 'Apresentação' },
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
          background: #e2e8f0;
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

        .drawflow .drawflow-node .node-menu-container {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 15;
        }

        .drawflow .drawflow-node .node-menu-trigger {
          width: 28px;
          height: 28px;
          background: white;
          border: none;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, background 0.15s;
          pointer-events: all;
        }

        .drawflow .drawflow-node:hover .node-menu-trigger {
          opacity: 1;
        }

        .drawflow .drawflow-node .node-menu-trigger:hover {
          background: #f3f4f6;
        }

        .drawflow .drawflow-node .node-menu-trigger svg {
          color: #64748b;
        }
        
        .node-menu-content {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          overflow: hidden;
          min-width: 160px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-8px);
          transition: opacity 0.15s, transform 0.15s;
          border: 1px solid #e5e7eb;
        }
        
        .node-menu-content.open {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }
        
        .node-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 14px;
          color: #374151;
          font-family: 'Montserrat', sans-serif;
        }
        
        .node-menu-item:hover {
          background: #f9fafb;
        }
        
        .node-menu-item svg {
          color: #6b7280;
          flex-shrink: 0;
        }
        
        .node-menu-item span {
          flex: 1;
          white-space: nowrap;
        }
        
        .node-menu-delete {
          color: #dc2626;
        }
        
        .node-menu-delete svg {
          color: #dc2626;
        }
        
        .node-menu-delete:hover {
          background: #fef2f2;
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
        
        .area-tool:hover {
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="document"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'document')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('document');
            }}
            style={{ background: '#dbeafe', borderColor: '#3b82f6' }}
            title="Documento"
          >
            <span style={{ fontSize: '18px' }}>📄</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af' }}>Documento</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="spreadsheet"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'spreadsheet')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('spreadsheet');
            }}
            style={{ background: '#d1fae5', borderColor: '#10b981' }}
            title="Planilha"
          >
            <span style={{ fontSize: '18px' }}>📊</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#065f46' }}>Planilha</span>
          </div>

          <div
            className="drag-drawflow"
            draggable="true"
            data-node="presentation"
            onMouseDown={(e) => handleMouseDownOnButton(e, 'presentation')}
            onClick={(e) => {
              if (!isDraggingNew) handleClickToAdd('presentation');
            }}
            style={{ background: '#fef3c7', borderColor: '#f59e0b' }}
            title="Apresentação"
          >
            <span style={{ fontSize: '18px' }}>📽️</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>Apresentação</span>
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

      <div className="flex-1 relative">
        {/* Drawflow canvas */}
        <div
          id="drawflow"
          ref={drawflowRef}
          style={{ position: 'absolute', inset: 0 }}
          onDrop={(e) => e.preventDefault()}
          onDragOver={(e) => e.preventDefault()}
        />
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