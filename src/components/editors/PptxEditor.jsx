import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Type, Image as ImageIcon, 
  Play, X, Bold, Italic, Underline, Upload, ZoomIn, ZoomOut, Palette, Square, Circle, Minus, Download
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PptxGenJS from 'pptxgenjs';

const PptxEditor = forwardRef(({ value, onChange, fileName = 'apresentacao' }, ref) => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState(null);
  
  const canvasRef = useRef(null);
  const slideRef = useRef(null);

  useImperativeHandle(ref, () => ({
    exportPptx: handleExportPptx
  }));

  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        const loadedSlides = Array.isArray(parsed.slides) ? parsed.slides : [createEmptySlide()];
        setSlides(loadedSlides.length > 0 ? loadedSlides : [createEmptySlide()]);
      } catch (e) {
        setSlides([createEmptySlide()]);
      }
    } else {
      setSlides([createEmptySlide()]);
    }
  }, [value]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [presentationMode]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.2, Math.min(2, prev + delta)));
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const createEmptySlide = () => ({
    background: '#ffffff',
    elements: []
  });

  const handleUpdate = (newSlides) => {
    setSlides(newSlides);
    onChange(JSON.stringify({ slides: newSlides }));
  };

  const addSlide = () => {
    const newSlide = createEmptySlide();
    const newSlides = [...slides, newSlide];
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
      width: type === 'text' ? 400 : type === 'image' ? 400 : type === 'shape' ? 200 : 600,
      height: type === 'text' ? 100 : type === 'image' ? 300 : type === 'shape' ? 200 : 80,
      content: type === 'text' ? 'Digite seu texto' : type === 'title' ? 'Título' : '',
      fontSize: type === 'title' ? 48 : 24,
      fontWeight: type === 'title' ? 'bold' : 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#000000',
      backgroundColor: type === 'shape' ? '#3b82f6' : 'transparent',
      shapeType: type === 'shape' ? 'rectangle' : null,
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
    
    setDragging({
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y
    });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const deltaX = (e.clientX - dragging.startX) / zoom;
      const deltaY = (e.clientY - dragging.startY) / zoom;
      
      updateElement(dragging.elementId, {
        x: dragging.initialX + deltaX,
        y: dragging.initialY + deltaY
      });
    } else if (resizing) {
      const deltaX = (e.clientX - resizing.startX) / zoom;
      const deltaY = (e.clientY - resizing.startY) / zoom;
      
      const newWidth = Math.max(50, resizing.initialWidth + deltaX);
      const newHeight = Math.max(30, resizing.initialHeight + deltaY);
      
      updateElement(resizing.elementId, {
        width: newWidth,
        height: newHeight
      });
    } else if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset({
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
    setIsPanning(false);
  };

  useEffect(() => {
    if (dragging || resizing || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, isPanning, panOffset, panStart, zoom]);

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

  const handleExportPptx = async () => {
    const pptx = new PptxGenJS();
    
    const validSlides = Array.isArray(slides) ? slides : [];
    
    for (const slide of validSlides) {
      const pptxSlide = pptx.addSlide();
      
      // Background
      if (slide.background && slide.background.startsWith('url(')) {
        const imageUrl = slide.background.match(/url\((.*?)\)/)[1];
        pptxSlide.background = { data: imageUrl };
      } else if (slide.background && slide.background.startsWith('#')) {
        pptxSlide.background = { color: slide.background.replace('#', '') };
      }
      
      // Elements
      const elements = Array.isArray(slide.elements) ? slide.elements : [];
      for (const element of elements) {
        const x = element.x / 1200 * 10;
        const y = element.y / 675 * 5.625;
        const w = element.width / 1200 * 10;
        const h = element.height / 675 * 5.625;
        
        if (element.type === 'text' || element.type === 'title') {
          pptxSlide.addText(element.content, {
            x, y, w, h,
            fontSize: element.fontSize,
            bold: element.fontWeight === 'bold',
            italic: element.fontStyle === 'italic',
            underline: element.textDecoration === 'underline',
            color: element.color.replace('#', ''),
            valign: 'top',
            breakLine: true
          });
        } else if (element.type === 'image' && element.imageUrl) {
          pptxSlide.addImage({ data: element.imageUrl, x, y, w, h });
        } else if (element.type === 'shape') {
          pptxSlide.addShape(element.shapeType === 'circle' ? 'ellipse' : 'rect', {
            x, y, w, h,
            fill: { color: element.backgroundColor.replace('#', '') }
          });
          if (element.content) {
            pptxSlide.addText(element.content, {
              x, y, w, h,
              fontSize: element.fontSize,
              bold: element.fontWeight === 'bold',
              color: element.color.replace('#', ''),
              align: 'center',
              valign: 'middle'
            });
          }
        }
      }
    }
    
    const cleanFileName = fileName.replace(/\.(pptx|json)$/i, '');
    await pptx.writeFile({ fileName: `${cleanFileName}.pptx` });
  };



  const currentSlideData = slides[currentSlide];
  const selectedEl = currentSlideData?.elements?.find(el => el.id === selectedElement);

  if (!currentSlideData || !slides.length) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (presentationMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 text-white hover:bg-white/20 z-10"
          onClick={() => setPresentationMode(false)}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <div 
          className="w-[1200px] h-[675px] rounded-lg shadow-2xl relative"
          style={{
            background: currentSlideData.background && currentSlideData.background.startsWith('url') 
              ? currentSlideData.background 
              : (currentSlideData.background || '#ffffff'),
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {currentSlideData.elements.map(element => (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
              }}
            >
              {element.type === 'image' && element.imageUrl && (
                <img 
                  src={element.imageUrl} 
                  alt="" 
                  className="w-full h-full object-contain"
                />
              )}
              {element.type === 'shape' && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: element.backgroundColor,
                    borderRadius: element.shapeType === 'circle' ? '50%' : '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: element.color,
                    fontSize: `${element.fontSize}px`,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textDecoration: element.textDecoration,
                    padding: '8px'
                  }}
                >
                  {element.content}
                </div>
              )}
              {(element.type === 'text' || element.type === 'title') && (
                <div
                  style={{
                    fontSize: `${element.fontSize}px`,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textDecoration: element.textDecoration,
                    color: element.color,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    width: '100%',
                    height: '100%',
                    padding: '2px'
                  }}
                >
                  {element.content}
                </div>
              )}
            </div>
          ))}
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
                    background: slide.background && slide.background.startsWith('url') 
                      ? slide.background 
                      : (slide.background || '#ffffff'),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {slide.elements.map(el => {
                    const scale = 0.15; // Escala fixa para miniaturas (1200px -> ~180px)
                    return (
                      <div
                        key={el.id}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${(el.x / 1200) * 100}%`,
                          top: `${(el.y / 675) * 100}%`,
                          width: `${(el.width / 1200) * 100}%`,
                          height: `${(el.height / 675) * 100}%`,
                        }}
                      >
                        {el.type === 'image' && el.imageUrl && (
                          <img src={el.imageUrl} alt="" className="w-full h-full object-contain" />
                        )}
                        {el.type === 'shape' && (
                          <div
                            className="w-full h-full flex items-center justify-center text-center"
                            style={{
                              backgroundColor: el.backgroundColor,
                              borderRadius: el.shapeType === 'circle' ? '50%' : `${8 * scale}px`,
                              fontSize: `${el.fontSize * scale}px`,
                              fontWeight: el.fontWeight,
                              fontStyle: el.fontStyle,
                              textDecoration: el.textDecoration,
                              color: el.color,
                              overflow: 'hidden',
                              padding: `${4 * scale}px`
                            }}
                          >
                            {el.content}
                          </div>
                        )}
                        {(el.type === 'text' || el.type === 'title') && (
                          <div
                            style={{
                              fontSize: `${el.fontSize * scale}px`,
                              fontWeight: el.fontWeight,
                              fontStyle: el.fontStyle,
                              textDecoration: el.textDecoration,
                              color: el.color,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              padding: `${2 * scale}px`
                            }}
                          >
                            {el.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {slides.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-white hover:bg-red-50"
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
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-2.5 flex items-center gap-3 flex-wrap">
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
          <Button size="sm" variant="ghost" onClick={() => {
            const newSlides = [...slides];
            const newElement = {
              id: Date.now().toString(),
              type: 'shape',
              x: 100,
              y: 100,
              width: 200,
              height: 200,
              content: '',
              fontSize: 24,
              fontWeight: 'normal',
              color: '#ffffff',
              backgroundColor: '#3b82f6',
              shapeType: 'rectangle'
            };
            newSlides[currentSlide].elements.push(newElement);
            handleUpdate(newSlides);
            setSelectedElement(newElement.id);
          }} className="h-8">
            <Square className="w-4 h-4 mr-1.5" />
            Retângulo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => {
            const newSlides = [...slides];
            const newElement = {
              id: Date.now().toString(),
              type: 'shape',
              x: 100,
              y: 100,
              width: 200,
              height: 200,
              content: '',
              fontSize: 24,
              fontWeight: 'normal',
              color: '#ffffff',
              backgroundColor: '#10b981',
              shapeType: 'circle'
            };
            newSlides[currentSlide].elements.push(newElement);
            handleUpdate(newSlides);
            setSelectedElement(newElement.id);
          }} className="h-8">
            <Circle className="w-4 h-4 mr-1.5" />
            Círculo
          </Button>

          <div className="h-6 w-px bg-gray-300" />

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
              {selectedEl.type === 'shape' && (
                <>
                  <Button
                    size="sm"
                    variant={selectedEl.shapeType === 'rectangle' ? 'default' : 'ghost'}
                    className="h-8"
                    onClick={() => updateElement(selectedEl.id, { shapeType: 'rectangle' })}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEl.shapeType === 'circle' ? 'default' : 'ghost'}
                    className="h-8"
                    onClick={() => updateElement(selectedEl.id, { shapeType: 'circle' })}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <input
                    type="color"
                    value={selectedEl.backgroundColor}
                    onChange={(e) => updateElement(selectedEl.id, { backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border"
                    title="Cor de fundo"
                  />
                  <input
                    type="color"
                    value={selectedEl.color}
                    onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border"
                    title="Cor do texto"
                  />
                  <div className="h-6 w-px bg-gray-300" />
                  <Input
                    type="number"
                    value={Math.round(selectedEl.width)}
                    onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                    className="w-16 h-8 text-xs"
                    min="50"
                    placeholder="L"
                  />
                  <Input
                    type="number"
                    value={Math.round(selectedEl.height)}
                    onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                    className="w-16 h-8 text-xs"
                    min="30"
                    placeholder="A"
                  />
                </>
              )}
              {selectedEl.type === 'image' && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => handleImageUpload(selectedEl.id)} className="h-8">
                    <Upload className="w-4 h-4 mr-1.5" />
                    Trocar Imagem
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                  <Input
                    type="number"
                    value={Math.round(selectedEl.width)}
                    onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                    className="w-16 h-8 text-xs"
                    min="50"
                    placeholder="L"
                  />
                  <Input
                    type="number"
                    value={Math.round(selectedEl.height)}
                    onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                    className="w-16 h-8 text-xs"
                    min="30"
                    placeholder="A"
                  />
                </>
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

          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={handleBackgroundUpload} disabled={uploadingBg} className="h-8">
              <Palette className="w-4 h-4 mr-1.5" />
              {uploadingBg ? 'Enviando...' : 'Fundo'}
            </Button>
            <input
              type="color"
              value={currentSlideData.background && currentSlideData.background.startsWith('#') ? currentSlideData.background : '#ffffff'}
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

        {/* Navegação e Zoom */}
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
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-gray-600 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              disabled={zoom >= 2}
              className="h-7 w-7 p-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-gray-200 overflow-hidden relative"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => {
            if (e.target === canvasRef.current && e.button === 0) {
              setIsPanning(true);
              setPanStart({ x: e.clientX, y: e.clientY });
              e.preventDefault();
            }
          }}
          onClick={() => setSelectedElement(null)}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginLeft: '-600px',
              marginTop: '-337.5px'
            }}
          >
            <div
              ref={slideRef}
              className="bg-white shadow-2xl relative"
              style={{
                width: '1200px',
                height: '675px',
                background: currentSlideData.background && currentSlideData.background.startsWith('url') 
                  ? currentSlideData.background 
                  : (currentSlideData.background || '#ffffff'),
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {currentSlideData.elements.map(element => (
                <div
                  key={element.id}
                  onMouseDown={(e) => handleMouseDown(e, element.id)}
                  onMouseEnter={() => setHoveredElement(element.id)}
                  onMouseLeave={() => setHoveredElement(null)}
                  className={`absolute cursor-move group ${
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
                      <>
                        <img 
                          src={element.imageUrl} 
                          alt="" 
                          className="w-full h-full object-contain pointer-events-none"
                        />
                        {(hoveredElement === element.id || selectedElement === element.id) && (
                          <>
                            <button
                              className="absolute top-2 left-2 w-8 h-8 bg-white/90 hover:bg-white rounded shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              style={{ cursor: 'move' }}
                              title="Mover"
                            >
                              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </button>
                            <button
                              className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageUpload(element.id);
                              }}
                              title="Trocar imagem"
                            >
                              <Upload className="w-4 h-4 text-gray-700" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div 
                        className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageUpload(element.id);
                        }}
                      >
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Clique para adicionar</p>
                        </div>
                      </div>
                    )
                  )}
                  {element.type === 'shape' && (
                    <>
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          backgroundColor: element.backgroundColor,
                          borderRadius: element.shapeType === 'circle' ? '50%' : '8px',
                          color: element.color,
                          fontSize: element.fontSize,
                          fontWeight: element.fontWeight,
                          padding: '8px'
                        }}
                      >
                        <Input
                          value={element.content}
                          onChange={(e) => updateElement(element.id, { content: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full border-none bg-transparent text-center focus-visible:ring-0 p-0"
                          style={{
                            color: element.color,
                            fontSize: element.fontSize,
                            fontWeight: element.fontWeight
                          }}
                        />
                      </div>
                      {(hoveredElement === element.id || selectedElement === element.id) && (
                        <button
                          className="absolute top-2 left-2 w-8 h-8 bg-white/90 hover:bg-white rounded shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          style={{ cursor: 'move' }}
                          title="Mover"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                  {(element.type === 'text' || element.type === 'title') && (
                    <>
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
                      {(hoveredElement === element.id || selectedElement === element.id) && (
                        <button
                          className="absolute top-2 left-2 w-8 h-8 bg-white/90 hover:bg-white rounded shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          style={{ cursor: 'move' }}
                          title="Mover"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}

                  {/* Resize Handle */}
                  {selectedElement === element.id && (
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizing({
                          elementId: element.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          initialWidth: element.width,
                          initialHeight: element.height
                        });
                      }}
                    />
                  )}
                  </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PptxEditor;