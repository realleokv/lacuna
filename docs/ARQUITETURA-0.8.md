# Arquitetura da versão 0.8

## Aplicação e contratos

Uma aplicação Flask serve a página, arquivos estáticos, o catálogo público e os corretores. O frontend mantém o roteamento por fragmentos do MVP; links profundos abrem qualquer área ou lição. Os pacotes em disco são independentes por área e possuem IDs estáveis. A primeira carga agrega os pacotes em um GET para permitir navegação imediata. O tamanho cresce com o número de áreas; uma divisão por demanda pode ser adotada quando medições justificarem.

| Componente | Responsabilidade |
|---|---|
| `app.py`, `diagnostic.py` | Rotas de saúde e acervo clássico, correção numérica exata, recomendação e reavaliação anteriores |
| `catalog.py` | Blueprint dos novos pacotes, projeção pública, validação de entradas e correção tipada |
| `static/js/storage.js` | Leitura, migração aditiva, gravação, aviso, exportação e recuperação |
| `static/js/hub/progress.js` | Eventos, estado adaptativo, intervalos, sessões, calendário, XP e compras |
| `hub/controller.js`, `hub/views.js` | Índices por ID, rotas, controles de teclado, formulários, tratamento de falhas e renderização |
| `lumi.js`, `hub/companion.js` | SVG existente, expressões, diálogo, gesto de arrastar e âncoras visuais |
| `experiences/cube.js`, `experiences/lab.js` | Modelo geométrico, visualizações e experiências isoladas do domínio pedagógico |
| `tests/` | Suítes Python, Node e jornadas Playwright pela aplicação real |

### API

| Método e caminho | Contrato |
|---|---|
| GET `/api/health` | Estado do processo e versão 0.8.0 |
| GET `/api/hub/catalog` | Áreas, trilhas, aulas e enunciados. Exclui `validator`, `hints` e `feedback` dos itens avaliados. A previsão guiada da aula tem resolução pública. |
| POST `/api/hub/check` | Recebe `{id, answer}`. Valor textual ou, em ordenação, lista completa das opções. Devolve `{correct, text}`. |
| POST `/api/hub/hint` | Recebe `{id, level}`, nível 1 ou 2. Devolve uma orientação ou resolução comentada. |
| GET `/api/content`; POST `/api/diagnose`, `/api/hint`, `/api/next`, `/api/report` | Contratos do acervo clássico, preservados. |

O Flask limita o corpo a 256 KB. Questões avaliadas trabalham com texto, listas fechadas e frações exatas. A renderização escapa o texto inserido em HTML. As chamadas de rede usam a mesma origem e as fontes são locais. O cabeçalho de permissões bloqueia câmera e microfone. A correção é um recurso de autoestudo; o usuário controla seu histórico local e os gabaritos autorais são consultáveis no código do repositório.

## Estado local e retomada

A versão 1 do envelope já continha sessões, microaulas, Lumi, rascunhos e respostas. A extensão `hub.version = 1` é adicionada ao carregar um envelope válido que ainda não a possua. O leitor agora reconhece N1–N20 e conserva as coleções anteriores. Uma versão desconhecida ou estrutura ilegível mantém o original e ativa a sessão em memória. Cada gravação compara a cópia lida com o valor atual. Uma alteração já observável feita por outra aba impede que uma cópia antiga a sobrescreva. O protocolo é local e não oferece transações entre processos. Quota insuficiente é sinalizada na interface.

Um percurso é identificado pelo modo e alvo. Guarda ordem das questões, índice, respostas digitadas, opções, tentativas, dicas e feedback. A resposta do servidor só é aplicada se rota, pergunta e percurso ainda forem os mesmos. Uma microaula termina depois de três práticas corretas; no diagnóstico, o aluno também pode avançar depois de uma tentativa errada. O acervo clássico conserva o diagnóstico ramificado e o seu próprio critério histórico.

## Evidências e revisão

- Cada sessão guarda a primeira resposta de cada questão. A primeira exposição a um ID é a evidência considerada para esse ID. Repetições continuam no histórico. Uma pista anterior ao acerto impede evidência independente. Erros compreendidos com ajuda ainda podem concluir a atividade.
- O motor examina as três evidências distintas mais recentes de cada conceito. Três questões e pelo menos dois acertos independentes indicam domínio provisório. Duas primeiras respostas incorretas sugerem prática. Outros conjuntos parciais ficam em desenvolvimento.
- As revisões passam a estar disponíveis após o intervalo escolhido de 1, 2 ou 7 dias; padrão de 2. Um recuo do relógio admite revisão em outra sessão. A revisão usa item reservado e inédito. A reconfirmação exige domínio provisório anterior, acerto independente e janela atual consistente. O banco possui duas oportunidades distintas por microaula e identifica quando terminam.
- A prioridade de recomendação considera revisão vencida, dificuldade observada, bases sugeridas e interesses. O diagnóstico é opcional. A dificuldade automática ordena a prática inicial pelo estado do conceito e as questões restantes pela resposta anterior. A opção manual define a ordem inicial sem alterar o histórico. Todas as três práticas continuam disponíveis.
- Não se atribui diagnóstico clínico nem precisão psicométrica ao indicador. O laboratório, as conversas do Lumi e as previsões guiadas ficam fora do cálculo.

## Gamificação

Uma questão corrigida até o acerto rende 5 XP e uma moeda somente na primeira conclusão desse ID. Uma microaula concluída pela primeira vez rende 10 XP e duas moedas. Uma revisão que reconfirma domínio concede 10 XP adicionais. O nível sobe a cada 60 XP. Essas constantes são escolhas iniciais de implementação. A moeda é virtual e só serve para cosméticos. Compras repetidas e cliques de conclusão repetidos não duplicam saldo. O painel diário acompanha três práticas novas e a coleção também registra a primeira conclusão de microaula do dia. O histórico usa a data local gravada no evento. A sequência conta dias ativos consecutivos até hoje ou ontem e ignora datas futuras no cálculo atual.

## Lumi e experiências

Lumi ocupa uma faixa reservada, tem posição horizontal entre 0 e 1, retorno por Home e por Configurações. Um diálogo nativo contém perguntas e pistas. A âncora na microaula recebe uma animação curta em uma área reservada se estiver visível. O modo de movimento reduzido mantém expressão e texto. Cor livre, roupas, acessórios, tema, som e coleção persistem.

O cubo usa 54 adesivos com posição e normal. Cada giro rotaciona a camada correspondente em torno de um eixo. Rede 2D, texto e perspectiva CSS 3D usam o mesmo estado. O estúdio de ritmo calcula o desvio absoluto médio dos últimos três intervalos em relação ao BPM escolhido. A escada de notas mostra frequências e direção melódica. O trilho usa movimento uniforme, com x inicial zero e x = v × t. O som começa após gesto e está inicialmente silenciado. O metrônomo é interrompido ao sair ou ocultar a página.

## Decisões e limites

Flask, Waitress e ES modules atendem ao escopo. Não houve migração de framework, dependência visual em produção, servidor de perfis ou armazenamento de mídia. O repositório do Air Drums indicado pelo proprietário, `realleokv/leokv_air_drums`, continha apenas o arquivo LICENSE (MIT) no commit `7cfa4c4`. Sem protótipo executável nesse repositório para integrar ou medir, a entrega usa o estúdio de ritmo com toque, teclado e som opcional. Air Drums por câmera permanece P2.
