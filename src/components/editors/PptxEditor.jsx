import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PptxEditor({ value, onChange }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setSlides(parsed.slides || [{ title: '', content: '' }]);
      } catch (e) {
        setSlides([{ title: '', content: '' }]);
      }
    } else {
      setSlides([{ title: '', content: '' }]);
    }
  }, [value]);

  const handleUpdate = (newSlides) => {
    setSlides(newSlides);
    onChange(JSON.stringify({ slides: newSlides }));
  };

  const addSlide = () => {
    const newSlides = [...slides, { title: '', content: '' }];
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

  const updateSlideTitle = (index, title) => {
    const newSlides = [...slides];
    newSlides[index].title = title;
    handleUpdate(newSlides);
  };

  const updateSlideContent = (index, content) => {
    const newSlides = [...slides];
    newSlides[index].content = content;
    handleUpdate(newSlides);
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

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar - Slide Thumbnails */}
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
        {/* Navigation */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm font-medium text-gray-600">
            Slide {currentSlide + 1} de {slides.length}
          </span>
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

        {/* Slide Editor */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <Input
              placeholder="Título do Slide"
              value={slides[currentSlide]?.title || ''}
              onChange={(e) => updateSlideTitle(currentSlide, e.target.value)}
              className="text-2xl font-bold mb-6 border-none focus-visible:ring-0 px-0"
            />
            <div className="prose max-w-none">
              <ReactQuill
                theme="snow"
                value={slides[currentSlide]?.content || ''}
                onChange={(content) => updateSlideContent(currentSlide, content)}
                modules={modules}
                formats={formats}
                placeholder="Conteúdo do slide..."
                style={{ minHeight: '300px' }}
              />
            </div>
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