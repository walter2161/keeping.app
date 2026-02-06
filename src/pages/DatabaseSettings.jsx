import React, { useState, useEffect } from 'react';
import { onhub } from '@/api/onhubClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Database, ArrowLeft, CheckCircle2, XCircle, Loader2, 
  Server, Key, Wifi, WifiOff, RefreshCw, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DatabaseSettings() {
  const [wpUrl, setWpUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success, message }
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    document.title = 'OnHub | Banco de Dados';
    const config = onhub.wp.getConfig();
    if (config) {
      setWpUrl(config.url);
      setApiKey(config.apiKey);
      setIsSaved(true);
    }
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const url = wpUrl.replace(/\/+$/, '');
      const res = await fetch(`${url}/wp-json/onhub/v1/ping`, {
        headers: { 'X-OnHub-Key': apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({ success: true, message: data.message || 'Conexao bem-sucedida com o WordPress!' });
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({ success: false, message: data.message || `Erro ${res.status}: Nao foi possivel conectar.` });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Nao foi possivel conectar. Verifique a URL e se o plugin esta ativo.' });
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    if (!wpUrl.trim() || !apiKey.trim()) return;
    onhub.wp.setConfig(wpUrl.trim(), apiKey.trim());
    setIsSaved(true);
    setTestResult({ success: true, message: 'Configuracao salva com sucesso!' });
  };

  const handleDisconnect = () => {
    onhub.wp.clearConfig();
    setWpUrl('');
    setApiKey('');
    setIsSaved(false);
    setTestResult(null);
  };

  const isConnected = onhub.wp.isConnected();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-6 py-4">
          <Link
            to={createPageUrl('Desktop')}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Banco de Dados</h1>
              <p className="text-sm text-gray-400">Conectar ao WordPress (plugin OnHub DB)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              {isConnected ? (
                <>
                  <div className="p-3 bg-green-600/20 rounded-full">
                    <Wifi className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-400">Conectado ao WordPress</p>
                    <p className="text-sm text-gray-400">{onhub.wp.getConfig()?.url}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}
                    className="border-red-700 text-red-400 hover:bg-red-900/30 hover:text-red-300">
                    Desconectar
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-gray-700/50 rounded-full">
                    <WifiOff className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-300">Modo Offline (localStorage)</p>
                    <p className="text-sm text-gray-500">Os dados estao armazenados localmente no navegador.</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Alert className="bg-blue-900/20 border-blue-800">
          <Info className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-sm">
            Para usar o banco de dados WordPress, instale o plugin <strong>OnHub DB</strong> no seu WordPress.
            O plugin cria uma REST API segura que o OnHub usa para armazenar pastas, arquivos e equipes.
            Enquanto nao configurar, os dados ficam salvos localmente no navegador.
          </AlertDescription>
        </Alert>

        {/* Config Form */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Server className="w-4 h-4" />
              Configuracao do WordPress
            </CardTitle>
            <CardDescription className="text-gray-400">
              Insira a URL do seu WordPress e a chave API gerada pelo plugin OnHub DB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wp-url" className="text-gray-300">URL do WordPress</Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="wp-url"
                  type="url"
                  value={wpUrl}
                  onChange={(e) => { setWpUrl(e.target.value); setIsSaved(false); }}
                  placeholder="https://meusite.com.br"
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-gray-300">Chave API (API Key)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setIsSaved(false); }}
                  placeholder="Chave gerada no painel do plugin"
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                />
              </div>
            </div>

            {testResult && (
              <Alert className={testResult.success
                ? 'bg-green-900/20 border-green-800'
                : 'bg-red-900/20 border-red-800'
              }>
                {testResult.success
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <XCircle className="w-4 h-4 text-red-400" />
                }
                <AlertDescription className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!wpUrl.trim() || !apiKey.trim() || isTesting}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {isTesting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Testar Conexao</>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!wpUrl.trim() || !apiKey.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaved ? 'Salvo' : 'Salvar Configuracao'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WP Plugin info */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Como instalar o plugin OnHub DB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-400">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              <p>Baixe o plugin <strong className="text-gray-200">onhub-db.zip</strong> disponibilizado pela equipe OnHub.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              <p>No painel do WordPress, va em <strong className="text-gray-200">Plugins &gt; Adicionar Novo &gt; Enviar Plugin</strong> e faca o upload.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              <p>Ative o plugin e acesse <strong className="text-gray-200">OnHub DB</strong> no menu lateral para copiar sua chave API.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
              <p>Cole a URL do site e a chave API nos campos acima e clique em <strong className="text-gray-200">Testar Conexao</strong>.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
