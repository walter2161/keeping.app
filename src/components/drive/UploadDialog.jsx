import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileText, FileSpreadsheet, Image, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UploadDialog({ open, onOpenChange, onUploadComplete, folderId, folders }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const detectFileType = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
    
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    if (ext === 'pptx' || ext === 'ppt') return 'pptx';
    if (ext === 'pdf') return 'pdf';
    if (imageExts.includes(ext)) return 'img';
    if (videoExts.includes(ext)) return 'video';
    return 'other';
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    const uploadedFiles = [];

    // Herdar compartilhamento da pasta pai recursivamente
    let sharedWith = [];
    
    if (folderId) {
      let checkFolderId = folderId;
      while (checkFolderId) {
        const folder = folders?.find(f => f.id === checkFolderId);
        if (folder && folder.shared_with && folder.shared_with.length > 0) {
          folder.shared_with.forEach(email => {
            if (!sharedWith.includes(email)) {
              sharedWith.push(email);
            }
          });
        }
        checkFolderId = folder?.parent_id;
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(prev => ({ ...prev, [i]: 'uploading' }));
      
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const fileType = detectFileType(file);
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        
        const newFile = await base44.entities.File.create({
          name: fileName,
          type: fileType,
          folder_id: folderId,
          file_url: file_url,
          content: '',
          shared_with: sharedWith,
        });
        
        uploadedFiles.push(newFile);
        setProgress(prev => ({ ...prev, [i]: 'complete' }));
      } catch (error) {
        setProgress(prev => ({ ...prev, [i]: 'error' }));
      }
    }

    setUploading(false);
    onUploadComplete?.(uploadedFiles);
    setFiles([]);
    setProgress({});
    onOpenChange(false);
  };

  const getFileIcon = (file) => {
    const type = detectFileType(file);
    switch(type) {
      case 'docx': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'xlsx': return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'img': return <Image className="w-5 h-5 text-cyan-600" />;
      case 'video': return <Video className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Arquivos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Clique para selecionar arquivos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Imagens, vídeos, documentos e planilhas
              </p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"
              disabled={uploading}
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {progress[index] === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {progress[index] === 'complete' && (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {progress[index] === 'error' && (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">✗</span>
                    </div>
                  )}
                  {!progress[index] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar {files.length > 0 && `(${files.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}