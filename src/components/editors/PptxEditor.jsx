import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Type, Image as ImageIcon, 
  Play, X, Bold, Italic, Underline, Palette, Maximize, Upload, ZoomIn, ZoomOut, LayoutTemplate
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from '@/api/base44Client';

export default function PptxEditor({ value, onChange }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [showTemplates, setShowTemplates] = useState(false);
  const slideRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        const loadedSlides = parsed.slides || [createEmptySlide()];
        // Garantir que todos os slides têm a estrutura correta
        const normalizedSlides = loadedSlides.map(slide => ({
          background: slide.background || '#ffffff',
          elements: slide.elements || []
        }));
        setSlides(normalizedSlides);
      } catch (e) {
        setSlides([createEmptySlide()]);
      }
    } else {
      setSlides([createEmptySlide()]);
    }
  }, [value]);

  // ESC para sair do modo apresentação
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [presentationMode]);

  const createEmptySlide = () => ({
    background: '#ffffff',
    elements: []
  });

  const handleUpdate = (newSlides) => {
    setSlides(newSlides);
    onChange(JSON.stringify({ slides: newSlides }));
  };

  const addSlide = (template = null) => {
    const newSlide = template ? { ...template } : createEmptySlide();
    const newSlides = [...slides, newSlide];
    handleUpdate(newSlides);
    setCurrentSlide(newSlides.length - 1);
    setShowTemplates(false);
  };

  const slideTemplates = [
    {
      name: 'Título',
      background: '#ffffff',
      elements: [
        { id: '1', type: 'title', x: 100, y: 200, width: 1000, height: 100, content: 'Título Principal', fontSize: 60, fontWeight: 'bold', color: '#1a1a1a', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' },
        { id: '2', type: 'text', x: 100, y: 350, width: 1000, height: 80, content: 'Subtítulo ou descrição', fontSize: 28, fontWeight: 'normal', color: '#666666', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' }
      ]
    },
    {
      name: 'Título e Conteúdo',
      background: '#ffffff',
      elements: [
        { id: '1', type: 'title', x: 60, y: 50, width: 1080, height: 80, content: 'Título', fontSize: 44, fontWeight: 'bold', color: '#1a1a1a', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' },
        { id: '2', type: 'text', x: 60, y: 160, width: 1080, height: 450, content: '• Ponto 1\n• Ponto 2\n• Ponto 3', fontSize: 24, fontWeight: 'normal', color: '#333333', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' }
      ]
    },
    {
      name: 'Duas Colunas',
      background: '#ffffff',
      elements: [
        { id: '1', type: 'title', x: 60, y: 50, width: 1080, height: 70, content: 'Título', fontSize: 44, fontWeight: 'bold', color: '#1a1a1a', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' },
        { id: '2', type: 'text', x: 60, y: 150, width: 500, height: 450, content: 'Coluna esquerda\n\n• Item 1\n• Item 2\n• Item 3', fontSize: 20, fontWeight: 'normal', color: '#333333', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' },
        { id: '3', type: 'text', x: 640, y: 150, width: 500, height: 450, content: 'Coluna direita\n\n• Item A\n• Item B\n• Item C', fontSize: 20, fontWeight: 'normal', color: '#333333', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' }
      ]
    },
    {
      name: 'Título e Imagem',
      background: '#ffffff',
      elements: [
        { id: '1', type: 'title', x: 60, y: 50, width: 1080, height: 70, content: 'Título com Imagem', fontSize: 44, fontWeight: 'bold', color: '#1a1a1a', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' },
        { id: '2', type: 'image', x: 300, y: 150, width: 600, height: 450, content: '', fontSize: 18, fontWeight: 'normal', color: '#000000', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' }
      ]
    },
    {
      name: 'Imagem Grande',
      background: '#ffffff',
      elements: [
        { id: '1', type: 'image', x: 100, y: 50, width: 1000, height: 575, content: '', fontSize: 18, fontWeight: 'normal', color: '#000000', fontStyle: 'normal', textDecoration: 'none', imageUrl: '' }
      ]
    },
    {
      name: 'Vazio',
      background: '#ffffff',
      elements: []
    }
  ];

  const deleteSlide = (index) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    handleUpdate(newSlides);
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
  };

  const addElement = (type) => {
    const newSlides = [...slides];
    const newElement = {
      id: Date.now().toString(),
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 300 : type === 'image' ? 400 : 200,
      height: type === 'text' ? 100 : type === 'image' ? 300 : 50,
      content: type === 'text' ? 'Digite seu texto' : type === 'title' ? 'Título' : '',
      fontSize: type === 'title' ? 48 : 18,
      fontWeight: type === 'title' ? 'bold' : 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#000000',
      imageUrl: ''
    };
    newSlides[currentSlide].elements.push(newElement);
    handleUpdate(newSlides);
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId, updates) => {
    const newSlides = [...slides];
    const element = newSlides[currentSlide].elements.find(el => el.id === elementId);
    if (element) {
      Object.assign(element, updates);
      handleUpdate(newSlides);
    }
  };

  const deleteElement = (elementId) => {
    const newSlides = [...slides];
    newSlides[currentSlide].elements = newSlides[currentSlide].elements.filter(el => el.id !== elementId);
    handleUpdate(newSlides);
    setSelectedElement(null);
  };

  const handleMouseDown = (e, elementId) => {
    if (presentationMode) return;
    e.stopPropagation();
    setSelectedElement(elementId);
    
    const element = slides[currentSlide].elements.find(el => el.id === elementId);
    const rect = e.currentTarget.getBoundingClientRect();
    const slideRect = slideRef.current.getBoundingClientRect();
    
    setDragging({
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
      slideLeft: slideRect.left,
      slideTop: slideRect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    const deltaX = (e.clientX - dragging.startX) / zoom;
    const deltaY = (e.clientY - dragging.startY) / zoom;
    
    updateElement(dragging.elementId, {
      x: dragging.initialX + deltaX,
      y: dragging.initialY + deltaY
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging]);

  const handleImageUpload = async (elementId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateElement(elementId, { imageUrl: file_url });
      } catch (error) {
        alert('Erro ao fazer upload da imagem');
      }
    };
    input.click();
  };

  const handleBackgroundUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setUploadingBg(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const newSlides = [...slides];
        newSlides[currentSlide].background = `url(${file_url})`;
        handleUpdate(newSlides);
      } catch (error) {
        alert('Erro ao fazer upload da imagem de fundo');
      } finally {
        setUploadingBg(false);
      }
    };
    input.click();
  };

  const currentSlideData = slides[currentSlide];
  const selectedEl = currentSlideData?.elements?.find(el => el.id === selectedElement);

  if (!currentSlideData || !slides.length) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (presentationMode) {
    return (
      <div 
        className="fixed inset-0 bg-black z-50 overflow-auto"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={(e) => {
          setIsPanning(true);
          setPanStart({ x: e.clientX, y: e.clientY });
          setScrollPos({ x: e.currentTarget.scrollLeft, y: e.currentTarget.scrollTop });
          e.preventDefault();
        }}
        onMouseMove={(e) => {
          if (isPanning) {
            const dx = panStart.x - e.clientX;
            const dy = panStart.y - e.clientY;
            e.currentTarget.scrollLeft = scrollPos.x + dx;
            e.currentTarget.scrollTop = scrollPos.y + dy;
          }
        }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
      >
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 text-white hover:bg-white/20 z-10"
          onClick={() => setPresentationMode(false)}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <div className="relative p-[50vh] inline-block">
          <div 
            className="w-[1200px] h-[675px] rounded-lg shadow-2xl relative"
            style={{
              background: currentSlideData.background.startsWith('url') 
                ? currentSlideData.background 
                : currentSlideData.background,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {currentSlideData.elements.map(element => (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: `${(element.x / 1200) * 100}%`,
                  top: `${(element.y / 675) * 100}%`,
                  width: `${(element.width / 1200) * 100}%`,
                  height: `${(element.height / 675) * 100}%`,
                }}
              >
                {element.type === 'image' && element.imageUrl && (
                  <img 
                    src={element.imageUrl} 
                    alt="" 
                    className="w-full h-full object-contain"
                  />
                )}
                {(element.type === 'text' || element.type === 'title') && (
                  <div
                    style={{
                      fontSize: `${(element.fontSize / 1200) * 100}%`,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textDecoration: element.textDecoration,
                      color: element.color,
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                  >
                    {element.content}
                  </div>
                )}
              </div>
            ))}
            </div>
            </div>

        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white bg-black/50 px-4 py-2 rounded-md">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90"
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar de Slides */}
      <div className="w-56 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700">Slides</h3>
          <Button size="sm" variant="ghost" onClick={addSlide} className="h-7 w-7 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`relative group rounded cursor-pointer border-2 transition-all ${
                currentSlide === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-1 font-medium">
                  {index + 1}
                </div>
                <div 
                  className="w-full aspect-video bg-gray-100 rounded border border-gray-200 relative overflow-hidden"
                  style={{
                    background: slide.background.startsWith('url') 
                      ? slide.background 
                      : slide.background,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {slide.elements.map(el => (
                    <div
                      key={el.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(el.x / 1200) * 100}%`,
                        top: `${(el.y / 675) * 100}%`,
                        width: `${(el.width / 1200) * 100}%`,
                        height: `${(el.height / 675) * 100}%`,
                        fontSize: `${el.fontSize * 0.08}px`,
                        fontWeight: el.fontWeight,
                        color: el.color,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {el.type === 'image' && el.imageUrl && (
                        <img src={el.imageUrl} alt="" className="w-full h-full object-contain" />
                      )}
                      {(el.type === 'text' || el.type === 'title') && el.content}
                    </div>
                  ))}
                </div>
              </div>
              {slides.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-white hover:bg-red-50 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSlide(index);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar Superior */}
        <div className="bg-white border-b px-4 py-2.5 flex items-center gap-4 flex-wrap">
          {/* Ferramentas de Inserção */}
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowTemplates(!showTemplates)} 
              className="h-8"
            >
              <LayoutTemplate className="w-4 h-4 mr-1.5" />
              Layout
            </Button>
            <Button size="sm" variant="ghost" onClick={() => addElement('title')} className="h-8">
              <Type className="w-4 h-4 mr-1.5" />
              Título
            </Button>
            <Button size="sm" variant="ghost" onClick={() => addElement('text')} className="h-8">
              <Type className="w-4 h-4 mr-1.5" />
              Texto
            </Button>
            <Button size="sm" variant="ghost" onClick={() => addElement('image')} className="h-8">
              <ImageIcon className="w-4 h-4 mr-1.5" />
              Imagem
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Ferramentas de Formatação do Elemento Selecionado */}
          {selectedEl && (
            <div className="flex items-center gap-1.5">
              {(selectedEl.type === 'text' || selectedEl.type === 'title') && (
                <>
                  <Input
                    type="number"
                    value={selectedEl.fontSize}
                    onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                    className="w-14 h-8 text-xs"
                    min="8"
                    max="120"
                  />
                  <Button
                    size="icon"
                    variant={selectedEl.fontWeight === 'bold' ? 'default' : 'ghost'}
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { 
                      fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' 
                    })}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={selectedEl.fontStyle === 'italic' ? 'default' : 'ghost'}
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { 
                      fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' 
                    })}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={selectedEl.textDecoration === 'underline' ? 'default' : 'ghost'}
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { 
                      textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline' 
                    })}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <input
                    type="color"
                    value={selectedEl.color}
                    onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                </>
              )}
              {selectedEl.type === 'image' && (
                <Button size="sm" variant="ghost" onClick={() => handleImageUpload(selectedEl.id)} className="h-8">
                  <Upload className="w-4 h-4 mr-1.5" />
                  Trocar
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => deleteElement(selectedEl.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex-1" />

          {/* Controles de Fundo e Apresentação */}
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={handleBackgroundUpload} disabled={uploadingBg} className="h-8">
              <Palette className="w-4 h-4 mr-1.5" />
              {uploadingBg ? 'Enviando...' : 'Fundo'}
            </Button>
            <input
              type="color"
              value={currentSlideData.background.startsWith('#') ? currentSlideData.background : '#ffffff'}
              onChange={(e) => {
                const newSlides = [...slides];
                newSlides[currentSlide].background = e.target.value;
                handleUpdate(newSlides);
              }}
              className="w-8 h-8 rounded cursor-pointer border"
              title="Cor de fundo"
            />
            <div className="h-6 w-px bg-gray-300 mx-1" />
            <Button size="sm" variant="default" onClick={() => setPresentationMode(true)} className="h-8 bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-1.5" />
              Apresentar
            </Button>
          </div>
        </div>

        {/* Barra de Navegação e Zoom */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="h-7"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-gray-600 min-w-[80px] text-center">
              {currentSlide + 1} / {slides.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="h-7"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
              disabled={zoom <= 0.2}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-gray-600 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              disabled={zoom >= 1.5}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Canvas do Slide */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => {
            if (e.button === 0 && (e.target === canvasRef.current || !slideRef.current.contains(e.target))) {
              setIsPanning(true);
              setPanStart({ x: e.clientX, y: e.clientY });
              setScrollPos({ x: canvasRef.current.scrollLeft, y: canvasRef.current.scrollTop });
              e.preventDefault();
            }
          }}
          onMouseMove={(e) => {
            if (isPanning && canvasRef.current) {
              const dx = e.clientX - panStart.x;
              const dy = e.clientY - panStart.y;
              canvasRef.current.scrollLeft = scrollPos.x - dx;
              canvasRef.current.scrollTop = scrollPos.y - dy;
            }
          }}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => setIsPanning(false)}
        >
            <div
              ref={slideRef}
              className="bg-white shadow-xl relative m-8"
              style={{
                width: '1200px',
                height: '675px',
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
               background: currentSlideData.background.startsWith('url') 
                 ? currentSlideData.background 
                 : currentSlideData.background,
               backgroundSize: 'cover',
               backgroundPosition: 'center'
              }}
              onClick={() => setSelectedElement(null)}
              >
            {currentSlideData.elements.map(element => (
              <div
                key={element.id}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                className={`absolute cursor-move ${
                  selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                }}
              >
                {element.type === 'image' && (
                  element.imageUrl ? (
                    <img 
                      src={element.imageUrl} 
                      alt="" 
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div 
                      className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageUpload(element.id);
                      }}
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )
                )}
                {(element.type === 'text' || element.type === 'title') && (
                  <Textarea
                    value={element.content}
                    onChange={(e) => updateElement(element.id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-full resize-none border-none bg-transparent focus-visible:ring-0 p-2"
                    style={{
                      fontSize: element.fontSize,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textDecoration: element.textDecoration,
                      color: element.color
                    }}
                  />
                )}
              </div>
            ))}
            </div>
            </div>
            </div>

            {/* Dialog de Templates */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Escolha um Layout</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowTemplates(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {slideTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all"
                    onClick={() => addSlide(template)}
                  >
                    <div 
                      className="w-full aspect-video bg-gray-50 relative"
                      style={{
                        background: template.background,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {template.elements.map(el => (
                        <div
                          key={el.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: `${(el.x / 1200) * 100}%`,
                            top: `${(el.y / 675) * 100}%`,
                            width: `${(el.width / 1200) * 100}%`,
                            height: `${(el.height / 675) * 100}%`,
                            fontSize: `${el.fontSize * 0.08}px`,
                            fontWeight: el.fontWeight,
                            color: el.color,
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.2'
                          }}
                        >
                          {el.type === 'image' && !el.imageUrl && (
                            <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-100">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          {(el.type === 'text' || el.type === 'title') && el.content}
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center text-sm font-medium bg-white">
                      {template.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}