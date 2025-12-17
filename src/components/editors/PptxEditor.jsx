import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronLeft, ChevronRight, LayoutTemplate, Image as ImageIcon, Type, AlignLeft, Columns2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from '@/api/base44Client';

const LAYOUTS = {
  title: { 
    name: 'Título', 
    icon: Type,
    template: { layout: 'title', title: '', subtitle: '' }
  },
  titleContent: { 
    name: 'Título e Conteúdo', 
    icon: AlignLeft,
    template: { layout: 'titleContent', title: '', content: '' }
  },
  twoColumns: { 
    name: 'Duas Colunas', 
    icon: Columns2,
    template: { layout: 'twoColumns', title: '', leftContent: '', rightContent: '' }
  },
  titleImage: { 
    name: 'Título e Imagem', 
    icon: ImageIcon,
    template: { layout: 'titleImage', title: '', content: '', imageUrl: '' }
  },
};

export default function PptxEditor({ value, onChange }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setSlides(parsed.slides || [{ layout: 'titleContent', title: '', content: '' }]);
      } catch (e) {
        setSlides([{ layout: 'titleContent', title: '', content: '' }]);
      }
    } else {
      setSlides([{ layout: 'titleContent', title: '', content: '' }]);
    }
  }, [value]);

  const handleUpdate = (newSlides) => {
    setSlides(newSlides);
    onChange(JSON.stringify({ slides: newSlides }));
  };

  const addSlide = (layout = 'titleContent') => {
    const newSlides = [...slides, { ...LAYOUTS[layout].template }];
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

  const updateSlideField = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index][field] = value;
    handleUpdate(newSlides);
  };

  const changeLayout = (index, layout) => {
    const newSlides = [...slides];
    const currentTitle = newSlides[index].title || '';
    newSlides[index] = { ...LAYOUTS[layout].template, title: currentTitle };
    handleUpdate(newSlides);
  };

  const handleImageUpload = async (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setUploadingImage(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateSlideField(index, 'imageUrl', file_url);
      } catch (error) {
        alert('Erro ao fazer upload da imagem');
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'align',
    'color', 'background'
  ];

  const renderSlideLayout = (slide, index) => {
    if (!slide) return null;

    switch (slide.layout) {
      case 'title':
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Input
              placeholder="Título Principal"
              value={slide.title || ''}
              onChange={(e) => updateSlideField(index, 'title', e.target.value)}
              className="text-5xl font-bold mb-4 border-none focus-visible:ring-0 text-center bg-transparent"
            />
            <Input
              placeholder="Subtítulo"
              value={slide.subtitle || ''}
              onChange={(e) => updateSlideField(index, 'subtitle', e.target.value)}
              className="text-2xl text-gray-600 border-none focus-visible:ring-0 text-center bg-transparent"
            />
          </div>
        );

      case 'titleContent':
        return (
          <div className="h-full flex flex-col">
            <Input
              placeholder="Título do Slide"
              value={slide.title || ''}
              onChange={(e) => updateSlideField(index, 'title', e.target.value)}
              className="text-3xl font-bold mb-6 border-none focus-visible:ring-0 bg-transparent"
            />
            <div className="flex-1">
              <Textarea
                placeholder="Conteúdo do slide..."
                value={slide.content || ''}
                onChange={(e) => updateSlideField(index, 'content', e.target.value)}
                className="h-full resize-none text-lg border-none focus-visible:ring-0 bg-transparent"
              />
            </div>
          </div>
        );

      case 'twoColumns':
        return (
          <div className="h-full flex flex-col">
            <Input
              placeholder="Título do Slide"
              value={slide.title || ''}
              onChange={(e) => updateSlideField(index, 'title', e.target.value)}
              className="text-3xl font-bold mb-6 border-none focus-visible:ring-0 bg-transparent"
            />
            <div className="flex-1 grid grid-cols-2 gap-6">
              <Textarea
                placeholder="Coluna esquerda..."
                value={slide.leftContent || ''}
                onChange={(e) => updateSlideField(index, 'leftContent', e.target.value)}
                className="h-full resize-none text-lg border-2 border-gray-200 rounded-lg p-4 focus-visible:ring-0"
              />
              <Textarea
                placeholder="Coluna direita..."
                value={slide.rightContent || ''}
                onChange={(e) => updateSlideField(index, 'rightContent', e.target.value)}
                className="h-full resize-none text-lg border-2 border-gray-200 rounded-lg p-4 focus-visible:ring-0"
              />
            </div>
          </div>
        );

      case 'titleImage':
        return (
          <div className="h-full flex flex-col">
            <Input
              placeholder="Título do Slide"
              value={slide.title || ''}
              onChange={(e) => updateSlideField(index, 'title', e.target.value)}
              className="text-3xl font-bold mb-6 border-none focus-visible:ring-0 bg-transparent"
            />
            <div className="flex-1 grid grid-cols-2 gap-6">
              <Textarea
                placeholder="Conteúdo..."
                value={slide.content || ''}
                onChange={(e) => updateSlideField(index, 'content', e.target.value)}
                className="h-full resize-none text-lg border-2 border-gray-200 rounded-lg p-4 focus-visible:ring-0"
              />
              <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                {slide.imageUrl ? (
                  <div className="relative w-full h-full group">
                    <img 
                      src={slide.imageUrl} 
                      alt="Slide" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleImageUpload(index)}
                      disabled={uploadingImage}
                    >
                      Trocar Imagem
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleImageUpload(index)}
                    disabled={uploadingImage}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {uploadingImage ? 'Enviando...' : 'Adicionar Imagem'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar - Slide Thumbnails */}
      <div className="w-64 bg-white border-r overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Slides</h3>
          <Select onValueChange={(layout) => addSlide(layout)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Novo Slide" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LAYOUTS).map(([key, layout]) => {
                const Icon = layout.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {layout.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-all ${
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
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {slide.title || 'Sem título'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {LAYOUTS[slide.layout]?.name || 'Layout'}
                  </p>
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

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Navigation and Layout Selector */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <span className="text-sm font-medium text-gray-600">
            Slide {currentSlide + 1} de {slides.length}
          </span>
          
          <div className="flex items-center gap-2">
            <Select 
              value={slides[currentSlide]?.layout || 'titleContent'}
              onValueChange={(layout) => changeLayout(currentSlide, layout)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LAYOUTS).map(([key, layout]) => {
                  const Icon = layout.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {layout.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-2xl aspect-video p-12 relative">
            {renderSlideLayout(slides[currentSlide], currentSlide)}
          </div>
        </div>
      </div>

      <style>{`
        .ql-container {
          min-height: 300px;
          font-family: 'Montserrat', sans-serif;
        }
        .ql-editor {
          min-height: 300px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}