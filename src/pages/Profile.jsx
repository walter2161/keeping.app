import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Save, Loader2, ArrowLeft, Upload, X, Database, Folder, File, HardDrive, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
    enabled: !!user,
  });

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => base44.entities.File.list(),
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    profile_picture: user?.profile_picture || '',
    auto_refresh_interval: user?.auto_refresh_interval || 120,
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        profile_picture: user.profile_picture || '',
        auto_refresh_interval: user.auto_refresh_interval || 120,
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSaving(false);
      alert('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      setSaving(false);
      alert('Erro ao atualizar perfil: ' + error.message);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    updateProfileMutation.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_picture: file_url });
    } catch (error) {
      alert('Erro ao fazer upload da imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Calcular métricas
  const myFolders = folders.filter(f => f.owner === user?.email && !f.deleted);
  const myFiles = files.filter(f => f.owner === user?.email && !f.deleted);
  
  // Calcular uso de armazenamento (estimativa baseada em conteúdo)
  const totalContentSize = myFiles.reduce((acc, file) => {
    const contentSize = file.content ? new Blob([file.content]).size : 0;
    return acc + contentSize;
  }, 0);
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Distribuição por tipo de arquivo
  const filesByType = myFiles.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {});

  const typeIcons = {
    docx: '📄',
    xlsx: '📊',
    pptx: '📽️',
    kbn: '📋',
    gnt: '📅',
    crn: '⏱️',
    flux: '🔀',
    pdf: '📕',
    img: '🖼️',
    video: '🎬',
    other: '📎'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <Link to={createPageUrl('Drive')}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Drive
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Foto de Perfil
              </label>
              {formData.profile_picture ? (
                <div className="flex items-center gap-4">
                  <img 
                    src={formData.profile_picture} 
                    alt="Perfil"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                  />
                  <div className="flex gap-2">
                    <label>
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span className="cursor-pointer">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Trocar Foto
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFormData({ ...formData, profile_picture: '' })}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Adicionar foto de perfil</p>
                    <p className="text-xs text-gray-500">Clique para selecionar uma imagem</p>
                  </div>
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nome Completo
              </label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Digite seu nome completo"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Função
              </label>
              <Input
                value={user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Atualização Automática
              </label>
              <div className="space-y-2">
                <Input
                  type="number"
                  min="30"
                  max="600"
                  value={formData.auto_refresh_interval}
                  onChange={(e) => setFormData({ ...formData, auto_refresh_interval: parseInt(e.target.value) || 120 })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  O sistema atualizará automaticamente após {formData.auto_refresh_interval} segundos quando houver mudanças nas equipes (30-600s)
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Métricas de Uso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Métricas de Uso do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total de Pastas */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Folder className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{myFolders.length}</span>
                </div>
                <p className="text-sm font-medium text-blue-800">Pastas Criadas</p>
                <p className="text-xs text-blue-600 mt-1">Estrutura organizada</p>
              </div>

              {/* Total de Arquivos */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <File className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">{myFiles.length}</span>
                </div>
                <p className="text-sm font-medium text-green-800">Arquivos Criados</p>
                <p className="text-xs text-green-600 mt-1">Conteúdo produzido</p>
              </div>

              {/* Armazenamento Usado */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <HardDrive className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">{formatBytes(totalContentSize)}</span>
                </div>
                <p className="text-sm font-medium text-purple-800">Armazenamento</p>
                <p className="text-xs text-purple-600 mt-1">Dados em cache</p>
              </div>

              {/* Atividade Total */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-900">{myFolders.length + myFiles.length}</span>
                </div>
                <p className="text-sm font-medium text-orange-800">Itens Totais</p>
                <p className="text-xs text-orange-600 mt-1">Recursos no sistema</p>
              </div>
            </div>

            {/* Distribuição por Tipo */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <File className="w-4 h-4" />
                Distribuição por Tipo de Arquivo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(filesByType).map(([type, count]) => (
                  <div 
                    key={type}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">{typeIcons[type] || '📎'}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-600 uppercase">{type}</p>
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(filesByType).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum arquivo criado ainda
                </p>
              )}
            </div>

            {/* Estatísticas de Uso de Memória */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Uso do Banco de Dados
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Registros de Pastas</p>
                      <p className="text-xs text-gray-600">Estrutura hierárquica</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-900">{myFolders.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Registros de Arquivos</p>
                      <p className="text-xs text-gray-600">Conteúdo e metadados</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-900">{myFiles.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cache de Conteúdo</p>
                      <p className="text-xs text-gray-600">Dados armazenados localmente</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-900">{formatBytes(totalContentSize)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 text-center">
                💡 <strong>Otimização de recursos:</strong> O sistema gerencia automaticamente o cache e a sincronização de dados para máxima eficiência.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}