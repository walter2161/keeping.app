import React from 'react';
import { onhub } from '@/api/onhubClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Users, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function NotificationBell({ currentUserEmail }) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ['teamInvitations', currentUserEmail],
    queryFn: async () => {
      const all = await onhub.entities.TeamInvitation.list();
      return all.filter(inv => inv.invited_email === currentUserEmail && inv.status === 'pending');
    },
    enabled: !!currentUserEmail,
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitation) => {
      // Atualizar status do convite
      await onhub.entities.TeamInvitation.update(invitation.id, { status: 'accepted' });
      
      // Adicionar usuário à equipe
      const team = await onhub.entities.Team.filter({ id: invitation.team_id });
      if (team.length > 0) {
        const currentMembers = team[0].members || [];
        if (!currentMembers.includes(invitation.invited_email)) {
          await onhub.entities.Team.update(invitation.team_id, {
            members: [...currentMembers, invitation.invited_email]
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const rejectInvitationMutation = useMutation({
    mutationFn: (invitationId) => 
      onhub.entities.TeamInvitation.update(invitationId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamInvitations'] });
    },
  });

  const pendingCount = invitations.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Notificações</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {invitations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-1">
                        Convite para <span className="font-semibold">{invitation.team_name}</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Por {invitation.invited_by}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptInvitationMutation.mutate(invitation)}
                          disabled={acceptInvitationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectInvitationMutation.mutate(invitation.id)}
                          disabled={rejectInvitationMutation.isPending}
                          className="h-7 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
