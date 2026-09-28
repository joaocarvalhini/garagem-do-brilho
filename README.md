# Garagem do Brilho — website

Site de página única (pt-PT) para a **Garagem do Brilho**, *Especialistas em Limpeza
de Detalhe Automóvel* — Marinha Grande, Leiria.

HTML estático. Sem framework, sem dependências de runtime, sem cookies, sem trackers.
A única exceção é a agenda da Noona embebida na secção de marcação, que só carrega
quando o visitante chega lá. Uma página, ~10KB de JavaScript, e um build que corre em menos de 50ms.

```bash
npm install     # sharp, apenas em build-time — nada disto chega ao browser
npm run setup   # fonts, icons, imagens, build
npm run dev     # build + servidor local em http://localhost:4322
```

---

## De onde veio o conteúdo

Tudo o que está no site é da própria empresa, retirado da página Noona
([noona.pt/garagemdobrilho](https://noona.pt/garagemdobrilho)) em julho de 2026 e
atualizado a 2026-09-28 (nova morada, novos preços):

- **Packs e preços** — os quatro packs (Simples, Completa Têxteis, Completa Peles,
  Detalhada) nos três escalões (Citadino / Familiar / SUV & XL), com durações e
  listas de inclusões exatamente como estão na marcação — incluindo as diferenças
  por escalão (o Simples de SUV é aspiração, o Detalhada Familiar inclui polimento).
- **Complementos** — os serviços de "Personalizado" na Noona (Limpeza Interior, Lavagem
  Exterior, Estofos, Detalhe Exterior) mais a Lavagem do Motor. Os restantes complementos
  da Noona (faróis, selantes, forros…) ficam só na marcação, como em julho.
- **Categoria COMERCIAL** — existe na Noona desde setembro de 2026, mas o cliente pediu
  que **não** apareça no site. Não é esquecimento.
- **Voucher** — o "3 Lavagens + 1 Grátis" foi retirado da Noona (setembro de 2026);
  `voucher` está a `null` em `site.json` e o bloco não é renderizado. Para voltar, basta
  repor o objeto (está no histórico do git) com o link do novo voucher.
- **Posicionamento** — "Atenção ao pormenor", "Qualidade Premium", "Spa Day",
  "Devolvemos o aspeto de novo ao seu carro" são frases deles, não nossas.
- **Morada e horário semanal** — da página Noona (o horário vem em `opening_hours`,
  segunda-feira primeiro, que é a ordem em que `site.json` o guarda).
- **Programa de manutenção** — descrito pelo cliente (setembro de 2026): quem faz uma
  Completa ou Detalhada tem desconto nas lavagens Simples durante 1 mês. Aparece no hero,
  ao lado da recolha. O valor do desconto não foi dado, por isso o site não o indica.
- **Fotografias e vídeos** — do álbum Google Photos partilhado pelo cliente
  ("Coches", julho 2026). Hero, banda CTA, cartões dos packs e o antes/depois são
  fotos reais. Em setembro de 2026 o cliente acrescentou trabalhos ao álbum: o hero
  passou a rodar entre os carros premium (Range Rover Sport, Porsche Macan, Mercedes
  AMG Line, BMW Série 4, Tesla Model S, Mazda MX-5), com um recorte vertical próprio
  para ecrãs em pé, e os cartões Simples (Mercedes AMG), Têxteis (MX-5), Peles
  (Golf R) e Detalhada (Porsche Macan) foram trocados a pedido dele, para não ser tudo
  o BMW. Porsche, Mercedes e
  Tesla só existem como vídeos curtos no álbum, por isso a fonte é o frame de
  1080×1920: no telemóvel mostram o carro inteiro, no desktop um pormenor (farol,
  jante), porque é tudo o que um frame vertical dá em horizontal. O antes/depois continua a ser o BMW Série 4
  (empoeirado → espuma → acabado); a foto do Daniel na
  secção Sobre é dele; os três reels da secção Trabalhos são vídeos deles
  transcodificados (Porsche Macan, espuma, jantes).
- **Logótipo** — o vetor oficial (Inkscape, Rubik itálico + carro/gota/brilhos) está
  em `src/assets/brand/`. O `make-icons.js` extrai a marca sem texto para
  `brand/mark.svg` (viewBox justo, calculado por rasterização+trim) e gera os
  favicons; o header usa a marca inline com o wordmark em Rubik Bold Italic.
- **Cores** — a paleta do site é a do logótipo: ciano `#059FD0` como acento
  (rampa 300–700 validada WCAG AA), marinho profundo nas superfícies.

Se os preços mudarem na Noona, o único ficheiro a tocar é
`src/content/site.json`. Os textos vivem todos em `src/content/pt.json`.

## O que falta (e o build avisa)

Correr `npm run build` imprime a lista real, e é essa que manda. Hoje é uma:

1. **NIF** — o JSON-LD sai sem `vatID`.

Resolvidos desde então: o horário semanal (2026-09-28, da Noona), o domínio (`garagemdobrilho.pt`, confirmado pelo cliente a
2026-07-30) e as coordenadas GPS, tiradas do próprio perfil do Google Business.

Fora da lista do build, porque não é um campo em falta mas um enquadramento a melhorar:

- **Antes/depois shot-for-shot** — o par atual é honesto (mesmo carro, mesma entrada) mas
  não é o mesmo enquadramento. O `src/assets/img/CREDITS.md` explica como fotografar o próximo.

## Arquitetura

```
scripts/
  build.js           gera dist/ (HTML + assets + manifest/sitemap/robots/_headers)
  serve.js           servidor estático local com suporte a Range
  fetch-fonts.js     auto-hospeda Space Grotesk + Inter + Rubik itálico (RGPD)
  process-images.js  AVIF/WebP responsivos + LQIP; tolera fotos em falta
  make-video.js      transcodifica os Reels (ffmpeg): loops mudos 720p + posters
  make-icons.js      extrai a marca do vetor oficial e gera os favicons
  og-image.js        cartão de partilha 1200x630 (WhatsApp/Facebook) — `npm run og`
  check-contrast.js  auditoria WCAG AA da paleta — falha o exit code se falhar um par
src/
  assets/brand/      vetores oficiais do logótipo + mark.svg extraída
  content/site.json  dados: packs, preços, escalões, extras, voucher, contactos
  content/pt.json    todo o texto visível
  templates/page.js  o site inteiro como função (conteúdo → HTML)
  lib/icons.js       ícones SVG inline (Lucide) + a marca oficial
  assets/css|js      um CSS, um JS — sem build steps, sem minificadores
```

### Decisões que vale a pena conhecer

- **Escuro por defeito.** Pintura lê-se sobre preto — o produto deste negócio é
  reflexo, e reflexo precisa de fundo escuro. A FAQ é a única secção clara, marcando
  a mudança de "ver" para "ler".
- **Preto-azul-branco** são as cores da marca. A paleta inteira passa WCAG AA nos
  24 pares declarados (`npm run contrast`).
- **Serviços e preços numa só secção.** Os cartões dos packs carregam preço,
  duração, inclusões e CTA — não há tabela separada. O menu tem só "Serviços";
  o intento "preço" é servido pelo botão do hero e pela barra fixa.
- **O seletor de veículo** (Citadino/Familiar/SUV & XL) é um grupo de radios nativo
  que reescreve preços, durações e inclusões dos cartões. Sem JS, a página mostra o
  escalão Citadino completo — nunca está vazia.
- **Os vídeos são decorativos e obedecem ao visitante**: loops mudos que só tocam
  em viewport, nunca com `prefers-reduced-motion`, e um toque pausa — e a pausa
  é respeitada mesmo ao sair e voltar ao ecrã.
- **A marcação faz-se dentro do site.** Todos os botões "Marcar" levam à secção
  `#marcar`, onde está a agenda da Noona num iframe (código de embed dado pelo cliente,
  plano pago). O iframe é `loading="lazy"`, por isso quem nunca lá chega não faz um
  único pedido à Noona; o CSP admite só `frame-src https://noona.pt`. A agenda deles
  continua a ser a fonte de verdade, e o link direto fica no rodapé e na própria secção.
- **O hero roda entre fotos de trabalhos.** A primeira está no HTML (é a imagem LCP);
  as outras vêm num `<template>` que só entra depois do `load`. Pára fora do ecrã, com o
  separador escondido, com o botão de pausa, e nunca corre com `prefers-reduced-motion`.
- **Animações**: uma ideia só — *luz a passar sobre uma superfície*. Nada gira nem
  salta; o negócio vende reflexos, por isso o movimento são reflexos. Inclui parallax
  do hero, realce que segue o cursor nos cartões, wipe dos títulos, barra de leitura,
  FAQ animada e brilho na marca e nos botões.
  - Só `transform`, `opacity` e `clip-path` são animados, e nenhum handler lê layout
    dentro de um evento de scroll ou pointer (uma medição por frame, partilhada).
  - `prefers-reduced-motion` desliga **tudo**, incluindo os estados que escondem
    conteúdo antes de o animar — reduzir movimento nunca pode reduzir conteúdo.
  - As revelações são **bidirecionais**: um elemento anima ao descer e volta a animar
    ao subir. Para isso não parecer nervoso são precisas duas coisas. Histerese:
    revela-se 12% dentro do ecrã (`rootMargin`), mas só se rearma quando o elemento
    está **completamente** fora dele — medido contra a viewport real e nunca contra
    `e.rootBounds`, que já vem encolhido pelo `rootMargin` e repunha elementos ainda
    visíveis. E direção: `--reveal-y` é assinado pelo bordo por onde o elemento saiu,
    para que algo que regressa de cima desça para o lugar em vez de saltar de baixo.
  - A classe `.js` é posta no `<head>` para evitar flash, com um temporizador de
    segurança que a remove se o `main.js` nunca chegar — um script em falta deixa a
    página visível, não em branco.

## Publicar

`dist/` é o site completo. Netlify, Cloudflare Pages ou qualquer host estático —
o `_headers` incluído já traz cache imutável para assets e CSP.

## Medição dos cliques de marcação

A marcação completa-se na agenda da Noona, embebida mas noutro domínio, por isso o site
não consegue ver a sua própria conversão. O que consegue ver é o clique num botão
"Marcar" (que leva à agenda) ou num link direto para a Noona, e é isso que
`functions/e.js` regista: uma linha por clique, com data e qual o botão. **Nada que identifique alguém** —
sem IP, sem user agent, sem cookie — logo não há consentimento a pedir.

Sem base de dados ligada o site funciona na mesma: a função responde 204 e a contagem é a
que o painel do Cloudflare mostrar (só o total, e por poucos dias). Ligar o D1 é o que dá
histórico permanente e a repartição por botão.

**Configuração, uma vez, no painel do Cloudflare:**

1. **D1** → criar base de dados, p. ex. `garagem-stats`
2. Aplicar o esquema — colar `db/schema.sql` na consola do D1, ou:
   `wrangler d1 execute garagem-stats --remote --file=db/schema.sql`
3. Projeto Pages → **Settings** → **Bindings** → adicionar D1 com o nome **`DB`**
4. Projeto Pages → **Settings** → **Variables** → `STATS_KEY` = uma chave à escolha
5. Voltar a publicar (as ligações só valem a partir do deploy seguinte)

**Ler os números:** `https://garagemdobrilho.pt/stats?k=<STATS_KEY>`, com `&dias=90` para
mudar o período. Sem `STATS_KEY` definida o endereço devolve 404 em vez de abrir — uma
configuração a meio esconde os dados, não os publica.

O que sai são cliques, não marcações confirmadas. Quantos deles se tornam trabalho só a
Noona sabe.
