import React, { useState } from 'react';
import { onhub } from '@/api/onhubClient';
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileText, FileSpreadsheet, Image, Video, Archive } from 'lucide-react';
import JSZip from 'jszip';
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
  const [extracting, setExtracting] = useState(false);

  const detectFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
    
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'xlsx';
    if (ext === 'pptx' || ext === 'ppt') return 'pptx';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'kbn') return 'kbn';
    if (ext === 'gnt') return 'gnt';
    if (ext === 'crn') return 'crn';
    if (ext === 'flux') return 'flux';
    if (imageExts.includes(ext)) return 'img';
    if (videoExts.includes(ext)) return 'video';
    return 'other';
  };

  const convertCSVToXLSX = (csvContent) => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const cells = {};
    
    lines.forEach((line, rowIndex) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      cells[rowIndex] = {};
      values.forEach((value, colIndex) => {
        cells[rowIndex][colIndex] = value;
      });
    });
    
    return JSON.stringify({ cells });
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Verificar se há arquivos .zip
    const zipFiles = selectedFiles.filter(f => f.name.toLowerCase().endsWith('.zip'));
    const regularFiles = selectedFiles.filter(f => !f.name.toLowerCase().endsWith('.zip'));
    
    if (zipFiles.length > 0) {
      setExtracting(true);
      try {
        for (const zipFile of zipFiles) {
          await extractAndUploadZip(zipFile);
        }
      } catch (error) {
        alert('Erro ao extrair arquivo ZIP: ' + error.message);
      }
      setExtracting(false);
    }
    
    if (regularFiles.length > 0) {
      setFiles(prev => [...prev, ...regularFiles]);
    }
  };

  const extractAndUploadZip = async (zipFile) => {
    const user = await onhub.auth.me();
    const zip = await JSZip.loadAsync(zipFile);
    const folderMap = new Map(); // path -> folder id
    
    // Obter team_id da pasta pai
    const getTeamId = (folderId) => {
      if (!folderId) return null;
      let currentId = folderId;
      while (currentId) {
        const folder = folders?.find(f => f.id === currentId);
        if (!folder) break;
        if (folder.team_id) return folder.team_id;
        currentId = folder.parent_id;
      }
      return null;
    };
    
    const teamId = getTeamId(folderId);
    
    // Função para criar pasta
    const createFolder = async (folderPath, parentId) => {
      const folderName = folderPath.split('/').pop();
      const newFolder = await onhub.entities.Folder.create({
        name: folderName,
        parent_id: parentId,
        team_id: teamId,
        owner: user.email,
        deleted: false
      });
      return newFolder.id;
    };
    
    // Função para criar arquivo
    const createFile = async (fileName, content, parentId, isBlob = false) => {
      const fileType = detectFileType(fileName);
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      
      let fileContent = '';
      let fileUrl = null;
      
      if (isBlob) {
        // Upload do blob
        const blob = new Blob([content]);
        const file = new File([blob], fileName);
        const { file_url } = await onhub.integrations.Core.UploadFile({ file });
        fileUrl = file_url;
      } else {
        // Converter CSV para XLSX se necessário
        if (fileName.toLowerCase().endsWith('.csv')) {
          fileContent = convertCSVToXLSX(content);
        } else if (fileType === 'docx' || fileType === 'xlsx' || fileType === 'pptx') {
          fileContent = content;
        } else if (fileType === 'kbn' || fileType === 'gnt' || fileType === 'crn' || fileType === 'flux') {
          try {
            JSON.parse(content); // Validar JSON
            fileContent = content;
          } catch {
            fileContent = '';
          }
        }
      }
      
      await onhub.entities.File.create({
        name: baseName,
        type: fileType,
        folder_id: parentId,
        team_id: teamId,
        content: fileContent,
        file_url: fileUrl,
        owner: user.email,
        deleted: false
      });
    };
    
    // Processar estrutura do ZIP
    const paths = Object.keys(zip.files).sort();
    
    for (const path of paths) {
      const zipEntry = zip.files[path];
      
      if (zipEntry.dir) {
        // É uma pasta
        const pathParts = path.replace(/\/$/, '').split('/');
        let currentParentId = folderId;
        let currentPath = '';
        
        for (const part of pathParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (!folderMap.has(currentPath)) {
            const newFolderId = await createFolder(currentPath, currentParentId);
            folderMap.set(currentPath, newFolderId);
            currentParentId = newFolderId;
          } else {
            currentParentId = folderMap.get(currentPath);
          }
        }
      } else {
        // É um arquivo
        const pathParts = path.split('/');
        const fileName = pathParts.pop();
        const folderPath = pathParts.join('/');
        
        // Criar pastas pai se necessário
        let parentId = folderId;
        if (folderPath) {
          const parts = folderPath.split('/');
          let currentPath = '';
          
          for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            
            if (!folderMap.has(currentPath)) {
              const newFolderId = await createFolder(currentPath, parentId);
              folderMap.set(currentPath, newFolderId);
              parentId = newFolderId;
            } else {
              parentId = folderMap.get(currentPath);
            }
          }
        }
        
        // Extrair e criar arquivo
        const fileType = detectFileType(fileName);
        const isBinary = fileType === 'img' || fileType === 'video' || fileType === 'pdf' || fileType === 'other';
        
        if (isBinary) {
          const blob = await zipEntry.async('blob');
          await createFile(fileName, blob, parentId, true);
        } else {
          const content = await zipEntry.async('text');
          await createFile(fileName, content, parentId, false);
        }
      }
    }
    
    alert(`ZIP extraído com sucesso! Estrutura importada.`);
    onUploadComplete?.();
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
        const { file_url } = await onhub.integrations.Core.UploadFile({ file });
        const fileType = detectFileType(file.name);
        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        
        const newFile = await onhub.entities.File.create({
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
    const type = detectFileType(file.name);
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
          {extracting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">Extraindo arquivo ZIP...</p>
                <p className="text-xs text-blue-600">Criando pastas e arquivos</p>
              </div>
            </div>
          )}

          <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${extracting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Clique para selecionar arquivos ou ZIP
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Imagens, vídeos, documentos, planilhas (.csv, .doc, .docx, .xls, .xlsx) ou arquivos .zip
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-600">
                <Archive className="w-4 h-4" />
                <span>Arquivos ZIP serão extraídos automaticamente</span>
              </div>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.pdf,.zip,.kbn,.gnt,.crn,.flux"
              disabled={uploading || extracting}
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
            disabled={uploading || extracting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading || extracting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : extracting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extraindo ZIP...
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
