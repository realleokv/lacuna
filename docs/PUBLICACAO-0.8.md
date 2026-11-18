# Publicação, reversão e próximos passos

## Situação observada

O serviço Web Python `lacuna` do Render aponta para `realleokv/lacuna`, branch `main`, com deploy automático ligado e previews de PR desligados. O Blueprint do repositório especifica Waitress e health check em `/api/health`. O campo de health check do serviço consultado veio vazio. No HTTPS público, uma consulta expirou e outra retornou `status: ok` e versão `1.0.0`, correspondente à aplicação anterior. Isso verifica o ambiente existente. A candidata 0.8 foi exercitada em servidores locais.

## Sequência para uma publicação autorizada

1. Conferir o relatório e a revisão editorial. Abrir a candidata em uma origem de homologação própria se for autorizada. Um domínio diferente tem armazenamento independente. Para testar migração fora de produção, preparar um perfil de teste com uma cópia consentida de v1; não enviar históricos pessoais ao servidor.
2. Validar em HTTPS o carregamento, o catálogo público, uma correção certa e outra errada, dicas, retomada, revisão, laboratório e exportação. Verificar o health check da configuração real antes de alterar o serviço. O arranque continua `python serve.py`, o build continua `pip install -r requirements.txt`.
3. O merge em `main` pode iniciar o deploy automaticamente. A autorização do idealizador deve preceder esse merge. A branch de revisão e o PR em rascunho são os pontos de inspeção.
4. Na liberação autorizada, registrar SHA e identificador do deploy, conferir `/api/health` com versão 0.8.0, repetir a jornada essencial e revisar erros HTTP e de inicialização.
5. Se houver regressão, interromper a liberação e, mediante autorização de operação em produção, reverter o deploy ou aplicar um commit de reversão. Evitar reescrever histórico. Uma versão antiga pode interpretar mal aulas clássicas N5–N20, por isso testar o leitor v1 de retorno e conservar a cópia exportada antes de oferecer rollback aos alunos. Nenhum procedimento requer apagar dados locais.

## Pendências e roadmap

| Prioridade | Pendência | O que falta para fechar |
|---|---|---|
| Aceite humano | Revisão editorial e observação com estudantes | Professores de cada área conferirem enunciados, gabaritos, dificuldade e clareza das intervenções. |
| Acessibilidade | Tecnologias assistivas e dispositivos físicos | Verificar leitura e foco com NVDA/VoiceOver/TalkBack, zoom nativo e toque em Android/iOS. |
| Compatibilidade operacional | Windows, navegadores de marca e HTTPS da candidata | Executar o iniciador .bat e repetir jornadas em Safari e Edge reais e em homologação autorizada. |
| Evolução do conteúdo | Banco finito de revisão | Após as duas revisões inéditas por conceito, o app informa que o banco terminou. Novas revisões exigem material novo com IDs próprios. |
| P2 • Air Drums | Rastreamento de mãos com câmera | O repositório observado continha a licença MIT. Será preciso disponibilizar a implementação e validar privacidade, latência, recusa de permissão e alternativa sem câmera. |
| Hipótese para 0.9 | Profundidade e ferramentas de autoria | Aumentar a variedade de transferências e testar outras simulações conforme retorno dos alunos. |

Conta, sincronização, IA generativa e novos domínios de ensino continuam como decisões futuras do idealizador.
