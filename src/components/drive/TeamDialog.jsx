import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, X, Plus, Trash2, LogOut } from 'lucide-react';
import TeamIconPicker from './TeamIconPicker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TeamDialog({ open, onOpenChange, team, currentUserEmail }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Users');
  const [color, setColor] = useState('purple');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [members, setMembers] = useState([currentUserEmail]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const { data: currentTeam } = useQuery({
    queryKey: ['team', team?.id],
    queryFn: async () => {
      if (!team?.id) return null;
      const teams = await base44.entities.Team.filter({ id: team.id });
      return teams[0] || null;
    },
    enabled: !!team?.id && open,
  });

  React.useEffect(() => {
    if (open) {
      if (team && currentTeam) {
        setName(currentTeam.name || '');
        setDescription(currentTeam.description || '');
        setIcon(currentTeam.icon || 'Users');
        setColor(currentTeam.color || 'purple');
        setMembers(currentTeam.members || [currentUserEmail]);
      } else if (!team) {
        setName('');
        setDescription('');
        setIcon('Users');
        setColor('purple');
        setMembers([currentUserEmail]);
      }
      setNewMemberEmail('');
    }
  }, [open, team, currentTeam, currentUserEmail]);
  
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

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      // Buscar todas as pastas da equipe
      const allFolders = await base44.entities.Folder.list();
      const teamFolders = allFolders.filter(f => f.team_id === teamId);
      
      // Buscar todos os arquivos da equipe
      const allFiles = await base44.entities.File.list();
      const teamFiles = allFiles.filter(f => f.team_id === teamId);
      
      // Deletar todos os arquivos
      for (const file of teamFiles) {
        await base44.entities.File.delete(file.id);
      }
      
      // Deletar todas as pastas
      for (const folder of teamFolders) {
        await base44.entities.Folder.delete(folder.id);
      }

      // Deletar convites pendentes da equipe
      const allInvitations = await base44.entities.TeamInvitation.list();
      const teamInvitations = allInvitations.filter(inv => inv.team_id === teamId);
      for (const invitation of teamInvitations) {
        await base44.entities.TeamInvitation.delete(invitation.id);
      }
      
      // Deletar a equipe
      await base44.entities.Team.delete(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['teamInvitations'] });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      if (!team || !currentTeam) return;
      const updatedMembers = currentTeam.members.filter(m => m !== currentUserEmail);
      await base44.entities.Team.update(team.id, { members: updatedMembers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setLeaveDialogOpen(false);
      onOpenChange(false);
    },
  });
  
  const handleAddMember = async () => {
    if (newMemberEmail && newMemberEmail.includes('@') && !members.includes(newMemberEmail)) {
      if (team) {
        // Se está editando, criar convite
        await base44.entities.TeamInvitation.create({
          team_id: team.id,
          team_name: team.name,
          invited_email: newMemberEmail,
          invited_by: currentUserEmail,
          status: 'pending',
        });
        queryClient.invalidateQueries({ queryKey: ['teamInvitations'] });
        setNewMemberEmail('');
      } else {
        // Se está criando, adicionar à lista local
        setMembers([...members, newMemberEmail]);
        setNewMemberEmail('');
      }
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
      icon: icon,
      color: color,
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
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Aparência
              </label>
              <TeamIconPicker
                icon={icon}
                color={color}
                onIconChange={setIcon}
                onColorChange={setColor}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nome da Equipe
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marketing, Desenvolvimento, etc."
              />
            </div>
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
            {team && (
              <p className="text-xs text-gray-500 mb-2">
                Ao adicionar um email, será enviado um convite para o usuário
              </p>
            )}
            
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
        
        <DialogFooter className={team ? "flex justify-between" : ""}>
          {team && (
            <div className="flex gap-2 mr-auto">
              {currentTeam && currentTeam.owner !== currentUserEmail && (
                <Button 
                  variant="outline" 
                  onClick={() => setLeaveDialogOpen(true)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Equipe
                </Button>
              )}
              {currentTeam && currentTeam.owner === currentUserEmail && (
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Equipe
                </Button>
              )}
            </div>
          )}
          <div className="flex gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir esta equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as pastas e arquivos desta equipe serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => team && deleteTeamMutation.mutate(team.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Equipe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Team Confirmation Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Você perderá acesso a todas as pastas e arquivos desta equipe. Será necessário um novo convite para voltar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leaveTeamMutation.mutate()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Sair da Equipe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}