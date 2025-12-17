import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Mail, Trash2, Copy } from 'lucide-react';

export default function ShareDialog({ open, onOpenChange, item, type, onGenerateLink, onShareWithEmail, onRemoveShare, currentUserEmail }) {
  const [email, setEmail] = useState('');

  if (!item) return null;

  const isOwner = item.owner === currentUserEmail;
  const sharedWith = item.shared_with || [];

  const handleShare = () => {
    if (email.trim()) {
      onShareWithEmail(item, type, email.trim());
      setEmail('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar {type === 'folder' ? 'Pasta' : 'Arquivo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Gerar Link */}
          {isOwner && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Link de Compartilhamento</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Qualquer pessoa com o link poderá acessar
              </p>
              <Button 
                size="sm" 
                onClick={() => onGenerateLink(item, type)}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
            </div>
          )}

          {/* Compartilhar por Email */}
          {isOwner && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Compartilhar com Usuário</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email do usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleShare()}
                />
                <Button onClick={handleShare} size="sm">
                  Enviar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Usuários com Acesso */}
          {sharedWith.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-3">Usuários com Acesso</h4>
              <div className="space-y-2">
                {sharedWith.map((sharedEmail) => (
                  <div key={sharedEmail} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-700">{sharedEmail}</span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveShare(item, type, sharedEmail)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informação do Proprietário */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Proprietário: {item.owner}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}