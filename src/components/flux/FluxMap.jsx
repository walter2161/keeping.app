import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, Circle, Diamond, ArrowRight, Trash2, 
  ZoomIn, ZoomOut, Hand, MousePointer, Type, StickyNote,
  Pencil, Image as ImageIcon, Frame as FrameIcon, Plus,
  Minus, MessageSquare, ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const COLORS = ['#fef08a', '#fed7aa', '#fecaca', '#ddd6fe', '#bfdbfe', '#bbf7d0', '#e9d5ff'];

export default function FluxMap({ data, onChange }) {
  const [elements, setElements] = useState(data?.elements || []);
  const [connections, setConnections] = useState(data?.connections || []);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (onChange) {
      onChange({ elements, connections });
    }
  }, [elements, connections]);

  const addElement = (type, x = null, y = null) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = x !== null ? x : (rect.width / 2 - pan.x) / zoom;
    const centerY = y !== null ? y : (rect.height / 2 - pan.y) / zoom;

    const configs = {
      sticky: { width: 200, height: 200, color: COLORS[Math.floor(Math.random() * COLORS.length)], text: 'Nova nota' },
      rect: { width: 180, height: 100, color: '#3b82f6', text: 'Processo' },
      circle: { width: 120, height: 120, color: '#10b981', text: 'Início' },
      diamond: { width: 180, height: 100, color: '#f59e0b', text: 'Decisão' },
      text: { width: 300, height: 150, color: '#ffffff', text: 'Adicione seu texto aqui...' },
      frame: { width: 600, height: 400, color: '#f3f4f6', text: 'Frame' }
    };

    const config = configs[type] || configs.sticky;
    const newElement = {
      id: Date.now().toString(),
      type,
      x: centerX - config.width / 2,
      y: centerY - config.height / 2,
      width: config.width,
      height: config.height,
      color: config.color,
      text: config.text,
      zIndex: elements.length
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id));
    setSelectedId(null);
  };

  const addConnection = (from, to) => {
    if (from !== to && !connections.find(c => c.from === from && c.to === to)) {
      setConnections([...connections, { 
        id: Date.now().toString(), 
        from, 
        to,
        label: ''
      }]);
    }
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(0.1, zoom * delta), 3);
      setZoom(newZoom);
    }
  };

  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-bg')) {
      setSelectedId(null);
      
      if (tool === 'pan' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && dragStart) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (isDragging && draggedElement) {
      const dx = e.movementX / zoom;
      const dy = e.movementY / zoom;
      updateElement(draggedElement, {
        x: elements.find(el => el.id === draggedElement).x + dx,
        y: elements.find(el => el.id === draggedElement).y + dy
      });
    } else if (tempConnection) {
      const rect = containerRef.current.getBoundingClientRect();
      setTempConnection({
        ...tempConnection,
        toX: (e.clientX - rect.left - pan.x) / zoom,
        toY: (e.clientY - rect.top - pan.y) / zoom
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedElement(null);
    setDragStart(null);
    setTempConnection(null);
  };

  const handleElementMouseDown = (e, elementId) => {
    e.stopPropagation();
    
    if (tool === 'connect') {
      const element = elements.find(el => el.id === elementId);
      if (!connectingFrom) {
        setConnectingFrom(elementId);
        setTempConnection({
          from: elementId,
          fromX: element.x + element.width / 2,
          fromY: element.y + element.height / 2,
          toX: element.x + element.width / 2,
          toY: element.y + element.height / 2
        });
      } else {
        addConnection(connectingFrom, elementId);
        setConnectingFrom(null);
        setTempConnection(null);
      }
    } else if (tool === 'select') {
      setSelectedId(elementId);
      setIsDragging(true);
      setDraggedElement(elementId);
    }
  };

  const getConnectionPoints = (element) => {
    return {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2
    };
  };

  const renderElement = (element) => {
    const isSelected = selectedId === element.id;
    const style = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      cursor: tool === 'select' ? 'move' : 'pointer',
      zIndex: element.zIndex || 0
    };

    const commonClasses = `border-2 ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'} transition-all`;

    if (element.type === 'sticky') {
      return (
        <div
          key={element.id}
          style={{ ...style, backgroundColor: element.color }}
          className={`${commonClasses} shadow-md p-4 font-handwriting`}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        >
          <textarea
            value={element.text}
            onChange={(e) => updateElement(element.id, { text: e.target.value })}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-800 text-sm"
            style={{ fontFamily: 'Arial, sans-serif' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          style={style}
          className={`${commonClasses} bg-white p-4`}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        >
          <textarea
            value={element.text}
            onChange={(e) => updateElement(element.id, { text: e.target.value })}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-700"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    if (element.type === 'frame') {
      return (
        <div
          key={element.id}
          style={{ ...style, backgroundColor: element.color }}
          className={`${commonClasses} border-dashed rounded-lg`}
          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        >
          <div className="p-2">
            <input
              value={element.text}
              onChange={(e) => updateElement(element.id, { text: e.target.value })}
              className="bg-transparent border-none outline-none font-semibold text-gray-700"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      );
    }

    return (
      <svg
        key={element.id}
        style={style}
        viewBox={`0 0 ${element.width} ${element.height}`}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
      >
        {element.type === 'rect' && (
          <rect
            width={element.width}
            height={element.height}
            fill={element.color}
            stroke={isSelected ? '#3b82f6' : '#fff'}
            strokeWidth={isSelected ? 4 : 2}
            rx={8}
          />
        )}
        
        {element.type === 'circle' && (
          <circle
            cx={element.width / 2}
            cy={element.height / 2}
            r={element.width / 2 - 5}
            fill={element.color}
            stroke={isSelected ? '#3b82f6' : '#fff'}
            strokeWidth={isSelected ? 4 : 2}
          />
        )}
        
        {element.type === 'diamond' && (
          <path
            d={`M ${element.width / 2} 5 L ${element.width - 5} ${element.height / 2} L ${element.width / 2} ${element.height - 5} L 5 ${element.height / 2} Z`}
            fill={element.color}
            stroke={isSelected ? '#3b82f6' : '#fff'}
            strokeWidth={isSelected ? 4 : 2}
          />
        )}
        
        <text
          x={element.width / 2}
          y={element.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="14"
          fontWeight="600"
        >
          {element.text}
        </text>
      </svg>
    );
  };

  const renderConnection = (conn) => {
    const fromEl = elements.find(el => el.id === conn.from);
    const toEl = elements.find(el => el.id === conn.to);
    if (!fromEl || !toEl) return null;

    const from = getConnectionPoints(fromEl);
    const to = getConnectionPoints(toEl);

    return (
      <g key={conn.id}>
        <defs>
          <marker
            id={`arrow-${conn.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
          </marker>
        </defs>
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#64748b"
          strokeWidth="2"
          markerEnd={`url(#arrow-${conn.id})`}
        />
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={tool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('select')}
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          
          <Button
            variant={tool === 'pan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pan')}
          >
            <Hand className="w-4 h-4" />
          </Button>
          
          <Button
            variant={tool === 'connect' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setTool('connect'); setConnectingFrom(null); }}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <Button variant="outline" size="sm" onClick={() => addElement('sticky')}>
            <StickyNote className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Nota</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('rect')}>
            <Square className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Forma</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('text')}>
            <Type className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Texto</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('frame')}>
            <FrameIcon className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Frame</span>
          </Button>
          
          {selectedId && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteElement(selectedId)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.1, zoom - 0.25))}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-14 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : tool === 'pan' ? 'grab' : 'default' }}
      >
        <div
          ref={canvasRef}
          className="canvas-bg absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            width: '10000px',
            height: '10000px'
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {connections.map(renderConnection)}
            {tempConnection && (
              <line
                x1={tempConnection.fromX}
                y1={tempConnection.fromY}
                x2={tempConnection.toX}
                y2={tempConnection.toY}
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>
          
          {elements.map(renderElement)}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedId && (
        <div className="bg-white border-t p-4">
          <div className="max-w-md flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Cor:</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: color,
                    borderColor: elements.find(el => el.id === selectedId)?.color === color ? '#000' : '#ccc'
                  }}
                  onClick={() => updateElement(selectedId, { color })}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}