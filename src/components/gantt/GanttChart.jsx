import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { format, addDays, startOfWeek, differenceInDays, addWeeks, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors = {
  pending: { bg: 'bg-gray-400', text: 'text-gray-700', label: 'Pendente' },
  inProgress: { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Em Progresso' },
  completed: { bg: 'bg-green-500', text: 'text-green-700', label: 'Concluído' },
  delayed: { bg: 'bg-red-500', text: 'text-red-700', label: 'Atrasado' },
};

const defaultTasks = [];

export default function GanttChart({ data, onChange }) {
  const [tasks, setTasks] = useState(data?.tasks || defaultTasks);
  const [viewStart, setViewStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [taskDialog, setTaskDialog] = useState({ open: false, task: null, isNew: true });
  const [newTask, setNewTask] = useState({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    status: 'pending',
    progress: 0,
  });

  React.useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
    }
  }, [data]);

  const days = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => addDays(viewStart, i));
  }, [viewStart]);

  const saveChanges = (newTasks) => {
    setTasks(newTasks);
    onChange?.({ tasks: newTasks });
  };

  const addTask = () => {
    const task = {
      id: `task-${Date.now()}`,
      ...newTask,
    };
    saveChanges([...tasks, task]);
    setNewTask({
      name: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      status: 'pending',
      progress: 0,
    });
    setTaskDialog({ open: false, task: null, isNew: true });
  };

  const updateTask = () => {
    const updatedTasks = tasks.map(t => 
      t.id === taskDialog.task.id ? taskDialog.task : t
    );
    saveChanges(updatedTasks);
    setTaskDialog({ open: false, task: null, isNew: true });
  };

  const deleteTask = (taskId) => {
    saveChanges(tasks.filter(t => t.id !== taskId));
  };

  const getTaskPosition = (task) => {
    const start = parseISO(task.startDate);
    const end = parseISO(task.endDate);
    const startOffset = differenceInDays(start, viewStart);
    const duration = differenceInDays(end, start) + 1;
    
    return {
      left: Math.max(0, startOffset) * 40,
      width: Math.min(duration, 28 - Math.max(0, startOffset)) * 40 - 4,
      isVisible: startOffset + duration > 0 && startOffset < 28,
    };
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewStart(subWeeks(viewStart, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-gray-700 min-w-[200px] text-center">
            {format(viewStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(viewStart, 27), "d 'de' MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setViewStart(addWeeks(viewStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={() => setTaskDialog({ open: true, task: null, isNew: true })} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Days Header */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div className="w-64 flex-shrink-0 p-3 border-r font-semibold text-gray-600 bg-gray-50">
              Tarefas
            </div>
            <div className="flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`w-10 flex-shrink-0 p-1 text-center border-r text-xs ${
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-100' : 'bg-white'
                  }`}
                >
                  <div className="text-gray-400">{format(day, 'EEE', { locale: ptBR })}</div>
                  <div className={`font-medium ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-orange-600' : 'text-gray-600'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <p className="mb-2">Nenhuma tarefa criada</p>
                <Button variant="outline" onClick={() => setTaskDialog({ open: true, task: null, isNew: true })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              </div>
            </div>
          ) : (
            tasks.map((task) => {
              const position = getTaskPosition(task);
              const status = statusColors[task.status] || statusColors.pending;
              
              return (
                <div key={task.id} className="flex border-b hover:bg-gray-50 group">
                  <div className="w-64 flex-shrink-0 p-3 border-r flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{task.name}</p>
                      <Badge className={`text-xs ${status.bg} text-white mt-1`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setTaskDialog({ open: true, task, isNew: false })}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex relative h-14">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={`w-10 flex-shrink-0 border-r ${
                          day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''
                        } ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-orange-50' : ''}`}
                      />
                    ))}
                    {position.isVisible && position.width > 0 && (
                      <div
                        className={`absolute top-2 h-10 ${status.bg} rounded-md shadow-sm flex items-center px-2 text-white text-xs font-medium overflow-hidden`}
                        style={{ left: position.left + 2, width: position.width }}
                      >
                        <div 
                          className="absolute inset-0 bg-white opacity-30"
                          style={{ width: `${task.progress}%` }}
                        />
                        <span className="relative z-10 truncate">{task.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task Dialog */}
      <Dialog open={taskDialog.open} onOpenChange={(open) => setTaskDialog({ ...taskDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{taskDialog.isNew ? 'Nova Tarefa' : 'Editar Tarefa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input
                placeholder="Nome da tarefa"
                value={taskDialog.isNew ? newTask.name : taskDialog.task?.name || ''}
                onChange={(e) => taskDialog.isNew 
                  ? setNewTask({ ...newTask, name: e.target.value })
                  : setTaskDialog({ ...taskDialog, task: { ...taskDialog.task, name: e.target.value }})
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Início</label>
                <Input
                  type="date"
                  value={taskDialog.isNew ? newTask.startDate : taskDialog.task?.startDate || ''}
                  onChange={(e) => taskDialog.isNew 
                    ? setNewTask({ ...newTask, startDate: e.target.value })
                    : setTaskDialog({ ...taskDialog, task: { ...taskDialog.task, startDate: e.target.value }})
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Data Fim</label>
                <Input
                  type="date"
                  value={taskDialog.isNew ? newTask.endDate : taskDialog.task?.endDate || ''}
                  onChange={(e) => taskDialog.isNew 
                    ? setNewTask({ ...newTask, endDate: e.target.value })
                    : setTaskDialog({ ...taskDialog, task: { ...taskDialog.task, endDate: e.target.value }})
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={taskDialog.isNew ? newTask.status : taskDialog.task?.status || 'pending'}
                onChange={(e) => taskDialog.isNew 
                  ? setNewTask({ ...newTask, status: e.target.value })
                  : setTaskDialog({ ...taskDialog, task: { ...taskDialog.task, status: e.target.value }})
                }
              >
                {Object.entries(statusColors).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Progresso: {taskDialog.isNew ? newTask.progress : taskDialog.task?.progress || 0}%</label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full"
                value={taskDialog.isNew ? newTask.progress : taskDialog.task?.progress || 0}
                onChange={(e) => taskDialog.isNew 
                  ? setNewTask({ ...newTask, progress: parseInt(e.target.value) })
                  : setTaskDialog({ ...taskDialog, task: { ...taskDialog.task, progress: parseInt(e.target.value) }})
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog({ open: false, task: null, isNew: true })}>
              Cancelar
            </Button>
            <Button 
              onClick={taskDialog.isNew ? addTask : updateTask}
              disabled={taskDialog.isNew ? !newTask.name : !taskDialog.task?.name}
            >
              {taskDialog.isNew ? 'Adicionar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}