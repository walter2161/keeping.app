import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2, Edit2, GripVertical, Image, Paperclip, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CardEditDialog from './CardEditDialog';

const defaultColumns = [
  { id: 'todo', title: 'A Fazer', color: 'bg-gray-500' },
  { id: 'doing', title: 'Em Progresso', color: 'bg-blue-500' },
  { id: 'review', title: 'Revisão', color: 'bg-yellow-500' },
  { id: 'done', title: 'Concluído', color: 'bg-green-500' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const coverColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

export default function KanbanBoard({ data, onChange }) {
  const [columns, setColumns] = useState(data?.columns || defaultColumns);
  const [cards, setCards] = useState(data?.cards || []);
  const [newCardDialog, setNewCardDialog] = useState({ open: false, columnId: null });
  const [editCardDialog, setEditCardDialog] = useState({ open: false, card: null });
  const [editColumnDialog, setEditColumnDialog] = useState({ open: false, column: null });
  const [newCard, setNewCard] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium',
    coverType: 'none',
    coverColor: coverColors[0],
    coverImage: '',
    attachments: []
  });
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const saveChanges = (newColumns, newCards) => {
    setColumns(newColumns);
    setCards(newCards);
    onChange?.({ columns: newColumns, cards: newCards });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    const updatedCards = cards.map(card => {
      if (card.id === draggableId) {
        return { ...card, columnId: destination.droppableId, order: destination.index };
      }
      return card;
    });
    
    saveChanges(columns, updatedCards);
  };

  const handleFileUpload = async (e, cardData, setCardData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (cardData.coverType === 'image') {
        setCardData({ ...cardData, coverImage: file_url });
      } else {
        const newAttachment = {
          id: Date.now().toString(),
          name: file.name,
          url: file_url
        };
        setCardData({ 
          ...cardData, 
          attachments: [...(cardData.attachments || []), newAttachment]
        });
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const addCard = () => {
    const card = {
      id: `card-${Date.now()}`,
      ...newCard,
      columnId: newCardDialog.columnId,
      order: cards.filter(c => c.columnId === newCardDialog.columnId).length,
    };
    saveChanges(columns, [...cards, card]);
    setNewCard({ 
      title: '', 
      description: '', 
      priority: 'medium',
      coverType: 'none',
      coverColor: coverColors[0],
      coverImage: '',
      attachments: []
    });
    setNewCardDialog({ open: false, columnId: null });
  };

  const handleEditCard = (updatedCard) => {
    const updatedCards = cards.map(c => 
      c.id === updatedCard.id ? updatedCard : c
    );
    saveChanges(columns, updatedCards);
    setEditCardDialog({ open: false, card: null });
  };

  const deleteCard = (cardId) => {
    saveChanges(columns, cards.filter(c => c.id !== cardId));
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newCol = {
      id: `col-${Date.now()}`,
      title: newColumnTitle,
      color: 'bg-purple-500',
    };
    saveChanges([...columns, newCol], cards);
    setNewColumnTitle('');
    setShowNewColumn(false);
  };

  const updateColumn = () => {
    const updatedColumns = columns.map(c =>
      c.id === editColumnDialog.column.id ? editColumnDialog.column : c
    );
    saveChanges(updatedColumns, cards);
    setEditColumnDialog({ open: false, column: null });
  };

  const deleteColumn = (colId) => {
    saveChanges(
      columns.filter(c => c.id !== colId),
      cards.filter(c => c.columnId !== colId)
    );
  };

  const removeAttachment = (card, attachmentId) => {
    const updatedAttachments = card.attachments.filter(a => a.id !== attachmentId);
    setNewCard({ ...newCard, attachments: updatedAttachments });
  };

  const CardCoverSection = ({ cardData, setCardData, isDialog = false }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Capa do Cartão:</label>
        <select
          className="text-sm p-1 border rounded"
          value={cardData.coverType || 'none'}
          onChange={(e) => setCardData({ ...cardData, coverType: e.target.value })}
        >
          <option value="none">Sem capa</option>
          <option value="color">Cor</option>
          <option value="image">Imagem</option>
        </select>
      </div>

      {cardData.coverType === 'color' && (
        <div className="flex gap-2 flex-wrap">
          {coverColors.map(color => (
            <button
              key={color}
              className={`w-8 h-8 rounded border-2 ${
                cardData.coverColor === color ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setCardData({ ...cardData, coverColor: color })}
            />
          ))}
        </div>
      )}

      {cardData.coverType === 'image' && (
        <div className="space-y-3">
          {cardData.coverImage ? (
            <div className="relative">
              <img src={cardData.coverImage} className="w-full aspect-square object-cover rounded" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setCardData({ ...cardData, coverImage: '' })}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
              <Image className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Clique para adicionar imagem</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, cardData, setCardData)}
                disabled={uploadingFile}
              />
            </label>
          )}
          
          {cardData.attachments && cardData.attachments.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Ou escolha um anexo como capa:</p>
              <div className="grid grid-cols-3 gap-2">
                {cardData.attachments
                  .filter(att => att.url && (att.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || att.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)))
                  .map(att => (
                    <button
                      key={att.id}
                      className={`relative aspect-square border-2 rounded overflow-hidden hover:border-blue-500 transition-colors ${
                        cardData.coverImage === att.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                      }`}
                      onClick={() => setCardData({ ...cardData, coverImage: att.url })}
                    >
                      <img src={att.url} className="w-full h-full object-cover" alt={att.name} />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const CardForm = ({ cardData, setCardData }) => {
    return (
      <div className="space-y-4">
        <Input
          placeholder="Título"
          value={cardData.title || ''}
          onChange={(e) => setCardData({ ...cardData, title: e.target.value })}
        />
        <Textarea
          placeholder="Descrição"
          value={cardData.description || ''}
          onChange={(e) => setCardData({ ...cardData, description: e.target.value })}
        />
        <select
          className="w-full p-2 border rounded-md"
          value={cardData.priority}
          onChange={(e) => setCardData({ ...cardData, priority: e.target.value })}
        >
          <option value="low">Prioridade Baixa</option>
          <option value="medium">Prioridade Média</option>
          <option value="high">Prioridade Alta</option>
        </select>

      <CardCoverSection cardData={cardData} setCardData={setCardData} isDialog={true} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Anexos:</label>
        <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
          <Paperclip className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Adicionar arquivo</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, cardData, setCardData)}
            disabled={uploadingFile}
          />
        </label>
        {cardData.attachments && cardData.attachments.length > 0 && (
          <div className="space-y-1">
            {cardData.attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                  {att.name}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAttachment(cardData, att.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 min-w-max" style={{ height: 'calc(100vh - 220px)' }}>
            {columns.map((column) => (
              <div key={column.id} className="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border h-full">
                <div className={`flex items-center justify-between p-3 rounded-t-xl ${column.color} bg-opacity-10`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-gray-800">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {cards.filter(c => c.columnId === column.id).length}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditColumnDialog({ open: true, column })}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Renomear Coluna
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteColumn(column.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Coluna
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {cards
                        .filter(card => card.columnId === column.id)
                        .sort((a, b) => a.order - b.order)
                        .map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                                }`}
                              >
                                {card.coverType === 'color' && (
                                  <div className="h-10" style={{ backgroundColor: card.coverColor }} />
                                )}
                                {card.coverType === 'image' && card.coverImage && (
                                 <img src={card.coverImage} className="w-full aspect-square object-cover" alt={card.title} />
                                )}
                                <div className="p-3">
                                 <div className="flex items-start gap-2">
                                   <div {...provided.dragHandleProps} className="mt-1 cursor-grab">
                                     <GripVertical className="w-4 h-4 text-gray-400" />
                                   </div>
                                   <div 
                                     className="flex-1 cursor-pointer"
                                     onClick={() => setEditCardDialog({ open: true, card })}
                                   >
                                     <p className="font-medium text-gray-800 text-sm">{card.title}</p>
                                     {card.description && (
                                       <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                                     )}
                                      <div className="flex items-center justify-between mt-2 gap-2">
                                        <div className="flex gap-1 flex-wrap">
                                          <Badge className={`text-xs ${priorityColors[card.priority]}`}>
                                            {card.priority === 'high' ? 'Alta' : card.priority === 'medium' ? 'Média' : 'Baixa'}
                                          </Badge>
                                          {card.attachments && card.attachments.length > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                              <Paperclip className="w-3 h-3 mr-1" />
                                              {card.attachments.length}
                                            </Badge>
                                          )}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                              <MoreVertical className="w-3 h-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => setEditCardDialog({ open: true, card })}>
                                              <Edit2 className="w-4 h-4 mr-2" />
                                              Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteCard(card.id)} className="text-red-600">
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Excluir
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-500 hover:text-gray-700"
                    onClick={() => setNewCardDialog({ open: true, columnId: column.id })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Cartão
                  </Button>
                </div>
              </div>
            ))}

            {showNewColumn ? (
              <div className="w-72 flex-shrink-0 p-3 bg-white rounded-xl border">
                <Input
                  placeholder="Nome da coluna"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={addColumn}>Adicionar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewColumn(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-72 h-12 flex-shrink-0 border-dashed"
                onClick={() => setShowNewColumn(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Coluna
              </Button>
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Dialog para novo cartão */}
      <Dialog open={newCardDialog.open} onOpenChange={(open) => setNewCardDialog({ ...newCardDialog, open })}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
          </DialogHeader>
          <CardForm cardData={newCard} setCardData={setNewCard} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCardDialog({ open: false, columnId: null })}>
              Cancelar
            </Button>
            <Button onClick={addCard} disabled={!newCard.title}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar cartão */}
      <CardEditDialog
        open={editCardDialog.open}
        onOpenChange={(open) => setEditCardDialog({ open, card: null })}
        data={editCardDialog.card}
        onSave={handleEditCard}
      />

      {/* Dialog para renomear coluna */}
      <Dialog open={editColumnDialog.open} onOpenChange={(open) => setEditColumnDialog({ ...editColumnDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Coluna</DialogTitle>
          </DialogHeader>
          {editColumnDialog.column && (
            <Input
              placeholder="Nome da coluna"
              value={editColumnDialog.column.title}
              onChange={(e) => setEditColumnDialog({
                ...editColumnDialog,
                column: { ...editColumnDialog.column, title: e.target.value }
              })}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColumnDialog({ open: false, column: null })}>
              Cancelar
            </Button>
            <Button onClick={updateColumn}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}