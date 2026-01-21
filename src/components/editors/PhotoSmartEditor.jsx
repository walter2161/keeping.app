import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pencil, Eraser, Type, Download, Upload, Trash2, Copy, Eye, EyeOff,
  Plus, Minus, Move, Square, Circle, Sparkles, Settings, Pipette,
  ChevronUp, ChevronDown, Lock, Unlock, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';

export default function PhotoSmartEditor({ data, onChange, fileName }) {
  const canvasRef = useRef(null);
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Initialize canvas and layers from data
  useEffect(() => {
    if (data?.layers && Array.isArray(data.layers)) {
      setLayers(data.layers);
      if (data.canvas) {
        setCanvasSize(data.canvas);
      }
      if (data.layers.length > 0) {
        setSelectedLayerId(data.layers[0].id);
      }
    } else {
      // Create default layer
      const defaultLayer = {
        id: Date.now(),
        name: 'Layer 1',
        visible: true,
        locked: false,
        canvas: createCanvas(1920, 1080),
        opacity: 100,
      };
      setLayers([defaultLayer]);
      setSelectedLayerId(defaultLayer.id);
    }
  }, [data]);

  const createCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layers.length === 0) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw all visible layers
    layers.forEach((layer) => {
      if (layer.visible && layer.canvas) {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0);
        ctx.globalAlpha = 1;
      }
    });

    // Export changes
    onChange({
      layers: layers.map(l => ({
        ...l,
        canvas: l.canvas.toDataURL()
      })),
      canvas: canvasSize
    });
  }, [layers, canvasSize, zoom]);

  const handleCanvasMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setIsDrawing(true);

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer || selectedLayer.locked) return;

    const ctx = selectedLayer.canvas.getContext('2d');

    // Save state for undo
    setUndoStack([...undoStack, selectedLayer.canvas.toDataURL()]);
    setRedoStack([]);

    if (tool === 'pencil') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    } else if (tool === 'colorpicker') {
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      setColor(`#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`);
    }

    setLayers([...layers]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    const ctx = selectedLayer.canvas.getContext('2d');

    if (tool === 'pencil') {
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

  const addLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      canvas: createCanvas(canvasSize.width, canvasSize.height),
      opacity: 100,
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const deleteLayer = () => {
    if (layers.length === 1) {
      alert('Cannot delete the last layer');
      return;
    }
    const newLayers = layers.filter(l => l.id !== selectedLayerId);
    setLayers(newLayers);
    setSelectedLayerId(newLayers[0].id);
  };

  const duplicateLayer = () => {
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    if (!selectedLayer) return;

    const newCanvas = createCanvas(canvasSize.width, canvasSize.height);
    const ctx = newCanvas.getContext('2d');
    ctx.drawImage(selectedLayer.canvas, 0, 0);

    const newLayer = {
      ...selectedLayer,
      id: Date.now(),
      name: `${selectedLayer.name} copy`,
      canvas: newCanvas,
    };
    
    const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
    const newLayers = [
      ...layers.slice(0, layerIndex + 1),
      newLayer,
      ...layers.slice(layerIndex + 1)
    ];
    setLayers(newLayers);
    setSelectedLayerId(newLayer.id);
  };

  const moveLayer = (direction) => {
    const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
    if (layerIndex === -1) return;

    const newIndex = direction === 'up' ? layerIndex + 1 : layerIndex - 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newLayers = [...layers];
    [newLayers[layerIndex], newLayers[newIndex]] = [newLayers[newIndex], newLayers[layerIndex]];
    setLayers(newLayers);
  };

  const toggleLayerVisibility = (layerId) => {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ));
  };

  const toggleLayerLock = (layerId) => {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, locked: !l.locked } : l
    ));
  };

  const updateLayerOpacity = (layerId, opacity) => {
    setLayers(layers.map(l =>
      l.id === layerId ? { ...l, opacity } : l
    ));
  };

  const generateWithAI = async () => {
    if (!fileName) {
      alert('Please name your design first');
      return;
    }

    setAiGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a creative, modern design image for "${fileName}". Make it professional and visually appealing. Dimensions: 1920x1080.`,
        response_json_schema: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            colors: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const imageUrl = await base44.integrations.Core.GenerateImage({
        prompt: result?.description || `Professional design for ${fileName}`
      });

      if (imageUrl?.url) {
        const img = new Image();
        img.onload = () => {
          const selectedLayer = layers.find(l => l.id === selectedLayerId);
          if (selectedLayer) {
            const ctx = selectedLayer.canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
            setLayers([...layers]);
          }
        };
        img.src = imageUrl.url;
      }
    } catch (error) {
      alert('Error generating image: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Toolbar - Left */}
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
        <ToolButton
          icon={Pencil}
          active={tool === 'pencil'}
          onClick={() => setTool('pencil')}
          title="Pencil"
        />
        <ToolButton
          icon={Eraser}
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          title="Eraser"
        />
        <ToolButton
          icon={Type}
          active={tool === 'text'}
          onClick={() => setTool('text')}
          title="Text"
        />
        <ToolButton
          icon={Square}
          active={tool === 'rectangle'}
          onClick={() => setTool('rectangle')}
          title="Rectangle"
        />
        <ToolButton
          icon={Circle}
          active={tool === 'circle'}
          onClick={() => setTool('circle')}
          title="Circle"
        />
        <ToolButton
          icon={Pipette}
          active={tool === 'colorpicker'}
          onClick={() => setTool('colorpicker')}
          title="Color Picker"
        />
        <div className="flex-1" />
        <Button
          size="icon"
          onClick={() => setZoom(Math.min(3, zoom + 0.5))}
          variant="outline"
          className="text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <span className="text-xs text-gray-300">{Math.round(zoom * 100)}%</span>
        <Button
          size="icon"
          onClick={() => setZoom(Math.max(0.1, zoom - 0.5))}
          variant="outline"
          className="text-white"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas Area - Center */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-900">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="border border-gray-600 cursor-crosshair bg-white"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>

        {/* Color & Brush Controls */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-white text-sm">Brush Size</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-white text-sm">{brushSize}px</span>
          </div>
          <Button
            onClick={generateWithAI}
            disabled={aiGenerating}
            className="ml-auto"
          >
            {aiGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Generate
          </Button>
        </div>
      </div>

      {/* Layers Panel - Right */}
      <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold mb-3">Layers</h3>
          <Button onClick={addLayer} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Layer
          </Button>
        </div>

        {/* Layer List */}
        <div className="flex-1 overflow-y-auto">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`p-3 border-b border-gray-700 cursor-pointer ${
                selectedLayerId === layer.id ? 'bg-blue-900' : 'hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="text-white h-6 w-6"
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerLock(layer.id);
                  }}
                  className="text-white h-6 w-6"
                >
                  {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
                <span className="text-white flex-1 text-sm truncate">{layer.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <label className="text-gray-300 text-xs flex-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateLayerOpacity(layer.id, parseInt(e.target.value));
                  }}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-gray-300 text-xs w-8">{layer.opacity}%</span>
              </div>

              <div className="flex gap-1 mt-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer('up');
                  }}
                  className="text-white h-6 w-6 flex-1"
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer('down');
                  }}
                  className="text-white h-6 w-6 flex-1"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer();
                  }}
                  className="text-white h-6 w-6 flex-1"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer();
                  }}
                  className="text-white h-6 w-6 flex-1 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, active, onClick, title }) {
  return (
    <Button
      size="icon"
      onClick={onClick}
      variant={active ? 'default' : 'ghost'}
      className={`text-white ${active ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
      title={title}
    >
      <Icon className="w-5 h-5" />
    </Button>
  );
}