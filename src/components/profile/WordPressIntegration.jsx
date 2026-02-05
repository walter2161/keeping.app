import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Globe, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  ExternalLink,
  Database,
  RefreshCw,
  FileCode,
  Server,
  Shield,
  Plug
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { onhub } from '@/api/onhubClient';

export default function WordPressIntegration({ user }) {
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('download');
  const [wpUrl, setWpUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleDownloadPlugin = () => {
    // Gerar o arquivo PHP do plugin
    const phpContent = generatePluginCode();
    const blob = new Blob([phpContent], { type: 'application/x-php' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'onhub-wp-sync.php';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePluginCode = () => {
    // Retorna o conteúdo do plugin PHP
    return `<?php
/**
 * Plugin Name: OnHub WP Sync - Integração Completa
 * Plugin URI:  https://onhub.app/plugin
 * Description: Sincroniza dados do OnHub com WordPress via REST API.
 * Version:     3.0.0
 * Author:      OnHub Team
 * License:     GPLv2 or later
 */

// Para o código completo, baixe de: src/api/dataled.php
// Este é um arquivo simplificado para download rápido

if (!defined('ABSPATH')) exit;

// Redirecionar para o arquivo principal
require_once plugin_dir_path(__FILE__) . 'dataled.php';
`;
  };

  const testConnection = async () => {
    if (!wpUrl || !apiKey) {
      setTestResult({ success: false, message: 'Preencha a URL e a API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${wpUrl}/wp-json/onhub/v1/health`, {
        method: 'GET',
        headers: {
          'X-OnHub-Key': apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({ 
          success: true, 
          message: `Conexão estabelecida! Versão: ${data.version}`,
          data 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `Erro ${response.status}: ${response.statusText}` 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Erro de conexão: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  const syncToWordPress = async () => {
    if (!wpUrl || !apiKey) {
      setSyncResult({ success: false, message: 'Configure a conexão primeiro' });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      // Buscar dados do OnHub
      const [folders, files, teams] = await Promise.all([
        onhub.entities.Folder.list(),
        onhub.entities.File.list(),
        onhub.entities.Team.list(),
      ]);

      const results = {
        folders: { synced: 0, errors: 0 },
        files: { synced: 0, errors: 0 },
        teams: { synced: 0, errors: 0 },
      };

      // Sincronizar pastas
      if (folders.length > 0) {
        const foldersRes = await fetch(`${wpUrl}/wp-json/onhub/v1/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OnHub-Key': apiKey,
          },
          body: JSON.stringify({ table: 'folders', data: folders }),
        });
        if (foldersRes.ok) {
          const data = await foldersRes.json();
          results.folders.synced = data.synced;
        }
      }

      // Sincronizar arquivos
      if (files.length > 0) {
        const filesRes = await fetch(`${wpUrl}/wp-json/onhub/v1/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OnHub-Key': apiKey,
          },
          body: JSON.stringify({ table: 'files', data: files }),
        });
        if (filesRes.ok) {
          const data = await filesRes.json();
          results.files.synced = data.synced;
        }
      }

      // Sincronizar equipes
      if (teams.length > 0) {
        const teamsRes = await fetch(`${wpUrl}/wp-json/onhub/v1/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OnHub-Key': apiKey,
          },
          body: JSON.stringify({ table: 'teams', data: teams }),
        });
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          results.teams.synced = data.synced;
        }
      }

      const totalSynced = results.folders.synced + results.files.synced + results.teams.synced;
      setSyncResult({
        success: true,
        message: `Sincronização concluída! ${totalSynced} itens sincronizados.`,
        details: results,
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: `Erro na sincronização: ${error.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Integração WordPress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">
              Conecte o OnHub ao seu site WordPress para sincronizar e fazer backup dos seus dados.
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Backup automático de todas as suas pastas e arquivos</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Sincronização bidirecional com WordPress</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>API REST segura com autenticação por chave</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Suporte a todas as entidades: Pastas, Arquivos, Equipes, etc.</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowDialog(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plug className="w-4 h-4 mr-2" />
            Configurar Integração WordPress
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Integração WordPress - OnHub Sync
            </DialogTitle>
            <DialogDescription>
              Configure a integração para sincronizar seus dados com WordPress
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="download">
                <Download className="w-4 h-4 mr-2" />
                Plugin
              </TabsTrigger>
              <TabsTrigger value="install">
                <FileCode className="w-4 h-4 mr-2" />
                Instalação
              </TabsTrigger>
              <TabsTrigger value="connect">
                <Key className="w-4 h-4 mr-2" />
                Conectar
              </TabsTrigger>
              <TabsTrigger value="sync">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </TabsTrigger>
            </TabsList>

            {/* Tab: Download */}
            <TabsContent value="download" className="space-y-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Passo 1: Baixar o Plugin
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Baixe o plugin OnHub WP Sync para instalar no seu WordPress.
                </p>
                
                <Button onClick={handleDownloadPlugin} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Plugin WordPress (.php)
                </Button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">O que o plugin inclui:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    9 Custom Post Types para todas as entidades do OnHub
                  </li>
                  <li className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-600" />
                    API REST completa com CRUD
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Sistema de autenticação por API Key
                  </li>
                  <li className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    Endpoint de sincronização em lote
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Tab: Instalação */}
            <TabsContent value="install" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</span>
                    Upload do Plugin
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 ml-8">
                    <li>Acesse o painel admin do WordPress</li>
                    <li>Vá em <strong>Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong></li>
                    <li>Selecione o arquivo <code className="bg-gray-100 px-1 rounded">onhub-wp-sync.php</code></li>
                    <li>Clique em <strong>Instalar Agora</strong></li>
                  </ol>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</span>
                    Ativar o Plugin
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 ml-8">
                    <li>Após instalar, clique em <strong>Ativar Plugin</strong></li>
                    <li>Um novo menu <strong>OnHub Sync</strong> aparecerá no painel</li>
                  </ol>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</span>
                    Criar API Key
                  </h3>
                  <ol className="text-sm text-gray-700 space-y-2 ml-8">
                    <li>No WordPress, vá em <strong>OnHub Sync &gt; API Keys</strong></li>
                    <li>Clique em <strong>Criar API Key</strong></li>
                    <li>Copie a chave gerada (ela só aparece uma vez!)</li>
                    <li>Cole a chave na aba "Conectar" aqui no OnHub</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Requisitos
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>WordPress 5.0 ou superior</li>
                    <li>PHP 7.4 ou superior</li>
                    <li>SSL habilitado (HTTPS) recomendado</li>
                    <li>Permissões de administrador</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Conectar */}
            <TabsContent value="connect" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    URL do seu site WordPress
                  </label>
                  <Input
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    placeholder="https://seusite.com.br"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: https://meusite.com.br (sem barra no final)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    API Key do WordPress
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="onhub_xxxxxxxxxxxxxxxx"
                      type="password"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(apiKey)}
                      disabled={!apiKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Criada em OnHub Sync &gt; API Keys no WordPress
                  </p>
                </div>

                <Button 
                  onClick={testConnection} 
                  disabled={testing || !wpUrl || !apiKey}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testando conexão...
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                        {testResult.message}
                      </span>
                    </div>
                    {testResult.data && (
                      <div className="mt-2 text-xs text-green-700">
                        <p>Tabelas disponíveis: {testResult.data.tables?.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Endpoint da API:</h4>
                  <code className="text-sm bg-gray-200 px-2 py-1 rounded block">
                    {wpUrl || 'https://seusite.com.br'}/wp-json/onhub/v1/
                  </code>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Sincronizar */}
            <TabsContent value="sync" className="space-y-4 mt-4">
              {!wpUrl || !apiKey ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="w-5 h-5" />
                    <span>Configure a conexão primeiro na aba "Conectar"</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Sincronizar Dados para WordPress
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Envie todos os seus dados do OnHub para o WordPress. Isso criará ou atualizará os registros no banco de dados do WordPress.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white p-3 rounded border">
                        <Database className="w-5 h-5 text-blue-600 mb-1" />
                        <p className="text-xs text-gray-600">Pastas</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <FileCode className="w-5 h-5 text-green-600 mb-1" />
                        <p className="text-xs text-gray-600">Arquivos</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <Server className="w-5 h-5 text-purple-600 mb-1" />
                        <p className="text-xs text-gray-600">Equipes</p>
                      </div>
                    </div>

                    <Button 
                      onClick={syncToWordPress} 
                      disabled={syncing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sincronizar Agora
                        </>
                      )}
                    </Button>
                  </div>

                  {syncResult && (
                    <div className={`p-4 rounded-lg border ${
                      syncResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {syncResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {syncResult.message}
                        </span>
                      </div>
                      {syncResult.details && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-white p-2 rounded text-center">
                            <p className="text-lg font-bold text-blue-600">{syncResult.details.folders.synced}</p>
                            <p className="text-xs text-gray-600">Pastas</p>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <p className="text-lg font-bold text-green-600">{syncResult.details.files.synced}</p>
                            <p className="text-xs text-gray-600">Arquivos</p>
                          </div>
                          <div className="bg-white p-2 rounded text-center">
                            <p className="text-lg font-bold text-purple-600">{syncResult.details.teams.synced}</p>
                            <p className="text-xs text-gray-600">Equipes</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Acessar WordPress
                    </h4>
                    <a 
                      href={`${wpUrl}/wp-admin/admin.php?page=onhub-sync`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Abrir painel OnHub Sync no WordPress
                    </a>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
