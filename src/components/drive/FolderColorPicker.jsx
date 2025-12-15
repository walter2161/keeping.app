import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const colors = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'default', label: 'Cinza', class: 'bg-gray-500' },
];

export default function FolderColorPicker({ folder, open, onOpenChange, onColorSelect }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Escolha a cor da pasta</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-3 justify-center py-4">
          {colors.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onColorSelect?.(folder, c.value);
                onOpenChange(false);
              }}
              className={`w-12 h-12 rounded-full ${c.class} ${
                folder?.color === c.value ? 'ring-4 ring-offset-2 ring-blue-600' : ''
              } hover:scale-110 transition-transform shadow-md`}
              title={c.label}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}