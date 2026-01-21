import React, { useRef, useState, useEffect } from 'react';
import {
  Move, Square, Wand2, Paintbrush, Pencil, Circle as CircleIcon, Minus as LineIcon,
  Type, Eraser, Palette, Search, Folder, Image as ImageIcon, RefreshCw,
  Copy, Trash2, Eye, EyeOff, Edit2, Sparkles, Loader2, Crop, RotateCw,
  ZoomIn, ZoomOut, Grid, Lock, Unlock, Layers, Download, Save, FileUp,
  FileText, FolderOpen, Upload, FilePlus, RotateCcw, Scissors, Clipboard,
  Settings, Maximize, Minimize, Sun, Moon, Droplet, Contrast, Sliders,
  Info, Keyboard, HelpCircle, ChevronRight, Triangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function PhotoSmartEditor({ data, onChange, fileName }) {
  const canvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 2500, height: 1500 });
  const [tool, setTool] = useState('move');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [zoom, setZoom] = useState(75);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [fontSize, setFontSize] = useState(48);
  const [selectedObject, setSelectedObject] = useState(null);
  
  // Dialogs
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [showAIHistoryDialog, setShowAIHistoryDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  // Initialize
  useEffect(() => {
    if (data?.layers && Array.isArray(data.layers) && data.layers.length > 0) {
      setLayers(data.layers);
      setSelectedLayerId(data.layers[0].id);
    } else {
      createDefaultLayer();
    }
  }, []);

  const createDefaultLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: 'Background',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'source-over',
      fillColor: '#ffffff',
      objects: []
    };
    setLayers([newLayer]);
    setSelectedLayerId(newLayer.id);
    saveState([newLayer]);
  };

  const saveState = (currentLayers) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentLayers)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvasSize.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvasSize.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }
    }

    // Render layers
    layers.forEach((layer) => {
      if (!layer.visible) return;
      
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';

      // Draw background color
      if (layer.fillColor) {
        ctx.fillStyle = layer.fillColor;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }

      // Draw objects
      if (layer.objects) {
        layer.objects.forEach(obj => {
          if (obj.type === 'path') {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            obj.points.forEach((point, idx) => {
              if (idx === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          } else if (obj.type === 'circle') {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.lineWidth;
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
            if (obj.fill) {
              ctx.fillStyle = obj.color;
              ctx.fill();
            }
            ctx.stroke();
          } else if (obj.type === 'rectangle') {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.lineWidth;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            if (obj.fill) {
              ctx.fillStyle = obj.color;
              ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
          } else if (obj.type === 'triangle') {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.lineWidth;
            ctx.beginPath();
            ctx.moveTo(obj.x1, obj.y1);
            ctx.lineTo(obj.x2, obj.y2);
            ctx.lineTo(obj.x3, obj.y3);
            ctx.closePath();
            if (obj.fill) {
              ctx.fillStyle = obj.color;
              ctx.fill();
            }
            ctx.stroke();
          } else if (obj.type === 'line') {
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.lineWidth;
            ctx.beginPath();
            ctx.moveTo(obj.x1, obj.y1);
            ctx.lineTo(obj.x2, obj.y2);
            ctx.stroke();
          } else if (obj.type === 'text') {
            ctx.fillStyle = obj.color;
            ctx.font = `${obj.fontSize}px Arial`;
            ctx.fillText(obj.text, obj.x, obj.y);
          } else if (obj.type === 'image') {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            };
            img.src = obj.src;
          } else if (obj.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = obj.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            obj.points.forEach((point, idx) => {
              if (idx === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
          }

          // Draw selection
          if (selectedObject && selectedObject.layerId === layer.id && selectedObject.objectIndex === layer.objects.indexOf(obj)) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            if (obj.type === 'text') {
              ctx.strokeRect(obj.x - 5, obj.y - obj.fontSize - 5, 200, obj.fontSize + 10);
            } else if (obj.type === 'circle') {
              ctx.strokeRect(obj.x - obj.radius - 5, obj.y - obj.radius - 5, obj.radius * 2 + 10, obj.radius * 2 + 10);
            }
            ctx.setLineDash([]);
          }
        });
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    });

    // Save
    if (onChange) {
      onChange({ layers, canvas: canvasSize });
    }
  }, [layers, canvasSize, showGrid, selectedObject]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasMouseDown = (e) => {
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(pos);

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    if (tool === 'move') {
      // Check if clicking on an object
      const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
      if (layerIndex !== -1 && layers[layerIndex].objects) {
        for (let i = layers[layerIndex].objects.length - 1; i >= 0; i--) {
          const obj = layers[layerIndex].objects[i];
          if (obj.type === 'text') {
            if (pos.x >= obj.x && pos.x <= obj.x + 200 && pos.y >= obj.y - obj.fontSize && pos.y <= obj.y) {
              setSelectedObject({ layerId: selectedLayerId, objectIndex: i, startX: pos.x - obj.x, startY: pos.y - obj.y });
              return;
            }
          }
        }
      }
    } else if (tool === 'pencil' || tool === 'brush') {
      setCurrentPath([pos]);
    } else if (tool === 'eraser') {
      setCurrentPath([pos]);
    } else if (tool === 'text') {
      const text = prompt('Digite o texto:');
      if (text) {
        const newObj = {
          type: 'text',
          text,
          x: pos.x,
          y: pos.y,
          color,
          fontSize
        };
        const updatedLayers = layers.map(l => 
          l.id === selectedLayerId 
            ? { ...l, objects: [...(l.objects || []), newObj] }
            : l
        );
        setLayers(updatedLayers);
        saveState(updatedLayers);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;
    
    const pos = getCanvasCoords(e);
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    if (tool === 'move' && selectedObject) {
      const updatedLayers = layers.map(l => {
        if (l.id === selectedObject.layerId) {
          const newObjects = [...l.objects];
          const obj = newObjects[selectedObject.objectIndex];
          if (obj.type === 'text') {
            newObjects[selectedObject.objectIndex] = {
              ...obj,
              x: pos.x - selectedObject.startX,
              y: pos.y - selectedObject.startY
            };
          }
          return { ...l, objects: newObjects };
        }
        return l;
      });
      setLayers(updatedLayers);
    } else if (tool === 'pencil' || tool === 'brush') {
      setCurrentPath([...currentPath, pos]);
    } else if (tool === 'eraser') {
      setCurrentPath([...currentPath, pos]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (selectedLayer && !selectedLayer.locked) {
      if (tool === 'pencil' || tool === 'brush') {
        if (currentPath.length > 1) {
          const newObj = {
            type: 'path',
            points: currentPath,
            color,
            lineWidth: tool === 'brush' ? brushSize * 2 : brushSize
          };
          const updatedLayers = layers.map(l => 
            l.id === selectedLayerId 
              ? { ...l, objects: [...(l.objects || []), newObj] }
              : l
          );
          setLayers(updatedLayers);
          saveState(updatedLayers);
        }
      } else if (tool === 'eraser') {
        if (currentPath.length > 1) {
          const newObj = {
            type: 'eraser',
            points: currentPath,
            lineWidth: brushSize * 2
          };
          const updatedLayers = layers.map(l => 
            l.id === selectedLayerId 
              ? { ...l, objects: [...(l.objects || []), newObj] }
              : l
          );
          setLayers(updatedLayers);
          saveState(updatedLayers);
        }
      } else if (tool === 'circle' && startPos) {
        const radius = Math.sqrt(Math.pow(startPos.x - currentPath[currentPath.length - 1]?.x || startPos.x, 2) + 
                                  Math.pow(startPos.y - currentPath[currentPath.length - 1]?.y || startPos.y, 2));
        const newObj = {
          type: 'circle',
          x: startPos.x,
          y: startPos.y,
          radius,
          color,
          lineWidth: brushSize,
          fill: false
        };
        const updatedLayers = layers.map(l => 
          l.id === selectedLayerId 
            ? { ...l, objects: [...(l.objects || []), newObj] }
            : l
        );
        setLayers(updatedLayers);
        saveState(updatedLayers);
      } else if (tool === 'rectangle' && startPos) {
        const endPos = currentPath[currentPath.length - 1] || startPos;
        const newObj = {
          type: 'rectangle',
          x: Math.min(startPos.x, endPos.x),
          y: Math.min(startPos.y, endPos.y),
          width: Math.abs(endPos.x - startPos.x),
          height: Math.abs(endPos.y - startPos.y),
          color,
          lineWidth: brushSize,
          fill: false
        };
        const updatedLayers = layers.map(l => 
          l.id === selectedLayerId 
            ? { ...l, objects: [...(l.objects || []), newObj] }
            : l
        );
        setLayers(updatedLayers);
        saveState(updatedLayers);
      } else if (tool === 'line' && startPos) {
        const endPos = currentPath[currentPath.length - 1] || startPos;
        const newObj = {
          type: 'line',
          x1: startPos.x,
          y1: startPos.y,
          x2: endPos.x,
          y2: endPos.y,
          color,
          lineWidth: brushSize
        };
        const updatedLayers = layers.map(l => 
          l.id === selectedLayerId 
            ? { ...l, objects: [...(l.objects || []), newObj] }
            : l
        );
        setLayers(updatedLayers);
        saveState(updatedLayers);
      } else if (tool === 'move' && selectedObject) {
        saveState(layers);
      }
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentPath([]);
    if (tool === 'move') {
      setSelectedObject(null);
    }
  };

  const addNewLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'source-over',
      objects: []
    };
    const updatedLayers = [newLayer, ...layers];
    setLayers(updatedLayers);
    setSelectedLayerId(newLayer.id);
    saveState(updatedLayers);
  };

  const deleteLayer = () => {
    if (layers.length === 1) return;
    const updatedLayers = layers.filter(l => l.id !== selectedLayerId);
    setLayers(updatedLayers);
    setSelectedLayerId(updatedLayers[0]?.id);
    saveState(updatedLayers);
  };

  const duplicateLayer = () => {
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return;

    const newLayer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: Date.now(),
      name: `${layer.name} copy`
    };

    const idx = layers.findIndex(l => l.id === selectedLayerId);
    const updatedLayers = [...layers.slice(0, idx), newLayer, ...layers.slice(idx)];
    setLayers(updatedLayers);
    setSelectedLayerId(newLayer.id);
    saveState(updatedLayers);
  };

  const toggleLayerVisibility = (layerId) => {
    const updatedLayers = layers.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    setLayers(updatedLayers);
  };

  const toggleLayerLock = (layerId) => {
    const updatedLayers = layers.map(l => 
      l.id === layerId ? { ...l, locked: !l.locked } : l
    );
    setLayers(updatedLayers);
  };

  const updateLayerOpacity = (opacity) => {
    if (!selectedLayerId) return;
    const updatedLayers = layers.map(l => 
      l.id === selectedLayerId ? { ...l, opacity } : l
    );
    setLayers(updatedLayers);
  };

  const updateLayerBlendMode = (mode) => {
    if (!selectedLayerId) return;
    const updatedLayers = layers.map(l => 
      l.id === selectedLayerId ? { ...l, blendMode: mode } : l
    );
    setLayers(updatedLayers);
  };

  const moveLayer = (direction) => {
    const idx = layers.findIndex(l => l.id === selectedLayerId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= layers.length) return;

    const updatedLayers = [...layers];
    [updatedLayers[idx], updatedLayers[newIdx]] = [updatedLayers[newIdx], updatedLayers[idx]];
    setLayers(updatedLayers);
    saveState(updatedLayers);
  };

  const generateWithAI = async (type = 'layer') => {
    if (!aiPrompt.trim()) {
      alert('Digite um prompt para gerar a imagem');
      return;
    }

    setAiGenerating(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: aiPrompt
      });

      if (result?.url) {
        setAiHistory([...aiHistory, { prompt: aiPrompt, url: result.url, date: new Date().toISOString() }]);
        
        const newObj = {
          type: 'image',
          src: result.url,
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height
        };

        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        const updatedLayers = layers.map(l => 
          l.id === selectedLayerId 
            ? { ...l, objects: [...(l.objects || []), newObj] }
            : l
        );
        
        setLayers(updatedLayers);
        saveState(updatedLayers);
      }
    } catch (error) {
      alert('Erro ao gerar imagem: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const createNewDocument = (width, height, bg = '#ffffff') => {
    setCanvasSize({ width, height });
    const newLayer = {
      id: Date.now(),
      name: 'Background',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'source-over',
      fillColor: bg,
      objects: []
    };
    setLayers([newLayer]);
    setSelectedLayerId(newLayer.id);
    saveState([newLayer]);
    setShowNewDocDialog(false);
  };

  const exportImage = (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${fileName || 'photosmart'}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
  };

  const importImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const newObj = {
              type: 'image',
              src: event.target.result,
              x: 0,
              y: 0,
              width: img.width,
              height: img.height
            };
            const updatedLayers = layers.map(l => 
              l.id === selectedLayerId 
                ? { ...l, objects: [...(l.objects || []), newObj] }
                : l
            );
            setLayers(updatedLayers);
            saveState(updatedLayers);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className={`flex flex-col h-screen bg-gray-900 ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-1 text-sm text-gray-300">
        {/* Arquivo Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">Arquivo</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setShowNewDocDialog(true)}>
              <FilePlus className="w-4 h-4 mr-2" />
              Novo Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={importImage}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Imagem
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange && onChange({ layers, canvas: canvasSize })}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => exportImage('png')}>PNG</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportImage('jpeg')}>JPG</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportImage('webp')}>WebP</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Editar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">Editar</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={undo} disabled={historyIndex <= 0}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Desfazer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={redo} disabled={historyIndex >= history.length - 1}>
              <RotateCw className="w-4 h-4 mr-2" />
              Refazer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={duplicateLayer}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar Camada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteLayer} disabled={layers.length === 1}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Camada
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* IA Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">IA</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => generateWithAI('layer')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Imagem
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowAIHistoryDialog(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Visualizar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">Visualizar</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="w-4 h-4 mr-2" />
              Zoom +
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="w-4 h-4 mr-2" />
              Zoom −
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setZoom(100)}>
              100%
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
              <Grid className="w-4 h-4 mr-2" />
              {showGrid ? 'Ocultar' : 'Mostrar'} Grade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
              Tela Cheia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ajuda Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">Ajuda</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
              <Keyboard className="w-4 h-4 mr-2" />
              Atalhos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
              <Info className="w-4 h-4 mr-2" />
              Sobre
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex gap-2 items-center">
          <span className="text-xs text-gray-400">Cor:</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <span className="text-xs text-gray-400">Tamanho: {brushSize}px</span>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-gray-400">Fonte: {fontSize}px</span>
          <input
            type="range"
            min="12"
            max="120"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      {/* AI Prompt Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-gray-400" />
        <Input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Generate an image of a futuristic city at sunset"
          className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
        />
        <Button 
          onClick={generateWithAI} 
          disabled={aiGenerating}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar'}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3 gap-1">
          <ToolButton icon={Move} active={tool === 'move'} onClick={() => setTool('move')} title="Mover (V)" />
          <ToolButton icon={Square} active={tool === 'rectangle'} onClick={() => setTool('rectangle')} title="Retângulo (R)" />
          <ToolButton icon={Triangle} active={tool === 'triangle'} onClick={() => setTool('triangle')} title="Triângulo" />
          <ToolButton icon={Paintbrush} active={tool === 'brush'} onClick={() => setTool('brush')} title="Pincel (B)" />
          <ToolButton icon={Pencil} active={tool === 'pencil'} onClick={() => setTool('pencil')} title="Lápis (P)" />
          <ToolButton icon={CircleIcon} active={tool === 'circle'} onClick={() => setTool('circle')} title="Círculo (C)" />
          <ToolButton icon={LineIcon} active={tool === 'line'} onClick={() => setTool('line')} title="Linha (L)" />
          <ToolButton icon={Type} active={tool === 'text'} onClick={() => setTool('text')} title="Texto (T)" />
          <ToolButton icon={Eraser} active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Borracha (E)" />
          <ToolButton icon={Search} active={tool === 'zoom'} onClick={() => setTool('zoom')} title="Lupa (Z)" />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="border border-gray-600 cursor-crosshair bg-white shadow-2xl"
                style={{ 
                  cursor: tool === 'move' ? 'move' : tool === 'zoom' ? 'zoom-in' : 'crosshair'
                }}
              />
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Select value={zoom.toString()} onValueChange={(v) => setZoom(parseInt(v))}>
                <SelectTrigger className="w-24 h-8 bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                  <SelectItem value="150">150%</SelectItem>
                  <SelectItem value="200">200%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-gray-400">
              {canvasSize.width} x {canvasSize.height} px | Camada: {selectedLayer?.name || 'Nenhuma'}
            </div>
          </div>
        </div>

        {/* Right Layers Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Camadas</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 h-6 w-6"
              onClick={addNewLayer}
            >
              <Layers className="w-4 h-4" />
            </Button>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`p-3 border-b border-gray-700 cursor-pointer flex items-center gap-3 ${
                  selectedLayerId === layer.id ? 'bg-indigo-900' : 'hover:bg-gray-700'
                }`}
              >
                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 border border-gray-600">
                  <Layers className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-white flex-1 text-sm truncate">{layer.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className="text-gray-400 h-6 w-6"
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(layer.id);
                    }}
                    className="text-gray-400 h-6 w-6"
                  >
                    {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Layer Controls */}
          <div className="p-3 border-t border-gray-700 space-y-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Opacidade:</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer?.opacity || 100}
                  onChange={(e) => updateLayerOpacity(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-xs w-12">{selectedLayer?.opacity || 100}%</span>
              </div>
            </div>

            <div className="flex gap-1 pt-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 flex-1" 
                onClick={addNewLayer}
                title="Nova Camada"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 flex-1"
                onClick={() => moveLayer('up')}
                title="Mover para Cima"
              >
                <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 flex-1"
                onClick={() => moveLayer('down')}
                title="Mover para Baixo"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 flex-1" 
                onClick={duplicateLayer}
                title="Duplicar"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-400 flex-1 hover:text-red-300" 
                onClick={deleteLayer}
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Largura (px)</label>
              <Input type="number" defaultValue={2500} id="doc-width" />
            </div>
            <div>
              <label className="text-sm font-medium">Altura (px)</label>
              <Input type="number" defaultValue={1500} id="doc-height" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>Cancelar</Button>
            <Button onClick={() => {
              const width = parseInt(document.getElementById('doc-width').value) || 2500;
              const height = parseInt(document.getElementById('doc-height').value) || 1500;
              createNewDocument(width, height);
            }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIHistoryDialog} onOpenChange={setShowAIHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Gerações IA</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {aiHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhuma geração ainda</p>
            ) : (
              aiHistory.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-800 rounded">
                  <img src={item.url} alt={item.prompt} className="w-24 h-24 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.prompt}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PhotoSmart - Ajuda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-2">Atalhos</h3>
              <div className="space-y-1 text-sm">
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">V</kbd> - Mover</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">B</kbd> - Pincel</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">P</kbd> - Lápis</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">E</kbd> - Borracha</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">T</kbd> - Texto</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolButton({ icon: Icon, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}