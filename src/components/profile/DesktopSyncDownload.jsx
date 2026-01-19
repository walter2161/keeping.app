import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, HardDrive, Info, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DesktopSyncDownload({ user }) {
  const [showInstructions, setShowInstructions] = useState(false);

  const generateSyncScript = () => {
    const apiUrl = import.meta.env.VITE_BASE44_API_URL || 'https://app.base44.com/api';
    const appId = import.meta.env.VITE_BASE44_APP_ID;
    
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Keeping Desktop Sync - Sincronização Local com Base44
Versão: 1.0.0
Requisitos: Python 3.8+
"""

import os
import sys
import json
import time
import requests
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# ========================================
# CONFIGURAÇÕES
# ========================================

# API Base44
API_URL = "${apiUrl}"
APP_ID = "${appId}"
API_KEY = ""  # PREENCHER COM SUA API KEY

# Email do usuário (usado para filtrar arquivos próprios)
USER_EMAIL = "${user?.email || ''}"

# Pasta local de sincronização
SYNC_FOLDER = os.path.expanduser("~/Keeping Drive")

# Intervalo de sincronização (segundos)
SYNC_INTERVAL = 30

# ========================================
# CLIENTE BASE44
# ========================================

class Base44Client:
    def __init__(self, api_url: str, app_id: str, api_key: str):
        self.api_url = api_url.rstrip('/')
        self.app_id = app_id
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'X-App-ID': app_id,
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def list_folders(self) -> List[Dict]:
        """Lista todas as pastas"""
        try:
            response = self.session.get(f"{self.api_url}/apps/{self.app_id}/entities/Folder")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Erro ao buscar pastas: {e}")
            return []
    
    def list_files(self) -> List[Dict]:
        """Lista todos os arquivos"""
        try:
            response = self.session.get(f"{self.api_url}/apps/{self.app_id}/entities/File")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Erro ao buscar arquivos: {e}")
            return []
    
    def download_file(self, file_url: str) -> Optional[bytes]:
        """Baixa arquivo externo"""
        try:
            response = requests.get(file_url)
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"❌ Erro ao baixar arquivo: {e}")
            return None

# ========================================
# SINCRONIZAÇÃO
# ========================================

class KeepingSync:
    def __init__(self, client: Base44Client, sync_folder: str, user_email: str):
        self.client = client
        self.sync_folder = Path(sync_folder)
        self.user_email = user_email
        self.folder_map = {}  # id -> path local
        
    def init_sync_folder(self):
        """Cria pasta de sincronização"""
        self.sync_folder.mkdir(parents=True, exist_ok=True)
        print(f"✅ Pasta de sincronização: {self.sync_folder}")
    
    def build_folder_structure(self, folders: List[Dict]):
        """Constrói estrutura de pastas locais"""
        self.folder_map = {}
        
        # Pastas raiz
        root_folders = [f for f in folders if not f.get('parent_id') and not f.get('deleted')]
        for folder in root_folders:
            if folder.get('owner') == self.user_email:
                self._create_folder_recursive(folder, self.sync_folder, folders)
    
    def _create_folder_recursive(self, folder: Dict, parent_path: Path, all_folders: List[Dict]):
        """Cria pasta e subpastas recursivamente"""
        folder_path = parent_path / self._sanitize_name(folder['name'])
        folder_path.mkdir(exist_ok=True)
        self.folder_map[folder['id']] = folder_path
        
        # Subpastas
        children = [f for f in all_folders if f.get('parent_id') == folder['id'] and not f.get('deleted')]
        for child in children:
            self._create_folder_recursive(child, folder_path, all_folders)
    
    def sync_files(self, files: List[Dict]):
        """Sincroniza arquivos"""
        my_files = [f for f in files if f.get('owner') == self.user_email and not f.get('deleted')]
        
        print(f"📂 Sincronizando {len(my_files)} arquivos...")
        
        for file in my_files:
            try:
                self._sync_file(file)
            except Exception as e:
                print(f"❌ Erro ao sincronizar {file.get('name')}: {e}")
    
    def _sync_file(self, file: Dict):
        """Sincroniza arquivo individual"""
        # Determinar pasta local
        folder_id = file.get('folder_id')
        if folder_id and folder_id in self.folder_map:
            folder_path = self.folder_map[folder_id]
        else:
            folder_path = self.sync_folder
        
        file_name = self._sanitize_name(file['name'])
        file_type = file.get('type', 'other')
        
        # Nome do arquivo com extensão
        if file_type in ['docx', 'xlsx', 'pptx', 'pdf']:
            full_name = f"{file_name}.{file_type}"
        elif file_type in ['kbn', 'gnt', 'crn', 'flux']:
            full_name = f"{file_name}.json"
        elif file_type in ['img', 'video', 'other']:
            full_name = file_name
        else:
            full_name = f"{file_name}.txt"
        
        file_path = folder_path / full_name
        
        # Verificar se arquivo já existe e está atualizado
        if file_path.exists():
            local_mtime = datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            remote_mtime = file.get('updated_date', file.get('created_date', ''))
            
            if local_mtime >= remote_mtime:
                return  # Arquivo local está atualizado
        
        # Baixar/criar arquivo
        if file.get('file_url'):
            # Arquivo externo (img, video, etc)
            content = self.client.download_file(file['file_url'])
            if content:
                file_path.write_bytes(content)
                print(f"✅ {full_name}")
        else:
            # Arquivo com conteúdo JSON
            content = file.get('content', '')
            if content:
                file_path.write_text(content, encoding='utf-8')
                print(f"✅ {full_name}")
    
    def _sanitize_name(self, name: str) -> str:
        """Remove caracteres inválidos do nome"""
        invalid_chars = '<>:"/\\\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '_')
        return name
    
    def run_sync(self):
        """Executa uma sincronização completa"""
        print(f"\\n🔄 Sincronizando... [{datetime.now().strftime('%H:%M:%S')}]")
        
        folders = self.client.list_folders()
        files = self.client.list_files()
        
        self.build_folder_structure(folders)
        self.sync_files(files)
        
        print(f"✅ Sincronização concluída!")

# ========================================
# MAIN
# ========================================

def main():
    print("""
╔═══════════════════════════════════════════╗
║   Keeping Desktop Sync - Base44           ║
║   Sincronização Local de Arquivos         ║
╚═══════════════════════════════════════════╝
""")
    
    # Validar configurações
    if not API_KEY:
        print("❌ ERRO: API_KEY não configurada!")
        print("\\n📝 Instruções:")
        print("1. Abra este script em um editor de texto")
        print("2. Preencha a variável API_KEY com sua chave de API")
        print("3. Salve e execute novamente")
        sys.exit(1)
    
    if not USER_EMAIL:
        print("❌ ERRO: USER_EMAIL não configurado!")
        sys.exit(1)
    
    print(f"👤 Usuário: {USER_EMAIL}")
    print(f"📁 Pasta: {SYNC_FOLDER}")
    print(f"🔄 Intervalo: {SYNC_INTERVAL}s")
    print()
    
    # Inicializar cliente
    client = Base44Client(API_URL, APP_ID, API_KEY)
    sync = KeepingSync(client, SYNC_FOLDER, USER_EMAIL)
    sync.init_sync_folder()
    
    # Sincronização inicial
    sync.run_sync()
    
    # Loop de sincronização
    print(f"\\n⏰ Sincronização automática ativada (a cada {SYNC_INTERVAL}s)")
    print("Pressione Ctrl+C para parar\\n")
    
    try:
        while True:
            time.sleep(SYNC_INTERVAL)
            sync.run_sync()
    except KeyboardInterrupt:
        print("\\n👋 Sincronização interrompida pelo usuário")
        sys.exit(0)

if __name__ == "__main__":
    main()
`;
  };

  const handleDownloadScript = () => {
    const script = generateSyncScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keeping_sync.py';
    a.click();
    URL.revokeObjectURL(url);
    
    setShowInstructions(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Sincronização Desktop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">
              Baixe o script de sincronização para manter seus arquivos sempre atualizados no seu computador.
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Sincronização automática em tempo real</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Pasta local espelhada com seus arquivos na nuvem</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Compatível com Windows, Mac e Linux</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleDownloadScript}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Script de Sincronização (.py)
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowInstructions(true)}
            className="w-full"
          >
            <Info className="w-4 h-4 mr-2" />
            Ver Instruções Completas
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Instruções de Instalação</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para configurar a sincronização desktop
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Passo 1 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</span>
                Requisitos
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p>• Python 3.8 ou superior instalado</p>
                <p>• Biblioteca <code className="bg-gray-100 px-1 rounded">requests</code>:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs">
                  pip install requests
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</span>
                Configurar API Key
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p>1. Abra o arquivo <code className="bg-gray-100 px-1 rounded">keeping_sync.py</code> em um editor de texto</p>
                <p>2. Procure a linha:</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                  API_KEY = ""  # PREENCHER COM SUA API KEY
                </div>
                <p>3. Cole sua API Key entre as aspas (obtenha no painel Base44)</p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</span>
                Executar Script
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p>No terminal/prompt de comando:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs">
                  python3 keeping_sync.py
                </div>
                <p className="text-gray-600 italic">Windows: use <code>python</code> ao invés de <code>python3</code></p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">4</span>
                Gerar Executável (.exe) - Opcional
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p>Para criar um executável:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs space-y-1">
                  <div>pip install pyinstaller</div>
                  <div>pyinstaller --onefile --name "KeepingSync" keeping_sync.py</div>
                </div>
                <p className="mt-2">O executável estará em <code className="bg-gray-100 px-1 rounded">dist/KeepingSync.exe</code></p>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Configurações Avançadas
              </h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p>• <strong>SYNC_FOLDER:</strong> Altere o caminho da pasta de sincronização</p>
                <p>• <strong>SYNC_INTERVAL:</strong> Ajuste o intervalo de sincronização (em segundos)</p>
                <p>• Os arquivos serão salvos em <code className="bg-white px-1 rounded">~/Keeping Drive</code> por padrão</p>
              </div>
            </div>

            {/* Limitações */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">⚠️ Importante</h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p>• Sincronização é <strong>unidirecional</strong> (nuvem → local)</p>
                <p>• Alterações locais NÃO são enviadas para a nuvem</p>
                <p>• Para montar como drive virtual (letra Z:, etc), use software como WinFsp ou Dokan</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}