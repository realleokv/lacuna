# Rastreabilidade da entrega

Base: prompt mestre LACUNA fornecido no PDF, complemento em texto e decisões posteriores da conversa. “Entregue” indica implementação; limites de validação estão em `VALIDACAO.md`.

| Requisito | Localização | Situação |
| --- | --- | --- |
| Marca lacuna. e slogans | `templates/index.html`, `static/js/app.js`, assets SVG | Entregue |
| Paleta, Sora, Nunito Sans e tokens | `static/css/tokens.css`, fontes com OFL | Entregue |
| Grid e componentes arredondados | `static/css/styles.css` | Entregue |
| Mascote original com visor e antenas | `static/js/lumi.js`, `static/assets/lumi.svg` | Entregue |
| 4 cores, 3 expressões, 4 acessórios, 3 tons | Criador Lumi e `sanitizeLumi` | Entregue; 144 combinações verificadas |
| Apelido de até 20 caracteres e reset | Criador/configurações | Entregue |
| Preservar escolha visual nas telas | `applyTheme` e variáveis CSS | Entregue |
| Grafo N1–N4 com dependências | `data/concepts.json`, painel | Entregue; cinco conexões |
| Pelo menos 12 questões | `data/questions.json` | Ampliado para 34 |
| Metadados, resposta, pistas e explicação | Banco JSON | Entregue |
| Diagnóstico entre 5 e 10 questões | `next_question` | Entregue; 8 a 10 nesta versão |
| Investigar pré-requisitos após erro | Sequência e dois probes | Entregue |
| Caminho 3x+6=21 → 21−6 → 15÷3 | `next_question`, testes de integração | Entregue |
| Não confirmar lacuna com erro isolado | `summarize`, textos de feedback | Entregue |
| Regra explícita de domínio | `CONTENT.mastery`, `summarize` | 2 independentes em 3 distintas |
| Quatro estados do conceito | Motor e rótulos do painel | Entregue |
| Pistas voluntárias em três níveis | `/api/hint`, tela de atividade | Entregue; 102 pistas |
| Pelo menos uma aula completa | `concepts.json`, `lesson` | Ampliado para quatro |
| Exercício de prática e nova reavaliação | Modos `practice` e `reassessment` | Entregue |
| Sete áreas funcionais | Hash router em `app.js` | Entregue |
| Grafo, barras, linha e cartões | `dashboard.js` | Somente registros reais; linha exige duas sessões comparáveis |
| Estados vazios honestos | Painel e resultados | Entregue; sem histórico fictício embarcado |
| Valores com denominador | Barras, resultados e comparação | Entregue |
| LocalStorage sem login | `storage.js` | Entregue; substitui a ideia anterior de banco |
| Exportar e apagar dados | Configurações | Entregue; importação não faz parte do escopo |
| Flask e JavaScript modular | `app.py`, `static/js/*.js` | Entregue |
| Rotas mínimas | `/`, `/api/content`, `/api/diagnose`, `/api/health` | Entregue, com três rotas de apoio |
| Sem API externa de IA | Motor determinístico local ao servidor | Entregue |
| Validação, limite e sem eval | API e parser com Fraction | Entregue |
| Acessibilidade e movimento reduzido | Labels, foco, skip link, tabelas e CSS | Implementado; auditoria completa ainda não realizada |
| Execução no Windows | `iniciar.bat` e README | Preparada; teste real no Windows pendente |
| Testes e lista de verificação | `tests/`, `docs/VALIDACAO.md` | Entregue |
| Roteiro de três minutos | `docs/DEMO_3_MINUTOS.md` | Entregue |
| Publicação via link | `render.yaml`, seção Render no README | Preparada; serviço público ainda não criado nesta entrega |

## Mudanças de escopo registradas

O número de questões e aulas foi ampliado dentro da autorização do usuário. A persistência passou de conta/banco para armazenamento no navegador por pedido explícito. Foram adicionadas rotas pequenas de pistas, sequência e relatório para manter as regras no servidor. O servidor WSGI é Waitress para permitir o mesmo comando em Windows e hospedagem Linux.

Não foram incluídos conteúdo de outras matérias, agentes de IA externos, pagamento, conta, dados pessoais obrigatórios, ranking ou alegação de resultado educacional comprovado.
