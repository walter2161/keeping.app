import { base44 } from '@/api/base44Client';

export async function createDefaultStructure(userEmail) {
  console.log('🚀 Iniciando criação de estrutura padrão...');
  
  const tempRefs = {};
  
  // Dados de exemplo ricos
  const exampleData = {
    contrato_social: `<h1 style="text-align: center;"><strong>CONTRATO SOCIAL</strong></h1><p><br></p><h2><strong>1. DAS PARTES</strong></h2><p>Pelo presente instrumento particular de Contrato Social, as partes abaixo qualificadas:</p><p><br></p><p><strong>SÓCIO 1:</strong> João Silva, brasileiro, casado, empresário, portador do CPF nº 000.000.000-00</p><p><strong>SÓCIO 2:</strong> Maria Santos, brasileira, solteira, administradora, portadora do CPF nº 111.111.111-11</p><p><br></p><h2><strong>2. DO OBJETO SOCIAL</strong></h2><p>A sociedade tem por objeto social:</p><p>• Prestação de serviços de consultoria empresarial</p><p>• Desenvolvimento de software e soluções tecnológicas</p><p>• Treinamento e capacitação profissional</p><p><br></p><h2><strong>3. DO CAPITAL SOCIAL</strong></h2><p>O capital social é de <strong>R$ 100.000,00</strong> (cem mil reais), dividido em 100 quotas de R$ 1.000,00 cada, assim distribuídas:</p><p>• Sócio 1: 60 quotas (60%) = R$ 60.000,00</p><p>• Sócio 2: 40 quotas (40%) = R$ 40.000,00</p><p><br></p><h2><strong>4. DA ADMINISTRAÇÃO</strong></h2><p>A administração da sociedade caberá aos sócios em conjunto, vedado o uso da firma em atividades estranhas ao interesse social.</p>`,
    
    politica_conduta: `<h1 style="text-align: center;"><strong>POLÍTICA DE CONDUTA INTERNA</strong></h1><p><br></p><h2><strong>1. OBJETIVO</strong></h2><p>Esta política estabelece os princípios éticos e de conduta que devem nortear o comportamento de todos os colaboradores da empresa.</p><p><br></p><h2><strong>2. PRINCÍPIOS FUNDAMENTAIS</strong></h2><p><strong>2.1 Respeito Mútuo</strong></p><p>• Tratar todos com dignidade e respeito</p><p>• Não tolerar discriminação de qualquer natureza</p><p>• Promover ambiente de trabalho saudável</p><p><br></p><p><strong>2.2 Integridade</strong></p><p>• Agir com honestidade em todas as situações</p><p>• Cumprir leis, normas e regulamentos</p><p>• Evitar conflitos de interesse</p><p><br></p><p><strong>2.3 Transparência</strong></p><p>• Manter comunicação clara e objetiva</p><p>• Documentar decisões importantes</p><p>• Prestar contas de suas ações</p><p><br></p><h2><strong>3. CONDUTAS VEDADAS</strong></h2><p>• Assédio moral ou sexual</p><p>• Uso de informações privilegiadas</p><p>• Divulgação de informações confidenciais</p><p>• Aceitar propinas ou vantagens indevidas</p>`,
    
    regimento_interno: `<h1 style="text-align: center;"><strong>REGIMENTO INTERNO</strong></h1><p><br></p><h2><strong>1. HORÁRIO DE FUNCIONAMENTO</strong></h2><p>• Segunda a Sexta: 8h às 18h</p><p>• Intervalo para almoço: 12h às 13h</p><p>• Tolerância de atraso: 10 minutos</p><p><br></p><h2><strong>2. DRESS CODE</strong></h2><p>• Segunda a Quinta: Casual corporativo</p><p>• Sexta-feira: Casual friday</p><p>• Reuniões externas: Formal</p><p><br></p><h2><strong>3. USO DE EQUIPAMENTOS</strong></h2><p>• Notebooks e celulares corporativos são de uso exclusivo profissional</p><p>• É proibido instalar softwares não autorizados</p><p>• Backup de dados deve ser realizado semanalmente</p><p><br></p><h2><strong>4. FÉRIAS E FOLGAS</strong></h2><p>• Férias devem ser solicitadas com 30 dias de antecedência</p><p>• Período mínimo de férias: 10 dias corridos</p><p>• Período máximo: 30 dias</p>`,
    
    comunicacao_interna: `<h1 style="text-align: center;"><strong>COMUNICAÇÃO INTERNA - JANEIRO 2026</strong></h1><p><br></p><p><strong>Data:</strong> 22 de Janeiro de 2026</p><p><strong>Para:</strong> Todos os colaboradores</p><p><strong>De:</strong> Diretoria</p><p><strong>Assunto:</strong> Informes do mês</p><p><br></p><h2><strong>1. Boas-vindas</strong></h2><p>É com grande satisfação que damos as boas-vindas aos novos colaboradores que se juntaram à nossa equipe este mês.</p><p><br></p><h2><strong>2. Resultados do Mês Anterior</strong></h2><p>• Crescimento de <strong>15% nas vendas</strong></p><p>• 3 novos clientes conquistados</p><p>• 100% de satisfação no atendimento</p><p><br></p><h2><strong>3. Metas para Janeiro</strong></h2><p>• Aumentar produtividade em 10%</p><p>• Reduzir tempo de resposta ao cliente</p><p>• Implementar novo sistema de gestão</p><p><br></p><h2><strong>4. Eventos e Treinamentos</strong></h2><p>• 25/01 - Treinamento de vendas consultivas</p><p>• 30/01 - Workshop de produtividade</p>`,
    
    fluxo_caixa: `Mês,Receitas,Despesas,Saldo\nJaneiro,150000,85000,65000\nFevereiro,165000,90000,75000\nMarço,170000,88000,82000\nAbril,180000,92000,88000\nMaio,175000,89000,86000\nJunho,190000,95000,95000\nJulho,185000,91000,94000\nAgosto,195000,96000,99000\nSetembro,200000,98000,102000\nOutubro,205000,100000,105000\nNovembro,210000,102000,108000\nDezembro,220000,105000,115000`,
    
    contas_pagar: `Fornecedor,Vencimento,Valor,Status,Categoria\nFornecedor A,2026-01-25,5000,Pendente,Matéria-prima\nFornecedor B,2026-01-28,3500,Pendente,Serviços\nFornecedor C,2026-02-05,8000,A vencer,Equipamentos\nFornecedor D,2026-02-10,2500,A vencer,Manutenção\nFornecedor E,2026-02-15,4200,A vencer,Marketing\nFornecedor F,2026-02-20,6800,A vencer,Consultoria\nAluguel,2026-02-01,12000,A vencer,Fixo\nSalários,2026-02-05,45000,A vencer,Pessoal`,
    
    contas_receber: `Cliente,Vencimento,Valor,Status,Projeto\nCliente A,2026-01-30,15000,A vencer,Projeto Alpha\nCliente B,2026-02-05,22000,A vencer,Projeto Beta\nCliente C,2026-02-10,18500,A vencer,Consultoria\nCliente D,2026-02-15,12000,A vencer,Desenvolvimento\nCliente E,2026-02-20,25000,A vencer,Projeto Gamma\nCliente F,2026-02-25,8500,A vencer,Manutenção\nCliente G,2026-03-01,19000,A vencer,Projeto Delta`,
    
    base_clientes: `Cliente,CNPJ,Contato,Email,Telefone,Cidade,Status\nEmpresa Alpha LTDA,12.345.678/0001-90,João Silva,joao@alpha.com,(11) 98765-4321,São Paulo,Ativo\nBeta Comércio SA,23.456.789/0001-01,Maria Santos,maria@beta.com,(11) 97654-3210,São Paulo,Ativo\nGamma Indústria,34.567.890/0001-12,Pedro Oliveira,pedro@gamma.com,(21) 96543-2109,Rio de Janeiro,Ativo\nDelta Serviços,45.678.901/0001-23,Ana Costa,ana@delta.com,(31) 95432-1098,Belo Horizonte,Ativo\nÉpsilon Tech,56.789.012/0001-34,Carlos Souza,carlos@epsilon.com,(11) 94321-0987,São Paulo,Prospecção`,
    
    proposta_cliente_a: `<h1 style="text-align: center;"><strong>PROPOSTA COMERCIAL</strong></h1><p><br></p><p><strong>Para:</strong> Cliente A - Empresa Alpha LTDA</p><p><strong>Data:</strong> Janeiro de 2026</p><p><strong>Validade:</strong> 30 dias</p><p><br></p><h2><strong>1. APRESENTAÇÃO</strong></h2><p>Apresentamos nossa proposta para desenvolvimento de sistema de gestão integrado, conforme reunião realizada em 15/01/2026.</p><p><br></p><h2><strong>2. ESCOPO DO PROJETO</strong></h2><p><strong>2.1 Módulos a serem desenvolvidos:</strong></p><p>• Módulo Financeiro</p><p>• Módulo de Vendas</p><p>• Módulo de Estoque</p><p>• Módulo de Relatórios</p><p><br></p><p><strong>2.2 Funcionalidades:</strong></p><p>• Dashboard executivo com indicadores em tempo real</p><p>• Integração com sistemas existentes</p><p>• App mobile para gestores</p><p>• Relatórios customizáveis</p><p><br></p><h2><strong>3. INVESTIMENTO</strong></h2><p>• Desenvolvimento: <strong>R$ 85.000,00</strong></p><p>• Treinamento: <strong>R$ 5.000,00</strong></p><p>• Suporte (12 meses): <strong>R$ 10.000,00</strong></p><p>• <strong>TOTAL: R$ 100.000,00</strong></p><p><br></p><h2><strong>4. CRONOGRAMA</strong></h2><p>• Fase 1 (Planejamento): 2 semanas</p><p>• Fase 2 (Desenvolvimento): 12 semanas</p><p>• Fase 3 (Testes e Ajustes): 3 semanas</p><p>• Fase 4 (Implantação): 1 semana</p>`,
    
    planejamento_marketing: `<h1 style="text-align: center;"><strong>PLANEJAMENTO DE MARKETING 2026</strong></h1><p><br></p><h2><strong>1. ANÁLISE DE MERCADO</strong></h2><p>O mercado apresenta crescimento de 12% ao ano, com oportunidades em segmentos B2B e B2C.</p><p><br></p><h2><strong>2. OBJETIVOS</strong></h2><p>• Aumentar brand awareness em 40%</p><p>• Gerar 500 leads qualificados por mês</p><p>• Alcançar 50.000 seguidores nas redes sociais</p><p>• ROI de marketing de 300%</p><p><br></p><h2><strong>3. ESTRATÉGIAS</strong></h2><p><strong>3.1 Marketing de Conteúdo</strong></p><p>• 12 artigos por mês no blog</p><p>• 2 e-books trimestrais</p><p>• 1 webinar mensal</p><p><br></p><p><strong>3.2 Redes Sociais</strong></p><p>• 3 posts diários no Instagram</p><p>• 5 posts semanais no LinkedIn</p><p>• Stories diários</p><p><br></p><p><strong>3.3 Campanhas Pagas</strong></p><p>• Google Ads: R$ 10.000/mês</p><p>• Facebook/Instagram Ads: R$ 8.000/mês</p><p>• LinkedIn Ads: R$ 5.000/mês</p><p><br></p><h2><strong>4. ORÇAMENTO ANUAL</strong></h2><p>• Marketing Digital: R$ 276.000</p><p>• Eventos: R$ 50.000</p><p>• Produção de Conteúdo: R$ 80.000</p><p>• Ferramentas: R$ 24.000</p><p>• <strong>TOTAL: R$ 430.000</strong></p>`,
    
    status_projetos: `Projeto,Cliente,Responsável,Status,Início,Previsão,Progresso\nDesenvolvimento Sistema,Cliente A,João Silva,Em andamento,2026-01-05,2026-04-30,45%\nConsultoria Processos,Cliente B,Maria Santos,Em andamento,2026-01-10,2026-03-15,60%\nRedesign Website,Cliente C,Pedro Costa,Planejamento,2026-02-01,2026-04-01,10%\nAutomação Marketing,Cliente D,Ana Oliveira,Em andamento,2025-12-01,2026-02-28,85%\nMigração Cloud,Cliente E,Carlos Lima,Atrasado,2025-11-15,2026-01-31,70%`,
    
    cadastro_colaboradores: `Nome,Cargo,Departamento,Email,Telefone,Admissão,Salário\nJoão Silva,Gerente Comercial,Comercial,joao.silva@empresa.com,(11) 98765-4321,2024-01-15,8500\nMaria Santos,Analista Financeiro,Financeiro,maria.santos@empresa.com,(11) 97654-3210,2024-03-20,6000\nPedro Costa,Desenvolvedor Senior,TI,pedro.costa@empresa.com,(11) 96543-2109,2023-08-10,9000\nAna Oliveira,Coordenadora Marketing,Marketing,ana.oliveira@empresa.com,(11) 95432-1098,2024-06-01,7500\nCarlos Lima,Analista Operacional,Operacional,carlos.lima@empresa.com,(11) 94321-0987,2025-01-10,5500`,
    
    infraestrutura_ti: `<h1 style="text-align: center;"><strong>DOCUMENTAÇÃO - INFRAESTRUTURA DE SISTEMAS</strong></h1><p><br></p><h2><strong>1. SERVIDORES</strong></h2><p><strong>Servidor Principal (Prod-01)</strong></p><p>• Localização: AWS - São Paulo (sa-east-1)</p><p>• Sistema Operacional: Ubuntu Server 22.04 LTS</p><p>• CPU: 8 vCPUs</p><p>• RAM: 32GB</p><p>• Storage: 500GB SSD</p><p>• IP: 10.0.1.10</p><p><br></p><p><strong>Servidor de Backup (Backup-01)</strong></p><p>• Localização: AWS - São Paulo (sa-east-1)</p><p>• Sistema Operacional: Ubuntu Server 22.04 LTS</p><p>• CPU: 4 vCPUs</p><p>• RAM: 16GB</p><p>• Storage: 2TB HDD</p><p><br></p><h2><strong>2. BANCO DE DADOS</strong></h2><p>• Tipo: PostgreSQL 15.2</p><p>• Modo: Cluster com replicação</p><p>• Backup: Automático a cada 6 horas</p><p>• Retenção: 30 dias</p><p><br></p><h2><strong>3. SEGURANÇA</strong></h2><p>• Firewall: AWS Security Groups</p><p>• SSL: Certificado válido até Dez/2026</p><p>• Antivírus: ClamAV atualizado</p><p>• Monitoramento: CloudWatch + Grafana</p>`,
    
    planejamento_estrategico: `<h1 style="text-align: center;"><strong>PLANEJAMENTO ESTRATÉGICO 2026</strong></h1><p><br></p><h2><strong>VISÃO</strong></h2><p>Ser referência nacional em soluções empresariais integradas até 2028.</p><p><br></p><h2><strong>MISSÃO</strong></h2><p>Transformar negócios através de tecnologia, processos otimizados e pessoas capacitadas.</p><p><br></p><h2><strong>VALORES</strong></h2><p>• Inovação contínua</p><p>• Excelência no atendimento</p><p>• Transparência nas relações</p><p>• Desenvolvimento de pessoas</p><p>• Sustentabilidade</p><p><br></p><h2><strong>OBJETIVOS ESTRATÉGICOS</strong></h2><p><strong>1. Crescimento</strong></p><p>• Aumentar faturamento em 30%</p><p>• Expandir para 3 novos estados</p><p>• Conquistar 100 novos clientes</p><p><br></p><p><strong>2. Operacional</strong></p><p>• Reduzir custos operacionais em 15%</p><p>• Implementar automações em 80% dos processos</p><p>• Atingir NPS de 85+</p><p><br></p><p><strong>3. Pessoas</strong></p><p>• Contratar 20 novos colaboradores</p><p>• Atingir 90% de satisfação interna</p><p>• Implementar plano de carreira estruturado</p><p><br></p><p><strong>4. Inovação</strong></p><p>• Lançar 2 novos produtos</p><p>• Investir R$ 500k em P&D</p><p>• Registrar 3 patentes</p>`
  };

  try {
    // 1. EMPRESA (raiz)
    const empresa = await base44.entities.Folder.create({
      name: 'EMPRESA',
      parent_id: null,
      owner: userEmail,
      color: 'blue'
    });
    tempRefs.EMPRESA = empresa.id;
    console.log('✓ EMPRESA criada');

    // 2. ADMINISTRATIVO
    const administrativo = await base44.entities.Folder.create({
      name: 'ADMINISTRATIVO',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'purple'
    });
    tempRefs.ADMINISTRATIVO = administrativo.id;

    const admin_documentos = await base44.entities.Folder.create({
      name: 'Documentos',
      parent_id: tempRefs.ADMINISTRATIVO,
      owner: userEmail
    });
    tempRefs.ADMIN_DOCUMENTOS = admin_documentos.id;

    await base44.entities.File.create({
      name: 'Contrato_Social_Atualizado',
      type: 'docx',
      folder_id: tempRefs.ADMIN_DOCUMENTOS,
      owner: userEmail,
      content: exampleData.contrato_social
    });

    await base44.entities.File.create({
      name: 'Politica_Conduta_Interna',
      type: 'docx',
      folder_id: tempRefs.ADMIN_DOCUMENTOS,
      owner: userEmail,
      content: exampleData.politica_conduta
    });

    await base44.entities.File.create({
      name: 'Regimento_Interno',
      type: 'docx',
      folder_id: tempRefs.ADMIN_DOCUMENTOS,
      owner: userEmail,
      content: exampleData.regimento_interno
    });

    await base44.entities.File.create({
      name: 'Comunicacao_Interna_2026-01',
      type: 'docx',
      folder_id: tempRefs.ADMIN_DOCUMENTOS,
      owner: userEmail,
      content: exampleData.comunicacao_interna
    });

    const admin_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.ADMINISTRATIVO,
      owner: userEmail
    });
    tempRefs.ADMIN_PROCESSOS = admin_processos.id;

    await base44.entities.File.create({
      name: 'Fluxo_Aprovacao_Documentos',
      type: 'flux',
      folder_id: tempRefs.ADMIN_PROCESSOS,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Início: Documento Criado' }, class: 'start', html: 'Início: Documento Criado', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 150 },
              '2': { id: 2, name: 'process', data: { text: 'Revisão pelo Gestor' }, class: 'process', html: 'Revisão pelo Gestor', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 150 },
              '3': { id: 3, name: 'decision', data: { text: 'Aprovado?' }, class: 'decision', html: 'Aprovado?', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] }, output_2: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 600, pos_y: 150 },
              '4': { id: 4, name: 'process', data: { text: 'Arquivar Documento' }, class: 'process', html: 'Arquivar Documento', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 80 },
              '5': { id: 5, name: 'process', data: { text: 'Retornar para Ajustes' }, class: 'process', html: 'Retornar para Ajustes', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } }, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 850, pos_y: 220 },
              '6': { id: 6, name: 'end', data: { text: 'Fim: Processo Concluído' }, class: 'end', html: 'Fim: Processo Concluído', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } }, outputs: {}, pos_x: 1100, pos_y: 80 }
            }
          }
        }
      })
    });

    const admin_tarefas = await base44.entities.Folder.create({
      name: 'Tarefas',
      parent_id: tempRefs.ADMINISTRATIVO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Administrativo_Semanal',
      type: 'kbn',
      folder_id: admin_tarefas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'todo', title: 'A Fazer', color: '#ef4444' },
          { id: 'doing', title: 'Em Andamento', color: '#f59e0b' },
          { id: 'done', title: 'Concluído', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'todo', title: 'Atualizar políticas internas', description: 'Revisar e atualizar documentação de RH', priority: 'high', tags: ['urgente', 'rh'] },
          { id: '2', columnId: 'doing', title: 'Organizar arquivos do mês', description: 'Digitalizar e organizar documentos', priority: 'medium', tags: ['organização'] },
          { id: '3', columnId: 'done', title: 'Reunião semanal realizada', description: 'Pauta e ata documentadas', priority: 'low', tags: ['reunião'] }
        ]
      })
    });

    const admin_cronogramas = await base44.entities.Folder.create({
      name: 'Cronogramas',
      parent_id: tempRefs.ADMINISTRATIVO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Rotinas_Administrativas',
      type: 'crn',
      folder_id: admin_cronogramas.id,
      owner: userEmail,
      content: JSON.stringify({
        groups: [
          { id: 'g1', name: 'Rotinas Diárias', color: '#3b82f6' },
          { id: 'g2', name: 'Rotinas Semanais', color: '#8b5cf6' },
          { id: 'g3', name: 'Rotinas Mensais', color: '#ec4899' }
        ],
        items: [
          { id: 'i1', groupId: 'g1', name: 'Conferir emails', start: '2026-01-22', end: '2026-01-22', progress: 100 },
          { id: 'i2', groupId: 'g1', name: 'Atualizar planilhas', start: '2026-01-22', end: '2026-01-22', progress: 50 },
          { id: 'i3', groupId: 'g2', name: 'Reunião de equipe', start: '2026-01-20', end: '2026-01-24', progress: 75 },
          { id: 'i4', groupId: 'g3', name: 'Fechamento mensal', start: '2026-01-28', end: '2026-01-31', progress: 0 }
        ]
      })
    });

    console.log('✓ ADMINISTRATIVO completo');

    // 3. FINANCEIRO
    const financeiro = await base44.entities.Folder.create({
      name: 'FINANCEIRO',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'green'
    });
    tempRefs.FINANCEIRO = financeiro.id;

    const fin_planilhas = await base44.entities.Folder.create({
      name: 'Planilhas',
      parent_id: tempRefs.FINANCEIRO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Caixa_2026',
      type: 'xlsx',
      folder_id: fin_planilhas.id,
      owner: userEmail,
      content: exampleData.fluxo_caixa
    });

    await base44.entities.File.create({
      name: 'Contas_a_Pagar_2026',
      type: 'xlsx',
      folder_id: fin_planilhas.id,
      owner: userEmail,
      content: exampleData.contas_pagar
    });

    await base44.entities.File.create({
      name: 'Contas_a_Receber_2026',
      type: 'xlsx',
      folder_id: fin_planilhas.id,
      owner: userEmail,
      content: exampleData.contas_receber
    });

    await base44.entities.File.create({
      name: 'Controle_Notas_Fiscais',
      type: 'xlsx',
      folder_id: fin_planilhas.id,
      owner: userEmail,
      content: 'Número,Data,Fornecedor/Cliente,Valor,Tipo,Status,Categoria\nNF-001,2026-01-05,Fornecedor A,5000,Entrada,Paga,Matéria-prima\nNF-002,2026-01-08,Cliente Alpha,15000,Saída,Recebida,Serviços\nNF-003,2026-01-12,Fornecedor B,3500,Entrada,Paga,Equipamentos\nNF-004,2026-01-15,Cliente Beta,22000,Saída,Recebida,Desenvolvimento\nNF-005,2026-01-18,Fornecedor C,8000,Entrada,Pendente,Consultoria\nNF-006,2026-01-20,Cliente Gamma,18500,Saída,Pendente,Consultoria\nNF-007,2026-01-22,Fornecedor D,2500,Entrada,Paga,Manutenção\nNF-008,2026-01-25,Cliente Delta,12000,Saída,A vencer,Treinamento'
    });

    const fin_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.FINANCEIRO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Fechamento_Mensal',
      type: 'flux',
      folder_id: fin_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Início: Último Dia do Mês' }, class: 'start', html: 'Início: Último Dia do Mês', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Conferir Lançamentos' }, class: 'process', html: 'Conferir Lançamentos', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'process', data: { text: 'Conciliação Bancária' }, class: 'process', html: 'Conciliação Bancária', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'process', data: { text: 'Gerar Relatórios' }, class: 'process', html: 'Gerar Relatórios', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 850, pos_y: 200 },
              '5': { id: 5, name: 'end', data: { text: 'Fim: Fechamento Concluído' }, class: 'end', html: 'Fim: Fechamento Concluído', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } }, outputs: {}, pos_x: 1100, pos_y: 200 }
            }
          }
        }
      })
    });

    const fin_tarefas = await base44.entities.Folder.create({
      name: 'Tarefas',
      parent_id: tempRefs.FINANCEIRO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Financeiro_Mensal',
      type: 'kbn',
      folder_id: fin_tarefas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'pending', title: 'Pendente', color: '#ef4444' },
          { id: 'review', title: 'Em Revisão', color: '#f59e0b' },
          { id: 'approved', title: 'Aprovado', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'pending', title: 'Pagamentos fornecedores', description: 'Vencimento em 25/01', priority: 'high', tags: ['urgente', 'pagamento'] },
          { id: '2', columnId: 'review', title: 'Conciliação bancária', description: 'Revisar lançamentos de janeiro', priority: 'medium', tags: ['análise'] },
          { id: '3', columnId: 'approved', title: 'Fechamento mensal anterior', description: 'Dezembro/2025 concluído', priority: 'low', tags: ['fechamento'] },
          { id: '4', columnId: 'pending', title: 'Relatório fluxo de caixa', description: 'Gerar relatório Q1', priority: 'medium', tags: ['relatório'] }
        ]
      })
    });

    const fin_cronogramas = await base44.entities.Folder.create({
      name: 'Cronogramas',
      parent_id: tempRefs.FINANCEIRO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Calendario_Fechamentos',
      type: 'crn',
      folder_id: fin_cronogramas.id,
      owner: userEmail,
      content: JSON.stringify({
        groups: [
          { id: 'g1', name: 'Janeiro 2026', color: '#3b82f6' },
          { id: 'g2', name: 'Fevereiro 2026', color: '#8b5cf6' },
          { id: 'g3', name: 'Março 2026', color: '#ec4899' }
        ],
        items: [
          { id: 'i1', groupId: 'g1', name: 'Contas a Pagar', start: '2026-01-20', end: '2026-01-25', progress: 80 },
          { id: 'i2', groupId: 'g1', name: 'Contas a Receber', start: '2026-01-23', end: '2026-01-28', progress: 60 },
          { id: 'i3', groupId: 'g1', name: 'Fechamento Mensal', start: '2026-01-28', end: '2026-01-31', progress: 20 },
          { id: 'i4', groupId: 'g2', name: 'Preparação Fevereiro', start: '2026-02-01', end: '2026-02-05', progress: 0 }
        ]
      })
    });

    console.log('✓ FINANCEIRO completo');

    // 4. COMERCIAL
    const comercial = await base44.entities.Folder.create({
      name: 'COMERCIAL',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'orange'
    });
    tempRefs.COMERCIAL = comercial.id;

    const com_clientes = await base44.entities.Folder.create({
      name: 'Clientes',
      parent_id: tempRefs.COMERCIAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Base_Clientes_Ativos',
      type: 'xlsx',
      folder_id: com_clientes.id,
      owner: userEmail,
      content: exampleData.base_clientes
    });

    const com_propostas = await base44.entities.Folder.create({
      name: 'Propostas',
      parent_id: tempRefs.COMERCIAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Proposta_Cliente_A_2026-01',
      type: 'docx',
      folder_id: com_propostas.id,
      owner: userEmail,
      content: exampleData.proposta_cliente_a
    });

    await base44.entities.File.create({
      name: 'Proposta_Cliente_B_2026-01',
      type: 'docx',
      folder_id: com_propostas.id,
      owner: userEmail,
      content: exampleData.proposta_cliente_a.replace('Cliente A', 'Cliente B').replace('Alpha', 'Beta')
    });

    const com_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.COMERCIAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Vendas_Consultivas',
      type: 'flux',
      folder_id: com_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Lead Qualificado' }, class: 'start', html: 'Lead Qualificado', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Diagnóstico de Necessidades' }, class: 'process', html: 'Diagnóstico de Necessidades', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'process', data: { text: 'Elaborar Proposta' }, class: 'process', html: 'Elaborar Proposta', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'process', data: { text: 'Apresentação' }, class: 'process', html: 'Apresentação', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 850, pos_y: 200 },
              '5': { id: 5, name: 'decision', data: { text: 'Aceito?' }, class: 'decision', html: 'Aceito?', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] }, output_2: { connections: [{ node: '7', output: 'input_1' }] } }, pos_x: 1100, pos_y: 200 },
              '6': { id: 6, name: 'end', data: { text: 'Venda Fechada!' }, class: 'end', html: 'Venda Fechada!', typenode: false, inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } }, outputs: {}, pos_x: 1350, pos_y: 130 },
              '7': { id: 7, name: 'process', data: { text: 'Follow-up' }, class: 'process', html: 'Follow-up', typenode: false, inputs: { input_1: { connections: [{ node: '5', input: 'output_2' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 1350, pos_y: 270 }
            }
          }
        }
      })
    });

    const com_tarefas = await base44.entities.Folder.create({
      name: 'Tarefas',
      parent_id: tempRefs.COMERCIAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Pipeline_Vendas',
      type: 'kbn',
      folder_id: com_tarefas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'lead', title: 'Lead', color: '#6366f1' },
          { id: 'contact', title: 'Primeiro Contato', color: '#8b5cf6' },
          { id: 'proposal', title: 'Proposta Enviada', color: '#f59e0b' },
          { id: 'negotiation', title: 'Negociação', color: '#10b981' },
          { id: 'closed', title: 'Fechado', color: '#3b82f6' }
        ],
        cards: [
          { id: '1', columnId: 'lead', title: 'Empresa Zeta', description: 'Indicação via LinkedIn - Software gestão', priority: 'high', tags: ['b2b', 'software'] },
          { id: '2', columnId: 'contact', title: 'Empresa Omega', description: 'Reunião agendada para 25/01', priority: 'high', tags: ['consultoria'] },
          { id: '3', columnId: 'proposal', title: 'Empresa Alpha', description: 'Proposta de R$ 100k enviada', priority: 'high', tags: ['desenvolvimento'] },
          { id: '4', columnId: 'negotiation', title: 'Empresa Beta', description: 'Negociando descontos', priority: 'medium', tags: ['treinamento'] },
          { id: '5', columnId: 'closed', title: 'Empresa Gamma', description: 'Contrato assinado - R$ 85k', priority: 'low', tags: ['consultoria'] }
        ]
      })
    });

    const com_cronogramas = await base44.entities.Folder.create({
      name: 'Cronogramas',
      parent_id: tempRefs.COMERCIAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Pipeline_Semanal',
      type: 'crn',
      folder_id: com_cronogramas.id,
      owner: userEmail,
      content: JSON.stringify({
        groups: [
          { id: 'g1', name: 'Semana 22-26/Jan', color: '#3b82f6' },
          { id: 'g2', name: 'Semana 29-02/Fev', color: '#8b5cf6' },
          { id: 'g3', name: 'Semana 05-09/Fev', color: '#ec4899' }
        ],
        items: [
          { id: 'i1', groupId: 'g1', name: 'Follow-up Empresa Alpha', start: '2026-01-22', end: '2026-01-23', progress: 100 },
          { id: 'i2', groupId: 'g1', name: 'Reunião Empresa Omega', start: '2026-01-25', end: '2026-01-25', progress: 0 },
          { id: 'i3', groupId: 'g2', name: 'Enviar proposta Empresa Zeta', start: '2026-01-29', end: '2026-01-31', progress: 0 },
          { id: 'i4', groupId: 'g3', name: 'Negociação Empresa Beta', start: '2026-02-05', end: '2026-02-07', progress: 0 }
        ]
      })
    });

    const com_apresentacoes = await base44.entities.Folder.create({
      name: 'Apresentacoes',
      parent_id: tempRefs.COMERCIAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Pitch_Comercial_Atual',
      type: 'pptx',
      folder_id: com_apresentacoes.id,
      owner: userEmail,
      content: JSON.stringify({
        slides: [
          {
            background: '#1e3a8a',
            elements: [
              { type: 'text', content: 'Nossa Empresa', x: 100, y: 200, fontSize: 48, color: '#ffffff', bold: true },
              { type: 'text', content: 'Transformando Negócios com Tecnologia', x: 100, y: 280, fontSize: 24, color: '#93c5fd' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Sobre Nós', x: 50, y: 50, fontSize: 36, color: '#1e3a8a', bold: true },
              { type: 'text', content: '• 5 anos de mercado\n• 50+ clientes atendidos\n• 95% de satisfação\n• Equipe de 20 especialistas', x: 50, y: 150, fontSize: 20, color: '#1f2937' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Nossas Soluções', x: 50, y: 50, fontSize: 36, color: '#1e3a8a', bold: true },
              { type: 'text', content: '✓ Desenvolvimento de Software\n✓ Consultoria Empresarial\n✓ Transformação Digital\n✓ Suporte e Manutenção', x: 50, y: 150, fontSize: 22, color: '#1f2937' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Cases de Sucesso', x: 50, y: 50, fontSize: 36, color: '#1e3a8a', bold: true },
              { type: 'text', content: 'Cliente Alpha:\n40% aumento produtividade\n\nCliente Beta:\nR$ 500k economia/ano\n\nCliente Gamma:\n90% automação processos', x: 50, y: 150, fontSize: 18, color: '#1f2937' }
            ]
          },
          {
            background: '#1e3a8a',
            elements: [
              { type: 'text', content: 'Vamos Conversar?', x: 100, y: 200, fontSize: 42, color: '#ffffff', bold: true },
              { type: 'text', content: 'contato@empresa.com | (11) 9999-9999', x: 100, y: 280, fontSize: 20, color: '#93c5fd' }
            ]
          }
        ]
      })
    });

    console.log('✓ COMERCIAL completo');

    // 5. MARKETING
    const marketing = await base44.entities.Folder.create({
      name: 'MARKETING',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'pink'
    });
    tempRefs.MARKETING = marketing.id;

    const mkt_planejamento = await base44.entities.Folder.create({
      name: 'Planejamento',
      parent_id: tempRefs.MARKETING,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Planejamento_Marketing_2026',
      type: 'docx',
      folder_id: mkt_planejamento.id,
      owner: userEmail,
      content: exampleData.planejamento_marketing
    });

    const mkt_campanhas = await base44.entities.Folder.create({
      name: 'Campanhas',
      parent_id: tempRefs.MARKETING,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Campanha_Lancamento_Q1',
      type: 'kbn',
      folder_id: mkt_campanhas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'backlog', title: 'Backlog', color: '#6b7280' },
          { id: 'planning', title: 'Planejamento', color: '#6366f1' },
          { id: 'creation', title: 'Criação', color: '#f59e0b' },
          { id: 'review', title: 'Revisão', color: '#8b5cf6' },
          { id: 'published', title: 'Publicado', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'backlog', title: 'Vídeo institucional', description: 'Roteiro e storyboard', priority: 'medium', tags: ['vídeo', 'instagram'] },
          { id: '2', columnId: 'planning', title: 'Campanha Google Ads', description: 'Definir palavras-chave e orçamento', priority: 'high', tags: ['ads', 'pago'] },
          { id: '3', columnId: 'creation', title: 'Posts redes sociais', description: '12 posts programados', priority: 'high', tags: ['social', 'orgânico'] },
          { id: '4', columnId: 'review', title: 'E-book lead magnet', description: 'Aguardando aprovação final', priority: 'medium', tags: ['conteúdo'] },
          { id: '5', columnId: 'published', title: 'Landing page Q1', description: 'No ar desde 15/01', priority: 'low', tags: ['website'] }
        ]
      })
    });

    await base44.entities.File.create({
      name: 'Cronograma_Campanha_Q1',
      type: 'gnt',
      folder_id: mkt_campanhas.id,
      owner: userEmail,
      content: JSON.stringify({
        tasks: [
          { id: 't1', name: 'Planejamento Campanha', start: '2026-01-15', end: '2026-01-22', progress: 100, dependencies: [] },
          { id: 't2', name: 'Criação de Conteúdo', start: '2026-01-23', end: '2026-02-05', progress: 60, dependencies: ['t1'] },
          { id: 't3', name: 'Design Materiais', start: '2026-01-25', end: '2026-02-08', progress: 40, dependencies: ['t1'] },
          { id: 't4', name: 'Configuração Google Ads', start: '2026-02-06', end: '2026-02-10', progress: 0, dependencies: ['t2'] },
          { id: 't5', name: 'Lançamento Campanha', start: '2026-02-11', end: '2026-02-15', progress: 0, dependencies: ['t3', 't4'] },
          { id: 't6', name: 'Monitoramento e Ajustes', start: '2026-02-16', end: '2026-03-31', progress: 0, dependencies: ['t5'] }
        ]
      })
    });

    await base44.entities.File.create({
      name: 'Calendario_Postagens_Q1',
      type: 'crn',
      folder_id: mkt_campanhas.id,
      owner: userEmail,
      content: JSON.stringify({
        groups: [
          { id: 'instagram', name: 'Instagram', color: '#e11d48' },
          { id: 'linkedin', name: 'LinkedIn', color: '#0284c7' },
          { id: 'facebook', name: 'Facebook', color: '#1d4ed8' }
        ],
        items: [
          { id: 'i1', groupId: 'instagram', name: 'Post: Lançamento produto', start: '2026-01-23', end: '2026-01-23', progress: 100 },
          { id: 'i2', groupId: 'instagram', name: 'Stories: Bastidores', start: '2026-01-25', end: '2026-01-25', progress: 100 },
          { id: 'i3', groupId: 'linkedin', name: 'Artigo: Cases de sucesso', start: '2026-01-24', end: '2026-01-24', progress: 100 },
          { id: 'i4', groupId: 'instagram', name: 'Reels: Tutorial produto', start: '2026-01-27', end: '2026-01-27', progress: 50 },
          { id: 'i5', groupId: 'facebook', name: 'Post: Dicas do setor', start: '2026-01-28', end: '2026-01-28', progress: 0 },
          { id: 'i6', groupId: 'linkedin', name: 'Post: Novidades empresa', start: '2026-01-30', end: '2026-01-30', progress: 0 }
        ]
      })
    });

    const mkt_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.MARKETING,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Criacao_Conteudo',
      type: 'flux',
      folder_id: mkt_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Ideia de Conteúdo' }, class: 'start', html: 'Ideia de Conteúdo', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Pesquisa e Planejamento' }, class: 'process', html: 'Pesquisa e Planejamento', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'process', data: { text: 'Criação Texto/Design' }, class: 'process', html: 'Criação Texto/Design', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'decision', data: { text: 'Aprovado?' }, class: 'decision', html: 'Aprovado?', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] }, output_2: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 200 },
              '5': { id: 5, name: 'process', data: { text: 'Publicar Conteúdo' }, class: 'process', html: 'Publicar Conteúdo', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] } }, pos_x: 1100, pos_y: 130 },
              '6': { id: 6, name: 'process', data: { text: 'Ajustar Conteúdo' }, class: 'process', html: 'Ajustar Conteúdo', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_2' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 1100, pos_y: 270 },
              '7': { id: 7, name: 'end', data: { text: 'Monitorar Métricas' }, class: 'end', html: 'Monitorar Métricas', typenode: false, inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } }, outputs: {}, pos_x: 1350, pos_y: 130 }
            }
          }
        }
      })
    });

    const mkt_midias = await base44.entities.Folder.create({
      name: 'Midias',
      parent_id: tempRefs.MARKETING,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Criacoes_PhotoSmart',
      type: 'psd',
      folder_id: mkt_midias.id,
      owner: userEmail,
      content: JSON.stringify({ layers: [], canvas: { width: 1920, height: 1080, background: '#ffffff' } })
    });

    await base44.entities.Folder.create({
      name: 'Instagram',
      parent_id: mkt_midias.id,
      owner: userEmail
    });

    await base44.entities.Folder.create({
      name: 'Videos',
      parent_id: mkt_midias.id,
      owner: userEmail
    });

    console.log('✓ MARKETING completo');

    // 6. OPERACIONAL
    const operacional = await base44.entities.Folder.create({
      name: 'OPERACIONAL',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'cyan'
    });
    tempRefs.OPERACIONAL = operacional.id;

    const op_projetos = await base44.entities.Folder.create({
      name: 'Projetos',
      parent_id: tempRefs.OPERACIONAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Projeto_Cliente_X',
      type: 'gnt',
      folder_id: op_projetos.id,
      owner: userEmail,
      content: JSON.stringify({
        tasks: [
          { id: 't1', name: 'Levantamento de Requisitos', start: '2026-01-05', end: '2026-01-12', progress: 100, dependencies: [] },
          { id: 't2', name: 'Análise e Design', start: '2026-01-13', end: '2026-01-26', progress: 100, dependencies: ['t1'] },
          { id: 't3', name: 'Desenvolvimento Backend', start: '2026-01-27', end: '2026-03-15', progress: 40, dependencies: ['t2'] },
          { id: 't4', name: 'Desenvolvimento Frontend', start: '2026-02-03', end: '2026-03-22', progress: 25, dependencies: ['t2'] },
          { id: 't5', name: 'Integração e Testes', start: '2026-03-23', end: '2026-04-12', progress: 0, dependencies: ['t3', 't4'] },
          { id: 't6', name: 'Homologação Cliente', start: '2026-04-13', end: '2026-04-20', progress: 0, dependencies: ['t5'] },
          { id: 't7', name: 'Deploy Produção', start: '2026-04-21', end: '2026-04-23', progress: 0, dependencies: ['t6'] },
          { id: 't8', name: 'Treinamento Usuários', start: '2026-04-24', end: '2026-04-30', progress: 0, dependencies: ['t7'] }
        ]
      })
    });

    await base44.entities.File.create({
      name: 'Cronograma_Sprint_Projeto_X',
      type: 'crn',
      folder_id: op_projetos.id,
      owner: userEmail,
      content: JSON.stringify({
        groups: [
          { id: 'backend', name: 'Backend', color: '#3b82f6' },
          { id: 'frontend', name: 'Frontend', color: '#8b5cf6' },
          { id: 'qa', name: 'QA/Testes', color: '#10b981' }
        ],
        items: [
          { id: 'i1', groupId: 'backend', name: 'API Autenticação', start: '2026-01-27', end: '2026-02-05', progress: 100 },
          { id: 'i2', groupId: 'backend', name: 'API CRUD Produtos', start: '2026-02-06', end: '2026-02-20', progress: 80 },
          { id: 'i3', groupId: 'frontend', name: 'Telas Login/Dashboard', start: '2026-02-03', end: '2026-02-15', progress: 90 },
          { id: 'i4', groupId: 'frontend', name: 'Interface Gestão Produtos', start: '2026-02-16', end: '2026-03-05', progress: 50 },
          { id: 'i5', groupId: 'backend', name: 'Relatórios e Analytics', start: '2026-02-21', end: '2026-03-15', progress: 20 },
          { id: 'i6', groupId: 'qa', name: 'Testes Integração', start: '2026-03-06', end: '2026-03-20', progress: 0 }
        ]
      })
    });

    const op_tarefas = await base44.entities.Folder.create({
      name: 'Tarefas',
      parent_id: tempRefs.OPERACIONAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Operacional_Diario',
      type: 'kbn',
      folder_id: op_tarefas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'todo', title: 'A Fazer Hoje', color: '#ef4444' },
          { id: 'doing', title: 'Em Execução', color: '#f59e0b' },
          { id: 'review', title: 'Em Revisão', color: '#8b5cf6' },
          { id: 'done', title: 'Concluído', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'todo', title: 'Reunião daily', description: 'Stand-up 9h com equipe', priority: 'high', tags: ['reunião'] },
          { id: '2', columnId: 'doing', title: 'Desenvolvimento feature X', description: 'Sprint atual - story points 8', priority: 'high', tags: ['dev', 'sprint'] },
          { id: '3', columnId: 'doing', title: 'Code review PR #124', description: 'Revisar implementação API', priority: 'medium', tags: ['review'] },
          { id: '4', columnId: 'review', title: 'Testes módulo pagamentos', description: 'Aguardando validação QA', priority: 'high', tags: ['qa'] },
          { id: '5', columnId: 'done', title: 'Deploy staging', description: 'Build #234 em homologação', priority: 'medium', tags: ['deploy'] }
        ]
      })
    });

    const op_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.OPERACIONAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Entrega_Projeto',
      type: 'flux',
      folder_id: op_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Projeto Iniciado' }, class: 'start', html: 'Projeto Iniciado', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Desenvolvimento' }, class: 'process', html: 'Desenvolvimento', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'process', data: { text: 'Testes Internos' }, class: 'process', html: 'Testes Internos', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'decision', data: { text: 'Passou?' }, class: 'decision', html: 'Passou?', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] }, output_2: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 850, pos_y: 200 },
              '5': { id: 5, name: 'process', data: { text: 'Homologação Cliente' }, class: 'process', html: 'Homologação Cliente', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 1100, pos_y: 130 },
              '6': { id: 6, name: 'decision', data: { text: 'Aprovado?' }, class: 'decision', html: 'Aprovado?', typenode: false, inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] }, output_2: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 1350, pos_y: 130 },
              '7': { id: 7, name: 'end', data: { text: 'Deploy Produção' }, class: 'end', html: 'Deploy Produção', typenode: false, inputs: { input_1: { connections: [{ node: '6', input: 'output_1' }] } }, outputs: {}, pos_x: 1600, pos_y: 130 }
            }
          }
        }
      })
    });

    const op_controle = await base44.entities.Folder.create({
      name: 'Controle',
      parent_id: tempRefs.OPERACIONAL,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Status_Projetos',
      type: 'xlsx',
      folder_id: op_controle.id,
      owner: userEmail,
      content: exampleData.status_projetos
    });

    console.log('✓ OPERACIONAL completo');

    // 7. RH
    const rh = await base44.entities.Folder.create({
      name: 'RH',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'indigo'
    });
    tempRefs.RH = rh.id;

    const rh_colaboradores = await base44.entities.Folder.create({
      name: 'Colaboradores',
      parent_id: tempRefs.RH,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Cadastro_Colaboradores_Ativos',
      type: 'xlsx',
      folder_id: rh_colaboradores.id,
      owner: userEmail,
      content: exampleData.cadastro_colaboradores
    });

    const rh_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.RH,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Admissao_Demissao',
      type: 'flux',
      folder_id: rh_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Nova Contratação' }, class: 'start', html: 'Nova Contratação', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Coletar Documentos' }, class: 'process', html: 'Coletar Documentos', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'process', data: { text: 'Exame Admissional' }, class: 'process', html: 'Exame Admissional', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'process', data: { text: 'Assinar Contrato' }, class: 'process', html: 'Assinar Contrato', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 850, pos_y: 200 },
              '5': { id: 5, name: 'process', data: { text: 'Integração e Treinamento' }, class: 'process', html: 'Integração e Treinamento', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 1100, pos_y: 200 },
              '6': { id: 6, name: 'end', data: { text: 'Colaborador Ativo' }, class: 'end', html: 'Colaborador Ativo', typenode: false, inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } }, outputs: {}, pos_x: 1350, pos_y: 200 }
            }
          }
        }
      })
    });

    const rh_tarefas = await base44.entities.Folder.create({
      name: 'Tarefas',
      parent_id: tempRefs.RH,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'RH_Rotinas',
      type: 'kbn',
      folder_id: rh_tarefas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'pending', title: 'Pendente', color: '#ef4444' },
          { id: 'processing', title: 'Em Processo', color: '#f59e0b' },
          { id: 'completed', title: 'Concluído', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'pending', title: 'Processo admissão - João', description: 'Documentos pendentes', priority: 'high', tags: ['admissão'] },
          { id: '2', columnId: 'processing', title: 'Férias Maria - Fevereiro', description: 'Aprovação gerente ok', priority: 'medium', tags: ['férias'] },
          { id: '3', columnId: 'processing', title: 'Avaliação desempenho Q4', description: '8 colaboradores restantes', priority: 'high', tags: ['avaliação'] },
          { id: '4', columnId: 'completed', title: 'Folha pagamento janeiro', description: 'Processada e paga', priority: 'low', tags: ['folha'] },
          { id: '5', columnId: 'pending', title: 'Treinamento compliance', description: 'Agendar para fevereiro', priority: 'medium', tags: ['treinamento'] }
        ]
      })
    });

    const rh_cronogramas = await base44.entities.Folder.create({
      name: 'Cronogramas',
      parent_id: tempRefs.RH,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Ferias_Equipe_2026',
      type: 'crn',
      folder_id: rh_cronogramas.id,
      owner: userEmail,
      content: JSON.stringify({
        groups: [
          { id: 'comercial', name: 'Comercial', color: '#f97316' },
          { id: 'ti', name: 'TI', color: '#3b82f6' },
          { id: 'adm', name: 'Administrativo', color: '#8b5cf6' }
        ],
        items: [
          { id: 'i1', groupId: 'comercial', name: 'João Silva - Férias', start: '2026-02-10', end: '2026-02-24', progress: 0 },
          { id: 'i2', groupId: 'ti', name: 'Pedro Costa - Férias', start: '2026-03-15', end: '2026-03-29', progress: 0 },
          { id: 'i3', groupId: 'adm', name: 'Maria Santos - Férias', start: '2026-04-01', end: '2026-04-15', progress: 0 },
          { id: 'i4', groupId: 'comercial', name: 'Ana Oliveira - Férias', start: '2026-07-01', end: '2026-07-15', progress: 0 },
          { id: 'i5', groupId: 'ti', name: 'Carlos Lima - Férias', start: '2026-12-20', end: '2027-01-03', progress: 0 }
        ]
      })
    });

    console.log('✓ RH completo');

    // 8. JURIDICO
    const juridico = await base44.entities.Folder.create({
      name: 'JURIDICO',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'gray'
    });
    tempRefs.JURIDICO = juridico.id;

    const jur_contratos = await base44.entities.Folder.create({
      name: 'Contratos',
      parent_id: tempRefs.JURIDICO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Contrato_Prestacao_Servico_Cliente_A',
      type: 'docx',
      folder_id: jur_contratos.id,
      owner: userEmail,
      content: '<h1 style="text-align: center;"><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong></h1><p><br></p><p><strong>Contrato nº:</strong> 001/2026</p><p><strong>Data:</strong> 05 de Janeiro de 2026</p><p><br></p><h2><strong>1. DAS PARTES</strong></h2><p><strong>CONTRATANTE:</strong> Empresa Alpha LTDA, CNPJ 12.345.678/0001-90</p><p>Endereço: Av. Paulista, 1000 - São Paulo/SP</p><p><br></p><p><strong>CONTRATADA:</strong> Nossa Empresa LTDA, CNPJ 98.765.432/0001-00</p><p>Endereço: Rua Comercial, 500 - São Paulo/SP</p><p><br></p><h2><strong>2. DO OBJETO</strong></h2><p>O presente contrato tem por objeto a prestação de serviços de <strong>Desenvolvimento de Sistema de Gestão Integrado</strong>, conforme especificações técnicas do Anexo I.</p><p><br></p><h2><strong>3. DO VALOR E FORMA DE PAGAMENTO</strong></h2><p>O valor total dos serviços é de <strong>R$ 100.000,00</strong> (cem mil reais), a ser pago da seguinte forma:</p><p>• 30% na assinatura do contrato: R$ 30.000,00</p><p>• 40% na entrega dos módulos principais: R$ 40.000,00</p><p>• 30% após homologação final: R$ 30.000,00</p><p><br></p><h2><strong>4. DO PRAZO</strong></h2><p>O prazo de execução dos serviços é de <strong>18 (dezoito) semanas</strong>, com início em 08/01/2026 e término previsto para 30/04/2026.</p><p><br></p><h2><strong>5. DAS OBRIGAÇÕES</strong></h2><p><strong>Da CONTRATADA:</strong></p><p>• Executar os serviços com qualidade técnica</p><p>• Fornecer relatórios semanais de andamento</p><p>• Realizar treinamento da equipe</p><p>• Garantir suporte técnico por 12 meses</p><p><br></p><p><strong>Da CONTRATANTE:</strong></p><p>• Fornecer informações necessárias</p><p>• Disponibilizar ambiente de testes</p><p>• Realizar pagamentos nos prazos acordados</p><p>• Designar responsável para acompanhamento</p>'
    });

    await base44.entities.File.create({
      name: 'Contrato_Prestacao_Servico_Cliente_B',
      type: 'docx',
      folder_id: jur_contratos.id,
      owner: userEmail,
      content: '<h1 style="text-align: center;"><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong></h1><p><br></p><p><strong>Contrato nº:</strong> 002/2026</p><p><strong>Data:</strong> 10 de Janeiro de 2026</p><p><br></p><h2><strong>1. DAS PARTES</strong></h2><p><strong>CONTRATANTE:</strong> Beta Comércio SA, CNPJ 23.456.789/0001-01</p><p>Endereço: Rua Augusta, 2500 - São Paulo/SP</p><p><br></p><p><strong>CONTRATADA:</strong> Nossa Empresa LTDA, CNPJ 98.765.432/0001-00</p><p>Endereço: Rua Comercial, 500 - São Paulo/SP</p><p><br></p><h2><strong>2. DO OBJETO</strong></h2><p>O presente contrato tem por objeto a prestação de serviços de <strong>Consultoria em Processos Empresariais</strong>, incluindo mapeamento, análise e otimização.</p><p><br></p><h2><strong>3. DO VALOR E FORMA DE PAGAMENTO</strong></h2><p>O valor total dos serviços é de <strong>R$ 75.000,00</strong> (setenta e cinco mil reais), a ser pago em 3 parcelas mensais de R$ 25.000,00.</p><p><br></p><h2><strong>4. DO PRAZO</strong></h2><p>O prazo de execução dos serviços é de <strong>12 (doze) semanas</strong>, com início em 15/01/2026 e término previsto para 15/03/2026.</p><p><br></p><h2><strong>5. ESCOPO DOS SERVIÇOS</strong></h2><p>• Diagnóstico organizacional completo</p><p>• Mapeamento de 10 processos principais</p><p>• Análise de gargalos e oportunidades</p><p>• Proposta de melhoria e automação</p><p>• Acompanhamento de implementação (60 dias)</p><p>• Treinamento de 3 turmas</p>'
    });

    const jur_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.JURIDICO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Analise_Contratos',
      type: 'flux',
      folder_id: jur_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Contrato Recebido' }, class: 'start', html: 'Contrato Recebido', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'process', data: { text: 'Análise Preliminar' }, class: 'process', html: 'Análise Preliminar', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'decision', data: { text: 'Complexo?' }, class: 'decision', html: 'Complexo?', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '4', output: 'input_1' }] }, output_2: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 600, pos_y: 200 },
              '4': { id: 4, name: 'process', data: { text: 'Consultoria Externa' }, class: 'process', html: 'Consultoria Externa', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 130 },
              '5': { id: 5, name: 'process', data: { text: 'Análise Interna' }, class: 'process', html: 'Análise Interna', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_2' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 270 },
              '6': { id: 6, name: 'process', data: { text: 'Emitir Parecer' }, class: 'process', html: 'Emitir Parecer', typenode: false, inputs: { input_1: { connections: [{ node: '4', input: 'output_1' }, { node: '5', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] } }, pos_x: 1100, pos_y: 200 },
              '7': { id: 7, name: 'end', data: { text: 'Contrato Analisado' }, class: 'end', html: 'Contrato Analisado', typenode: false, inputs: { input_1: { connections: [{ node: '6', input: 'output_1' }] } }, outputs: {}, pos_x: 1350, pos_y: 200 }
            }
          }
        }
      })
    });

    const jur_controle = await base44.entities.Folder.create({
      name: 'Controle',
      parent_id: tempRefs.JURIDICO,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Acompanhamento_Contratos',
      type: 'xlsx',
      folder_id: jur_controle.id,
      owner: userEmail,
      content: 'Contrato,Cliente,CNPJ,Valor,Início,Vencimento,Status,Renovação,Responsável\nCTR-001/2026,Empresa Alpha,12.345.678/0001-90,100000,2026-01-05,2027-01-05,Vigente,Automática,Dr. Silva\nCTR-002/2026,Beta Comércio,23.456.789/0001-01,75000,2026-01-10,2027-01-10,Vigente,Manual,Dr. Silva\nCTR-015/2025,Gamma Indústria,34.567.890/0001-12,150000,2025-06-01,2026-06-01,Vigente,Manual,Dra. Santos\nCTR-022/2025,Delta Serviços,45.678.901/0001-23,50000,2025-09-15,2026-09-15,Vigente,Automática,Dr. Silva\nCTR-008/2024,Épsilon Tech,56.789.012/0001-34,200000,2024-03-01,2026-03-01,A Vencer,Manual,Dra. Santos\nCTR-031/2025,Zeta Logistics,67.890.123/0001-45,90000,2025-11-01,2026-11-01,Vigente,Automática,Dr. Silva'
    });

    console.log('✓ JURIDICO completo');

    // 9. TI
    const ti = await base44.entities.Folder.create({
      name: 'TI',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'blue'
    });
    tempRefs.TI = ti.id;

    const ti_documentacao = await base44.entities.Folder.create({
      name: 'Documentacao',
      parent_id: tempRefs.TI,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Infraestrutura_Sistemas',
      type: 'docx',
      folder_id: ti_documentacao.id,
      owner: userEmail,
      content: exampleData.infraestrutura_ti
    });

    const ti_processos = await base44.entities.Folder.create({
      name: 'Processos',
      parent_id: tempRefs.TI,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Fluxo_Suporte_TI',
      type: 'flux',
      folder_id: ti_processos.id,
      owner: userEmail,
      content: JSON.stringify({
        drawflow: {
          Home: {
            data: {
              '1': { id: 1, name: 'start', data: { text: 'Chamado Aberto' }, class: 'start', html: 'Chamado Aberto', typenode: false, inputs: {}, outputs: { output_1: { connections: [{ node: '2', output: 'input_1' }] } }, pos_x: 100, pos_y: 200 },
              '2': { id: 2, name: 'decision', data: { text: 'Prioridade?' }, class: 'decision', html: 'Prioridade?', typenode: false, inputs: { input_1: { connections: [{ node: '1', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '3', output: 'input_1' }] }, output_2: { connections: [{ node: '4', output: 'input_1' }] } }, pos_x: 350, pos_y: 200 },
              '3': { id: 3, name: 'process', data: { text: 'Atendimento Imediato' }, class: 'process', html: 'Atendimento Imediato', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 600, pos_y: 130 },
              '4': { id: 4, name: 'process', data: { text: 'Adicionar à Fila' }, class: 'process', html: 'Adicionar à Fila', typenode: false, inputs: { input_1: { connections: [{ node: '2', input: 'output_2' }] } }, outputs: { output_1: { connections: [{ node: '5', output: 'input_1' }] } }, pos_x: 600, pos_y: 270 },
              '5': { id: 5, name: 'process', data: { text: 'Diagnóstico e Solução' }, class: 'process', html: 'Diagnóstico e Solução', typenode: false, inputs: { input_1: { connections: [{ node: '3', input: 'output_1' }, { node: '4', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '6', output: 'input_1' }] } }, pos_x: 850, pos_y: 200 },
              '6': { id: 6, name: 'process', data: { text: 'Confirmar com Usuário' }, class: 'process', html: 'Confirmar com Usuário', typenode: false, inputs: { input_1: { connections: [{ node: '5', input: 'output_1' }] } }, outputs: { output_1: { connections: [{ node: '7', output: 'input_1' }] } }, pos_x: 1100, pos_y: 200 },
              '7': { id: 7, name: 'end', data: { text: 'Chamado Fechado' }, class: 'end', html: 'Chamado Fechado', typenode: false, inputs: { input_1: { connections: [{ node: '6', input: 'output_1' }] } }, outputs: {}, pos_x: 1350, pos_y: 200 }
            }
          }
        }
      })
    });

    const ti_tarefas = await base44.entities.Folder.create({
      name: 'Tarefas',
      parent_id: tempRefs.TI,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Suporte_TI',
      type: 'kbn',
      folder_id: ti_tarefas.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'open', title: 'Abertos', color: '#ef4444' },
          { id: 'progress', title: 'Em Atendimento', color: '#f59e0b' },
          { id: 'waiting', title: 'Aguardando', color: '#8b5cf6' },
          { id: 'resolved', title: 'Resolvido', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'open', title: 'Notebook lento - João', description: 'Precisa otimização', priority: 'medium', tags: ['hardware'] },
          { id: '2', columnId: 'progress', title: 'Erro no sistema - Maria', description: 'Investigando bug', priority: 'high', tags: ['software', 'urgente'] },
          { id: '3', columnId: 'progress', title: 'Novo acesso - Pedro', description: 'Criar usuário CRM', priority: 'low', tags: ['acesso'] },
          { id: '4', columnId: 'waiting', title: 'Impressora offline', description: 'Aguardando peça', priority: 'medium', tags: ['hardware'] },
          { id: '5', columnId: 'resolved', title: 'Reset senha - Ana', description: 'Senha resetada com sucesso', priority: 'low', tags: ['acesso'] }
        ]
      })
    });

    const ti_controle = await base44.entities.Folder.create({
      name: 'Controle',
      parent_id: tempRefs.TI,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Acessos_Sistemas',
      type: 'xlsx',
      folder_id: ti_controle.id,
      owner: userEmail,
      content: 'Usuário,Nome,Cargo,Sistema,Perfil,Data Acesso,Último Login,Status\njoao.silva,João Silva,Gerente Comercial,ERP,Admin,2024-01-15,2026-01-22 08:30,Ativo\njoao.silva,João Silva,Gerente Comercial,CRM,Admin,2024-01-15,2026-01-22 09:15,Ativo\nmaria.santos,Maria Santos,Analista Financeiro,ERP,Usuário,2024-03-20,2026-01-22 08:45,Ativo\nmaria.santos,Maria Santos,Analista Financeiro,Sistema Financeiro,Admin,2024-03-20,2026-01-21 17:20,Ativo\npedro.costa,Pedro Costa,Desenvolvedor Senior,GitLab,Admin,2023-08-10,2026-01-22 10:05,Ativo\npedro.costa,Pedro Costa,Desenvolvedor Senior,AWS Console,Admin,2023-08-10,2026-01-20 15:30,Ativo\nana.oliveira,Ana Oliveira,Coord. Marketing,CRM,Usuário,2024-06-01,2026-01-22 08:00,Ativo\nana.oliveira,Ana Oliveira,Coord. Marketing,RD Station,Admin,2024-06-01,2026-01-21 18:45,Ativo\ncarlos.lima,Carlos Lima,Analista Operacional,ERP,Usuário,2025-01-10,2026-01-22 07:50,Ativo\ncarlos.lima,Carlos Lima,Analista Operacional,Sistema Projetos,Usuário,2025-01-10,2026-01-22 09:30,Ativo'
    });

    console.log('✓ TI completo');

    // 10. DIRETORIA
    const diretoria = await base44.entities.Folder.create({
      name: 'DIRETORIA',
      parent_id: tempRefs.EMPRESA,
      owner: userEmail,
      color: 'red'
    });
    tempRefs.DIRETORIA = diretoria.id;

    const dir_planejamento = await base44.entities.Folder.create({
      name: 'Planejamento',
      parent_id: tempRefs.DIRETORIA,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Planejamento_Estrategico_2026',
      type: 'docx',
      folder_id: dir_planejamento.id,
      owner: userEmail,
      content: exampleData.planejamento_estrategico
    });

    const dir_projetos = await base44.entities.Folder.create({
      name: 'Projetos',
      parent_id: tempRefs.DIRETORIA,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Expansao_Empresa',
      type: 'gnt',
      folder_id: dir_projetos.id,
      owner: userEmail,
      content: JSON.stringify({
        tasks: [
          { id: 't1', name: 'Estudo de Viabilidade', start: '2026-01-15', end: '2026-02-28', progress: 50, dependencies: [] },
          { id: 't2', name: 'Análise Mercado Regional', start: '2026-01-20', end: '2026-02-15', progress: 60, dependencies: [] },
          { id: 't3', name: 'Planejamento Financeiro', start: '2026-03-01', end: '2026-03-31', progress: 0, dependencies: ['t1'] },
          { id: 't4', name: 'Busca de Instalações', start: '2026-03-15', end: '2026-05-15', progress: 0, dependencies: ['t2'] },
          { id: 't5', name: 'Contratação Equipe Local', start: '2026-04-01', end: '2026-06-30', progress: 0, dependencies: ['t3'] },
          { id: 't6', name: 'Setup Infraestrutura', start: '2026-05-16', end: '2026-07-31', progress: 0, dependencies: ['t4'] },
          { id: 't7', name: 'Marketing Pré-Lançamento', start: '2026-06-01', end: '2026-08-15', progress: 0, dependencies: ['t5'] },
          { id: 't8', name: 'Inauguração Filial', start: '2026-08-16', end: '2026-08-31', progress: 0, dependencies: ['t6', 't7'] }
        ]
      })
    });

    await base44.entities.File.create({
      name: 'Tarefas_Expansao',
      type: 'kbn',
      folder_id: dir_projetos.id,
      owner: userEmail,
      content: JSON.stringify({
        columns: [
          { id: 'backlog', title: 'Backlog', color: '#6b7280' },
          { id: 'planning', title: 'Planejamento', color: '#6366f1' },
          { id: 'execution', title: 'Execução', color: '#f59e0b' },
          { id: 'completed', title: 'Concluído', color: '#10b981' }
        ],
        cards: [
          { id: '1', columnId: 'backlog', title: 'Definir localização filial', description: '3 cidades em análise', priority: 'high', tags: ['estratégia'] },
          { id: '2', columnId: 'planning', title: 'Orçamento expansão', description: 'Projeção de R$ 2M', priority: 'high', tags: ['financeiro'] },
          { id: '3', columnId: 'planning', title: 'Pesquisa imóveis comerciais', description: 'Mínimo 300m²', priority: 'medium', tags: ['infraestrutura'] },
          { id: '4', columnId: 'execution', title: 'Análise concorrência regional', description: '70% concluído', priority: 'high', tags: ['marketing'] },
          { id: '5', columnId: 'completed', title: 'Aprovação diretoria', description: 'Projeto aprovado em 10/01', priority: 'low', tags: ['governança'] }
        ]
      })
    });

    const dir_apresentacoes = await base44.entities.Folder.create({
      name: 'Apresentacoes',
      parent_id: tempRefs.DIRETORIA,
      owner: userEmail
    });

    await base44.entities.File.create({
      name: 'Reuniao_Diretoria_Janeiro_2026',
      type: 'pptx',
      folder_id: dir_apresentacoes.id,
      owner: userEmail,
      content: JSON.stringify({
        slides: [
          {
            background: '#7c3aed',
            elements: [
              { type: 'text', content: 'Reunião de Diretoria', x: 100, y: 180, fontSize: 48, color: '#ffffff', bold: true },
              { type: 'text', content: 'Janeiro 2026 - Resultados e Planejamento', x: 100, y: 260, fontSize: 22, color: '#e9d5ff' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Resultados Q4 2025', x: 50, y: 50, fontSize: 36, color: '#7c3aed', bold: true },
              { type: 'text', content: 'Faturamento: R$ 2.4M (+18%)\nNovos Clientes: 12\nRetenção: 94%\nLucro Líquido: R$ 480k (+22%)', x: 50, y: 150, fontSize: 24, color: '#1f2937' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Metas 2026', x: 50, y: 50, fontSize: 36, color: '#7c3aed', bold: true },
              { type: 'text', content: '🎯 Faturamento: R$ 3.5M\n🎯 Expansão: 3 novos estados\n🎯 Equipe: +15 colaboradores\n🎯 Novos Produtos: 2 lançamentos', x: 50, y: 150, fontSize: 22, color: '#1f2937' }
            ]
          },
          {
            background: '#ffffff',
            elements: [
              { type: 'text', content: 'Investimentos 2026', x: 50, y: 50, fontSize: 36, color: '#7c3aed', bold: true },
              { type: 'text', content: 'Marketing: R$ 430k\nP&D: R$ 500k\nInfraestrutura: R$ 200k\nCapacitação: R$ 120k\n\nTotal: R$ 1.25M', x: 50, y: 150, fontSize: 22, color: '#1f2937' }
            ]
          },
          {
            background: '#7c3aed',
            elements: [
              { type: 'text', content: 'Próxima Reunião', x: 100, y: 200, fontSize: 40, color: '#ffffff', bold: true },
              { type: 'text', content: 'Fevereiro 2026 - Review Mensal', x: 100, y: 280, fontSize: 24, color: '#e9d5ff' }
            ]
          }
        ]
      })
    });

    console.log('✓ DIRETORIA completo');
    console.log('✅ Estrutura padrão criada com sucesso!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar estrutura:', error);
    throw error;
  }
}