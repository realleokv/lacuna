# lacuna.

**Aprender começa por entender.**

MVP de matemática com diagnóstico por regras, microaulas e um tutor personalizável: o Lumi. Desenvolvido em Python/Flask, HTML, CSS e JavaScript puro. Sem login e sem banco de dados. O histórico fica no `localStorage` do navegador.

## Usar online

**[Abrir o Lacuna](https://lacuna-40i2.onrender.com/)** — publicado no Render, plano Free, em 11/11/2026.

Não precisa instalar nada ou criar conta. Histórico e personalização ficam neste navegador; não são sincronizados entre dispositivos.

## Começar no Windows

1. Instale o **Python 3.12 ou superior**, pelo site oficial: https://www.python.org/downloads/windows/ . Inclua o Python Launcher (`py`) na instalação.
2. Extraia o ZIP inteiro. Não execute os arquivos dentro do ZIP.
3. Abra a pasta `lacuna` e dê dois cliques em **`iniciar.bat`**.
4. Na primeira execução, aguarde a criação do ambiente e o download das dependências.
5. Abra **http://127.0.0.1:5000** no navegador. Mantenha a janela do servidor aberta; `Ctrl+C` encerra.

O projeto não precisa de Node, npm, React, banco de dados, chave de API nem conta para funcionar. Node é opcional, apenas para os testes JavaScript.

Se preferir o terminal, abra o PowerShell na pasta que contém `app.py`:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe serve.py
```

Não é necessário ativar o ambiente virtual; os comandos chamam diretamente seu Python. Se `py` não existir, use `python` na primeira linha, depois de conferir `python --version`. Não abra `index.html` diretamente: o servidor Flask é necessário para corrigir as atividades.

### Problemas comuns

| Sintoma | O que fazer |
| --- | --- |
| `py` não reconhecido | Reinstale com o Python Launcher ou use `python -m venv .venv`. |
| Python anterior a 3.12 | Instale uma versão compatível e recrie apenas a pasta `.venv` deste projeto. |
| Porta 5000 ocupada | No PowerShell: `$env:PORT="5001"`, depois execute `serve.py` e abra a porta 5001. |
| Pacotes não baixam | Verifique internet/proxy da rede. As dependências vêm do PyPI. |
| Página não corrige respostas | Confirme que o terminal está aberto e `/api/health` responde. |
| Histórico não aparece | Confira o mesmo navegador, perfil, endereço e porta. `localhost` e `127.0.0.1` têm armazenamentos diferentes. |

O início automático foi preparado para Windows; os testes desta entrega foram executados em Linux/Python 3.12.14 e Chrome. A execução real do `.bat` em Windows permanece a conferir no seu computador.

## O que está pronto

- Sete áreas: início, criação do Lumi, diagnóstico, painel, microaula, resultados e configurações.
- Lumi original em SVG: quatro cores, três expressões, quatro opções de acessórios e três personalidades; apelido opcional de até 20 caracteres.
- Cor escolhida aplicada aos destaques da interface; reações ao pensar, acertar e incentivar.
- **34 questões**, com correção exata de números inteiros, decimais e frações equivalentes.
- **Quatro microaulas**, com explicação em etapas, exemplo visual, prática e reavaliação.
- Diagnóstico de 8 a 10 questões, uma por tela. O botão Continuar deixa o aluno controlar o ritmo.
- Três pistas voluntárias por questão: orientação, primeiro passo e resolução.
- Mapa de conceitos, barras, histórico e evolução construída com respostas reais.
- Personalização, respostas, tentativas, pistas e atividade em andamento preservadas após recarregar a página.
- Exportação JSON, exclusão dos dados do Lacuna com confirmação e preferência por movimento reduzido.

## Como o diagnóstico funciona

| Conceito | Conteúdo | Pré-requisitos |
| --- | --- | --- |
| N1 | Operações | Nenhum |
| N2 | Números negativos | N1 |
| N3 | Frações | N1 |
| N4 | Equações lineares | N1, N2, N3 |

O fluxo começa em `3x + 6 = 21`. Se a primeira resposta a uma equação estiver errada, o Lumi investiga `21 − 6` e depois `15 ÷ 3`. Uma dificuldade nessa divisão sugere a aula de operações como **hipótese de prática**. Um único erro não confirma uma lacuna.

O estado de cada conceito considera suas **três questões distintas mais recentes**:

- **Ainda não avaliado:** nenhuma resposta finalizada.
- **Em desenvolvimento:** existem respostas, mas faltam evidências para os outros estados.
- **Precisa praticar:** pelo menos duas primeiras respostas erradas no recorte.
- **Demonstrou domínio:** três questões distintas e pelo menos duas corretas na primeira tentativa, sem pistas. Essa regra tem prioridade quando satisfeita.

Repetir a mesma questão não fornece várias evidências distintas. Uma resposta acertada depois de errar continua registrada como tentativa com ajuda; não vira acerto independente. O alerta específico de divisão permanece até surgirem dois acertos independentes em outras questões de divisão posteriores à investigação.

“Domínio” é uma estimativa simples deste MVP. É possível cumprir a regra geral de operações e ainda receber uma recomendação específica de divisão. Não é nota, laudo nem comprovação de eficácia pedagógica.

O gráfico de evolução aparece a partir de dois diagnósticos/reavaliações concluídos; a prática de uma única questão fica fora dessa comparação. As barras e tabelas sempre mostram o denominador. A reavaliação guarda um retrato do mapa anterior para comparação.

## Seus dados

Tudo é organizado em uma única chave: **`lacuna:v1`**. O app não cria conta, cookie de sessão, senha nem banco no servidor. As respostas são enviadas ao Flask para correção em memória; o aplicativo não as grava em arquivos nem em logs. O provedor de hospedagem pode manter registros técnicos próprios, como acesso e IP.

O navegador conserva histórico, preferência visual e atividade em andamento entre visitas ao mesmo endereço. **Outro dispositivo ou navegador terá outro histórico.** Limpar dados do site, navegar em modo privado ou trocar o domínio pode fazer o histórico desaparecer. O JSON exportado serve para consulta/backup legível; esta versão **não importa o arquivo de volta**.

Se o armazenamento estiver cheio ou bloqueado, aparece um aviso e a sessão continua em memória. Se houver dados inválidos ou de uma versão desconhecida, o original é preservado, sem sobrescrita silenciosa. A exclusão remove somente a chave do Lacuna.

Não há autenticação nem proteção contra edição manual dos dados pelo dono do navegador. Este MVP é para autoestudo e demonstração, não para certificação, ranking competitivo ou avaliação oficial.

## Arquivos principais

| Arquivo/pasta | Responsabilidade |
| --- | --- |
| `app.py` | Rotas Flask, validação HTTP e cabeçalhos de segurança |
| `diagnostic.py` | Correção numérica, sequência, domínio e recomendação |
| `serve.py` | Servidor WSGI Waitress, compartilhado por Windows e Render |
| `data/concepts.json` | Grafo, quatro aulas e configuração da regra de domínio |
| `data/questions.json` | Questões, respostas esperadas, pistas e explicações |
| `templates/index.html` | Estrutura semântica, navegação e diálogo |
| `static/js/app.js` | Rotas, eventos e coordenação da experiência |
| `static/js/storage.js` | Persistência versionada, exportação e recorte de evidências |
| `static/js/diagnostic.js` | Telas de atividade e microaula |
| `static/js/dashboard.js` | Métricas, grafo, barras e histórico |
| `static/js/lumi.js` | SVG original, opções visuais e falas |
| `static/js/utils.js` | HTTP, escape de texto e utilitários |
| `static/css/` | Tokens de marca, estilos e responsividade |
| `static/assets/` | Marca, mascote, favicon e fontes locais com licenças |
| `tests/` | Testes Python e JavaScript |
| `render.yaml` | Configuração de publicação como Web Service Python |
| `docs/` | Decisões, rastreabilidade, validação e roteiro da demonstração |

## Testar

Execute os comandos **dentro da pasta `lacuna`**, onde está `app.py`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
node --test tests/storage.test.mjs
```

Em Linux/macOS:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
node --test tests/storage.test.mjs
.venv/bin/python serve.py
```

O relatório da entrega está em `docs/VALIDACAO.md`. Os testes não comprovam adequação pedagógica nem substituem avaliação com estudantes e professores.

## API

Todas as rotas POST recebem JSON. Não existem credenciais para configurar.

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/` | Aplicação |
| GET | `/api/health` | Estado e versão |
| GET | `/api/content` | Conteúdo público sem gabarito das questões |
| POST | `/api/diagnose` | Corrigir uma resposta |
| POST | `/api/hint` | Solicitar uma pista de nível 1, 2 ou 3 |
| POST | `/api/next` | Obter próxima questão ou encerramento |
| POST | `/api/report` | Recalcular mapa e recomendação |

Exemplo de corpo para `/api/diagnose`:

```json
{"question_id":"eq_001","answer":"5","first_answer":"5","attempts":1,"hints_used":0,"personality":"direct"}
```

Para `/api/next`, use `{"records":[],"mode":"diagnostic","concept_id":"N1"}`. Modos adicionais: `practice` e `reassessment`. Para `/api/report`, envie `{"records":[...]}` com registros no formato acima. O servidor recalcula os acertos e não confia em campos `correct` enviados pelo cliente. Aceita até 500 registros por solicitação e corpo máximo de 256 KB. O frontend envia somente a resposta mais recente de cada questão conhecida: no máximo 34 registros nesta versão. O servidor aplica a janela de três por conceito, preservando contexto para a investigação de divisão.

## Publicar no Render

A instância deste repositório já está publicada em [https://lacuna-40i2.onrender.com/](https://lacuna-40i2.onrender.com/). Serviço: `srv-dbq9huqjnfac73d96h7g`. As instruções abaixo servem para reproduzir a instalação em outro ambiente; não é necessário criar outro serviço para usar o endereço existente.

O projeto precisa de um **Web Service Python**, pois a correção depende do Flask. Não deve ser publicado como site apenas estático.

1. Coloque o conteúdo desta pasta na raiz de um repositório GitHub/GitLab/Bitbucket acessível ao Render. Não suba `.venv`, caches nem históricos exportados.
2. No Render, crie um Blueprint a partir do repositório. O `render.yaml` já define runtime, comandos e health check.
3. Confira o plano **Free** antes de aplicar. Não há banco, disco ou serviço adicional nesta configuração.
4. Aguarde o deploy e abra o endereço efetivamente atribuído pelo Render. Teste também `/api/health` nesse endereço.

Para criação manual:

| Campo | Valor |
| --- | --- |
| Tipo | Web Service |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `python serve.py` |
| Health check | `/api/health` |
| Plano | Free |
| `PYTHON_VERSION` | `3.12.14` |
| `HOST` | `0.0.0.0` |
| `PORT` | Fornecida pelo Render; não fixe manualmente |

Se colocar a pasta inteira dentro de outro repositório, defina a raiz do serviço como `lacuna`, ou adapte o Blueprint antes de aplicar. A validação local do YAML não é um deploy: um link público só existe depois que o serviço for criado e o build terminar. O plano gratuito está sujeito às condições e limites atuais do provedor.

Referências oficiais consultadas em 10/11/2026: [Flask com Waitress](https://flask.palletsprojects.com/en/stable/deploying/waitress/), [Flask no Render](https://render.com/docs/deploy-flask), [Blueprints](https://render.com/docs/blueprint-spec), [JSON Schema do Render](https://render.com/schema/render.yaml.json).

## Limites e próximos passos

Esta entrega não implementa login, sincronização, banco, importação JSON, IA generativa, correção de texto livre, modo offline/PWA, ranking ou validação científica. Reavaliações usam um conjunto fixo diferente do diagnóstico e da prática; repetir a mesma reavaliação pode favorecer memorização. O histórico local cresce com o uso, e o limite de armazenamento depende do navegador.

Antes de uma implantação educacional ampla: revisão do conteúdo por professores, testes com leitores de tela e dispositivos reais, análise de acessibilidade completa, observabilidade e controles de uso do servidor. Nenhum resultado de aprendizagem ou desempenho em produção é prometido.

As fontes Sora e Nunito Sans são distribuídas com seus arquivos OFL em `static/assets/fonts/`. Marca, ilustrações SVG e textos de exercícios foram produzidos para este projeto. Não foi atribuída uma licença pública ao restante do código; essa escolha fica com o autor do projeto.
