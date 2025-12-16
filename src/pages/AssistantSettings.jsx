import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Image, Briefcase, BookOpen, Save, Loader2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AssistantSettings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    assistant_name: user?.assistant_name || 'Assistente Virtual',
    assistant_avatar: user?.assistant_avatar || '',
    assistant_role: user?.assistant_role || 'Assistente Executiva',
    assistant_expertise: user?.assistant_expertise || 'Gestão de projetos, organização e produtividade',
    assistant_guidelines: user?.assistant_guidelines || 'Seja sempre prestativa, objetiva e profissional. Ajude o usuário a organizar suas tarefas e projetos de forma eficiente.',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        assistant_name: user.assistant_name || 'Assistente Virtual',
        assistant_avatar: user.assistant_avatar || '',
        assistant_role: user.assistant_role || 'Assistente Executiva',
        assistant_expertise: user.assistant_expertise || 'Gestão de projetos, organização e produtividade',
        assistant_guidelines: user.assistant_guidelines || 'Seja sempre prestativa, objetiva e profissional. Ajude o usuário a organizar suas tarefas e projetos de forma eficiente.',
      });
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSaving(false);
      alert('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      setSaving(false);
      alert('Erro ao salvar configurações: ' + error.message);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    updateSettingsMutation.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, assistant_avatar: file_url });
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Assistente Virtual</h1>
          <Link to={createPageUrl('Profile')}>
            <Button variant="outline">
              Voltar ao Perfil
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Personalização do Assistente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nome do Assistente
              </label>
              <Input
                value={formData.assistant_name}
                onChange={(e) => setFormData({ ...formData, assistant_name: e.target.value })}
                placeholder="Ex: Maria, Sofia, Carol..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                <Image className="w-4 h-4" />
                Foto do Assistente
              </label>
              
              {formData.assistant_avatar ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <img 
                      src={formData.assistant_avatar} 
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                    />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Avatar atual</p>
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={uploading}>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Enviando...' : 'Trocar Foto'}
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
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Image className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Enviando...' : 'Clique para adicionar uma foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Sugestão: Use uma imagem do <a href="https://pollistations.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">pollistations.ai</a>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Cargo/Função
              </label>
              <Input
                value={formData.assistant_role}
                onChange={(e) => setFormData({ ...formData, assistant_role: e.target.value })}
                placeholder="Ex: Assistente Executiva, Secretária Virtual..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Áreas de Conhecimento
              </label>
              <Input
                value={formData.assistant_expertise}
                onChange={(e) => setFormData({ ...formData, assistant_expertise: e.target.value })}
                placeholder="Ex: Gestão de projetos, marketing, vendas..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Diretrizes de Comportamento
              </label>
              <Textarea
                value={formData.assistant_guidelines}
                onChange={(e) => setFormData({ ...formData, assistant_guidelines: e.target.value })}
                placeholder="Como o assistente deve se comportar e responder..."
                className="h-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                Defina como você quer que seu assistente se comporte, o tom de voz, estilo de resposta, etc.
              </p>
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
                  Salvar Configurações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}