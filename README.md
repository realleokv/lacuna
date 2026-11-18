# Lacuna 0.8

**Aprender começa por entender.** O Lacuna é um hub de autoestudo com o Lumi, trilhas abertas e progresso salvo no navegador. A versão 0.8 está em uma branch de revisão. O endereço público acompanha a branch `main`.

## Rodar no computador

No Windows com Python 3.12 ou superior, abra **iniciar.bat** na pasta do projeto. Em Linux ou macOS:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python serve.py
```

Acesse **http://127.0.0.1:5000**. No PowerShell, use `.\.venv\Scripts\python.exe` no lugar de `.venv/bin/python`. Flask corrige as respostas e Waitress serve a aplicação. Os recursos visuais, as fontes e os conteúdos acompanham o projeto.

## Experimentar a versão

1. Na abertura, escolha **Começar a aprender** para informar um apelido e interesses ou **Pular e explorar** para entrar no catálogo.
2. Abra uma área. O diagnóstico opcional traz uma questão de cada microaula. Você pode escolher qualquer trilha diretamente.
3. Abra uma aula pelo mapa ou pela lista. Teste a previsão do exemplo, responda às três práticas e consulte uma pista se precisar. O painel permite retomar a atividade. Ao terminar as três aulas de uma trilha, aparece seu desafio final.
4. Em **Revisões**, retome um conceito depois do intervalo escolhido nas configurações. Cada conceito possui duas questões reservadas. O estado de domínio considera tentativas independentes e questões distintas.
5. Clique no Lumi para conversar ou pedir uma pista. Arraste-o dentro da faixa reservada. Com o botão focado, as setas movem e Home centraliza. No perfil e na coleção, veja histórico, calendário, moedas, itens e medalhas.
6. Entre no **Laboratório** para manipular o cubo 3×3 em 2D/3D, marcar pulsos, comparar notas ou experimentar movimento. Todo o percurso pode ser feito com teclado e texto.

### Catálogo do hub

| Área | Primeira trilha | Segunda trilha |
|---|---|---|
| Matemática | Operações e frações | Equações e proporções |
| Português e escrita | Interpretação e coesão | Ortografia e produção guiada |
| Ciências | Método científico e matéria | Ecossistemas e corpo humano |
| Física | Movimento e medidas | Forças e energia |
| Química | Átomos e tabela periódica | Misturas e ligações |
| História | Tempo e fontes históricas | Sociedades e transformações |
| Geografia | Cartografia e orientação | Clima e território |
| Música e instrumentos | Ritmo e pulsação | Notas e percepção musical |
| Raciocínio lógico | Sequências e padrões | Dedução e problemas |
| Cubo mágico | Peças, cores e notação | Primeiras sequências e resolução |

Cada uma das 20 trilhas contém três microaulas. As 60 microaulas somam 180 práticas avaliadas, 60 verificações diagnósticas, 120 revisões e 20 desafios de fim de trilha. Há ainda 60 previsões interativas nos exemplos. O botão **Meu acervo de matemática** abre as 20 aulas e 162 questões anteriores, incluindo os módulos de ampliação existentes. Os dois percursos identificam seus históricos separadamente.

### Dados locais

A chave `lacuna:v1` conserva os dados do acervo e recebe a extensão versionada `hub`. Apelido, preferências e progresso são locais. O servidor recebe a resposta para corrigir em memória. O site mantém a exportação JSON e a exclusão com confirmação. Uma gravação bloqueada ou cheia avisa o aluno e mantém a sessão na memória. Em caso de conteúdo inválido, Configurações permite exportar o original. Limpar os dados do site ou trocar de navegador, perfil ou domínio afeta o acesso ao histórico. A exportação é para consulta e não oferece reimportação pelo site.

## Testes

```bash
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
node --test tests/*.test.mjs
```

Para a jornada real no navegador, instale os extras e o Chromium do Playwright:

```bash
.venv/bin/python -m pip install -r requirements-e2e.txt
.venv/bin/python -m playwright install chromium
.venv/bin/python tests/e2e/journey.py --width 390
.venv/bin/python tests/e2e/journey.py --sweep --width 1366 --height 900
```

O script inicializa e encerra seu próprio servidor de teste. `--browser firefox` e `--browser webkit` selecionam outros motores instalados. `--audit --axe CAMINHO/axe.min.js` verifica regras de acessibilidade em dois temas e reflow a 320 pixels CSS. O JavaScript de auditoria é opcional e executado apenas nos testes.

## Documentação da entrega

| Documento | O que consultar |
|---|---|
| [Auditoria inicial](docs/AUDITORIA-0.8.md) | Commit-base, inventário e divergências |
| [Arquitetura e decisões](docs/ARQUITETURA-0.8.md) | APIs, módulos, persistência, regras e laboratório |
| [Guia de conteúdo](docs/CONTEUDO-0.8.md) | Contrato JSON, exemplos e revisão editorial |
| [Relatório de validação](docs/VALIDACAO.md) | Testes executados, matriz AC-01–AC-20 e limites |
| [Changelog](CHANGELOG.md) | Entregas incrementais |
| [Publicação e roadmap](docs/PUBLICACAO-0.8.md) | Ambiente Render, verificação da candidata e pendências |
| [README do MVP](docs/README-MVP.md) | Registro histórico do projeto anterior |

As fontes Sora e Nunito Sans mantêm suas licenças OFL em `static/assets/fonts/`. O projeto preserva os SVGs próprios. O laboratório usa geometria e sons sintetizados localmente.
