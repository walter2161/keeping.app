import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Database, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Settings() {
  const [wpUrl, setWpUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Carregar configurações do usuário
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setWpUrl(user.wp_url || '');
      setApiKey(user.wp_api_key || '');
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);

    try {
      const cleanUrl = wpUrl.trim().replace(/\/$/, '');
      const response = await fetch(`${cleanUrl}/wp-json/keeping/v1/test`, {
        headers: {
          'X-API-Key': apiKey.trim(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestStatus({ success: true, data });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestStatus({ 
          success: false, 
          error: errorData.message || 'API Key inválida. Verifique suas credenciais.' 
        });
      }
    } catch (error) {
      setTestStatus({ success: false, error: 'Erro de conexão. Verifique a URL do WordPress.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    await updateSettingsMutation.mutateAsync({
      wp_url: wpUrl.trim(),
      wp_api_key: apiKey.trim(),
    });
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600">Configure a conexão com WordPress</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL do WordPress
              </label>
              <Input
                type="url"
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
                placeholder="https://seu-site.com"
                className="text-lg"
              />
              <p className="text-sm text-gray-500 mt-1">
                A URL base do seu site WordPress (sem barra no final)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="keeping_secure_key_2025"
                className="text-lg font-mono"
              />
              <p className="text-sm text-gray-500 mt-1">
                A chave de API configurada no plugin WordPress
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleTestConnection}
                disabled={!wpUrl || !apiKey || testing}
                variant="outline"
                className="flex-1"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Testar Conexão
              </Button>
              <Button
                onClick={handleSave}
                disabled={!wpUrl || !apiKey || updateSettingsMutation.isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {updateSettingsMutation.isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>

            {testStatus && (
              <div className={`p-4 rounded-lg border-l-4 ${
                testStatus.success 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-start gap-3">
                  {testStatus.success ? (
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      testStatus.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {testStatus.success ? '✓ Conexão bem-sucedida!' : '✗ Falha na conexão'}
                    </p>
                    {testStatus.success ? (
                      <div className="mt-2 text-sm text-green-800">
                        <p>{testStatus.data.message}</p>
                        <p className="mt-1"><strong>Usuário:</strong> {testStatus.data.user_email}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-800 mt-1">{testStatus.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold mb-3">ℹ️ Como configurar</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
              <li>Instale o plugin WordPress "Keeping Database API"</li>
              <li>Ative o plugin no painel do WordPress</li>
              <li>Cole a URL do seu site WordPress acima</li>
              <li>Cole a API Key que está no arquivo do plugin (linha 11)</li>
              <li>Clique em "Testar Conexão" para verificar</li>
              <li>Se tudo estiver OK, clique em "Salvar Configurações"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}