import React, { useEffect, useRef } from 'react';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';

export default function XlsxEditor({ value, onChange }) {
  const jssRef = useRef(null);
  const tableRef = useRef(null);
  const worksheetRef = useRef(null);
  const [selectedCell, setSelectedCell] = React.useState({ x: 0, y: 0, name: 'A1' });
  
  useEffect(() => {
    if (!jssRef.current || !jspreadsheet) return;

    // Destruir instância existente se houver
    if (worksheetRef.current && worksheetRef.current.destroy) {
      worksheetRef.current.destroy();
      worksheetRef.current = null;
    }

    let parsedData = null;
    try {
      if (value && value.trim()) {
        parsedData = JSON.parse(value);
      }
    } catch (e) {
      console.error('Error parsing spreadsheet value:', e);
    }

    const options = {
      data: parsedData?.data || Array(100).fill(null).map(() => Array(26).fill('')),
      meta: parsedData?.meta || {},
      style: parsedData?.style || {},
      mergeCells: parsedData?.merged || {},
      minDimensions: [26, 100],
      defaultColWidth: 120,
      defaultRowHeight: 32,
      tableOverflow: true,
      tableHeight: 'calc(100vh - 300px)',
      tableWidth: '100%',
      freezeColumns: 0,
      csvFileName: 'planilha',
      about: false,
      allowInsertRow: true,
      allowManualInsertRow: true,
      allowInsertColumn: true,
      allowManualInsertColumn: true,
      allowDeleteRow: true,
      allowDeleteColumn: true,
      allowRenameColumn: true,
      allowComments: true,
      wordWrap: true,
      selectionCopy: true,
      mergeCells: {},
      parseFormulas: true,
      pagination: 100,
      paginationOptions: [50, 100, 200, 500],
      worksheets: [
        { name: 'Planilha 1' }
      ],
      toolbar: [
        {
          type: 'i',
          content: 'undo',
          onclick: function() {
            if (worksheetRef.current) {
              worksheetRef.current.undo();
            }
          }
        },
        {
          type: 'i',
          content: 'redo',
          onclick: function() {
            if (worksheetRef.current) {
              worksheetRef.current.redo();
            }
          }
        },
        {
          type: 'select',
          k: 'font-family',
          v: ['Arial','Verdana','Courier New','Times New Roman','Georgia','Helvetica','Montserrat','Calibri','Tahoma']
        },
        {
          type: 'select',
          k: 'font-size',
          v: ['8px','9px','10px','11px','12px','13px','14px','15px','16px','18px','20px','22px','24px','28px','32px']
        },
        {
          type: 'i',
          content: 'format_bold',
          k: 'font-weight',
          v: 'bold'
        },
        {
          type: 'i',
          content: 'format_italic',
          k: 'font-style',
          v: 'italic'
        },
        {
          type: 'i',
          content: 'format_underlined',
          k: 'text-decoration',
          v: 'underline'
        },
        {
          type: 'color',
          content: 'format_color_text',
          k: 'color'
        },
        {
          type: 'color',
          content: 'format_color_fill',
          k: 'background-color'
        },
        {
          type: 'select',
          k: 'text-align',
          v: ['left','center','right']
        },
        {
          type: 'select',
          k: 'vertical-align',
          v: ['top','middle','bottom']
        },
        {
          type: 'i',
          content: 'border_all',
          onclick: function() {
            if (worksheetRef.current) {
              const selected = worksheetRef.current.getSelected();
              if (selected) {
                worksheetRef.current.setStyle(selected, 'border', '1px solid #000');
              }
            }
          }
        },
        {
          type: 'i',
          content: 'border_outer',
          onclick: function() {
            if (worksheetRef.current) {
              const selected = worksheetRef.current.getSelected();
              if (selected) {
                worksheetRef.current.setStyle(selected, 'border', '2px solid #000');
              }
            }
          }
        },
        {
          type: 'i',
          content: 'border_clear',
          onclick: function() {
            if (worksheetRef.current) {
              const selected = worksheetRef.current.getSelected();
              if (selected) {
                worksheetRef.current.setStyle(selected, 'border', 'none');
              }
            }
          }
        },
        {
          type: 'i',
          content: 'merge_cells',
          onclick: function() {
            if (worksheetRef.current) {
              const cells = worksheetRef.current.getSelectedColumns();
              if (cells && cells.length > 0) {
                worksheetRef.current.setMerge(cells);
              }
            }
          }
        },
        {
          type: 'i',
          content: 'format_clear',
          onclick: function() {
            if (worksheetRef.current) {
              const selected = worksheetRef.current.getSelected();
              if (selected) {
                worksheetRef.current.resetStyle(selected);
              }
            }
          }
        }
      ],
      onchange: function(instance, cell, x, y, value) {
        if (worksheetRef.current && onChange) {
          const data = worksheetRef.current.getData();
          const meta = worksheetRef.current.getMeta();
          const style = worksheetRef.current.getStyle();
          const merged = worksheetRef.current.getMerge();
          
          onChange(JSON.stringify({
            data: data,
            meta: meta,
            style: style,
            merged: merged
          }));
        }
      },
      onchangestyle: function(instance, cell, x, y, k, v) {
        if (worksheetRef.current && onChange) {
          const data = worksheetRef.current.getData();
          const meta = worksheetRef.current.getMeta();
          const style = worksheetRef.current.getStyle();
          const merged = worksheetRef.current.getMerge();
          
          onChange(JSON.stringify({
            data: data,
            meta: meta,
            style: style,
            merged: merged
          }));
        }
      },
      onselection: function(instance, x1, y1, x2, y2) {
        const cellName = String.fromCharCode(65 + x1) + (y1 + 1);
        setSelectedCell({ x: x1, y: y1, name: cellName });
        const input = document.getElementById('formula-input');
        if (input && worksheetRef.current) {
          const value = worksheetRef.current.getValue(cellName);
          input.value = value || '';
        }
      },
      contextMenu: function(obj, x, y, e) {
        const items = [];

        items.push({
          title: 'Inserir nova linha antes',
          onclick: function() {
            worksheetRef.current.insertRow(1, parseInt(y), 1);
          }
        });

        items.push({
          title: 'Inserir nova linha depois',
          onclick: function() {
            worksheetRef.current.insertRow(1, parseInt(y) + 1, 1);
          }
        });

        items.push({
          title: 'Excluir linha',
          onclick: function() {
            worksheetRef.current.deleteRow(parseInt(y));
          }
        });

        items.push({ type: 'line' });

        items.push({
          title: 'Inserir nova coluna antes',
          onclick: function() {
            worksheetRef.current.insertColumn(1, parseInt(x), 1);
          }
        });

        items.push({
          title: 'Inserir nova coluna depois',
          onclick: function() {
            worksheetRef.current.insertColumn(1, parseInt(x) + 1, 1);
          }
        });

        items.push({
          title: 'Excluir coluna',
          onclick: function() {
            worksheetRef.current.deleteColumn(parseInt(x));
          }
        });

        items.push({ type: 'line' });

        items.push({
          title: 'Copiar',
          shortcut: 'Ctrl + C',
          onclick: function() {
            worksheetRef.current.copy(true);
          }
        });

        items.push({
          title: 'Colar',
          shortcut: 'Ctrl + V',
          onclick: function() {
            if (worksheetRef.current.options.copyData) {
              worksheetRef.current.paste(x, y);
            }
          }
        });

        items.push({
          title: 'Salvar',
          shortcut: 'Ctrl + S',
          onclick: function() {
            worksheetRef.current.download();
          }
        });

        return items;
      }
    };

    worksheetRef.current = jspreadsheet(jssRef.current, options);
    tableRef.current = jssRef.current.querySelector('.jexcel');

    return () => {
      if (worksheetRef.current && worksheetRef.current.destroy) {
        worksheetRef.current.destroy();
        worksheetRef.current = null;
      }
    };
  }, [value]);

  return (
    <div className="w-full h-full bg-white">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      
      {/* Barra de Fórmulas */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600 min-w-[60px]">
            {selectedCell.name}
          </span>
          <span className="text-gray-400">|</span>
        </div>
        <input
          type="text"
          id="formula-input"
          placeholder="Digite uma fórmula (ex: =SUM(A1:A10) ou =B2+C2)"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && worksheetRef.current) {
              let value = e.target.value;
              if (value) {
                // Traduzir fórmulas PT-BR para EN
                value = value.replace(/=SOMA\(/gi, '=SUM(');
                value = value.replace(/=MÉDIA\(/gi, '=AVERAGE(');
                value = value.replace(/=MÁXIMO\(/gi, '=MAX(');
                value = value.replace(/=MÍNIMO\(/gi, '=MIN(');
                
                worksheetRef.current.setValue(selectedCell.name, value);
                e.target.value = '';
                setTimeout(() => {
                  if (worksheetRef.current && onChange) {
                    const data = worksheetRef.current.getData();
                    const meta = worksheetRef.current.getMeta();
                    const style = worksheetRef.current.getStyle();
                    const merged = worksheetRef.current.getMerge();
                    onChange(JSON.stringify({ data, meta, style, merged }));
                  }
                }, 100);
              }
            }
          }}
        />
      </div>
      
      <style>{`
        .jexcel_container {
          background: white;
        }
        .jexcel {
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 12px;
        }
        .jexcel_pagination {
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .jexcel_pagination select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 13px;
          cursor: pointer;
          color: #374151;
        }
        .jexcel_pagination button {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 13px;
          cursor: pointer;
          color: #374151;
          transition: all 0.2s;
        }
        .jexcel_pagination button:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #3b82f6;
          color: #3b82f6;
        }
        .jexcel_pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .jexcel_pagination span {
          color: #6b7280;
          font-size: 13px;
        }
        .jexcel thead td {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
          border-right: 1px solid #d1d5db;
          border-bottom: 1px solid #d1d5db;
          padding: 8px;
          text-align: center;
          user-select: none;
        }
        .jexcel tbody tr:first-child td {
          border-top: 1px solid #d1d5db;
        }
        .jexcel tbody td {
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 4px 6px;
          min-height: 26px;
        }
        .jexcel tbody td:first-child {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
          text-align: center;
          user-select: none;
          border-right: 1px solid #d1d5db;
        }
        .jexcel tbody .jexcel_row > td:first-child {
          background: #f9fafb;
        }
        .jexcel > thead > tr > td.selected,
        .jexcel > tbody > tr > td.selected,
        .jexcel > tbody > tr > td.highlight,
        .jexcel > tbody > tr > td.highlight-left,
        .jexcel > tbody > tr > td.highlight-right,
        .jexcel > tbody > tr > td.highlight-top,
        .jexcel > tbody > tr > td.highlight-bottom {
          background: #dbeafe !important;
          border: 2px solid #3b82f6 !important;
        }
        .jexcel > tbody > tr > td.readonly {
          background: #f9fafb;
          color: #6b7280;
        }
        .jexcel_toolbar {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 16px;
          display: flex !important;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          min-height: 50px;
          position: relative;
          z-index: 1;
        }
        .jexcel_toolbar i {
          cursor: pointer;
          padding: 8px 10px;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 20px;
          color: #4b5563;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          font-family: 'Material Icons' !important;
          font-weight: normal;
          font-style: normal;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
        .jexcel_toolbar i:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        .jexcel_toolbar select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 13px;
          cursor: pointer;
          min-width: 100px;
        }
        .jexcel_toolbar input[type="color"] {
          width: 36px;
          height: 36px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          padding: 2px;
        }
        .jexcel_formula {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px 16px;
          display: flex !important;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 0;
        }
        .jexcel_formula input {
          flex: 1;
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        .jexcel_content {
          overflow: auto;
          position: relative;
          z-index: 0;
        }
        .jexcel_container {
          position: relative;
        }
        .jcontextmenu {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          padding: 4px;
          min-width: 200px;
        }
        .jcontextmenu > div {
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 13px;
          color: #374151;
        }
        .jcontextmenu > div:hover {
          background: #f3f4f6;
        }
        .jcontextmenu hr {
          margin: 4px 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
        .jexcel_corner {
          background: #f3f4f6;
          border-right: 1px solid #d1d5db;
          border-bottom: 1px solid #d1d5db;
        }
        .jexcel textarea {
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11px;
          padding: 4px 6px;
        }
        .jtabs {
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          padding: 8px 12px;
        }
        .jtabs-headers {
          display: flex !important;
          gap: 6px;
          align-items: center;
        }
        .jtabs-headers div {
          padding: 8px 20px;
          background: #e5e7eb;
          border-radius: 6px 6px 0 0;
          cursor: pointer;
          font-size: 13px;
          color: #4b5563;
          font-weight: 500;
          transition: all 0.2s;
        }
        .jtabs-headers div:hover {
          background: #d1d5db;
        }
        .jtabs-headers div.jtabs-selected {
          background: white;
          color: #1f2937;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          border-bottom: none;
        }
        .jtabs-add {
          width: 32px;
          height: 32px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          font-size: 18px;
          transition: all 0.2s;
        }
        .jtabs-add:hover {
          background: #f3f4f6;
          border-color: #3b82f6;
          color: #3b82f6;
        }
      `}</style>
      <div ref={jssRef} className="w-full" />
    </div>
  );
}