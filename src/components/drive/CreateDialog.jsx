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
  GanttChart, Calendar 
} from 'lucide-react';

export default function CreateDialog({ 
  type, // 'folder' | 'kbn' | 'gnt' | 'crn' | 'docx' | 'xlsx'
  open, 
  onOpenChange, 
  onSubmit 
}) {
  const [name, setName] = useState('');

  const config = {
    folder: { icon: Folder, title: 'Nova Pasta', placeholder: 'Nome da pasta', color: 'text-gray-600' },
    kbn: { icon: LayoutGrid, title: 'Novo Kanban', placeholder: 'Nome do arquivo Kanban', color: 'text-purple-600' },
    gnt: { icon: GanttChart, title: 'Novo Gantt', placeholder: 'Nome do arquivo Gantt', color: 'text-orange-600' },
    crn: { icon: Calendar, title: 'Novo Cronograma', placeholder: 'Nome do arquivo Cronograma', color: 'text-pink-600' },
    docx: { icon: FileText, title: 'Novo Documento', placeholder: 'Nome do documento', color: 'text-blue-600' },
    xlsx: { icon: FileSpreadsheet, title: 'Nova Planilha', placeholder: 'Nome da planilha', color: 'text-green-600' },
  };

  const currentConfig = config[type] || config.folder;
  const Icon = currentConfig.icon;

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
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
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}