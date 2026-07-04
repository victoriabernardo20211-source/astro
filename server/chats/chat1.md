# Nobile Logística - Design completo

_Started 2026-06-26 14:26 UTC_

---

## User

Crie o design completo de um site de rastreamento logístico chamado Nobile Logística. Paleta de cores: roxo escuro #4A0E8F como cor principal, roxo médio #7B2FBE como secundário, lavanda #E8D5FF para fundos suaves, e branco #FFFFFF como base. Textos em #1A1A2E (quase preto com tom frio). Me mostre as seguintes telas:
1. Home pública — header roxo escuro #4A0E8F com logo branco e links brancos "Início" e "Rastrear", hero section com fundo branco, título grande em roxo escuro "Rastreie seu pedido com facilidade", subtítulo em cinza, botão roxo #7B2FBE com texto branco "Rastrear meu pedido", e 3 cards abaixo com borda roxa suave e ícone roxo (Rastreamento em tempo real / Atualização automática / Suporte dedicado).
2. Página de rastreamento — fundo #F8F5FF (branco levemente lilás), input de CPF com borda roxa ao focar, botão roxo #7B2FBE "Buscar", e card de resultado branco com borda #E8D5FF. Exibir nome do cliente, código do pedido, cidade/estado, e uma timeline vertical de 8 etapas (Pedido Recebido → Em Separação → Coletado → Em Trânsito → Chegou no estado destino → Em Rota → Saiu para Entrega → Entregue) onde etapas concluídas ficam em roxo #7B2FBE e as futuras em cinza claro.
3. Painel do cliente (dashboard) — header roxo escuro com "Painel do Cliente · Bem-vindo, BERLIM", botão roxo #7B2FBE "+ Novo Rastreamento" e botão outline branco "Sair". Abaixo, 5 abas com underline roxo na ativa: Rastreamentos / Pedidos LPQV / Upload Planilha / Meus Arquivos / Minha Conta. Na aba Rastreamentos mostrar tabela com colunas: CPF, Cliente, Código, Cidade/UF, Status (badge com fundo #E8D5FF e texto roxo), Data, Ações.
4. Login do painel — fundo #F8F5FF, card branco centralizado com sombra suave, ícone de cadeado roxo no topo, título "Painel do Cliente", campos Usuário e Senha com borda roxa ao focar, botão roxo escuro "Entrar".
Visual premium, clean e moderno. Layout mobile-first, sem gradientes pesados, tipografia elegante, espaçamento generoso.

## Assistant

_[tool: list_files]_

Design system is empty, so I'll build on your detailed spec. The brief is precise enough — I'll go straight to building all 4 screens on a pannable canvas (3 mobile screens + a desktop dashboard for the table).

Let me pick the type system and build.

_[tool: dc_write]_

Quatro telas prontas. Vou verificar.

_[tool: ready_for_verification]_

Pronto. As 4 telas do **Nobile Logística** estão num canvas navegável (arraste/zoom para explorar):

- **Home** e **Rastreamento** e **Login** em formato mobile-first
- **Dashboard** em largura desktop para a tabela completa caber bem

Segui a paleta exata (#4A0E8F / #7B2FBE / #E8D5FF / branco, texto #1A1A2E), tipografia Sora + Plus Jakarta Sans, timeline de 8 etapas com a 6ª em destaque pulsante, e badges lilás na tabela. Se quiser, posso transformar em protótipo navegável (clicar para passar de tela em tela) ou ajustar qualquer tela.

## User

https://rodoipatrans.com/index.html faz um tipo esse

## Assistant

Não consegui acessar o site (`rodoipatrans.com/index.html` retornou erro de rede). Vou buscar referências.Não consegui abrir o site exato, mas conheço bem o gênero (site institucional de transportadora: hero, serviços, frota, cobertura, área de rastreio). Vou montar uma **home institucional completa** no estilo, mantendo a marca Nobile, e adicioná-la ao canvas. Vou usar slots de imagem para você soltar fotos reais de frota.

_[tool: copy_starter_component]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_fetch]_

_[tool: web_search]_

_[tool: read_file]_

_[tool: grep]_

Vou anexar uma home institucional desktop ao canvas, com slots de imagem para frota.

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Adicionei a tela **05 · Home institucional** ao canvas, no estilo de site de transportadora: barra de contato, header com navegação completa, hero roxo com caixa de rastreamento, faixa de números (+20 anos, 100+ veículos, 26 estados, 99% no prazo), seção de serviços (4 cards), bloco "A empresa", faixa de cobertura nacional com CTA e footer completo — tudo na marca Nobile.

Os blocos de imagem do hero e da seção da empresa são **slots arrastáveis**: solte fotos reais da frota/galpão que elas ficam salvas. Não consegui abrir o `rodoipatrans.com` (deu erro de rede), então segui o layout típico do gênero — se você me mandar um print do site, ajusto para ficar mais fiel.

## User

coloca uma palheta de cores mais clean

## Assistant

Vou clarear a paleta — reduzir os grandes blocos roxo-escuro saturados e deixar fundos brancos/lavanda suave dominarem, mantendo o roxo só como acento. Foco na home institucional, que é a mais "pesada".

_[tool: read_file]_

_[tool: read_file]_

Tenho as strings exatas. Vou clarear a home institucional: hero branco, faixa de números em lavanda suave, barra de contato branca, CTA em lavanda e footer no roxo da marca (em vez de quase-preto).

_[tool: str_replace_edit]_

_[tool: show_html]_

_[tool: ready_for_verification]_

Paleta clareada na home institucional: barra de contato branca, **hero branco** com título escuro (em vez do bloco roxo cheio), faixa de números em lavanda suave `#F8F5FF`, faixa de cobertura em lavanda `#E8D5FF` com botão roxo, e footer no roxo da marca em vez de quase-preto. Agora o roxo escuro aparece só como acento (header + footer), com branco e lavanda dominando — bem mais clean. Se quiser, aplico o mesmo tratamento às telas mobile.

## User

faz a tela de rastrear a encomenda

## Assistant

Vou recriar essa tela de rastreio no layout desktop (header branco, faixa hero, duas colunas com card de busca + "como funciona" + card de ajuda), na marca roxa da Nobile. Adiciono como frame 06 ao canvas.

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Frame **06 · Rastrear encomenda** pronto, recriando o layout da referência na marca Nobile: header branco, faixa hero roxa com breadcrumb "Início / Rastreio", card de busca por "Código de rastreio", card "Como funciona o rastreamento?" com as 2 etapas numeradas e a nota informativa, mais o card lateral "Precisa de ajuda?" com botão outline. Está no canvas à direita da home institucional.

## User

muda o nome para Astro Fretes e todos os dados que tiver nobile logistica para astro fretes faz uma tela para após a pessoa colocar o codigo de rastreio também

## Assistant

_[tool: list_files]_

Design system folder is empty, so I'll continue with your brand spec. Renaming everywhere, then adding the tracking-result screen.

_[tool: run_script]_

Now adding the tracking-result screen (frame 07) and renaming the file.

_[tool: dc_html_str_replace]_

Renomeando o arquivo para refletir a marca.

_[tool: copy_files]_

_[tool: ready_for_verification]_

Pronto. Renomeei tudo de **Nobile Logística → Astro Fretes** (logo, footer, e-mail `astrofretes.com.br`, textos institucionais) e o arquivo agora é `Astro Fretes.dc.html`.

Também adicionei o frame **07 · Resultado do rastreio** — a tela que aparece depois de digitar o código: banner de status atual "Em rota de entrega" com previsão de entrega, histórico completo de movimentação (8 etapas com locais e horários), card lateral com detalhes da encomenda (destinatário, código, origem/destino, serviço) e bloco de atendimento. Está no canvas à direita da tela de rastrear.

