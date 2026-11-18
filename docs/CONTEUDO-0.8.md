# Guia de autoria e revisão

Cada arquivo em `data/subjects` é um pacote UTF-8 com `schema_version`, `id`, `title`, `symbol` e `tracks`. Os IDs são referências persistentes. Um ajuste de redação pode conservar o ID; substituir a habilidade avaliada exige novo ID e uma decisão de migração. Atualize o campo `version` de um item revisado e descreva a mudança no changelog. Os pacotes atuais usam a versão 1.

## Criar uma microaula

1. Defina um objetivo observável, como “calcular uma distância pela escala”. Escreva passos, um exemplo concreto e uma previsão guiada com duas opções e explicação. A chave `mini.solution` é visível e a atividade não vale XP nem domínio.
2. Declare pré-requisitos pelos IDs das aulas anteriores. A recomendação pode apontar para uma base; o acesso é livre.
3. Escreva três práticas de dificuldades 1, 2 e 3. Reserve um item diagnóstico e pelo menos dois de revisão que exijam transferência para outro caso. Cada trilha precisa de uma aplicação final em pelo menos uma das aulas.
4. Preencha a autoria, versão, acessibilidade, correção comentada e duas pistas. A primeira orienta o raciocínio, a segunda mostra uma resolução. Para itens sonoros e visuais, ofereça texto e teclado.
5. Execute a suíte Python e o percurso E2E. O contrato verifica IDs, formas de resposta, grafo, contagens, correção via HTTP e integridade do banco. Submeta o conteúdo a uma pessoa com formação na área antes de uso curricular amplo.

### Exemplo de questão válida

```json
{
  "id": "geo-escala.novo-exemplo",
  "concept_id": "geo-escala",
  "role": "practice",
  "format": "numeric",
  "prompt": "Na escala 1:5.000, quantos metros representam 2 cm?",
  "difficulty": 2,
  "validator": "100",
  "options": [],
  "feedback": "Os 2 cm representam 10.000 cm no terreno, ou 100 m.",
  "hints": ["Comece multiplicando por 5.000.", "Divida 10.000 cm por 100 para obter metros."],
  "source_or_author": "Lacuna • material autoral",
  "accessibility": "Texto e teclado",
  "version": 1
}
```

| Formato | Dados e operação |
|---|---|
| `numeric` | Número ou fração em texto. Aceita vírgula decimal e equivalências exatas, por exemplo 0,5 e 1/2. O enunciado deve indicar a unidade esperada. |
| `typed`, `blank` | Palavra, expressão curta ou lacuna com solução inequívoca. Ignora caixa e espaços externos; preserva acentos e distinções internas. |
| `choice`, `boolean` | Opções explícitas com um valor correto. Verdadeiro e Falso são enviados como texto. |
| `match` | Associação a uma categoria. Há arraste até a opção e seleção direta por rádio/teclado. |
| `order` | Lista com cada elemento uma única vez. O validador contém a ordem correta; a UI permite arraste ou botões subir/descer. |
| `visual` | Escolha uma representação com texto ou símbolos. O enunciado especifica o que o padrão significa. |

Os papéis são `practice`, `diagnostic`, `review` e `checkpoint`. Diagnóstico, revisão e desafio não repetem IDs de prática. A autoria é original. Um exemplo de notação conferida para o cubo é o [artigo 12 das regras da WCA](https://www.worldcubeassociation.org/regulations/#article-12-notation).

## Matriz editorial da candidata

Escopo de cada linha: seis microaulas, 18 práticas, seis diagnósticos, 12 revisões e dois desafios. Os testes verificam que uma resposta esperada é aceita e que uma alternativa é recusada em cada item. A conferência de redação abaixo é da implementação. Revisão por professor de cada área e observação com estudantes permanecem abertas.

| Área | Conferência específica na autoria |
|---|---|
| Matemática | Unidades, frações equivalentes, base percentual e sinal em deslocamentos. |
| Português | Acentos dos porquês, referentes inequívocos, inferências qualificadas e revisão por escolhas fechadas. Redações livres ficam fora do corretor. |
| Ciências | Previsões refutáveis e distinção entre variáveis, matéria e energia. |
| Física | Deslocamento com sinal, rapidez média, unidades e hipóteses da simulação. |
| Química | Distinção entre Z e A, componente e fase, propriedades de separação e modelos de ligação. |
| História | Separação entre observação e inferência, alcance das fontes, diversidade de trajetórias e escala temporal. |
| Geografia | Convenções de orientação, escala com conversão de unidades, latitude, longitude e períodos de observação. |
| Música | Pulso, subdivisão e agrupamento distintos. Altura sonora também representada em hertz e em texto. |
| Lógica | Condicionais sem inversão indevida; sequências finitas com regra declarada; dependências explícitas. |
| Cubo | Perspectiva da face, inversão da ordem ao desfazer giros e conferência das laterais da primeira camada. O treino de resolução usa um caso inicial conhecido. |
