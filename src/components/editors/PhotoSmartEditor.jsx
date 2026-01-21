import React, { useRef, useState, useEffect } from 'react';
import {
  Move, Square, Wand2, Paintbrush, Pencil, Circle as CircleIcon, Minus as LineIcon,
  Type, Eraser, Palette, Search, Folder, Image as ImageIcon, RefreshCw,
  Copy, Trash2, Eye, EyeOff, Edit2, Sparkles, Loader2, Crop, RotateCw,
  ZoomIn, ZoomOut, Grid, Lock, Unlock, Layers, Download, Save, FileUp
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

  const generateWithAI = async () => {
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
        const newLayer = {
          id: Date.now(),
          name: 'AI Generated',
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: 'normal',
          imageData: result.url,
          type: 'raster'
        };
        const updatedLayers = [newLayer, ...layers];
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
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-4 text-sm text-gray-300">
        <button className="hover:text-white" onClick={createDefaultLayer}>Arquivo</button>
        <button className="hover:text-white" onClick={undo} disabled={historyIndex <= 0}>Editar</button>
        <button className="hover:text-white">Imagem</button>
        <button className="hover:text-white">Efeitos</button>
        <button className="hover:text-white" onClick={generateWithAI}>IA</button>
        <button className="hover:text-white" onClick={() => setShowGrid(!showGrid)}>Visualizar</button>
        <button className="hover:text-white">Ajuda</button>
        <div className="ml-auto flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 h-8 w-8"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Desfazer"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 h-8 w-8"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Refazer"
          >
            <RefreshCw className="w-4 h-4 scale-x-[-1]" />
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