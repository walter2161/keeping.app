import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format, addDays, startOfWeek, differenceInDays, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  notStarted: { bg: 'bg-gray-200', color: 'text-gray-600', label: 'Não Iniciado' },
  onTrack: { bg: 'bg-green-500', color: 'text-green-600', label: 'No Prazo' },
  atRisk: { bg: 'bg-yellow-500', color: 'text-yellow-600', label: 'Em Risco' },
  delayed: { bg: 'bg-red-500', color: 'text-red-600', label: 'Atrasado' },
  completed: { bg: 'bg-blue-500', color: 'text-blue-600', label: 'Concluído' },
};

const groupColors = [
  'border-l-pink-500',
  'border-l-purple-500',
  'border-l-blue-500',
  'border-l-green-500',
  'border-l-orange-500',
];

export default function CronogramaBoard({ data, onChange }) {
  const [groups, setGroups] = useState(data?.groups || [
    { id: 'g1', name: 'Fase 1 - Planejamento', color: 0 },
    { id: 'g2', name: 'Fase 2 - Execução', color: 1 },
  ]);
  const [items, setItems] = useState(data?.items || []);
  const [viewStart, setViewStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [itemDialog, setItemDialog] = useState({ open: false, item: null, isNew: true, groupId: null });
  const [groupDialog, setGroupDialog] = useState({ open: false, group: null, isNew: true });
  const [newItem, setNewItem] = useState({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    status: 'notStarted',
    assignee: '',
  });
  const [newGroup, setNewGroup] = useState({ name: '', color: 0 });

  React.useEffect(() => {
    if (data?.groups) setGroups(data.groups);
    if (data?.items) setItems(data.items);
  }, [data]);

  const days = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => addDays(viewStart, i));
  }, [viewStart]);

  const saveChanges = (newGroups, newItems) => {
    setGroups(newGroups);
    setItems(newItems);
    onChange?.({ groups: newGroups, items: newItems });
  };

  const addItem = () => {
    const item = {
      id: `item-${Date.now()}`,
      ...newItem,
      groupId: itemDialog.groupId,
    };
    saveChanges(groups, [...items, item]);
    setNewItem({
      name: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      status: 'notStarted',
      assignee: '',
    });
    setItemDialog({ open: false, item: null, isNew: true, groupId: null });
  };

  const updateItem = () => {
    const updatedItems = items.map(i => 
      i.id === itemDialog.item.id ? itemDialog.item : i
    );
    saveChanges(groups, updatedItems);
    setItemDialog({ open: false, item: null, isNew: true, groupId: null });
  };

  const deleteItem = (itemId) => {
    saveChanges(groups, items.filter(i => i.id !== itemId));
  };

  const addGroup = () => {
    const group = {
      id: `group-${Date.now()}`,
      ...newGroup,
      color: groups.length % groupColors.length,
    };
    saveChanges([...groups, group], items);
    setNewGroup({ name: '', color: 0 });
    setGroupDialog({ open: false, group: null, isNew: true });
  };

  const deleteGroup = (groupId) => {
    saveChanges(
      groups.filter(g => g.id !== groupId),
      items.filter(i => i.groupId !== groupId)
    );
  };

  const getItemPosition = (item) => {
    const start = parseISO(item.startDate);
    const end = parseISO(item.endDate);
    const startOffset = differenceInDays(start, viewStart);
    const duration = differenceInDays(end, start) + 1;
    
    return {
      left: Math.max(0, startOffset) * 48,
      width: Math.min(duration, 21 - Math.max(0, startOffset)) * 48 - 4,
      isVisible: startOffset + duration > 0 && startOffset < 21,
    };
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewStart(subWeeks(viewStart, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-gray-700 min-w-[200px] text-center">
            {format(viewStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(viewStart, 20), "d 'de' MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setViewStart(addWeeks(viewStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGroupDialog({ open: true, group: null, isNew: true })}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Days Header */}
          <div className="flex border-b sticky top-0 bg-white z-10 shadow-sm">
            <div className="w-72 flex-shrink-0 p-3 border-r font-semibold text-gray-600 bg-gray-50">
              Itens
            </div>
            <div className="flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`w-12 flex-shrink-0 p-1 text-center border-r text-xs ${
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-100' : 'bg-white'
                  }`}
                >
                  <div className="text-gray-400 uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
                  <div className={`font-bold ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-pink-600 bg-pink-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groups */}
          {groups.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="mb-2">Nenhum grupo criado</p>
                <Button variant="outline" onClick={() => setGroupDialog({ open: true, group: null, isNew: true })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="mb-4">
                {/* Group Header */}
                <div className={`flex border-b-2 ${groupColors[group.color]} bg-white/60`}>
                  <div className={`w-72 flex-shrink-0 p-3 border-r border-l-4 ${groupColors[group.color]} flex items-center justify-between`}>
                    <span className="font-semibold text-gray-800">{group.name}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setItemDialog({ open: true, item: null, isNew: true, groupId: group.id })}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500"
                        onClick={() => deleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1" />
                </div>

                {/* Group Items */}
                {items
                  .filter(item => item.groupId === group.id)
                  .map((item) => {
                    const position = getItemPosition(item);
                    const status = statusConfig[item.status] || statusConfig.notStarted;
                    
                    return (
                      <div key={item.id} className="flex border-b hover:bg-white/50 group">
                        <div className={`w-72 flex-shrink-0 p-3 border-r border-l-4 ${groupColors[group.color]} flex items-center justify-between bg-white/40`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${status.bg} text-white`}>
                                {status.label}
                              </Badge>
                              {item.assignee && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.assignee}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => setItemDialog({ open: true, item, isNew: false, groupId: group.id })}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex relative h-16">
                          {days.map((day, i) => (
                            <div
                              key={i}
                              className={`w-12 flex-shrink-0 border-r ${
                                day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50/50' : ''
                              } ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-pink-50/50' : ''}`}
                            />
                          ))}
                          {position.isVisible && position.width > 0 && (
                            <div
                              className={`absolute top-3 h-10 ${status.bg} rounded-lg shadow-md flex items-center justify-center text-white text-xs font-medium transition-all hover:scale-105`}
                              style={{ left: position.left + 2, width: position.width }}
                            >
                              <span className="truncate px-2">{item.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {items.filter(item => item.groupId === group.id).length === 0 && (
                  <div className="flex border-b bg-white/30">
                    <div className={`w-72 flex-shrink-0 p-3 border-r border-l-4 ${groupColors[group.color]} text-gray-400 text-sm`}>
                      Nenhum item. Clique + para adicionar.
                    </div>
                    <div className="flex-1" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={(open) => setItemDialog({ ...itemDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemDialog.isNew ? 'Novo Item' : 'Editar Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input
                placeholder="Nome do item"
                value={itemDialog.isNew ? newItem.name : itemDialog.item?.name || ''}
                onChange={(e) => itemDialog.isNew 
                  ? setNewItem({ ...newItem, name: e.target.value })
                  : setItemDialog({ ...itemDialog, item: { ...itemDialog.item, name: e.target.value }})
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Responsável</label>
              <Input
                placeholder="Nome do responsável"
                value={itemDialog.isNew ? newItem.assignee : itemDialog.item?.assignee || ''}
                onChange={(e) => itemDialog.isNew 
                  ? setNewItem({ ...newItem, assignee: e.target.value })
                  : setItemDialog({ ...itemDialog, item: { ...itemDialog.item, assignee: e.target.value }})
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Início</label>
                <Input
                  type="date"
                  value={itemDialog.isNew ? newItem.startDate : itemDialog.item?.startDate || ''}
                  onChange={(e) => itemDialog.isNew 
                    ? setNewItem({ ...newItem, startDate: e.target.value })
                    : setItemDialog({ ...itemDialog, item: { ...itemDialog.item, startDate: e.target.value }})
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Data Fim</label>
                <Input
                  type="date"
                  value={itemDialog.isNew ? newItem.endDate : itemDialog.item?.endDate || ''}
                  onChange={(e) => itemDialog.isNew 
                    ? setNewItem({ ...newItem, endDate: e.target.value })
                    : setItemDialog({ ...itemDialog, item: { ...itemDialog.item, endDate: e.target.value }})
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={itemDialog.isNew ? newItem.status : itemDialog.item?.status || 'notStarted'}
                onChange={(e) => itemDialog.isNew 
                  ? setNewItem({ ...newItem, status: e.target.value })
                  : setItemDialog({ ...itemDialog, item: { ...itemDialog.item, status: e.target.value }})
                }
              >
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog({ open: false, item: null, isNew: true, groupId: null })}>
              Cancelar
            </Button>
            <Button 
              onClick={itemDialog.isNew ? addItem : updateItem}
              disabled={itemDialog.isNew ? !newItem.name : !itemDialog.item?.name}
            >
              {itemDialog.isNew ? 'Adicionar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={groupDialog.open} onOpenChange={(open) => setGroupDialog({ ...groupDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do Grupo</label>
              <Input
                placeholder="Ex: Fase 1 - Planejamento"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialog({ open: false, group: null, isNew: true })}>
              Cancelar
            </Button>
            <Button onClick={addGroup} disabled={!newGroup.name}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}