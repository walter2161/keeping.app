import React, { useState, useRef, useCallback } from 'react';
import { 
  Square, Circle, Diamond, ArrowRight, Trash2, 
  Hand, MousePointer, Type, StickyNote,
  Frame as FrameIcon, Plus, Minus, Move
} from 'lucide-react';
import { Button } from "@/components/ui/button";

const COLORS = ['#fef08a', '#fed7aa', '#fecaca', '#ddd6fe', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#ffffff'];

export default function FluxMap({ data, onChange }) {
  const [elements, setElements] = useState(data?.elements || []);
  const [connections, setConnections] = useState(data?.connections || []);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState({ active: false, type: null, startX: 0, startY: 0, elementStart: null });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [tempLine, setTempLine] = useState(null);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const updateData = useCallback((newElements, newConnections) => {
    setElements(newElements);
    setConnections(newConnections);
    if (onChange) {
      onChange({ elements: newElements, connections: newConnections });
    }
  }, [onChange]);

  const addElement = (type) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = (rect.width / 2 - pan.x) / zoom;
    const centerY = (rect.height / 2 - pan.y) / zoom;

    const configs = {
      sticky: { width: 200, height: 200, color: COLORS[0], text: 'Nova nota' },
      rect: { width: 180, height: 100, color: '#3b82f6', text: 'Processo' },
      circle: { width: 120, height: 120, color: '#10b981', text: 'Início/Fim' },
      diamond: { width: 160, height: 120, color: '#f59e0b', text: 'Decisão?' },
      text: { width: 300, height: 150, color: '#ffffff', text: 'Texto livre...' },
      frame: { width: 600, height: 400, color: '#f3f4f6', text: 'Área / Seção' }
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
    
    updateData([...elements, newElement], connections);
  };

  const getElementsInFrame = useCallback((frameId) => {
    const frame = elements.find(el => el.id === frameId);
    if (!frame || frame.type !== 'frame') return [];
    
    return elements.filter(el => {
      if (el.id === frameId || el.type === 'frame') return false;
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      return centerX >= frame.x && centerX <= frame.x + frame.width &&
             centerY >= frame.y && centerY <= frame.y + frame.height;
    });
  }, [elements]);

  const updateElement = (id, updates) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    
    // Se moveu um frame, mover elementos dentro dele
    const element = elements.find(el => el.id === id);
    if (element && element.type === 'frame' && (updates.x !== undefined || updates.y !== undefined)) {
      const dx = (updates.x || element.x) - element.x;
      const dy = (updates.y || element.y) - element.y;
      
      const childElements = getElementsInFrame(id);
      childElements.forEach(child => {
        const childIndex = newElements.findIndex(el => el.id === child.id);
        if (childIndex !== -1) {
          newElements[childIndex] = {
            ...newElements[childIndex],
            x: newElements[childIndex].x + dx,
            y: newElements[childIndex].y + dy
          };
        }
      });
    }
    
    updateData(newElements, connections);
  };

  const deleteElement = () => {
    if (!selectedId) return;
    const newElements = elements.filter(el => el.id !== selectedId);
    const newConnections = connections.filter(conn => conn.from !== selectedId && conn.to !== selectedId);
    updateData(newElements, newConnections);
    setSelectedId(null);
  };

  const handleElementMouseDown = (e, element) => {
    e.stopPropagation();
    
    setSelectedId(element.id);
    
    if (tool === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(element.id);
        setTempLine({
          fromX: element.x + element.width / 2,
          fromY: element.y + element.height / 2,
          toX: element.x + element.width / 2,
          toY: element.y + element.height / 2
        });
      } else {
        if (connectingFrom !== element.id) {
          const newConn = {
            id: Date.now().toString(),
            from: connectingFrom,
            to: element.id,
            label: ''
          };
          updateData(elements, [...connections, newConn]);
        }
        setConnectingFrom(null);
        setTempLine(null);
        setTool('select');
      }
    } else if (tool === 'select') {
      setDragState({
        active: true,
        type: 'element',
        startX: e.clientX,
        startY: e.clientY,
        elementStart: { x: element.x, y: element.y },
        elementId: element.id
      });
    }
  };

  const handleMouseDown = (e) => {
    if (e.target !== containerRef.current && e.target !== canvasRef.current) return;
    
    if (tool === 'pan') {
      setDragState({
        active: true,
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        panStart: { ...pan }
      });
      return;
    }

    setSelectedId(null);
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempLine(null);
    }
  };

  const handleMouseMove = (e) => {
    if (dragState.active) {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.type === 'pan') {
        setPan({
          x: dragState.panStart.x + dx,
          y: dragState.panStart.y + dy
        });
      } else if (dragState.type === 'element') {
        const newX = dragState.elementStart.x + dx / zoom;
        const newY = dragState.elementStart.y + dy / zoom;
        updateElement(dragState.elementId, { x: newX, y: newY });
      }
    } else if (tempLine) {
      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      setTempLine({ ...tempLine, toX: canvasX, toY: canvasY });
    }
  };

  const handleMouseUp = () => {
    setDragState({ active: false, type: null, startX: 0, startY: 0, elementStart: null });
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(0.1, zoom * delta), 3);
      setZoom(newZoom);
    }
  };

  const renderElement = (element) => {
    const isSelected = selectedId === element.id;
    const style = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      cursor: tool === 'select' ? 'move' : tool === 'connect' ? 'crosshair' : 'default',
      zIndex: element.zIndex || 0,
      pointerEvents: 'auto'
    };

    if (element.type === 'sticky') {
      return (
        <div
          key={element.id}
          style={{ ...style, backgroundColor: element.color }}
          className={`shadow-md p-3 rounded border-2 ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        >
          <textarea
            value={element.text}
            onChange={(e) => updateElement(element.id, { text: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm text-gray-800"
            style={{ pointerEvents: 'auto' }}
          />
        </div>
      );
    }

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          style={{ ...style, backgroundColor: element.color }}
          className={`p-3 rounded border-2 ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        >
          <textarea
            value={element.text}
            onChange={(e) => updateElement(element.id, { text: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-sm"
            style={{ pointerEvents: 'auto' }}
          />
        </div>
      );
    }

    if (element.type === 'frame') {
      const childrenCount = getElementsInFrame(element.id).length;
      return (
        <div
          key={element.id}
          style={{ ...style, backgroundColor: element.color }}
          className={`rounded-lg border-2 border-dashed ${isSelected ? 'border-blue-500 border-4' : 'border-gray-400'} transition-all`}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
        >
          <div className="m-2 flex items-center justify-between" onMouseDown={(e) => e.stopPropagation()}>
            <input
              value={element.text}
              onChange={(e) => updateElement(element.id, { text: e.target.value })}
              onMouseDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none outline-none font-semibold text-gray-700 flex-1"
              style={{ pointerEvents: 'auto' }}
            />
            {childrenCount > 0 && (
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600 font-medium">
                {childrenCount} {childrenCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
        </div>
      );
    }

    // SVG shapes
    return (
      <svg
        key={element.id}
        style={style}
        viewBox={`0 0 ${element.width} ${element.height}`}
        onMouseDown={(e) => handleElementMouseDown(e, element)}
      >
        {element.type === 'rect' && (
          <rect
            width={element.width}
            height={element.height}
            fill={element.color}
            stroke={isSelected ? '#3b82f6' : '#fff'}
            strokeWidth={isSelected ? 3 : 2}
            rx={8}
          />
        )}
        
        {element.type === 'circle' && (
          <circle
            cx={element.width / 2}
            cy={element.height / 2}
            r={Math.min(element.width, element.height) / 2 - 5}
            fill={element.color}
            stroke={isSelected ? '#3b82f6' : '#fff'}
            strokeWidth={isSelected ? 3 : 2}
          />
        )}
        
        {element.type === 'diamond' && (
          <path
            d={`M ${element.width / 2} 5 L ${element.width - 5} ${element.height / 2} L ${element.width / 2} ${element.height - 5} L 5 ${element.height / 2} Z`}
            fill={element.color}
            stroke={isSelected ? '#3b82f6' : '#fff'}
            strokeWidth={isSelected ? 3 : 2}
          />
        )}
        
        <text
          x={element.width / 2}
          y={element.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="13"
          fontWeight="600"
          pointerEvents="none"
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

    const fromX = fromEl.x + fromEl.width / 2;
    const fromY = fromEl.y + fromEl.height / 2;
    const toX = toEl.x + toEl.width / 2;
    const toY = toEl.y + toEl.height / 2;

    return (
      <g key={conn.id}>
        <defs>
          <marker
            id={`arrow-${conn.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
          </marker>
        </defs>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="#64748b"
          strokeWidth="2"
          markerEnd={`url(#arrow-${conn.id})`}
        />
        {conn.label && (
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2}
            textAnchor="middle"
            fill="#374151"
            fontSize="12"
            fontWeight="600"
          >
            {conn.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between gap-3 flex-wrap shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={tool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setTool('select'); setConnectingFrom(null); setTempLine(null); }}
          >
            <MousePointer className="w-4 h-4 mr-1" />
            Selecionar
          </Button>
          
          <Button
            variant={tool === 'pan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setTool('pan'); setConnectingFrom(null); setTempLine(null); }}
          >
            <Hand className="w-4 h-4 mr-1" />
            Mover
          </Button>
          
          <Button
            variant={tool === 'connect' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setTool('connect'); setConnectingFrom(null); setTempLine(null); }}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Conectar
          </Button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <Button variant="outline" size="sm" onClick={() => addElement('sticky')}>
            <StickyNote className="w-4 h-4 mr-1" />
            Nota
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('rect')}>
            <Square className="w-4 h-4 mr-1" />
            Retângulo
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('circle')}>
            <Circle className="w-4 h-4 mr-1" />
            Círculo
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('diamond')}>
            <Diamond className="w-4 h-4 mr-1" />
            Decisão
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('text')}>
            <Type className="w-4 h-4 mr-1" />
            Texto
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => addElement('frame')}>
            <FrameIcon className="w-4 h-4 mr-1" />
            Frame
          </Button>
          
          {selectedId && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteElement}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.1, zoom - 0.2))}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(3, zoom + 0.2))}>
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
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: dragState.active && dragState.type === 'pan' ? 'grabbing' : tool === 'pan' ? 'grab' : 'default',
          touchAction: 'none'
        }}
      >
        <div
          ref={canvasRef}
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '5000px',
            height: '5000px',
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0',
            pointerEvents: 'none'
          }}
        >
          {/* Connections layer */}
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
            {tempLine && (
              <line
                x1={tempLine.fromX}
                y1={tempLine.fromY}
                x2={tempLine.toX}
                y2={tempLine.toY}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>
          
          {/* Elements layer */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {elements
              .sort((a, b) => {
                // Frames sempre atrás
                if (a.type === 'frame' && b.type !== 'frame') return -1;
                if (b.type === 'frame' && a.type !== 'frame') return 1;
                return (a.zIndex || 0) - (b.zIndex || 0);
              })
              .map(renderElement)}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedId && (
        <div className="bg-white border-t p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Cor:</span>
            <div className="flex gap-2">
              {COLORS.map(color => {
                const el = elements.find(e => e.id === selectedId);
                return (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                    style={{ 
                      backgroundColor: color,
                      borderColor: el?.color === color ? '#3b82f6' : '#d1d5db'
                    }}
                    onClick={() => updateElement(selectedId, { color })}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}