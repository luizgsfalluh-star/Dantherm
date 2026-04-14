# Guia de Identidade Visual — Dantherm

Documentação do padrão visual utilizado na aplicação web da Dantherm, garantindo consistência e profissionalismo em todas as telas e no PDF exportado.

---

## Paleta de Cores

### Cores Primárias

| Nome | Hex | Uso |
|---|---|---|
| Azul Dantherm | `#1E3A5F` | Cabeçalho, títulos principais, botões primários |
| Azul Claro | `#2D5A8E` | Hover de botões, links, bordas ativas |
| Branco | `#FFFFFF` | Fundo principal, texto sobre fundos escuros |

### Cores Secundárias

| Nome | Hex | Uso |
|---|---|---|
| Cinza Escuro | `#374151` | Texto principal do corpo |
| Cinza Médio | `#6B7280` | Texto secundário, labels, placeholders |
| Cinza Claro | `#F3F4F6` | Fundo de cards, fundo de inputs |
| Cinza Borda | `#D1D5DB` | Bordas de inputs, divisores |

### Cores de Estado

| Nome | Hex | Uso |
|---|---|---|
| Verde Sucesso | `#059669` | Indicadores "aprovado", sobredimensionamento adequado |
| Vermelho Erro | `#DC2626` | Indicadores "reprovado", erros de validação |
| Amarelo Alerta | `#D97706` | Avisos, valores no limite |
| Azul Informativo | `#2563EB` | Informações complementares, tooltips |

### Cores dos Gráficos

| Nome | Hex | Uso |
|---|---|---|
| Vermelho Quente | `#EF4444` | Linha de temperatura do fluido quente |
| Azul Frio | `#3B82F6` | Linha de temperatura do fluido frio |
| Roxo Vapor | `#8B5CF6` | Linha de fração de vapor |
| Cinza Grade | `#E5E7EB` | Linhas de grade dos gráficos |

---

## Tipografia

### Fonte Principal — Inter

Utilizada em toda a interface para textos de navegação, labels, botões e texto corrido.

| Estilo | Peso | Uso |
|---|---|---|
| Inter Regular | 400 | Texto corrido, descrições |
| Inter Medium | 500 | Labels de formulário, subtítulos |
| Inter SemiBold | 600 | Títulos de seção, botões |
| Inter Bold | 700 | Títulos principais, cabeçalho |

### Fonte Numérica — JetBrains Mono

Utilizada exclusivamente para dados numéricos e resultados de cálculos, garantindo alinhamento perfeito de dígitos (tabular numbers).

| Estilo | Peso | Uso |
|---|---|---|
| JetBrains Mono Regular | 400 | Valores numéricos em tabelas e resultados |
| JetBrains Mono Medium | 500 | Valores numéricos em destaque |

### Tamanhos

| Elemento | Tamanho | Line Height |
|---|---|---|
| Título da página (H1) | 24px / 1.5rem | 1.3 |
| Título de seção (H2) | 20px / 1.25rem | 1.4 |
| Subtítulo (H3) | 16px / 1rem | 1.4 |
| Texto corrido | 14px / 0.875rem | 1.5 |
| Labels | 14px / 0.875rem | 1.4 |
| Valores numéricos | 14px / 0.875rem | 1.5 |
| Texto pequeno (caption) | 12px / 0.75rem | 1.4 |

---

## Regras de Layout

### Estrutura Geral

A aplicação utiliza um layout de duas colunas: **sidebar** (entrada de dados) + **área principal** (resultados).

```
┌──────────────────────────────────────────────────────────────┐
│                        CABEÇALHO                             │
│  [Logo Dantherm]  Calculadora de Trocador de Calor           │
├──────────────────┬───────────────────────────────────────────┤
│                  │                                           │
│   SIDEBAR        │         ÁREA PRINCIPAL                    │
│   (Entrada)      │         (Resultados)                      │
│                  │                                           │
│   - Dados do     │   - Resumo geral                         │
│     processo     │   - Tabela por zonas                     │
│   - Geometria    │   - Gráficos                             │
│   - Materiais    │   - Resultados hidráulicos               │
│   - Presets      │   - Resultados mecânicos                 │
│                  │   - Exportar PDF                          │
│                  │                                           │
├──────────────────┴───────────────────────────────────────────┤
│                        RODAPÉ                                │
└──────────────────────────────────────────────────────────────┘
```

### Dimensões

| Elemento | Valor |
|---|---|
| Largura máxima do conteúdo | 1440px |
| Largura da sidebar | 380px (fixa) |
| Padding externo | 24px |
| Gap entre colunas | 24px |
| Border radius de cards | 8px |
| Border radius de inputs | 6px |

### Breakpoints Responsivos

| Breakpoint | Comportamento |
|---|---|
| >= 1024px (desktop) | Layout de duas colunas (sidebar + principal) |
| 768px - 1023px (tablet) | Sidebar colapsa acima da área principal (empilhado) |
| < 768px (mobile) | Coluna única, formulário compacto |

---

## Componentes Visuais

### Cards

Cards são o container visual principal para agrupar informações relacionadas.

```
┌─────────────────────────────────┐
│  Título do Card                 │  <- Inter SemiBold 16px, #1E3A5F
│─────────────────────────────────│  <- Borda 1px #D1D5DB
│                                 │
│  Conteúdo do card               │  <- Fundo #FFFFFF
│                                 │  <- Padding 16px
│                                 │  <- Border radius 8px
│                                 │  <- Sombra: 0 1px 3px rgba(0,0,0,0.1)
└─────────────────────────────────┘
```

**Especificações:**
- Fundo: `#FFFFFF`
- Borda: `1px solid #D1D5DB`
- Sombra: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Border radius: `8px`
- Padding interno: `16px`
- Margem inferior entre cards: `16px`

### Tabelas de Resultados

Tabelas seguem um estilo limpo e alinhado para dados de engenharia.

**Especificações:**
- Cabeçalho: fundo `#F3F4F6`, texto `#374151` Inter SemiBold 14px
- Linhas alternadas: fundo `#FFFFFF` e `#F9FAFB`
- Valores numéricos: JetBrains Mono Regular 14px, alinhados à direita
- Unidades: texto `#6B7280`, tamanho 12px
- Bordas entre linhas: `1px solid #E5E7EB`
- Padding das células: `8px 12px`

### Cabeçalho (Header)

**Especificações:**
- Fundo: `#1E3A5F`
- Altura: `64px`
- Texto: Inter Bold 20px, `#FFFFFF`
- Logo posicionado à esquerda com margem de 16px
- Elementos alinhados verticalmente ao centro

### Botões

**Botão primário (ex: "Calcular"):**
- Fundo: `#1E3A5F`
- Texto: `#FFFFFF`, Inter SemiBold 14px
- Padding: `10px 20px`
- Border radius: `6px`
- Hover: fundo `#2D5A8E`
- Transição: 150ms ease

**Botão secundário (ex: "Exportar PDF"):**
- Fundo: `#FFFFFF`
- Borda: `1px solid #1E3A5F`
- Texto: `#1E3A5F`, Inter SemiBold 14px
- Hover: fundo `#F3F4F6`

**Botão desabilitado:**
- Fundo: `#D1D5DB`
- Texto: `#6B7280`
- Cursor: not-allowed

### Inputs de Formulário

**Especificações:**
- Fundo: `#FFFFFF`
- Borda: `1px solid #D1D5DB`
- Border radius: `6px`
- Padding: `8px 12px`
- Texto: Inter Regular 14px, `#374151`
- Placeholder: `#9CA3AF`
- Foco: borda `#2D5A8E`, sombra `0 0 0 2px rgba(45, 90, 142, 0.2)`
- Erro: borda `#DC2626`, texto de erro 12px `#DC2626`

---

## Tom Visual

A identidade visual da Dantherm reflete os seguintes princípios:

### Industrial
A paleta de cores baseada em azul marinho e cinzas transmite seriedade e confiança, remetendo ao ambiente industrial de fabricação de trocadores de calor.

### Técnico
O uso de fonte monoespaçada (JetBrains Mono) para dados numéricos e tabelas alinhadas reforça a precisão técnica esperada em cálculos de engenharia.

### Limpo
Espaçamento generoso, hierarquia tipográfica clara e ausência de elementos decorativos desnecessários garantem que o foco permaneça nos dados e resultados.

### Profissional
O memorial de cálculo em PDF segue os mesmos padrões visuais da aplicação, com cabeçalho institucional Dantherm, tabelas formatadas e dados organizados conforme normas TEMA e ASME.
