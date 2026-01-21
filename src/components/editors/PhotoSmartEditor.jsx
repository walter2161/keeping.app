import React, { useRef, useState, useEffect } from 'react';
import {
  Move, Square, Wand2, Paintbrush, Pencil, Circle as CircleIcon, Minus as LineIcon,
  Type, Eraser, Palette, Search, Folder, Image as ImageIcon, RefreshCw,
  Copy, Trash2, Eye, EyeOff, Edit2, Sparkles, Loader2, Crop, RotateCw,
  ZoomIn, ZoomOut, Grid, Lock, Unlock, Layers, Download, Save, FileUp,
  FileText, FolderOpen, Upload, FilePlus, RotateCcw, Scissors, Clipboard,
  Settings, Maximize, Minimize, Sun, Moon, Droplet, Contrast, Sliders,
  Info, Keyboard, HelpCircle, ChevronRight
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
import { Textarea } from "@/components/ui/textarea";

export default function PhotoSmartEditor({ data, onChange, fileName }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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
  const [lastPos, setLastPos] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Dialogs
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [showAIHistoryDialog, setShowAIHistoryDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  // Initialize canvas with default layer
  useEffect(() => {
    if (data?.layers && Array.isArray(data.layers) && data.layers.length > 0) {
      const loadedLayers = data.layers.map(l => ({
        ...l,
        imageData: l.imageData || null
      }));
      setLayers(loadedLayers);
      setSelectedLayerId(loadedLayers[0].id);
    } else {
      // Create default background layer
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
      blendMode: 'normal',
      imageData: null,
      type: 'raster'
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
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid if enabled
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
      ctx.globalCompositeOperation = layer.blendMode || 'normal';

      if (layer.imageData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        };
        img.src = layer.imageData;
      } else if (layer.fillColor) {
        ctx.fillStyle = layer.fillColor;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    });

    // Save changes
    if (onChange) {
      onChange({
        layers: layers.map(l => ({
          ...l,
          thumbnail: null
        })),
        canvas: canvasSize
      });
    }
  }, [layers, canvasSize, showGrid]);

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
    setLastPos(pos);

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    if (tool === 'pencil' || tool === 'brush') {
      // Drawing will be handled on mouse move
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;
    
    const pos = getCanvasCoords(e);
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (tool === 'pencil' || tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === 'brush' ? brushSize * 2 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (lastPos) {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      // Update layer imageData
      const updatedLayers = layers.map(l => 
        l.id === selectedLayerId 
          ? { ...l, imageData: canvas.toDataURL() }
          : l
      );
      setLayers(updatedLayers);
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      const updatedLayers = layers.map(l => 
        l.id === selectedLayerId 
          ? { ...l, imageData: canvas.toDataURL() }
          : l
      );
      setLayers(updatedLayers);
    }

    setLastPos(pos);
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing) {
      saveState(layers);
    }
    setIsDrawing(false);
    setLastPos(null);
  };

  const addNewLayer = (type = 'raster') => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      imageData: null,
      type
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
      ...layer,
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
        // Add to history
        setAiHistory([...aiHistory, { prompt: aiPrompt, url: result.url, date: new Date().toISOString() }]);
        
        const newLayer = {
          id: Date.now(),
          name: type === 'background' ? 'AI Background' : 'AI Generated',
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal',
          imageData: result.url,
          type: 'raster'
        };
        
        let updatedLayers;
        if (type === 'background') {
          updatedLayers = [...layers, newLayer];
        } else if (type === 'replace' && selectedLayerId) {
          updatedLayers = layers.map(l => 
            l.id === selectedLayerId ? { ...l, imageData: result.url, name: 'AI Generated' } : l
          );
        } else {
          updatedLayers = [newLayer, ...layers];
        }
        
        setLayers(updatedLayers);
        setSelectedLayerId(newLayer.id);
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
      blendMode: 'normal',
      fillColor: bg,
      type: 'raster'
    };
    setLayers([newLayer]);
    setSelectedLayerId(newLayer.id);
    saveState([newLayer]);
    setShowNewDocDialog(false);
  };

  const rotateCanvas = (degrees) => {
    // For now, just swap dimensions for 90° rotations
    if (degrees === 90 || degrees === -90) {
      setCanvasSize({ width: canvasSize.height, height: canvasSize.width });
    }
  };

  const flipCanvas = (direction) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    if (direction === 'horizontal') {
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, -canvasSize.width, 0);
    } else {
      ctx.scale(1, -1);
      ctx.drawImage(canvas, 0, -canvasSize.height);
    }
  };

  const exportImage = (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${fileName || 'photosmart'}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
    setShowExportDialog(false);
  };

  const applyImageAdjustments = () => {
    if (!selectedLayerId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    const updatedLayers = layers.map(l => 
      l.id === selectedLayerId ? { ...l, imageData: canvas.toDataURL() } : l
    );
    setLayers(updatedLayers);
    saveState(updatedLayers);
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
          const newLayer = {
            id: Date.now(),
            name: file.name,
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            imageData: event.target.result,
            type: 'raster'
          };
          const updatedLayers = [newLayer, ...layers];
          setLayers(updatedLayers);
          setSelectedLayerId(newLayer.id);
          saveState(updatedLayers);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addTextLayer = () => {
    const text = prompt('Digite o texto:');
    if (!text) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const ctx = tempCanvas.getContext('2d');
    
    ctx.font = '48px Arial';
    ctx.fillStyle = color;
    ctx.fillText(text, 100, 100);

    const newLayer = {
      id: Date.now(),
      name: `Text: ${text.substring(0, 20)}`,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      imageData: tempCanvas.toDataURL(),
      type: 'text',
      textContent: text
    };

    const updatedLayers = [newLayer, ...layers];
    setLayers(updatedLayers);
    setSelectedLayerId(newLayer.id);
    saveState(updatedLayers);
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

        {/* Imagem Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">Imagem</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem onClick={() => setShowResizeDialog(true)}>
              <Maximize className="w-4 h-4 mr-2" />
              Tamanho do Documento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RotateCw className="w-4 h-4 mr-2" />
                Rotacionar Canvas
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => rotateCanvas(90)}>90° Direita</DropdownMenuItem>
                <DropdownMenuItem onClick={() => rotateCanvas(-90)}>90° Esquerda</DropdownMenuItem>
                <DropdownMenuItem onClick={() => rotateCanvas(180)}>180°</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => flipCanvas('horizontal')}>
              Inverter Horizontal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => flipCanvas('vertical')}>
              Inverter Vertical
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Efeitos Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:text-white hover:bg-gray-700 px-3 py-1 rounded">Efeitos</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sliders className="w-4 h-4 mr-2" />
                Ajustes
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Brilho: {brightness}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Contraste: {contrast}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Saturação: {saturation}%</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={applyImageAdjustments} className="w-full" size="sm">
                    Aplicar
                  </Button>
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>
              Desfoque
            </DropdownMenuItem>
            <DropdownMenuItem>
              Nitidez
            </DropdownMenuItem>
            <DropdownMenuItem>
              Sombra
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
              Gerar Nova Camada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateWithAI('background')}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Gerar Fundo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateWithAI('replace')} disabled={!selectedLayerId}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Substituir Camada
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowAIHistoryDialog(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Histórico de Gerações
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
              {fullscreen ? 'Sair de' : ''} Tela Cheia
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
              Atalhos do Teclado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Como Usar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
              <Info className="w-4 h-4 mr-2" />
              Sobre o PhotoSmart
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 h-8 w-8"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Desfazer (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 h-8 w-8"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Refazer (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
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
          {aiGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Gerar'
          )}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3 gap-1">
          <ToolButton icon={Move} active={tool === 'move'} onClick={() => setTool('move')} title="Mover" />
          <ToolButton icon={Square} active={tool === 'rectangle'} onClick={() => setTool('rectangle')} title="Retângulo" />
          <ToolButton icon={Wand2} active={tool === 'wand'} onClick={() => setTool('wand')} title="Varinha Mágica" />
          <ToolButton icon={Paintbrush} active={tool === 'brush'} onClick={() => setTool('brush')} title="Pincel" />
          <ToolButton icon={Pencil} active={tool === 'pencil'} onClick={() => setTool('pencil')} title="Lápis" />
          <ToolButton icon={CircleIcon} active={tool === 'circle'} onClick={() => setTool('circle')} title="Círculo" />
          <ToolButton icon={LineIcon} active={tool === 'line'} onClick={() => setTool('line')} title="Linha" />
          <ToolButton icon={Type} active={tool === 'text'} onClick={() => { setTool('text'); addTextLayer(); }} title="Texto" />
          <ToolButton icon={Eraser} active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Borracha" />
          <ToolButton icon={Crop} active={tool === 'crop'} onClick={() => setTool('crop')} title="Cortar" />
          <div className="relative">
            <ToolButton icon={Palette} active={false} title="Cor" />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <ToolButton icon={Search} active={tool === 'zoom'} onClick={() => setTool('zoom')} title="Zoom" />
          
          <div className="flex-1" />
          
          <div className="text-xs text-gray-400 px-1">
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-10 h-2"
              style={{ writingMode: 'bt-lr', transform: 'rotate(-90deg)' }}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden" ref={containerRef}>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="border border-gray-600 cursor-crosshair bg-white shadow-2xl"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowGrid(!showGrid)}
                title="Grade"
              >
                <Grid className={`w-4 h-4 ${showGrid ? 'text-indigo-400' : 'text-gray-400'}`} />
              </Button>
            </div>
            <div className="text-gray-400">
              {canvasSize.width} x {canvasSize.height} px
            </div>
          </div>
        </div>

        {/* Right Layers Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Camadas</h3>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 h-6 w-6"
                onClick={() => addNewLayer('raster')}
                title="Nova Camada"
              >
                <Layers className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`p-3 border-b border-gray-700 cursor-pointer flex items-center gap-3 ${
                  selectedLayerId === layer.id ? 'bg-indigo-900' : 'hover:bg-gray-700'
                }`}
              >
                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-600">
                  {layer.imageData ? (
                    <img src={layer.imageData} alt={layer.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                  )}
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
              <label className="text-gray-400 text-xs mb-1 block">Modo:</label>
              <Select 
                value={selectedLayer?.blendMode || 'normal'} 
                onValueChange={updateLayerBlendMode}
              >
                <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="multiply">Multiplicar</SelectItem>
                  <SelectItem value="screen">Tela</SelectItem>
                  <SelectItem value="overlay">Sobrepor</SelectItem>
                  <SelectItem value="darken">Escurecer</SelectItem>
                  <SelectItem value="lighten">Clarear</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                onClick={() => addNewLayer('raster')}
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
                <Layers className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 flex-1"
                onClick={() => moveLayer('down')}
                title="Mover para Baixo"
              >
                <Layers className="w-4 h-4 rotate-180" />
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
              <Input 
                type="number" 
                defaultValue={2500} 
                id="doc-width"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Altura (px)</label>
              <Input 
                type="number" 
                defaultValue={1500} 
                id="doc-height"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fundo</label>
              <Select defaultValue="#ffffff">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#ffffff">Branco</SelectItem>
                  <SelectItem value="#000000">Preto</SelectItem>
                  <SelectItem value="transparent">Transparente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              const width = parseInt(document.getElementById('doc-width').value) || 2500;
              const height = parseInt(document.getElementById('doc-height').value) || 1500;
              createNewDocument(width, height);
            }}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResizeDialog} onOpenChange={setShowResizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redimensionar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Largura (px)</label>
              <Input 
                type="number" 
                defaultValue={canvasSize.width} 
                id="resize-width"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Altura (px)</label>
              <Input 
                type="number" 
                defaultValue={canvasSize.height} 
                id="resize-height"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResizeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              const width = parseInt(document.getElementById('resize-width').value);
              const height = parseInt(document.getElementById('resize-height').value);
              setCanvasSize({ width, height });
              setShowResizeDialog(false);
            }}>
              Aplicar
            </Button>
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
              <h3 className="font-semibold mb-2">Atalhos do Teclado</h3>
              <div className="space-y-1 text-sm">
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + Z</kbd> - Desfazer</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + Y</kbd> - Refazer</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl + D</kbd> - Duplicar Camada</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded">Delete</kbd> - Excluir Camada</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sobre</h3>
              <p className="text-sm text-gray-400">
                PhotoSmart Editor - Editor de imagens profissional com IA integrada.
                Versão 1.0.0
              </p>
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