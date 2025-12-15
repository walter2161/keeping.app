import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const colors = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'default', label: 'Cinza', class: 'bg-gray-500' },
];

export default function FolderColorDialog({ open, onOpenChange, currentColor, onSubmit }) {
  const [selectedColor, setSelectedColor] = React.useState(currentColor || 'blue');

  React.useEffect(() => {
    if (open) {
      setSelectedColor(currentColor || 'blue');
    }
  }, [open, currentColor]);

  const handleSubmit = () => {
    onSubmit(selectedColor);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolher Cor da Pasta</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-3 gap-4">
            {colors.map(c => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  selectedColor === c.value 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-full ${c.class}`} />
                <span className="text-sm font-medium text-gray-700">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}