import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Folder, FileText, FileSpreadsheet, LayoutGrid, 
  GanttChart, Calendar, ArrowRight, Presentation, Sparkles
} from 'lucide-react';

export default function CreateDialog({ 
  type, // 'folder' | 'kbn' | 'gnt' | 'crn' | 'docx' | 'xlsx' | 'pptx' | 'psd'
  open, 
  onOpenChange, 
  onSubmit,
  existingNames = [] // Lista de nomes já existentes
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [error, setError] = useState('');

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setName('');
      setColor('blue');
      setError('');
    }
  }, [open]);

  const config = {
    folder: { icon: Folder, title: 'Nova Pasta', placeholder: 'Nome da pasta', color: 'text-gray-600' },
    kbn: { icon: LayoutGrid, title: 'Novo Kanban', placeholder: 'Nome do arquivo Kanban', color: 'text-purple-600' },
    gnt: { icon: GanttChart, title: 'Novo Gantt', placeholder: 'Nome do arquivo Gantt', color: 'text-orange-600' },
    crn: { icon: Calendar, title: 'Novo Cronograma', placeholder: 'Nome do arquivo Cronograma', color: 'text-pink-600' },
    flux: { icon: ArrowRight, title: 'Novo FluxMap', placeholder: 'Nome do FluxMap', color: 'text-teal-600' },
    docx: { icon: FileText, title: 'Novo Documento', placeholder: 'Nome do documento', color: 'text-blue-600' },
    xlsx: { icon: FileSpreadsheet, title: 'Nova Planilha', placeholder: 'Nome da planilha', color: 'text-green-600' },
    pptx: { icon: Presentation, title: 'Nova Apresentação', placeholder: 'Nome da apresentação', color: 'text-amber-600' },
    psd: { icon: Sparkles, title: 'Novo PhotoSmart', placeholder: 'Nome do projeto', color: 'text-indigo-600' },
  };

  const currentConfig = config[type] || config.folder;
  const Icon = currentConfig.icon;

  const colors = [
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
    { value: 'default', label: 'Cinza', class: 'bg-gray-500' },
  ];

  const handleNameChange = (value) => {
    setName(value);
    if (existingNames.includes(value.trim().toLowerCase())) {
      setError('Já existe um item com este nome neste local');
    } else {
      setError('');
    }
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName && !existingNames.includes(trimmedName.toLowerCase())) {
      if (type === 'folder') {
        onSubmit(trimmedName, color);
      } else {
        onSubmit(trimmedName);
      }
      setName('');
      setColor('blue');
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${currentConfig.color}`} />
            {currentConfig.title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder={currentConfig.placeholder}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
            className={error ? 'border-red-500' : ''}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          
          {type === 'folder' && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Cor da Pasta</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.class} ${
                      color === c.value ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                    } hover:scale-110 transition-transform`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setName('');
            setError('');
            setColor('blue');
          }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !!error}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}