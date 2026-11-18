# Validação da candidata Lacuna 0.8

**Data:** 18/11/2026. **Base:** `802e2c80e359fe6e03792a61d9a3809b36b0f8ca`. **Escopo:** servidores locais Flask/Waitress, arquivos da branch de revisão e consulta somente de leitura ao serviço Render existente.

## Resultado reproduzível

| Verificação executada | Resultado |
|---|---|
| Base antes das mudanças | Python: 196 passaram, quatro falharam. Node: nove passaram. No Chromium, diagnóstico respondeu corretamente; painel antigo lançou exceção. |
| `python -m pytest -q` | **582 passaram**. Inclui os 200 casos do acervo, contrato de 10 pacotes, verificação de chave e alternativa para cada um dos 380 itens e integração com as rotas Flask de catálogo, pistas e correção. |
| `node --test tests/*.test.mjs` | **20 passaram**. Abrange dados inválidos, quota, original recuperável, escrita a partir de aba desatualizada, versão anterior, recompensas, sequência, dificuldade, domínio, revisão e transformações do cubo. |
| Playwright `--sweep`, Chromium, 1366 × 900 | Abriu as 60 aulas, respondeu às 180 práticas e concluiu os 20 desafios. Completou os dez diagnósticos (60 itens). Avançou o relógio do navegador de teste em três dias em cada uma de duas rodadas e concluiu 120 revisões inéditas. **380 IDs diferentes corrigidos na interface.** |
| Playwright, jornada completa | Chromium 153 em 390 × 844 e 1366 × 900. Firefox 153 e WebKit 26.5 em 820 × 1024. Cobriu pular onboarding, escolher uma área, diagnóstico, mapa/lista, minidesafio, erro, dica pelo Lumi, refresh, conclusão, compra/equipamento, perfil, tema escuro, texto ampliado, revisão e quatro módulos de laboratório. |
| `--reopen`, Chromium com diretório de perfil temporário | Carregou envelope v1 com N20, apelido antigo e extensão do hub ausente. Fechou o processo do navegador, abriu outro com o mesmo perfil e recuperou questão, rascunho e pista. Interrompeu uma correção HTTP, confirmou ausência de recompensa, repetiu com sucesso e preservou o original de um JSON corrompido. |
| `--audit --axe …` | axe-core 4.14.1, regras WCAG 2 A/AA e 2.1 AA selecionadas: 14 rotas em claro e escuro, sem violações detectadas nessas execuções. Mais cinco estados auditados na jornada Chromium, incluindo erro com pista, perfil escuro ampliado e cubo 3D. Sem overflow horizontal nas 14 rotas a 320 pixels CSS. |
| Interação e movimento | Arraste do Lumi dentro da faixa, centralização com Home, foco em diálogo, links, botões e ordenação por teclado. Fez o treino R U e o desfez por U′ R′; conferiu a recuperação das seis faces. Asserção de semântica da árvore de acessibilidade na exploração. Testes de jornada com movimento reduzido. |
| HTTP, privacidade e falhas | Acerto e erro para cada ID; dicas e gabaritos de itens avaliados ausentes do GET; inválidos rejeitados; corpo excessivo retorna 413. No laboratório a jornada passa com a API de captura simulando indisponibilidade, sem solicitação de mídia. |
| Medição local ilustrativa | CPython 3.12.14 e Flask test client, 100 chamadas por rota, sem latência de rede. Catálogo público de 174.184 bytes, mediana 2,47 ms e p95 3,27 ms. Correção numérica, mediana 0,15 ms e p95 0,24 ms. Não é medição de desempenho no Render. |

Os testes de percurso usam os gabaritos do repositório para operar os controles visíveis. Isso verifica o encadeamento real dos fluxos e a persistência. A suíte também testa respostas deliberadamente erradas, pistas e alternativas. A avaliação de correção conceitual por especialistas é uma etapa distinta.

## Critérios do Documento Mestre

| ID | Estado | Evidência e limite |
|---|---|---|
| AC-01 | Verificado | Base inventariada, testes-base, diagnóstico e regressão do painel reproduzidos; acervo e leitura v1 exercitados. |
| AC-02 | Verificado | Dez áreas, duas trilhas utilizáveis por área. Percurso completo em todas. |
| AC-03 | Implementado; aceite docente pendente | Três aulas e nove práticas por trilha, fechamento por desafio, feedback e progresso. Matriz de conferência no guia editorial. |
| AC-04 | Verificado | Onboarding pulável, seis itens diagnósticos por área, painel atualizado e exploração livre. |
| AC-05 | Verificado por regra e interface | Seleção inicial ou manual, ordenação dos itens restantes conforme resposta, evidência preservada. |
| AC-06 | Verificado | Mapa/lista, bases indicadas, estado e abertura pelo teclado. |
| AC-07 | Verificado no escopo funcional | Escolhas, numéricos/texto/lacunas, booleano, associação com arraste ou seleção, ordenação e representações visuais. Ritmo por teclado/toque com indicação textual substitui o requisito dependente de dispositivo. |
| AC-08 | Verificado | Erro e pista pelo Lumi, nova tentativa, explicação, reforço pelo exemplo e regras de independência. |
| AC-09 | Verificado | Intervalo configurável, novo ID nas duas rodadas, teste de confirmação e repetição sem inflação. |
| AC-10 | Verificado em navegadores de teste | Faixa reservada nas telas principais, arraste normalizado, retorno ao centro e diálogo. Teste em telefone físico pendente. |
| AC-11 | Implementado e verificado por amostragem | Preferências persistentes, tema do sistema/claro/escuro, roupas e acessórios. Auditorias abrangem ambos os temas; combinações arbitrárias de cor e dispositivo não foram esgotadas. |
| AC-12 | Verificado | Regras de XP e nível expostas, missões, moedas, compra idempotente, equipar, medalhas e sequência por dia local. |
| AC-13 | Verificado | Dashboard, perfil, registros reais e retomada no novo processo do navegador. |
| AC-14 | Verificado | Migração aditiva e leitura N20; armazenamento inválido, cheio e aba desatualizada cobertos. |
| AC-15 | Verificado em três larguras emuladas | Celular, tablet e desktop completaram a jornada. Aparelhos físicos pendentes. |
| AC-16 | Parcialmente verificado | Teclado, foco, semântica, movimento reduzido, reflow, alto contraste, ajuste de fonte e alternativas sem mídia exercitados. Faltam leitores de tela reais, zoom nativo e usuários de tecnologias assistivas. |
| AC-17 | Verificado | Quatro módulos com interação e volta à aula. Modelo de cubo com inversas, leitura dos adesivos e modos 2D/3D. Air Drums por câmera fica em P2. |
| AC-18 | Verificado localmente | Python, Node e smoke/E2E executados. O workflow do PR reproduz as suítes e duas jornadas Chromium. |
| AC-19 | Pendente para a candidata | O Render de produção continua na versão anterior. Homologação HTTPS da candidata depende de autorização para o ambiente correspondente. |
| AC-20 | Entregue | README, auditoria, arquitetura/decisões, guia de autoria, changelog, relatório e plano de publicação. |

## Falhas encontradas e tratadas

- O painel do acervo acessava coordenadas ausentes para N5–N20. A correção deixa o desenho original e oferece links para todos os 20 conceitos.
- O leitor de estado do MVP recusava conclusões N5–N20. A migração e a reabertura real exercitam essa condição.
- O validador encontrou colisões de IDs em Música. As trilhas receberam IDs próprios antes da entrega.
- A auditoria encontrou contraste insuficiente em partes do tema escuro herdado e overflow decorativo na capa. Os caminhos foram corrigidos e as verificações repetidas.
- Os primeiros roteiros de teste podiam consultar o formulário antes da mudança de rota e selecionavam o rádio invisível da cor. O roteiro passou a aguardar a renderização e clicar no rótulo visível. O teste de indisponibilidade de mídia instala a simulação no documento antes da navegação.
- O executável Chromium de sistema e a primeira inicialização do WebKit não abriram neste ambiente. A validação utilizou Chromium headless e WebKit com bibliotecas de teste locais. Os fluxos de produção continuam sem essas dependências.

## Limites do aceite

A candidata pode ser inspecionada e executada localmente. Não houve publicação. Seguem pendentes leitura por professor, teste com estudantes, dispositivos físicos, leitores de tela, Safari/Edge de distribuição e iniciador em Windows. O laboratório mede o intervalo entre toques no navegador; latência acústica, calibração de câmera e precisão de reconhecimento de mãos não foram avaliadas. O planejamento de liberação está em [Publicação e roadmap](PUBLICACAO-0.8.md).
