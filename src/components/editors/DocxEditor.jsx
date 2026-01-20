import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Configuração avançada do editor
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'];
Quill.register(Size, true);

const Font = Quill.import('attributors/style/font');
Font.whitelist = ['arial', 'comic-sans', 'courier-new', 'georgia', 'helvetica', 'lucida', 'times-new-roman', 'verdana'];
Quill.register(Font, true);

const DocxEditor = forwardRef(({ value, onChange, zoom = 100 }, ref) => {
  const quillRef = useRef(null);
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' or 'landscape'
  
  useImperativeHandle(ref, () => ({
    setOrientation,
    getOrientation: () => orientation,
    print: handlePrint
  }));

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', e.target.result);
          quill.setSelection(range.index + 1);
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'font': Font.whitelist }],
        [{ 'size': Size.whitelist }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: true
    },
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent', 'check',
    'link', 'image', 'video', 'formula',
    'color', 'background',
    'align', 'direction',
    'code-block', 'script'
  ];

  const handlePrint = async () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const content = document.querySelector('.ql-editor');
    if (!content) return;

    try {
      // Capturar o conteúdo como imagem
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Criar PDF
      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = orientation === 'portrait' ? 210 : 297;
      const pageHeight = orientation === 'portrait' ? 297 : 210;
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Abrir janela de impressão
      pdf.autoPrint();
      window.open(pdf.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao preparar documento para impressão');
    }
  };

  return (
    <div className="bg-gray-100 h-full flex flex-col" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
      <style>{`
        .ql-container {
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11pt;
        }
        .ql-editor {
          min-height: ${orientation === 'portrait' ? '29.7cm' : '21cm'};
          width: ${orientation === 'portrait' ? '21cm' : '29.7cm'};
          margin: 20px auto;
          padding: ${orientation === 'portrait' ? '2.5cm 2cm' : '2cm 2.5cm'};
          background: white;
          line-height: 1.8;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        @media print {
          .ql-editor {
            box-shadow: none;
            padding: 0;
          }
        }
        .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #f9fafb;
          padding: 12px 20px;
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex !important;
          flex-wrap: wrap;
          gap: 4px;
        }
        .ql-toolbar .ql-formats {
          margin-right: 8px !important;
        }
        @media print {
          .ql-toolbar {
            display: none !important;
          }
        }
        .ql-toolbar .ql-stroke {
          fill: none;
          stroke: #4b5563;
        }
        .ql-toolbar .ql-fill {
          fill: #4b5563;
          stroke: none;
        }
        .ql-toolbar button:hover,
        .ql-toolbar button:focus,
        .ql-toolbar button.ql-active {
          color: #2563eb !important;
        }
        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button:focus .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb !important;
        }
        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button:focus .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb !important;
        }
        .ql-picker-label:hover,
        .ql-picker-label.ql-active {
          color: #2563eb !important;
        }
        .ql-picker-label:hover .ql-stroke,
        .ql-picker-label.ql-active .ql-stroke {
          stroke: #2563eb !important;
        }
        .ql-container {
          border: none !important;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          left: 2cm !important;
          right: 2cm !important;
        }
        .ql-editor h1 {
          font-size: 2em;
          margin: 0.67em 0;
        }
        .ql-editor h2 {
          font-size: 1.5em;
          margin: 0.75em 0;
        }
        .ql-editor h3 {
          font-size: 1.17em;
          margin: 0.83em 0;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="8px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="8px"]::before {
          content: '8';
          font-size: 8px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="9px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="9px"]::before {
          content: '9';
          font-size: 9px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before {
          content: '10';
          font-size: 10px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="11px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="11px"]::before {
          content: '11';
          font-size: 11px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before {
          content: '12';
          font-size: 12px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before {
          content: '14';
          font-size: 14px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before {
          content: '16';
          font-size: 16px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before {
          content: '18';
          font-size: 18px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before {
          content: '20';
          font-size: 20px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="22px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="22px"]::before {
          content: '22';
          font-size: 22px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before {
          content: '24';
          font-size: 24px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="26px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="26px"]::before {
          content: '26';
          font-size: 26px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="28px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="28px"]::before {
          content: '28';
          font-size: 28px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="36px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="36px"]::before {
          content: '36';
          font-size: 36px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="48px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="48px"]::before {
          content: '48';
          font-size: 48px !important;
        }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="72px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="72px"]::before {
          content: '72';
          font-size: 72px !important;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=arial]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=arial]::before {
          content: 'Arial';
          font-family: Arial, sans-serif;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=comic-sans]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=comic-sans]::before {
          content: 'Comic Sans';
          font-family: 'Comic Sans MS', cursive;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=courier-new]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=courier-new]::before {
          content: 'Courier New';
          font-family: 'Courier New', monospace;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=georgia]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=georgia]::before {
          content: 'Georgia';
          font-family: Georgia, serif;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=helvetica]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=helvetica]::before {
          content: 'Helvetica';
          font-family: Helvetica, sans-serif;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=lucida]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=lucida]::before {
          content: 'Lucida';
          font-family: 'Lucida Sans Unicode', sans-serif;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=times-new-roman]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=times-new-roman]::before {
          content: 'Times New Roman';
          font-family: 'Times New Roman', serif;
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=verdana]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=verdana]::before {
          content: 'Verdana';
          font-family: Verdana, sans-serif;
        }
        .ql-font-arial { font-family: Arial, sans-serif; }
        .ql-font-comic-sans { font-family: 'Comic Sans MS', cursive; }
        .ql-font-courier-new { font-family: 'Courier New', monospace; }
        .ql-font-georgia { font-family: Georgia, serif; }
        .ql-font-helvetica { font-family: Helvetica, sans-serif; }
        .ql-font-lucida { font-family: 'Lucida Sans Unicode', sans-serif; }
        .ql-font-times-new-roman { font-family: 'Times New Roman', serif; }
        .ql-font-verdana { font-family: Verdana, sans-serif; }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Digite seu documento aqui..."
        className="flex-1 flex flex-col"
      />
    </div>
  );
});

export default DocxEditor;