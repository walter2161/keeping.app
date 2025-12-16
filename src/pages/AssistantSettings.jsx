import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Image, Briefcase, BookOpen, Save, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AssistantSettings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

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
      const defaultAvatar = user.assistant_avatar || 'https://image.pollinations.ai/prompt/professional%20female%20assistant%2C%20business%20suit%2C%20elegant%20glasses%2C%20long%20dark%20hair%2C%20friendly%20confident%20smile%2C%20shoulder%20portrait%2C%20modern%20office%20background%2C%20professional%20corporate%20photo%2C%20studio%20lighting?width=350&height=350&model=flux&nologo=true&enhance=true';
      
      setFormData({
        assistant_name: user.assistant_name || 'Assistente Virtual',
        assistant_avatar: defaultAvatar,
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

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      alert('Por favor, descreva como você quer que seja o assistente');
      return;
    }

    setGenerating(true);
    try {
      const prompt = encodeURIComponent(imagePrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=350&height=350&model=flux&nologo=true&enhance=true`;
      
      setFormData({ ...formData, assistant_avatar: imageUrl });
      setImagePrompt('');
    } catch (error) {
      alert('Erro ao gerar imagem: ' + error.message);
    } finally {
      setGenerating(false);
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
                  <div className="flex flex-col items-center gap-4">
                    <img 
                      src={formData.assistant_avatar} 
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData({ ...formData, assistant_avatar: '' })}
                    >
                      Gerar Nova Foto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Descreva o assistente (ex: mulher profissional, cabelo castanho, sorrindo)"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleGenerateImage()}
                      disabled={generating}
                    />
                    <Button 
                      onClick={handleGenerateImage}
                      disabled={generating || !imagePrompt.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Gerado por <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">pollinations.ai</a> - IA que gera imagens realistas
                  </p>
                </div>
              )}
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