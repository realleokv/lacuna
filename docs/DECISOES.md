# Plano executado e decisões aprovadas

## Direção do produto

LACUNA ajuda o estudante a localizar uma base que merece atenção antes de continuar em matemática. Lumi é o centro da identidade: pequeno robô arredondado, visor, antenas, personalidade direta com humor leve. A cor escolhida pelo estudante continua presente no mascote e nos destaques da interface.

### Preferências incorporadas

| Decisão da conversa | Implementação |
| --- | --- |
| Identidade equilibrada com foco no Lumi | Base creme/azul-marinho, mascote presente nas etapas importantes e acentos personalizáveis |
| Criatura pequena, arredondada, com visor e antenas | SVG original editável por código, com quatro acessórios possíveis |
| Direto, mas divertido | Tom padrão `direct`; opções paciente e engraçado alteram apenas a fala |
| Reações e transições cinematográficas suaves | Entrada breve em camada com opacidade/deslocamento, reação de alegria, inclinação ao pensar e aceno de incentivo; sem bloquear interação |
| Uma questão por tela | Correção, pistas e botão Continuar; sem avanço automático |
| Critério de domínio aceito | Dois acertos independentes entre três questões distintas recentes |
| Ampliação pequena das aulas | Quatro microaulas, uma para cada conceito, mantendo a mesma finalidade |
| Login e banco substituídos por armazenamento local | Sem cadastro; histórico e preferências em `localStorage`; Flask corrige em memória |
| Iniciar implementação | P0 e P1 implementados; IA generativa e expansão para outras matérias fora desta entrega |

Não foi alterado o resultado esperado: encontrar um ponto de partida, praticar e observar novas evidências. Não há login escondido nem dependência de banco de dados.

## Etapas concluídas

1. Identidade: tokens, tipografia local, logotipo, favicon e Lumi original.
2. Conteúdo: grafo de quatro conceitos, 34 questões, 102 pistas e quatro microaulas.
3. Motor: validação de respostas, investigação de pré-requisitos, domínio e reavaliação.
4. Experiência: sete áreas, persistência, gráficos com dados reais, exportação e exclusão.
5. Revisão: testes automatizados, inspeção visual desktop e tela estreita, ajustes de foco e largura.
6. Entrega: código, documentação, teste reproduzível, roteiro de apresentação e Blueprint Render.

## Arquitetura

O navegador renderiza o HTML e o SVG, cuida da navegação e guarda o estado. O Flask entrega conteúdo e aplica regras determinísticas. Os JSON de conteúdo são somente leitura. Não existe escrita de dados de estudantes no servidor.

O estado local contém `schema_version`, `content_version`, identificador aleatório, Lumi, preferências, sessões, respostas, aulas, atividade ativa e último relatório. Cada resposta guarda primeira resposta, resposta atual, tentativas, pistas, horário e situação de finalização. O identificador local não é usado como login.

Uma questão só entra no painel ao ser finalizada por Continuar ou pelo encerramento da atividade. O rascunho e as pistas permanecem salvos antes disso. Um recorte com a última tentativa de cada questão conhecida é enviado ao relatório; sua janela de domínio continua sendo de três questões por conceito.

As camadas de proteção incluem escape de apelidos/textos no HTML/SVG, lista de opções permitidas, limite de corpo HTTP, interpretação numérica sem `eval`, verificação de tipos e cabeçalhos contra incorporação e execução de scripts externos. Não existe proteção contra fraude do próprio usuário, porque o histórico é local e não autenticado.

## Escolhas de interface

A paleta mantém as cores oficiais. Texto principal usa azul-marinho e o secundário usa um tom escuro; cores claras ficam em fundos e detalhes. Estado não depende apenas da cor: sempre existe um rótulo. Sora é usada nos títulos, Nunito Sans no corpo. Fontes são servidas localmente.

As transições duram de 180 a 280 ms. A opção Reduzir animações e `prefers-reduced-motion` desligam animação e rolagem suave. A escolha por movimentos curtos interpreta o pedido cinematográfico sem alongar a troca de questão.

## Ponto de publicação

Publicado em 11/11/2026 no endereço [https://lacuna-40i2.onrender.com/](https://lacuna-40i2.onrender.com/), a partir de `realleokv/lacuna`, branch `main`. O serviço `srv-dbq9huqjnfac73d96h7g` usa Python/Waitress no plano Free, sem banco de dados ou disco persistente. O deploy inicial chegou ao estado `live` e a navegação pública foi verificada; detalhes em [VALIDACAO.md](VALIDACAO.md).

A criação foi direta pelo Render, mantendo o health check TCP padrão. O endpoint `/api/health` foi verificado manualmente. O `render.yaml`, validado contra o schema oficial, fica como configuração reproduzível por Blueprint com health check HTTP.
