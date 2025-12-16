import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Check,
  Upload,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { base44 } from '@/api/base44Client';

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const coverColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

export default function CardEditDialog({ open, onOpenChange, data, onSave }) {
  const [editData, setEditData] = useState(data || {
    title: '',
    description: '',
    priority: 'medium',
    coverType: 'none',
    coverColor: coverColors[0],
    coverImage: '',
    attachments: [],
  });
  
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (editData.coverType === 'image') {
        setEditData({ ...editData, coverImage: file_url });
      } else {
        const newAttachment = {
          id: Date.now().toString(),
          name: file.name,
          url: file_url
        };
        setEditData({ 
          ...editData, 
          attachments: [...(editData.attachments || []), newAttachment]
        });
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = (attachmentId) => {
    const updatedAttachments = editData.attachments.filter(a => a.id !== attachmentId);
    setEditData({ ...editData, attachments: updatedAttachments });
  };

  const handleSave = () => {
    onSave(editData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Card</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Título"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          />
          
          <Textarea
            placeholder="Descrição"
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          />
          
          <select
            className="w-full p-2 border rounded-md"
            value={editData.priority || 'medium'}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
          >
            <option value="low">Prioridade Baixa</option>
            <option value="medium">Prioridade Média</option>
            <option value="high">Prioridade Alta</option>
          </select>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Capa do Cartão:</label>
              <select
                className="text-sm p-1 border rounded"
                value={editData.coverType || 'none'}
                onChange={(e) => setEditData({ ...editData, coverType: e.target.value })}
              >
                <option value="none">Sem capa</option>
                <option value="color">Cor</option>
                <option value="image">Imagem</option>
              </select>
            </div>

            {editData.coverType === 'color' && (
              <div className="flex gap-2 flex-wrap">
                {coverColors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      editData.coverColor === color ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditData({ ...editData, coverColor: color })}
                  />
                ))}
              </div>
            )}

            {editData.coverType === 'image' && (
              <div>
                {editData.coverImage ? (
                  <div className="relative">
                    <img src={editData.coverImage} className="w-full h-32 object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => setEditData({ ...editData, coverImage: '' })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Clique para adicionar imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anexos:</label>
            <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Adicionar arquivo</span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </label>
            {editData.attachments && editData.attachments.length > 0 && (
              <div className="space-y-1">
                {editData.attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <a href={att.url} target="_blank" className="text-blue-600 hover:underline truncate flex-1">
                      {att.name}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!editData.title}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}