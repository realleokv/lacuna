# Inventário e plano • 18/11/2026

Base `802e2c80e359fe6e03792a61d9a3809b36b0f8ca`, branch de trabalho `feat/lacuna-0.8`. Documento Mestre v1.0 como referência. O serviço Render cadastrado para este repositório acompanha main. A revisão ocorre fora dessa branch.

| Componente | Estado na base | Evidência e decisão |
|---|---|---|
| Flask + Waitress e SPA com fragmentos | Funcional | Página inicial, API de saúde, conteúdo, diagnóstico, dicas, próxima questão e relatório. Manter o contrato. |
| Diagnóstico matemático | Funcional | Caminho por equação, subtração e divisão, 8–10 respostas, correção racional. Manter acessível. |
| Conteúdo anterior | Parcial | JSON contém 20 conceitos e 162 itens. 34 itens compõem o banco original de quatro conceitos. Outros 16 conceitos já possuem prática e reavaliação. Preservar IDs e rotas, inclusive lógica de programação já existente no acervo. |
| Painel e gráficos | Parcial | SVG só tem coordenadas para N1–N4, mas recebe os 20 conceitos. Denominador fixo 4. Visual padrão de equação em aulas sem visual específico. |
| Persistência | Parcial | lacuna:v1 guarda apelido, aparência, sessões, registros, aulas, rascunho, pistas e relatório. Validação de aulas limita-se a N1–N4. Exportação, tratamento de quota e recuperação de original já existem. |
| Interface e assets | Parcial | Sete telas, SVG próprio, fontes locais Sora e Nunito Sans com OFL. Licença geral do projeto não definida. |
| Hub multiárea, diagnóstico por área, revisão agendada, moedas, perfil, laboratório | Ausentes | Implementar em módulos, usando Flask para gabaritos e navegador para dados individuais. |
| Testes | Parcial | pytest: 196 aprovados e 4 falhas (duas expectativas de cobertura de 20 conceitos em 8–10 perguntas, contagem fixa de 34 e igualdade do gabarito original com todo o acervo). Node: 9/9 aprovados. |

## Ordem da entrega

1. P0 • Corrigir compatibilidade do acervo, validar pacotes e implementar evidências, retomada e recompensas idempotentes. Provar uma trilha vertical antes da expansão.
2. P0 • Navegação, onboarding opcional, mapa, lições e diagnóstico com revisão independente.
3. P0 • Duas trilhas por área, três aulas por trilha, três práticas por aula, verificações separadas de diagnóstico e revisão. O maior esforço é editorial: pelo menos 180 práticas, além das verificações.
4. P0/P1 • Perfil, missões, cosméticos e Lumi com espaço reservado, movimento opcional e controle de retorno.
5. P0/P1 • Laboratório com teclado/toque, alternativas visuais e volta ao conceito. P2 • avaliar Air Drums sem bloquear os demais módulos.
6. Verificar regressões, falhas de armazenamento, três larguras, acessibilidade, integridade das respostas e documentar riscos antes de qualquer publicação.

### Reprodução no navegador

Uma cópia isolada do commit-base abriu a capa, iniciou o diagnóstico, aceitou a resposta 5 em 3x + 6 = 21 e mostrou a resolução. Ao abrir o painel, o Chromium registrou `undefined is not iterable` no desenho dos nós sem coordenadas. A correção limita o diagrama original aos quatro conceitos que ele representa e lista os 20 conceitos com links e denominadores reais. O histórico e a nova rota do painel têm cobertura de navegação.
