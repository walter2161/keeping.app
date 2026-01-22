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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: JSON.stringify({ groups: [], items: [] })
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
      content: 'Número,Data,Fornecedor,Valor,Tipo\n001,2026-01-15,Fornecedor A,5000,Entrada\n002,2026-01-18,Cliente B,15000,Saída\n003,2026-01-20,Fornecedor C,3500,Entrada'
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: JSON.stringify({ groups: [], items: [] })
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: JSON.stringify({ groups: [], items: [] })
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
      content: JSON.stringify({ slides: [{ background: '#ffffff', elements: [] }] })
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
      content: JSON.stringify({ columns: [], cards: [] })
    });

    await base44.entities.File.create({
      name: 'Campanha_Lancamento_Q1',
      type: 'gnt',
      folder_id: mkt_campanhas.id,
      owner: userEmail,
      content: JSON.stringify({ tasks: [] })
    });

    await base44.entities.File.create({
      name: 'Calendario_Postagens_Q1',
      type: 'crn',
      folder_id: mkt_campanhas.id,
      owner: userEmail,
      content: JSON.stringify({ groups: [], items: [] })
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ tasks: [] })
    });

    await base44.entities.File.create({
      name: 'Projeto_Cliente_X',
      type: 'crn',
      folder_id: op_projetos.id,
      owner: userEmail,
      content: JSON.stringify({ groups: [], items: [] })
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
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: JSON.stringify({ groups: [], items: [] })
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
      content: '<h1 style="text-align: center;"><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong></h1><p><br></p><p>Entre as partes CONTRATANTE e CONTRATADA, fica acordado...</p>'
    });

    await base44.entities.File.create({
      name: 'Contrato_Prestacao_Servico_Cliente_B',
      type: 'docx',
      folder_id: jur_contratos.id,
      owner: userEmail,
      content: '<h1 style="text-align: center;"><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong></h1><p><br></p><p>Entre as partes CONTRATANTE e CONTRATADA, fica acordado...</p>'
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: 'Contrato,Cliente,Valor,Início,Vencimento,Status\nContrato 001,Cliente A,100000,2026-01-01,2027-01-01,Vigente\nContrato 002,Cliente B,75000,2025-12-01,2026-12-01,Vigente'
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
      content: JSON.stringify({ drawflow: { Home: { data: {} } } })
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
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: 'Usuário,Sistema,Perfil,Data Acesso,Status\njoao.silva,ERP,Admin,2026-01-15,Ativo\nmaria.santos,CRM,Usuário,2026-01-10,Ativo'
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
      content: JSON.stringify({ tasks: [] })
    });

    await base44.entities.File.create({
      name: 'Expansao_Empresa',
      type: 'kbn',
      folder_id: dir_projetos.id,
      owner: userEmail,
      content: JSON.stringify({ columns: [], cards: [] })
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
      content: JSON.stringify({ slides: [{ background: '#ffffff', elements: [] }] })
    });

    console.log('✓ DIRETORIA completo');
    console.log('✅ Estrutura padrão criada com sucesso!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar estrutura:', error);
    throw error;
  }
}