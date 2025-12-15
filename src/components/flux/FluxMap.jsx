import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, Square, Circle, Diamond, ArrowRight, Trash2, 
  ZoomIn, ZoomOut, Move, MousePointer, Type
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const nodeTypes = {
  process: { 
    label: 'Processo', 
    shape: 'rect', 
    color: '#3b82f6',
    icon: Square 
  },
  decision: { 
    label: 'Decisão', 
    shape: 'diamond', 
    color: '#f59e0b',
    icon: Diamond 
  },
  start: { 
    label: 'Início', 
    shape: 'circle', 
    color: '#10b981',
    icon: Circle 
  },
  end: { 
    label: 'Fim', 
    shape: 'circle', 
    color: '#ef4444',
    icon: Circle 
  },
  note: { 
    label: 'Nota', 
    shape: 'rect', 
    color: '#8b5cf6',
    icon: Type 
  }
};

export default function FluxMap({ data, onChange }) {
  const [nodes, setNodes] = useState(data?.nodes || []);
  const [connections, setConnections] = useState(data?.connections || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (onChange) {
      onChange({ nodes, connections });
    }
  }, [nodes, connections]);

  const addNode = (type) => {
    const newNode = {
      id: Date.now().toString(),
      type,
      x: (window.innerWidth / 2 - pan.x) / zoom - 75,
      y: (window.innerHeight / 2 - pan.y) / zoom - 40,
      width: 150,
      height: 80,
      text: nodeTypes[type].label
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (id, updates) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (id) => {
    setNodes(nodes.filter(node => node.id !== id));
    setConnections(connections.filter(conn => 
      conn.from !== id && conn.to !== id
    ));
    setSelectedNode(null);
  };

  const addConnection = (from, to) => {
    if (from !== to && !connections.find(c => c.from === from && c.to === to)) {
      setConnections([...connections, { id: Date.now().toString(), from, to }]);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      if (tool === 'pan') {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && tool === 'pan') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (tool === 'select') {
      setSelectedNode(nodeId);
    } else if (tool === 'connect') {
      if (!connectingFrom) {
        setConnectingFrom(nodeId);
      } else {
        addConnection(connectingFrom, nodeId);
        setConnectingFrom(null);
      }
    }
  };

  const handleNodeDrag = (nodeId, dx, dy) => {
    updateNode(nodeId, {
      x: nodes.find(n => n.id === nodeId).x + dx / zoom,
      y: nodes.find(n => n.id === nodeId).y + dy / zoom
    });
  };

  const renderNode = (node) => {
    const config = nodeTypes[node.type];
    const isSelected = selectedNode === node.id;
    
    return (
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
      >
        {config.shape === 'rect' && (
          <rect
            width={node.width}
            height={node.height}
            fill={config.color}
            stroke={isSelected ? '#000' : '#fff'}
            strokeWidth={isSelected ? 3 : 2}
            rx={8}
          />
        )}
        
        {config.shape === 'circle' && (
          <circle
            cx={node.width / 2}
            cy={node.height / 2}
            r={40}
            fill={config.color}
            stroke={isSelected ? '#000' : '#fff'}
            strokeWidth={isSelected ? 3 : 2}
          />
        )}
        
        {config.shape === 'diamond' && (
          <path
            d={`M ${node.width / 2} 0 L ${node.width} ${node.height / 2} L ${node.width / 2} ${node.height} L 0 ${node.height / 2} Z`}
            fill={config.color}
            stroke={isSelected ? '#000' : '#fff'}
            strokeWidth={isSelected ? 3 : 2}
          />
        )}
        
        <text
          x={node.width / 2}
          y={node.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="14"
          fontWeight="600"
          pointerEvents="none"
        >
          {node.text}
        </text>
      </g>
    );
  };

  const renderConnection = (conn) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return null;
    
    const x1 = fromNode.x + fromNode.width / 2;
    const y1 = fromNode.y + fromNode.height / 2;
    const x2 = toNode.x + toNode.width / 2;
    const y2 = toNode.y + toNode.height / 2;
    
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowSize = 10;
    
    return (
      <g key={conn.id}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-3">
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
            <Move className="w-4 h-4" />
          </Button>
          
          <Button
            variant={tool === 'connect' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setTool('connect'); setConnectingFrom(null); }}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <Select value="process" onValueChange={addNode}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Adicionar nó" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(nodeTypes).map(([key, type]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" style={{ color: type.color }} />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedNode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteNode(selectedNode)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-hidden relative"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{ cursor: tool === 'pan' ? 'grab' : 'default' }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="#64748b"
              />
            </marker>
          </defs>
          
          {connections.map(renderConnection)}
          {nodes.map(renderNode)}
        </svg>
      </div>

      {/* Node Properties */}
      {selectedNode && (
        <div className="bg-white border-t p-4">
          <div className="max-w-md">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Texto do Nó
            </label>
            <input
              type="text"
              value={nodes.find(n => n.id === selectedNode)?.text || ''}
              onChange={(e) => updateNode(selectedNode, { text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}