import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Save, Loader2, ArrowLeft, Upload, X, Database, Folder, File, HardDrive, Activity, Trash2 } from 'lucide-react';
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

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
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

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      const deletedFolders = folders.filter(f => f.deleted && f.owner === user?.email);
      const deletedFiles = files.filter(f => f.deleted && f.owner === user?.email);
      
      const deletePromises = [
        ...deletedFolders.map(f => base44.entities.Folder.delete(f.id)),
        ...deletedFiles.map(f => base44.entities.File.delete(f.id))
      ];
      
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      alert('Lixeira esvaziada com sucesso!');
    },
    onError: (error) => {
      alert('Erro ao esvaziar lixeira: ' + error.message);
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

  // Calcular métricas em tempo real
  const myFolders = folders.filter(f => f.owner === user?.email && !f.deleted);
  const myFiles = files.filter(f => f.owner === user?.email && !f.deleted);
  const allFolders = folders.filter(f => !f.deleted);
  const allFiles = files.filter(f => !f.deleted);
  
  // Calcular uso de armazenamento real (conteúdo + metadados)
  const calculateStorageSize = (files) => {
    return files.reduce((acc, file) => {
      // Tamanho do conteúdo JSON
      const contentSize = file.content ? new Blob([file.content]).size : 0;
      // Tamanho dos metadados (estimativa)
      const metadataSize = new Blob([JSON.stringify({
        name: file.name,
        type: file.type,
        folder_id: file.folder_id,
        team_id: file.team_id,
        owner: file.owner,
        created_date: file.created_date,
        updated_date: file.updated_date
      })]).size;
      // Se houver file_url, adicionar estimativa de arquivo externo (500KB médio)
      const externalFileSize = file.file_url ? 500000 : 0;
      return acc + contentSize + metadataSize + externalFileSize;
    }, 0);
  };

  const myStorageUsed = calculateStorageSize(myFiles);
  const totalStorageUsed = calculateStorageSize(allFiles);
  
  // Calcular uso de registros no banco de dados
  const myDbRecords = myFolders.length + myFiles.length;
  const totalDbRecords = allFolders.length + allFiles.length;
  
  // Quota do sistema (limite estimado)
  const storageQuota = 1024 * 1024 * 1024; // 1GB
  const recordsQuota = 10000; // 10k registros
  
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsagePercentage = (used, total) => {
    return Math.min(Math.round((used / total) * 100), 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 75) return 'bg-yellow-500';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-red-500';
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

  // Estatísticas adicionais
  const myTeams = teams.filter(t => t.owner === user?.email || (t.members && t.members.includes(user?.email)));
  const sharedFolders = folders.filter(f => f.team_id && !f.deleted);
  const sharedFiles = files.filter(f => f.team_id && !f.deleted);

  // Lixeira
  const trashedFolders = folders.filter(f => f.deleted && f.owner === user?.email);
  const trashedFiles = files.filter(f => f.deleted && f.owner === user?.email);
  const trashedStorageUsed = calculateStorageSize(trashedFiles);

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
              {/* Total de Pastas (excluindo lixeira) */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Folder className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{myFolders.length}</span>
                </div>
                <p className="text-sm font-medium text-blue-800">Pastas Ativas</p>
                <p className="text-xs text-blue-600 mt-1">Excluindo lixeira</p>
              </div>

              {/* Total de Arquivos (excluindo lixeira) */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <File className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">{myFiles.length}</span>
                </div>
                <p className="text-sm font-medium text-green-800">Arquivos Ativos</p>
                <p className="text-xs text-green-600 mt-1">Excluindo lixeira</p>
              </div>

              {/* Armazenamento Usado */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <HardDrive className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">{formatBytes(myStorageUsed)}</span>
                </div>
                <p className="text-sm font-medium text-purple-800">Meu Uso</p>
                <p className="text-xs text-purple-600 mt-1">{formatBytes(totalStorageUsed)} total no sistema</p>
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

            {/* Uso do Banco de Dados com Quotas */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Uso do Banco de Dados
              </h3>
              
              {/* Armazenamento */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Armazenamento Total do Sistema</p>
                        <p className="text-xs text-gray-600">Incluindo conteúdo, metadados e arquivos externos</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Meu uso:</span>
                      <span className="font-bold text-purple-900">{formatBytes(myStorageUsed)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Uso total:</span>
                      <span className="font-bold text-purple-900">{formatBytes(totalStorageUsed)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Disponível:</span>
                      <span className="font-bold text-gray-900">{formatBytes(storageQuota)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Uso do sistema</span>
                      <span>{getUsagePercentage(totalStorageUsed, storageQuota)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all ${getUsageColor(getUsagePercentage(totalStorageUsed, storageQuota))}`}
                        style={{ width: `${getUsagePercentage(totalStorageUsed, storageQuota)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Registros */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Database className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Registros no Banco de Dados</p>
                        <p className="text-xs text-gray-600">Pastas, arquivos e entidades relacionadas</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Meus registros</p>
                      <p className="text-2xl font-bold text-blue-900">{myDbRecords}</p>
                      <p className="text-xs text-gray-500 mt-1">{myFolders.length} pastas + {myFiles.length} arquivos</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total no sistema</p>
                      <p className="text-2xl font-bold text-blue-900">{totalDbRecords}</p>
                      <p className="text-xs text-gray-500 mt-1">{allFolders.length} pastas + {allFiles.length} arquivos</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Capacidade do banco</span>
                      <span>{getUsagePercentage(totalDbRecords, recordsQuota)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all ${getUsageColor(getUsagePercentage(totalDbRecords, recordsQuota))}`}
                        style={{ width: `${getUsagePercentage(totalDbRecords, recordsQuota)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{totalDbRecords.toLocaleString()} / {recordsQuota.toLocaleString()} registros</p>
                  </div>
                </div>

                {/* Estatísticas Adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-lg border border-teal-200">
                    <p className="text-xs text-teal-700 mb-1">Equipes</p>
                    <p className="text-2xl font-bold text-teal-900">{myTeams.length}</p>
                    <p className="text-xs text-teal-600 mt-1">Colaboração ativa</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 mb-1">Pastas Compartilhadas</p>
                    <p className="text-2xl font-bold text-orange-900">{sharedFolders.length}</p>
                    <p className="text-xs text-orange-600 mt-1">Em equipes</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 rounded-lg border border-pink-200">
                    <p className="text-xs text-pink-700 mb-1">Arquivos Compartilhados</p>
                    <p className="text-2xl font-bold text-pink-900">{sharedFiles.length}</p>
                    <p className="text-xs text-pink-600 mt-1">Em colaboração</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lixeira */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Lixeira
                </h3>
                {(trashedFolders.length > 0 || trashedFiles.length > 0) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja esvaziar a lixeira permanentemente? Isso irá excluir ${trashedFolders.length} pasta(s) e ${trashedFiles.length} arquivo(s).`)) {
                        emptyTrashMutation.mutate();
                      }
                    }}
                    disabled={emptyTrashMutation.isPending}
                  >
                    {emptyTrashMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Esvaziando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Esvaziar Lixeira
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <Folder className="w-6 h-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{trashedFolders.length}</span>
                  </div>
                  <p className="text-sm font-medium text-red-800">Pastas na Lixeira</p>
                  <p className="text-xs text-red-600 mt-1">Aguardando exclusão</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <File className="w-6 h-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{trashedFiles.length}</span>
                  </div>
                  <p className="text-sm font-medium text-red-800">Arquivos na Lixeira</p>
                  <p className="text-xs text-red-600 mt-1">Aguardando exclusão</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <HardDrive className="w-6 h-6 text-red-600" />
                    <span className="text-xl font-bold text-red-900">{formatBytes(trashedStorageUsed)}</span>
                  </div>
                  <p className="text-sm font-medium text-red-800">Espaço Ocupado</p>
                  <p className="text-xs text-red-600 mt-1">Pode ser liberado</p>
                </div>
              </div>

              {(trashedFolders.length === 0 && trashedFiles.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">A lixeira está vazia</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 text-center">
                💡 <strong>Sincronização em tempo real:</strong> Todos os dados são atualizados automaticamente e refletem o uso atual do sistema. O banco gerencia otimização e cache automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}