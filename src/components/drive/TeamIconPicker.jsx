import React from 'react';
import { 
  Users, Briefcase, Code, Palette, Heart, Zap, Star, 
  Target, TrendingUp, Shield, Rocket, Coffee, Music, Camera, 
  BookOpen, Globe, MessageCircle, Activity
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const icons = [
  { name: 'Users', component: Users },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Code', component: Code },
  { name: 'Palette', component: Palette },
  { name: 'Heart', component: Heart },
  { name: 'Zap', component: Zap },
  { name: 'Star', component: Star },
  { name: 'Target', component: Target },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Shield', component: Shield },
  { name: 'Rocket', component: Rocket },
  { name: 'Coffee', component: Coffee },
  { name: 'Music', component: Music },
  { name: 'Camera', component: Camera },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Globe', component: Globe },
  { name: 'MessageCircle', component: MessageCircle },
  { name: 'Activity', component: Activity },
];

const colors = [
  { name: 'purple', class: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
  { name: 'blue', class: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
  { name: 'green', class: 'bg-green-100 text-green-600 hover:bg-green-200' },
  { name: 'orange', class: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
  { name: 'red', class: 'bg-red-100 text-red-600 hover:bg-red-200' },
  { name: 'pink', class: 'bg-pink-100 text-pink-600 hover:bg-pink-200' },
  { name: 'yellow', class: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' },
  { name: 'teal', class: 'bg-teal-100 text-teal-600 hover:bg-teal-200' },
];

export default function TeamIconPicker({ icon, color, onIconChange, onColorChange }) {
  const IconComponent = icons.find(i => i.name === icon)?.component || Users;
  const colorClass = colors.find(c => c.name === color)?.class || colors[0].class;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-12 h-12 ${colorClass}`}
        >
          <IconComponent className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Ícone</label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map((iconItem) => {
                const Icon = iconItem.component;
                return (
                  <button
                    key={iconItem.name}
                    onClick={() => onIconChange(iconItem.name)}
                    className={`p-2 rounded hover:bg-gray-100 ${
                      icon === iconItem.name ? 'bg-gray-100 ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((colorItem) => (
                <button
                  key={colorItem.name}
                  onClick={() => onColorChange(colorItem.name)}
                  className={`p-3 rounded ${colorItem.class} ${
                    color === colorItem.name ? 'ring-2 ring-gray-800' : ''
                  }`}
                >
                  <div className="w-full h-4 rounded" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}