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
    
    return `package com.keeping.sync;

import com.google.gson.*;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;

/**
 * Keeping Desktop Sync - Sincronização Local com Base44
 * Versão: 1.0.0
 * Requisitos: Java 11+
 */
public class KeepingSync {
    
    // ========================================
    // CONFIGURAÇÕES
    // ========================================
    
    private static final String API_URL = "${apiUrl}";
    private static final String APP_ID = "${appId}";
    private static String API_KEY = ""; // PREENCHER COM SUA API KEY
    
    private static final String USER_EMAIL = "${user?.email || ''}";
    private static final String SYNC_FOLDER = System.getProperty("user.home") + "/Keeping Drive";
    private static final int SYNC_INTERVAL = 30; // segundos
    
    // ========================================
    // CLIENTE HTTP
    // ========================================
    
    static class Base44Client {
        private final String apiUrl;
        private final String appId;
        private final String apiKey;
        private final Gson gson;
        
        public Base44Client(String apiUrl, String appId, String apiKey) {
            this.apiUrl = apiUrl;
            this.appId = appId;
            this.apiKey = apiKey;
            this.gson = new Gson();
        }
        
        private HttpURLConnection createConnection(String endpoint) throws IOException {
            URL url = new URL(apiUrl + "/apps/" + appId + "/entities/" + endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("X-App-ID", appId);
            conn.setRequestProperty("X-API-Key", apiKey);
            conn.setRequestProperty("Content-Type", "application/json");
            return conn;
        }
        
        public JsonArray listFolders() {
            try {
                HttpURLConnection conn = createConnection("Folder");
                conn.setRequestMethod("GET");
                
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                JsonArray folders = gson.fromJson(reader, JsonArray.class);
                reader.close();
                return folders;
            } catch (Exception e) {
                System.out.println("❌ Erro ao buscar pastas: " + e.getMessage());
                return new JsonArray();
            }
        }
        
        public JsonArray listFiles() {
            try {
                HttpURLConnection conn = createConnection("File");
                conn.setRequestMethod("GET");
                
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                JsonArray files = gson.fromJson(reader, JsonArray.class);
                reader.close();
                return files;
            } catch (Exception e) {
                System.out.println("❌ Erro ao buscar arquivos: " + e.getMessage());
                return new JsonArray();
            }
        }
        
        public byte[] downloadFile(String fileUrl) {
            try {
                URL url = new URL(fileUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                InputStream in = conn.getInputStream();
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                in.close();
                return out.toByteArray();
            } catch (Exception e) {
                System.out.println("❌ Erro ao baixar arquivo: " + e.getMessage());
                return null;
            }
        }
    }
    
    // ========================================
    // SINCRONIZAÇÃO
    // ========================================
    
    static class Synchronizer {
        private final Base44Client client;
        private final Path syncFolder;
        private final String userEmail;
        private final Map<String, Path> folderMap;
        
        public Synchronizer(Base44Client client, String syncFolder, String userEmail) {
            this.client = client;
            this.syncFolder = Paths.get(syncFolder);
            this.userEmail = userEmail;
            this.folderMap = new HashMap<>();
        }
        
        public void initSyncFolder() throws IOException {
            Files.createDirectories(syncFolder);
            System.out.println("✅ Pasta de sincronização: " + syncFolder);
        }
        
        public void buildFolderStructure(JsonArray folders) throws IOException {
            folderMap.clear();
            
            for (JsonElement elem : folders) {
                JsonObject folder = elem.getAsJsonObject();
                if (!folder.has("parent_id") && !getBoolean(folder, "deleted")) {
                    if (getString(folder, "owner").equals(userEmail)) {
                        createFolderRecursive(folder, syncFolder, folders);
                    }
                }
            }
        }
        
        private void createFolderRecursive(JsonObject folder, Path parentPath, JsonArray allFolders) throws IOException {
            String folderName = sanitizeName(getString(folder, "name"));
            Path folderPath = parentPath.resolve(folderName);
            Files.createDirectories(folderPath);
            folderMap.put(getString(folder, "id"), folderPath);
            
            String folderId = getString(folder, "id");
            for (JsonElement elem : allFolders) {
                JsonObject child = elem.getAsJsonObject();
                if (child.has("parent_id") && 
                    getString(child, "parent_id").equals(folderId) && 
                    !getBoolean(child, "deleted")) {
                    createFolderRecursive(child, folderPath, allFolders);
                }
            }
        }
        
        public void syncFiles(JsonArray files) {
            List<JsonObject> myFiles = new ArrayList<>();
            for (JsonElement elem : files) {
                JsonObject file = elem.getAsJsonObject();
                if (getString(file, "owner").equals(userEmail) && !getBoolean(file, "deleted")) {
                    myFiles.add(file);
                }
            }
            
            System.out.println("📂 Sincronizando " + myFiles.size() + " arquivos...");
            
            for (JsonObject file : myFiles) {
                try {
                    syncFile(file);
                } catch (Exception e) {
                    System.out.println("❌ Erro ao sincronizar " + getString(file, "name") + ": " + e.getMessage());
                }
            }
        }
        
        private void syncFile(JsonObject file) throws IOException {
            Path folderPath = syncFolder;
            if (file.has("folder_id")) {
                String folderId = getString(file, "folder_id");
                if (folderMap.containsKey(folderId)) {
                    folderPath = folderMap.get(folderId);
                }
            }
            
            String fileName = sanitizeName(getString(file, "name"));
            String fileType = getString(file, "type");
            
            String fullName;
            if (Arrays.asList("docx", "xlsx", "pptx", "pdf").contains(fileType)) {
                fullName = fileName + "." + fileType;
            } else if (Arrays.asList("kbn", "gnt", "crn", "flux").contains(fileType)) {
                fullName = fileName + ".json";
            } else {
                fullName = fileName;
            }
            
            Path filePath = folderPath.resolve(fullName);
            
            if (file.has("file_url") && !getString(file, "file_url").isEmpty()) {
                byte[] content = client.downloadFile(getString(file, "file_url"));
                if (content != null) {
                    Files.write(filePath, content);
                    System.out.println("✅ " + fullName);
                }
            } else if (file.has("content")) {
                String content = getString(file, "content");
                Files.write(filePath, content.getBytes("UTF-8"));
                System.out.println("✅ " + fullName);
            }
        }
        
        private String sanitizeName(String name) {
            return name.replaceAll("[<>:\"/\\\\\\\\|?*]", "_");
        }
        
        private String getString(JsonObject obj, String key) {
            return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : "";
        }
        
        private boolean getBoolean(JsonObject obj, String key) {
            return obj.has(key) && !obj.get(key).isJsonNull() && obj.get(key).getAsBoolean();
        }
        
        public void runSync() throws IOException {
            String time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
            System.out.println("\\n🔄 Sincronizando... [" + time + "]");
            
            JsonArray folders = client.listFolders();
            JsonArray files = client.listFiles();
            
            buildFolderStructure(folders);
            syncFiles(files);
            
            System.out.println("✅ Sincronização concluída!");
        }
    }
    
    // ========================================
    // MAIN
    // ========================================
    
    public static void main(String[] args) {
        System.out.println("""
╔═══════════════════════════════════════════╗
║   Keeping Desktop Sync - Base44           ║
║   Sincronização Local de Arquivos         ║
╚═══════════════════════════════════════════╝
""");
        
        if (API_KEY.isEmpty()) {
            System.out.println("❌ ERRO: API_KEY não configurada!");
            System.out.println("\\n📝 Instruções:");
            System.out.println("1. Abra este arquivo em um editor de texto");
            System.out.println("2. Preencha a variável API_KEY com sua chave de API");
            System.out.println("3. Compile e execute novamente");
            System.exit(1);
        }
        
        if (USER_EMAIL.isEmpty()) {
            System.out.println("❌ ERRO: USER_EMAIL não configurado!");
            System.exit(1);
        }
        
        System.out.println("👤 Usuário: " + USER_EMAIL);
        System.out.println("📁 Pasta: " + SYNC_FOLDER);
        System.out.println("🔄 Intervalo: " + SYNC_INTERVAL + "s");
        System.out.println();
        
        try {
            Base44Client client = new Base44Client(API_URL, APP_ID, API_KEY);
            Synchronizer sync = new Synchronizer(client, SYNC_FOLDER, USER_EMAIL);
            sync.initSyncFolder();
            
            sync.runSync();
            
            System.out.println("\\n⏰ Sincronização automática ativada (a cada " + SYNC_INTERVAL + "s)");
            System.out.println("Pressione Ctrl+C para parar\\n");
            
            ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
            scheduler.scheduleAtFixedRate(() -> {
                try {
                    sync.runSync();
                } catch (Exception e) {
                    System.out.println("❌ Erro na sincronização: " + e.getMessage());
                }
            }, SYNC_INTERVAL, SYNC_INTERVAL, TimeUnit.SECONDS);
            
            Thread.currentThread().join();
            
        } catch (Exception e) {
            System.out.println("❌ Erro: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
`;
  };

  const handleDownloadScript = () => {
    const script = generateSyncScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KeepingSync.java';
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
            Baixar Script de Sincronização (.java)
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
                <p>• Java 11 ou superior (JDK instalado)</p>
                <p>• Biblioteca Gson para JSON:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs">
                  Baixar: https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar
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
                <p>1. Abra o arquivo <code className="bg-gray-100 px-1 rounded">KeepingSync.java</code> em um editor</p>
                <p>2. Procure a linha:</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                  private static String API_KEY = ""; // PREENCHER
                </div>
                <p>3. Cole sua API Key entre as aspas (obtenha no painel Base44)</p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</span>
                Compilar e Executar
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p>No terminal/prompt de comando:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs space-y-1">
                  <div># Compilar (coloque gson-2.10.1.jar na mesma pasta)</div>
                  <div>javac -cp "gson-2.10.1.jar" KeepingSync.java</div>
                  <div></div>
                  <div># Executar</div>
                  <div>java -cp ".;gson-2.10.1.jar" com.keeping.sync.KeepingSync</div>
                </div>
                <p className="text-gray-600 italic">Linux/Mac: use <code>:</code> ao invés de <code>;</code></p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">4</span>
                Gerar Executável (.exe) - Opcional
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-700">
                <p>Criar JAR executável:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs space-y-1">
                  <div># Criar manifest.txt com:</div>
                  <div>Main-Class: com.keeping.sync.KeepingSync</div>
                  <div></div>
                  <div># Gerar JAR</div>
                  <div>jar cfm KeepingSync.jar manifest.txt *.class gson-2.10.1.jar</div>
                  <div></div>
                  <div># Executar</div>
                  <div>java -jar KeepingSync.jar</div>
                </div>
                <p className="mt-2">Use Launch4j para converter JAR em EXE no Windows</p>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Configurações Avançadas
              </h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p>• <strong>SYNC_FOLDER:</strong> Altere no código (linha ~20)</p>
                <p>• <strong>SYNC_INTERVAL:</strong> Ajuste o intervalo (linha ~21)</p>
                <p>• Arquivos salvos em <code className="bg-white px-1 rounded">~/Keeping Drive</code></p>
                <p>• Necessita Gson: <a href="https://github.com/google/gson" className="text-blue-600 underline" target="_blank">github.com/google/gson</a></p>
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