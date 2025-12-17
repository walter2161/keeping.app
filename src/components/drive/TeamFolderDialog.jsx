import React, { useState } from 'react';
import { Users, FolderPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamFolderDialog({ open, onOpenChange, teams, onSubmit }) {
  const [name, setName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  const handleSubmit = () => {
    if (name.trim() && selectedTeamId) {
      onSubmit(name.trim(), selectedTeamId);
      setName('');
      setSelectedTeamId('');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-purple-600" />
            Nova Pasta de Equipe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nome da Pasta
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da pasta..."
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Equipe
            </label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a equipe..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !selectedTeamId}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Criar Pasta de Equipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}