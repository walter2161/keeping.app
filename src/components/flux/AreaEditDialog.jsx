import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AreaEditDialog({ open, onOpenChange, data, onSave }) {
  const [formData, setFormData] = useState({
    title: data.title || 'Área',
    color: data.color || 'rgba(59, 130, 246, 0.1)',
  });

  const presetColors = [
    { name: 'Azul', value: 'rgba(59, 130, 246, 0.1)' },
    { name: 'Verde', value: 'rgba(34, 197, 94, 0.1)' },
    { name: 'Amarelo', value: 'rgba(234, 179, 8, 0.1)' },
    { name: 'Vermelho', value: 'rgba(239, 68, 68, 0.1)' },
    { name: 'Roxo', value: 'rgba(168, 85, 247, 0.1)' },
    { name: 'Rosa', value: 'rgba(236, 72, 153, 0.1)' },
    { name: 'Laranja', value: 'rgba(249, 115, 22, 0.1)' },
    { name: 'Cinza', value: 'rgba(107, 114, 128, 0.1)' },
  ];

  const handleSave = () => {
    onSave({
      ...data,
      title: formData.title,
      color: formData.color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Área</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Título da Área</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da área"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cor de Fundo</label>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-blue-500 scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ background: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}