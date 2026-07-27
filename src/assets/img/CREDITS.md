# Fotografia

Todas as fotografias deste site devem ser **da própria empresa**. Nada aqui é banco de
imagens — num site de detalhe automóvel, as fotos do trabalho real *são* o produto.
Coloque os ficheiros em `src/assets/img/source/` com os nomes abaixo e corra
`npm run images`.

| Ficheiro | Estado | Para que serve |
|---|---|---|
| `source/hero.jpg` | entregue | Hero — BMW 4 GC rear three-quarter after detail, gloss against blue sky. |
| `source/garagem.jpg` | entregue | CTA band — the same BMW mid-treatment, covered in snow foam. |
| `source/danycad1.jpg` | entregue | About — Daniel. Faces outperform machines on this kind of page. |
| `source/pack-simples.jpg` | entregue | Pack card — snow foam on the BMW, side view. |
| `source/pack-texteis.jpg` | entregue | Pack card — fabric seat after steam cleaning, close up. |
| `source/pack-peles.jpg` | entregue | Pack card — BMW leather cockpit after treatment. |
| `source/pack-detalhada.jpg` | entregue | Pack card — side panel gloss with sun flare after detail. |
| `source/ba-01-durante.jpg` | entregue | Comparison — DURING. The BMW under snow foam. |
| `source/ba-01-depois.jpg` | entregue | Comparison — AFTER. Same car, same spot, same angle, finished. |

## Como fotografar (vale mais do que a câmara)

- **Falta um antes/depois verdadeiro (carro sujo → acabado).** O comparador do site
  usa hoje "em lavagem → depois" porque é o único par com enquadramento igual que
  existe. Para o substituir: **antes de tocar no carro**, marque a posição das rodas
  com fita, tire a foto do carro sujo, e no fim tire a segunda **do mesmo sítio, com
  o mesmo enquadramento e a mesma luz**. É a peça mais persuasiva do site — mas só
  funciona se as duas fotos forem iguais em tudo menos no estado do carro. Um "antes"
  à sombra e um "depois" ao sol não provam nada; provam que o sol existe.
- **Vertical funciona aqui.** O comparador é 4:5, por isso fotos de telemóvel na
  vertical servem bem — ao contrário do hero, que precisa de horizontal.
- **Horizontal.** O site é horizontal; fotos verticais de telemóvel cortam mal no hero.
  Vire o telemóvel de lado.
- **Pinturas escuras ao fim da tarde**, nunca a meio-dia. O sol alto queima os reflexos
  e é precisamente o reflexo que mostra o trabalho.
- **Pormenor, não só carros inteiros.** O interior de uma jante, a costura de um banco,
  as calhas dos vidros. É esse o argumento da marca.
- **Inclua uma cara.** Uma foto do Daniel a trabalhar rende mais do que qualquer foto
  de máquina.

## Regenerar

```bash
npm run images -- --force
```
