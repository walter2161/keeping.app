import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 10;

export default function XlsxEditor({ value, onChange }) {
  const [data, setData] = useState(() => {
    try {
      return value ? JSON.parse(value) : { cells: {}, styles: {} };
    } catch {
      return { cells: {}, styles: {} };
    }
  });
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    onChange(JSON.stringify(data));
  }, [data]);

  const getCellValue = (row, col) => {
    const key = `${row}-${col}`;
    return data.cells[key] || '';
  };

  const getCellStyle = (row, col) => {
    const key = `${row}-${col}`;
    return data.styles[key] || {};
  };

  const updateCell = (row, col, value) => {
    const key = `${row}-${col}`;
    setData(prev => ({
      ...prev,
      cells: { ...prev.cells, [key]: value }
    }));
  };

  const updateCellStyle = (row, col, styleKey, styleValue) => {
    const key = `${row}-${col}`;
    setData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [key]: { ...prev.styles[key], [styleKey]: styleValue }
      }
    }));
  };

  const applyStyle = (styleKey, styleValue) => {
    if (!selectedCell) return;
    const [row, col] = selectedCell.split('-').map(Number);
    updateCellStyle(row, col, styleKey, styleValue);
  };

  const getColumnLetter = (col) => {
    let letter = '';
    let temp = col;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b bg-gray-50 flex-wrap">
          <Select onValueChange={(val) => applyStyle('fontWeight', val)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Negrito</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => applyStyle('fontSize', val)}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="11" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10px">10</SelectItem>
              <SelectItem value="11px">11</SelectItem>
              <SelectItem value="12px">12</SelectItem>
              <SelectItem value="14px">14</SelectItem>
              <SelectItem value="16px">16</SelectItem>
              <SelectItem value="18px">18</SelectItem>
              <SelectItem value="20px">20</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-gray-300" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyStyle('fontWeight', 'bold')}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyStyle('fontStyle', 'italic')}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyStyle('textAlign', 'left')}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyStyle('textAlign', 'center')}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => applyStyle('textAlign', 'right')}
          >
            <AlignRight className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          <input
            type="color"
            onChange={(e) => applyStyle('backgroundColor', e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
            title="Cor de fundo"
          />
          <input
            type="color"
            onChange={(e) => applyStyle('color', e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
            title="Cor do texto"
          />
        </div>

        {/* Spreadsheet */}
        <div className="overflow-auto max-h-[600px]">
          <table className="border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-gray-100 border border-gray-300 w-12 text-xs font-semibold text-gray-600"></th>
                {Array.from({ length: DEFAULT_COLS }).map((_, col) => (
                  <th
                    key={col}
                    className="sticky top-0 z-10 bg-gray-100 border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 min-w-[100px]"
                  >
                    {getColumnLetter(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: DEFAULT_ROWS }).map((_, row) => (
                <tr key={row}>
                  <td className="sticky left-0 z-10 bg-gray-100 border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 text-center">
                    {row + 1}
                  </td>
                  {Array.from({ length: DEFAULT_COLS }).map((_, col) => {
                    const cellKey = `${row}-${col}`;
                    const style = getCellStyle(row, col);
                    return (
                      <td
                        key={col}
                        className={`border border-gray-300 p-0 ${
                          selectedCell === cellKey ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={getCellValue(row, col)}
                          onChange={(e) => updateCell(row, col, e.target.value)}
                          onFocus={() => setSelectedCell(cellKey)}
                          className="w-full h-full px-2 py-1 text-sm border-none focus:outline-none"
                          style={style}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}