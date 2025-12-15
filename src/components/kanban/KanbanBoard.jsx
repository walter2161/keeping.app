import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export default function KanbanBoard({ data, onChange }) {
  const [columns, setColumns] = useState(data?.columns || defaultColumns);
  const [cards, setCards] = useState(data?.cards || []);
  const [newCardDialog, setNewCardDialog] = useState({ open: false, columnId: null });
  const [editCardDialog, setEditCardDialog] = useState({ open: false, card: null });
  const [newCard, setNewCard] = useState({ title: '', description: '', priority: 'medium' });
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumn, setShowNewColumn] = useState(false);

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

  const addCard = () => {
    const card = {
      id: `card-${Date.now()}`,
      ...newCard,
      columnId: newCardDialog.columnId,
      order: cards.filter(c => c.columnId === newCardDialog.columnId).length,
    };
    saveChanges(columns, [...cards, card]);
    setNewCard({ title: '', description: '', priority: 'medium' });
    setNewCardDialog({ open: false, columnId: null });
  };

  const updateCard = () => {
    const updatedCards = cards.map(c => 
      c.id === editCardDialog.card.id ? editCardDialog.card : c
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

  const deleteColumn = (colId) => {
    saveChanges(
      columns.filter(c => c.id !== colId),
      cards.filter(c => c.columnId !== colId)
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => (
              <div key={column.id} className="w-72 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border">
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
                                className={`p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div {...provided.dragHandleProps} className="mt-1 cursor-grab">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800 text-sm">{card.title}</p>
                                    {card.description && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                      <Badge className={`text-xs ${priorityColors[card.priority]}`}>
                                        {card.priority === 'high' ? 'Alta' : card.priority === 'medium' ? 'Média' : 'Baixa'}
                                      </Badge>
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

      <Dialog open={newCardDialog.open} onOpenChange={(open) => setNewCardDialog({ ...newCardDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título"
              value={newCard.title}
              onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
            />
            <Textarea
              placeholder="Descrição"
              value={newCard.description}
              onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
            />
            <select
              className="w-full p-2 border rounded-md"
              value={newCard.priority}
              onChange={(e) => setNewCard({ ...newCard, priority: e.target.value })}
            >
              <option value="low">Prioridade Baixa</option>
              <option value="medium">Prioridade Média</option>
              <option value="high">Prioridade Alta</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCardDialog({ open: false, columnId: null })}>
              Cancelar
            </Button>
            <Button onClick={addCard} disabled={!newCard.title}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editCardDialog.open} onOpenChange={(open) => setEditCardDialog({ ...editCardDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cartão</DialogTitle>
          </DialogHeader>
          {editCardDialog.card && (
            <div className="space-y-4">
              <Input
                placeholder="Título"
                value={editCardDialog.card.title}
                onChange={(e) => setEditCardDialog({ 
                  ...editCardDialog, 
                  card: { ...editCardDialog.card, title: e.target.value } 
                })}
              />
              <Textarea
                placeholder="Descrição"
                value={editCardDialog.card.description}
                onChange={(e) => setEditCardDialog({ 
                  ...editCardDialog, 
                  card: { ...editCardDialog.card, description: e.target.value } 
                })}
              />
              <select
                className="w-full p-2 border rounded-md"
                value={editCardDialog.card.priority}
                onChange={(e) => setEditCardDialog({ 
                  ...editCardDialog, 
                  card: { ...editCardDialog.card, priority: e.target.value } 
                })}
              >
                <option value="low">Prioridade Baixa</option>
                <option value="medium">Prioridade Média</option>
                <option value="high">Prioridade Alta</option>
              </select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCardDialog({ open: false, card: null })}>
              Cancelar
            </Button>
            <Button onClick={updateCard}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}