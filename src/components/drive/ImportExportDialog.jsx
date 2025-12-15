import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ImportExportDialog({ 
  open, 
  onOpenChange, 
  onImport 
}) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Por favor, selecione um arquivo JSON válido.');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setStatus('loading');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await onImport(data);
        setStatus('success');
        setTimeout(() => {
          onOpenChange(false);
          setStatus('idle');
          setFile(null);
        }, 1500);
      } catch (err) {
        setStatus('error');
        setError('Erro ao processar o arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Importar Arquivos
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {status === 'idle' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json,application/json"
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileJson className="w-10 h-10 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Clique para selecionar um arquivo</p>
                    <p className="text-sm text-gray-400 mt-1">Apenas arquivos .json são aceitos</p>
                  </>
                )}
              </div>
              
              {error && (
                <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
              <p className="mt-3 text-gray-600">Importando arquivos...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <p className="mt-3 text-gray-600 font-medium">Importação concluída!</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <p className="mt-3 text-gray-600">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setStatus('idle');
                  setError('');
                }}
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>
        
        {status === 'idle' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={!file}>
              Importar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}