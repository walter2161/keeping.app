import React, { useRef, useState, useEffect } from 'react';
import {
  Move, Square, Wand2, Paintbrush, Pencil, Circle as CircleIcon, Minus as LineIcon,
  Type, Eraser, Palette, Search, Folder, Image as ImageIcon, RefreshCw,
  Copy, Trash2, Eye, EyeOff, Edit2, Sparkles, Loader2
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
  const [blendMode, setBlendMode] = useState('normal');
  const [layerOpacity, setLayerOpacity] = useState(100);
  const [addMask, setAddMask] = useState(false);

  // Initialize from data
  useEffect(() => {
    if (data?.layers && Array.isArray(data.layers)) {
      const loadedLayers = data.layers.map(l => ({
        ...l,
        canvas: loadCanvasFromData(l.canvasData || l.canvas)
      }));
      setLayers(loadedLayers);
      if (data.canvas) {
        setCanvasSize(data.canvas);
      }
      if (loadedLayers.length > 0) {
        setSelectedLayerId(loadedLayers[0].id);
      }
    } else {
      // Create default background layer
      const bg = createLayer('Background', canvasSize.width, canvasSize.height);
      const ctx = bg.canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      setLayers([bg]);
      setSelectedLayerId(bg.id);
    }
  }, []);

  const loadCanvasFromData = (canvasData) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    if (typeof canvasData === 'string' && canvasData.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasData;
    }
    
    return canvas;
  };

  const createLayer = (name, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return {
      id: Date.now() + Math.random(),
      name,
      visible: true,
      locked: false,
      canvas,
      opacity: 100,
      blendMode: 'normal',
      thumbnail: null
    };
  };

  // Render main canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layers.length === 0) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Render all visible layers
    layers.forEach((layer) => {
      if (layer.visible && layer.canvas) {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0);
        ctx.globalAlpha = 1;
      }
    });

    // Save changes
    saveToData();
  }, [layers, canvasSize]);

  const saveToData = () => {
    onChange({
      layers: layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        locked: l.locked,
        opacity: l.opacity,
        blendMode: l.blendMode,
        canvasData: l.canvas.toDataURL(),
        thumbnail: generateThumbnail(l.canvas)
      })),
      canvas: canvasSize
    });
  };

  const generateThumbnail = (canvas) => {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 60;
    thumbCanvas.height = 40;
    const ctx = thumbCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 60, 40);
    return thumbCanvas.toDataURL();
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    const ctx = selectedLayer.canvas.getContext('2d');

    if (tool === 'pencil' || tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === 'brush' ? brushSize * 2 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }

    setLayers([...layers]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    const ctx = selectedLayer.canvas.getContext('2d');

    if (tool === 'pencil' || tool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }

    setLayers([...layers]);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const addNewLayer = () => {
    const newLayer = createLayer(`Layer ${layers.length + 1}`, canvasSize.width, canvasSize.height);
    setLayers([newLayer, ...layers]);
    setSelectedLayerId(newLayer.id);
  };

  const deleteLayer = () => {
    if (layers.length === 1) return;
    const newLayers = layers.filter(l => l.id !== selectedLayerId);
    setLayers(newLayers);
    setSelectedLayerId(newLayers[0]?.id);
  };

  const duplicateLayer = () => {
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvasSize.width;
    newCanvas.height = canvasSize.height;
    const ctx = newCanvas.getContext('2d');
    ctx.drawImage(layer.canvas, 0, 0);

    const newLayer = {
      ...layer,
      id: Date.now() + Math.random(),
      name: `${layer.name} copy`,
      canvas: newCanvas
    };

    const idx = layers.findIndex(l => l.id === selectedLayerId);
    const newLayers = [...layers.slice(0, idx), newLayer, ...layers.slice(idx)];
    setLayers(newLayers);
    setSelectedLayerId(newLayer.id);
  };

  const toggleLayerVisibility = (layerId) => {
    setLayers(layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  };

  const updateLayerOpacity = (layerId, opacity) => {
    setLayers(layers.map(l => l.id === layerId ? { ...l, opacity } : l));
    setLayerOpacity(opacity);
  };

  const updateSelectedLayerOpacity = (opacity) => {
    if (!selectedLayerId) return;
    updateLayerOpacity(selectedLayerId, opacity);
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
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const newLayer = createLayer('AI Generated', canvasSize.width, canvasSize.height);
          const ctx = newLayer.canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
          setLayers([newLayer, ...layers]);
          setSelectedLayerId(newLayer.id);
        };
        img.src = result.url;
      }
    } catch (error) {
      alert('Erro ao gerar imagem: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-4 text-sm text-gray-300">
        <button className="hover:text-white">Arquivo</button>
        <button className="hover:text-white">Editar</button>
        <button className="hover:text-white">Imagem</button>
        <button className="hover:text-white">Efeitos</button>
        <button className="hover:text-white">IA</button>
        <button className="hover:text-white">Visualizar</button>
        <button className="hover:text-white">Ajuda</button>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
            <Square className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
            <Copy className="w-4 h-4" />
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
          <ToolButton icon={Move} active={tool === 'move'} onClick={() => setTool('move')} />
          <ToolButton icon={Square} active={tool === 'rectangle'} onClick={() => setTool('rectangle')} />
          <ToolButton icon={Wand2} active={tool === 'wand'} onClick={() => setTool('wand')} />
          <ToolButton icon={Paintbrush} active={tool === 'brush'} onClick={() => setTool('brush')} />
          <ToolButton icon={Pencil} active={tool === 'pencil'} onClick={() => setTool('pencil')} />
          <ToolButton icon={CircleIcon} active={tool === 'circle'} onClick={() => setTool('circle')} />
          <ToolButton icon={LineIcon} active={tool === 'line'} onClick={() => setTool('line')} />
          <ToolButton icon={Type} active={tool === 'text'} onClick={() => setTool('text')} />
          <ToolButton icon={Eraser} active={tool === 'eraser'} onClick={() => setTool('eraser')} />
          <div className="relative">
            <ToolButton icon={Palette} active={false} onClick={() => {}} />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <ToolButton icon={Search} active={tool === 'zoom'} onClick={() => setTool('zoom')} />
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
            <Button variant="ghost" size="icon" className="text-gray-400 h-8 w-8">
              <Square className="w-4 h-4" />
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
                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                  {layer.thumbnail ? (
                    <img src={layer.thumbnail} alt={layer.name} className="w-full h-full object-cover" />
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
                    className="text-gray-400 h-6 w-6"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Layer Controls */}
          <div className="p-3 border-t border-gray-700 space-y-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Modo:</label>
              <Select value={blendMode} onValueChange={setBlendMode}>
                <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="multiply">Multiplicar</SelectItem>
                  <SelectItem value="screen">Tela</SelectItem>
                  <SelectItem value="overlay">Sobrepor</SelectItem>
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
                  onChange={(e) => updateSelectedLayerOpacity(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-xs w-12">{selectedLayer?.opacity || 100}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addMask}
                onChange={(e) => setAddMask(e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-gray-300 text-sm">Adicionar Máscara</label>
            </div>

            <div className="flex gap-1 pt-2">
              <Button variant="ghost" size="icon" className="text-gray-400 flex-1" onClick={addNewLayer}>
                <Folder className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 flex-1" onClick={addNewLayer}>
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 flex-1">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 flex-1" onClick={duplicateLayer}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-400 flex-1 hover:text-red-300" onClick={deleteLayer}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}