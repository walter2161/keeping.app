import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, X, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TeamDialog({ open, onOpenChange, team, currentUserEmail }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [members, setMembers] = useState([currentUserEmail]);

  React.useEffect(() => {
    if (open) {
      if (team) {
        setName(team.name || '');
        setDescription(team.description || '');
        setMembers(team.members || [currentUserEmail]);
      } else {
        setName('');
        setDescription('');
        setMembers([currentUserEmail]);
      }
      setNewMemberEmail('');
    }
  }, [open, team, currentUserEmail]);
  
  const queryClient = useQueryClient();
  
  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      const newTeam = await base44.entities.Team.create(data);
      
      // Criar pasta automaticamente para a equipe
      await base44.entities.Folder.create({
        name: data.name,
        parent_id: null,
        team_id: newTeam.id,
        order: 0,
        owner: data.owner,
      });
      
      return newTeam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      onOpenChange(false);
    },
  });
  
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onOpenChange(false);
    },
  });
  
  const handleAddMember = () => {
    if (newMemberEmail && newMemberEmail.includes('@') && !members.includes(newMemberEmail)) {
      setMembers([...members, newMemberEmail]);
      setNewMemberEmail('');
    }
  };
  
  const handleRemoveMember = (email) => {
    if (email !== currentUserEmail) {
      setMembers(members.filter(m => m !== email));
    }
  };
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    const data = {
      name: name.trim(),
      description: description.trim(),
      owner: currentUserEmail,
      members: members,
    };
    
    if (team) {
      updateTeamMutation.mutate({ id: team.id, data });
    } else {
      createTeamMutation.mutate(data);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {team ? 'Editar Equipe' : 'Nova Equipe'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nome da Equipe
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marketing, Desenvolvimento, etc."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Descrição (opcional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito desta equipe..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Membros da Equipe
            </label>
            
            <div className="flex gap-2 mb-3">
              <Input
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="email@exemplo.com"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <Button
                size="icon"
                onClick={handleAddMember}
                disabled={!newMemberEmail || !newMemberEmail.includes('@')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {members.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{email}</span>
                  {email === currentUserEmail ? (
                    <span className="text-xs text-blue-600 font-medium">Você</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveMember(email)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || members.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {team ? 'Salvar' : 'Criar Equipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}