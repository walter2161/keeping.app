import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Type, Image as ImageIcon, 
  Play, X, Bold, Italic, Underline, Palette, Maximize, Upload
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
  const slideRef = useRef(null);

  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setSlides(parsed.slides || [createEmptySlide()]);
      } catch (e) {
        setSlides([createEmptySlide()]);
      }
    } else {
      setSlides([createEmptySlide()]);
    }
  }, [value]);

  const createEmptySlide = () => ({
    background: '#ffffff',
    elements: []
  });

  const handleUpdate = (newSlides) => {
    setSlides(newSlides);
    onChange(JSON.stringify({ slides: newSlides }));
  };

  const addSlide = () => {
    const newSlides = [...slides, createEmptySlide()];
    handleUpdate(newSlides);
    setCurrentSlide(newSlides.length - 1);
  };

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
    
    const deltaX = e.clientX - dragging.startX;
    const deltaY = e.clientY - dragging.startY;
    
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

  const selectedEl = slides[currentSlide]?.elements.find(el => el.id === selectedElement);

  if (presentationMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={() => setPresentationMode(false)}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <div 
            className="w-full h-full max-w-7xl max-h-[90vh] rounded-lg shadow-2xl relative"
            style={{
              background: slides[currentSlide].background.startsWith('url') 
                ? slides[currentSlide].background 
                : slides[currentSlide].background,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {slides[currentSlide].elements.map(element => (
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

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
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
      {/* Sidebar */}
      <div className="w-64 bg-white border-r overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Slides</h3>
          <Button size="sm" onClick={addSlide}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg cursor-pointer border-2 transition-all ${
                currentSlide === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    Slide {index + 1}
                  </p>
                  <div 
                    className="w-full aspect-video bg-gray-100 rounded border"
                    style={{
                      background: slide.background.startsWith('url') 
                        ? slide.background 
                        : slide.background,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                </div>
                {slides.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(index);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => addElement('title')}>
              <Type className="w-4 h-4 mr-1" />
              Título
            </Button>
            <Button size="sm" variant="outline" onClick={() => addElement('text')}>
              <Type className="w-4 h-4 mr-1" />
              Texto
            </Button>
            <Button size="sm" variant="outline" onClick={() => addElement('image')}>
              <ImageIcon className="w-4 h-4 mr-1" />
              Imagem
            </Button>
          </div>

          {selectedEl && (
            <div className="flex items-center gap-3 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
              {(selectedEl.type === 'text' || selectedEl.type === 'title') && (
                <>
                  <Input
                    type="number"
                    value={selectedEl.fontSize}
                    onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                    className="w-16 h-8"
                    min="8"
                    max="120"
                  />
                  <Button
                    size="icon"
                    variant={selectedEl.fontWeight === 'bold' ? 'default' : 'outline'}
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { 
                      fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' 
                    })}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={selectedEl.fontStyle === 'italic' ? 'default' : 'outline'}
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { 
                      fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' 
                    })}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={selectedEl.textDecoration === 'underline' ? 'default' : 'outline'}
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
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </>
              )}
              {selectedEl.type === 'image' && (
                <Button size="sm" onClick={() => handleImageUpload(selectedEl.id)}>
                  <Upload className="w-4 h-4 mr-1" />
                  Trocar Imagem
                </Button>
              )}
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={() => deleteElement(selectedEl.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBackgroundUpload} disabled={uploadingBg}>
              <Palette className="w-4 h-4 mr-1" />
              {uploadingBg ? 'Enviando...' : 'Fundo'}
            </Button>
            <input
              type="color"
              value={slides[currentSlide].background.startsWith('#') ? slides[currentSlide].background : '#ffffff'}
              onChange={(e) => {
                const newSlides = [...slides];
                newSlides[currentSlide].background = e.target.value;
                handleUpdate(newSlides);
              }}
              className="w-8 h-8 rounded cursor-pointer"
              title="Cor de fundo"
            />
            <Button size="sm" variant="default" onClick={() => setPresentationMode(true)}>
              <Play className="w-4 h-4 mr-1" />
              Apresentar
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-gray-600 px-4">
            Slide {currentSlide + 1} de {slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-gray-100 flex items-center justify-center">
          <div
            ref={slideRef}
            className="bg-white shadow-2xl relative"
            style={{
              width: '1200px',
              height: '675px',
              background: slides[currentSlide].background.startsWith('url') 
                ? slides[currentSlide].background 
                : slides[currentSlide].background,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onClick={() => setSelectedElement(null)}
          >
            {slides[currentSlide].elements.map(element => (
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
    </div>
  );
}