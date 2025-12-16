import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Check,
  Upload,
  Image as ImageIcon,
  User,
  Tag
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import ReactMarkdown from 'react-markdown';

export default function CardEditDialog({ open, onOpenChange, data, onSave }) {
  const [editData, setEditData] = useState(data || {
    title: '',
    description: '',
    members: [],
    labels: [],
    dueDate: null,
    checklists: [],
    attachments: [],
    cover: null,
    comments: [],
  });

  const [newMember, setNewMember] = useState('');
  const [newLabel, setNewLabel] = useState({ name: '', color: 'bg-blue-500' });
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  const labelColors = [
    'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 
    'bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-indigo-500'
  ];

  const handleAddMember = () => {
    if (newMember.trim()) {
      setEditData({
        ...editData,
        members: [...(editData.members || []), newMember.trim()]
      });
      setNewMember('');
    }
  };

  const handleRemoveMember = (index) => {
    setEditData({
      ...editData,
      members: editData.members.filter((_, i) => i !== index)
    });
  };

  const handleAddLabel = () => {
    if (newLabel.name.trim()) {
      setEditData({
        ...editData,
        labels: [...(editData.labels || []), { ...newLabel }]
      });
      setNewLabel({ name: '', color: 'bg-blue-500' });
    }
  };

  const handleRemoveLabel = (index) => {
    setEditData({
      ...editData,
      labels: editData.labels.filter((_, i) => i !== index)
    });
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setEditData({
        ...editData,
        checklists: [...(editData.checklists || []), { text: newChecklistItem.trim(), checked: false }]
      });
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (index) => {
    const updated = [...editData.checklists];
    updated[index].checked = !updated[index].checked;
    setEditData({ ...editData, checklists: updated });
  };

  const handleRemoveChecklistItem = (index) => {
    setEditData({
      ...editData,
      checklists: editData.checklists.filter((_, i) => i !== index)
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setEditData({
        ...editData,
        comments: [...(editData.comments || []), { 
          text: newComment.trim(), 
          date: new Date().toISOString(),
          author: 'Você'
        }]
      });
      setNewComment('');
    }
  };

  const handleSave = () => {
    onSave(editData);
    onOpenChange(false);
  };

  const checkedCount = (editData.checklists || []).filter(item => item.checked).length;
  const totalCount = (editData.checklists || []).length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cover Image */}
          {editData.cover && (
            <div className="relative w-full h-32 rounded-lg overflow-hidden">
              <img src={editData.cover} alt="Cover" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setEditData({ ...editData, cover: null })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              value={editData.title || ''}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Digite o título do card"
              className="text-lg font-semibold"
            />
          </div>

          {/* Members */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <User className="w-4 h-4" />
              Membros
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {(editData.members || []).map((member, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm">{member}</span>
                  <button onClick={() => handleRemoveMember(index)} className="text-gray-500 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Nome do membro"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button onClick={handleAddMember} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Etiquetas
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {(editData.labels || []).map((label, index) => (
                <div key={index} className={`flex items-center gap-1 ${label.color} text-white px-3 py-1 rounded`}>
                  <span className="text-sm font-medium">{label.name}</span>
                  <button onClick={() => handleRemoveLabel(index)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel.name}
                onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                placeholder="Nome da etiqueta"
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
              />
              <select
                value={newLabel.color}
                onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
                className="border rounded px-2"
              >
                {labelColors.map(color => (
                  <option key={color} value={color}>{color.replace('bg-', '').replace('-500', '')}</option>
                ))}
              </select>
              <Button onClick={handleAddLabel} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium mb-2 block">Data de Vencimento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editData.dueDate ? format(new Date(editData.dueDate), 'dd/MM/yyyy') : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={editData.dueDate ? new Date(editData.dueDate) : undefined}
                  onSelect={(date) => setEditData({ ...editData, dueDate: date?.toISOString() })}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Descrição</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
              >
                {showMarkdownPreview ? 'Editar' : 'Preview'}
              </Button>
            </div>
            {showMarkdownPreview ? (
              <div className="border rounded-lg p-4 min-h-[120px] prose prose-sm max-w-none">
                <ReactMarkdown>{editData.description || '*Sem descrição*'}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Adicione uma descrição mais detalhada... (suporta Markdown)"
                rows={6}
              />
            )}
          </div>

          {/* Checklists */}
          <div>
            <label className="text-sm font-medium mb-2 block">Checklist</label>
            {totalCount > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{Math.round(progress)}%</span>
                  <span>{checkedCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2 mb-2">
              {(editData.checklists || []).map((item, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleChecklistItem(index)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => handleRemoveChecklistItem(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Adicionar item"
                onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              />
              <Button onClick={handleAddChecklistItem} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium mb-2 block">Anexos</label>
            <div className="space-y-2 mb-2">
              {(editData.attachments || []).map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm flex-1">{attachment.name}</span>
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">
                    Abrir
                  </a>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Adicionar Anexo
            </Button>
          </div>

          {/* Comments */}
          <div>
            <label className="text-sm font-medium mb-2 block">Comentários</label>
            <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
              {(editData.comments || []).map((comment, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.date), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicionar comentário..."
                rows={2}
              />
              <Button onClick={handleAddComment} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}