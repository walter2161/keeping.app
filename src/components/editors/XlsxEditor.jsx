import React, { useEffect, useRef } from 'react';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';

export default function XlsxEditor({ value, onChange }) {
  const jssRef = useRef(null);
  const tableRef = useRef(null);
  const worksheetRef = useRef(null);
  useEffect(() => {
    if (!jssRef.current || !jspreadsheet || worksheetRef.current) return;

    let initialData = [];
    try {
      if (value) {
        const parsed = JSON.parse(value);
        initialData = parsed.data || [];
      }
    } catch (e) {
      console.error('Error parsing spreadsheet data:', e);
    }

    // Se não há dados, criar planilha vazia
    if (!initialData.length) {
      initialData = Array(100).fill(null).map(() => Array(26).fill(''));
    }

    const options = {
      data: initialData,
      minDimensions: [26, 100],
      defaultColWidth: 100,
      tableOverflow: true,
      tableHeight: 'calc(100vh - 200px)',
      tableWidth: '100%',
      freezeColumns: 0,
      csvFileName: 'planilha',
      allowInsertRow: true,
      allowManualInsertRow: true,
      allowInsertColumn: true,
      allowManualInsertColumn: true,
      allowDeleteRow: true,
      allowDeleteColumn: true,
      allowRenameColumn: true,
      allowComments: true,
      wordWrap: false,
      selectionCopy: true,
      mergeCells: {},
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
          v: ['Arial','Verdana','Courier New','Times New Roman','Georgia','Helvetica']
        },
        {
          type: 'select',
          k: 'font-size',
          v: ['9px','10px','11px','12px','13px','14px','15px','16px','18px','20px','22px']
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
          type: 'i',
          content: 'border_all',
          onclick: function() {
            if (worksheetRef.current) {
              worksheetRef.current.setBorder();
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
        }
      ],
      onchange: function(instance, cell, x, y, value) {
        if (worksheetRef.current && onChange) {
          const data = worksheetRef.current.getData();
          const meta = worksheetRef.current.getMeta();
          const style = worksheetRef.current.getStyle();
          const merged = worksheetRef.current.getMerge();
          
          onChange(JSON.stringify({
            data,
            meta,
            style,
            merged
          }));
        }
      },
      onselection: function(instance, x1, y1, x2, y2) {
        // Callback quando células são selecionadas
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

    try {
      // Restaurar dados salvos se existirem
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.data) options.data = parsed.data;
        if (parsed.meta) options.meta = parsed.meta;
        if (parsed.style) options.style = parsed.style;
        if (parsed.merged) options.mergeCells = parsed.merged;
      }
    } catch (e) {
      console.error('Error restoring spreadsheet:', e);
    }

    worksheetRef.current = jspreadsheet(jssRef.current, options);
    tableRef.current = jssRef.current.querySelector('.jexcel');

    return () => {
      if (worksheetRef.current && worksheetRef.current.destroy) {
        worksheetRef.current.destroy();
        worksheetRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full bg-white">
      <style>{`
        .jexcel_container {
          background: white;
        }
        .jexcel {
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11px;
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
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .jexcel_toolbar i {
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 4px;
          transition: all 0.2s;
          font-size: 18px;
          color: #4b5563;
        }
        .jexcel_toolbar i:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        .jexcel_toolbar select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 12px;
          cursor: pointer;
        }
        .jexcel_toolbar input[type="color"] {
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
        }
        .jexcel_content {
          overflow: auto;
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
        }
        .jtabs-headers {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
        }
        .jtabs-headers div {
          padding: 6px 16px;
          background: #e5e7eb;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          font-size: 12px;
          color: #4b5563;
          font-weight: 500;
        }
        .jtabs-headers div.jtabs-selected {
          background: white;
          color: #1f2937;
          font-weight: 600;
        }
      `}</style>
      <div ref={jssRef} className="w-full" />
    </div>
  );
}