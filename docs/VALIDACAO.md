# Relatório de validação — LACUNA 1.0.0

Fechamento: 11/11/2026. Código testado em Python 3.12.14/Linux e Chrome. Os dados usados na navegação foram criados exclusivamente para verificar o MVP.

## Resultado automatizado

| Conjunto | Resultado | Cobertura principal |
| --- | --- | --- |
| `python -m pytest -q` | **72 aprovados** | Correção, conteúdo, diagnóstico, reavaliação, entradas inválidas, limites e API |
| `node --test tests/storage.test.mjs` | **9 aprovados** | Persistência, exportação, exclusão isolada, dados corrompidos, limite de armazenamento e Lumi |
| `node --check static/js/*.js` aplicado individualmente | Todos os seis módulos válidos | Sintaxe JavaScript |
| `render.yaml` contra JSON Schema oficial | Válido | Estrutura do Blueprint; não valida uma conta nem cria um deploy |

Total: **81 testes automatizados aprovados**, sem falhas na execução final. Os comandos devem ser executados dentro da pasta `lacuna`, conforme o README. Uma primeira chamada de pytest feita a partir da pasta externa falhou na descoberta de módulos; o comando foi corrigido para a raiz do projeto, sem alterar os testes para esconder esse erro de execução.

### Casos importantes cobertos

- 34 respostas esperadas conferidas, incluindo uma tabela de resultados calculados independentemente do gabarito.
- Frações equivalentes, vírgula decimal, sinais negativos e formato `x = 5`.
- Rejeição de divisão por zero, código, texto, infinito, valores gigantes e tipos inválidos.
- Erro em equação leva a subtração e divisão, nessa ordem, inclusive se a subtração também estiver errada.
- Diagnósticos terminam com 8 a 10 itens, sem repetir pergunta na mesma sessão.
- Um erro isolado não confirma dificuldade nem altera automaticamente pré-requisitos não avaliados.
- Domínio exige três questões distintas e dois acertos independentes; pistas e novas tentativas não viram evidências independentes.
- A recomendação de divisão não desaparece por acertos em outras operações; dois acertos posteriores de divisão permitem avançar. Um novo erro de investigação reabre a hipótese.
- Reavaliação usa itens diferentes da prática e inclui uma equação quando parte de N1, N2 ou N3.
- Conteúdo público não antecipa gabarito, pistas ou explicações das questões. Exemplos resolvidos das aulas são públicos por finalidade pedagógica.
- API limita o corpo a 256 KB e o histórico enviado a 500 registros; não cria cookie de sessão.
- Persistência mantém preferências, rascunho e pistas; dados inválidos ou de versão desconhecida não são sobrescritos.
- Falha de armazenamento avisa sem descartar a sessão em memória; exclusão não limpa dados de outros aplicativos.
- Apelido é escapado para SVG e opções ficam restritas às permitidas; 144 combinações de configuração são verificadas.

## Verificação manual no navegador

| Fluxo | Evidência observada |
| --- | --- |
| Início e criador | Mascote, fontes locais, cores e controles renderizados; Menta e óculos selecionados e salvos |
| Persistência | Preferências, resposta e pista reapareceram após recarregar a página |
| Diagnóstico obrigatório | `3x+6=21` respondida com 4 → `21−6` → `15÷3`; indicação da aula de operações |
| Resultado do diagnóstico de teste | 10 respostas, 8/10 acertos de primeira e 8 independentes; não são dados de alunos |
| Prática com ajuda | `20÷4`: erro inicial, três pistas e acerto na segunda tentativa; resultado 0/1 de primeira e 0 independentes |
| Reavaliação de operações | Novas questões: 18÷3, 28−8, 35÷5 e 4x+4=28; 4/4 independentes, comparação antes/depois e N1 com 3/3 no recorte |
| Painel após recarregar | Contagens e estados permaneceram coerentes com as atividades finalizadas |
| Tela estreita | Início, criador, introdução, exercício, painel, aula de negativos e configurações verificados em viewport de 360×780; sem rolagem horizontal após ajuste |
| Exportação | Botão de exportar produziu download de arquivo JSON na página principal; conteúdo da exportação também coberto por teste unitário |
| Teclado | Espaço ativou movimento reduzido; Enter no link de pular conteúdo levou o foco ao `main` sem mudar a rota |
| Preferência de movimento | Checkbox permaneceu marcado após recarregar e atributo da interface refletiu a preferência |
| Início da atividade | Questão começou no topo da página com foco no conteúdo, inclusive partindo da introdução na mesma rota |

A inspeção estreita usou um iframe local de teste em Chrome, com largura de viewport de 360 px (345 px úteis quando a barra de rolagem ocupa espaço). Não foi um aparelho físico. O wrapper e sua rota temporária foram removidos da entrega. A aplicação normal mantém `X-Frame-Options: DENY` e `frame-ancestors 'none'`.

Uma tentativa de capturar download dentro desse iframe expirou na ferramenta de automação; a verificação foi concluída na página principal, onde o download foi observado. Isso não foi contado como sucesso antes da confirmação.

## Ajustes feitos durante a revisão

- Conservação do contexto de divisão além da janela curta das barras, sem alterar a regra de domínio.
- Recomendação usa a ocorrência mais recente da investigação, mesmo quando existem tentativas semelhantes no histórico.
- Validação de tipos do conceito recebido pela API.
- Foco do link “Pular para o conteúdo”, rolagem ao iniciar atividade e título acessível das páginas.
- Rótulo estável dos seletores de cor e singular nos resultados de uma questão.
- Decoração do hero contida em telas estreitas, sem transbordar horizontalmente.
- Rascunho respondido finalizado corretamente ao trocar de atividade.
- Botão de retomar no início aponta para a atividade mesmo quando o criador foi pulado.

## Limites desta validação

Não foram realizados: execução real do `.bat` no Windows; teste em aparelho móvel físico, Safari ou Firefox; auditoria completa WCAG; teste com leitor de tela; carga/estresse; estudo pedagógico com estudantes; teste de eficácia; deploy público no Render. A exclusão real pela interface não foi acionada durante a navegação final; a função de exclusão e seu isolamento foram testados automaticamente.

A configuração de publicação foi validada, mas a publicação depende de repositório Git acessível e escolha do workspace. Sem um deploy efetivamente concluído não há URL pública a certificar.

## Lista de entrega

- [x] Código e assets locais, com licenças das fontes.
- [x] 34 questões, 102 pistas e quatro aulas.
- [x] Persistência sem login, exportação e exclusão.
- [x] Testes reproduzíveis e relatório com limitações.
- [x] README com execução Windows e Linux.
- [x] Decisões, rastreabilidade e roteiro de três minutos.
- [x] Blueprint Render.
- [ ] Publicação externa e verificação da URL atribuída pelo provedor.
