# Arquitetura da Aplicação — Dantherm

## Visão Geral

A aplicação Dantherm é uma **Single Page Application (SPA)** construída com React 19 e TypeScript, executada inteiramente no lado do cliente (client-side only). Não há backend nem banco de dados; todos os cálculos são realizados no navegador do usuário.

Essa decisão arquitetural foi tomada para:
- Eliminar dependências de servidor e custos de hospedagem
- Permitir uso offline após o carregamento inicial
- Garantir que dados proprietários de projeto não trafeguem pela rede
- Simplificar o deployment (arquivos estáticos)

## Fluxo de Dados

O fluxo principal segue um caminho linear e unidirecional:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌───────────────────┐
│   Entrada   │───>│  Validação   │───>│    Cálculo        │───>│  Formatação  │───>│ Renderização/PDF  │
│  (InputForm)│    │  (InputForm) │    │  (calculations/)  │    │  (Results)   │    │  (ResultsPanel)   │
└─────────────┘    └──────────────┘    └──────────────────┘    └──────────────┘    └───────────────────┘
       │                                      │                                            │
       │                                      ├── thermal.ts                               ├── Gráficos (Recharts)
       │                                      ├── hydraulic.ts                             ├── Tabelas de resultados
       ├── Presets (data/)                    └── mechanical.ts                            └── PDF (jsPDF)
       └── Dados manuais
```

### Descrição das Etapas

1. **Entrada:** O usuário preenche os dados no formulário (`InputForm`), podendo usar presets pré-configurados ou inserir valores manualmente.

2. **Validação:** O próprio componente `InputForm` valida os dados antes de submetê-los. Verifica limites físicos (temperaturas, pressões positivas, dimensões coerentes).

3. **Cálculo:** Os dados validados são passados aos módulos de cálculo (`calculations/`), que executam os cálculos térmico, hidráulico e mecânico de forma independente.

4. **Formatação:** Os resultados brutos são formatados para exibição (arredondamento, unidades, formatação numérica).

5. **Renderização/PDF:** O componente `ResultsPanel` renderiza os resultados em tabelas e gráficos. O usuário pode exportar um Memorial de Cálculo em PDF via `pdfExport.ts`.

## Módulos de Cálculo

### `calculations/thermal.ts`

Motor principal do cálculo térmico. Implementa o modelo zona-por-zona para subcondensadores.

**Responsabilidades:**
- Dividir o trocador em zonas com base na fração de vapor
- Calcular a carga térmica por zona (Q = ṁ × Δh)
- Calcular LMTD e fator de correção Ft para cada zona
- Calcular coeficientes de película: lado casco (Kern) e lado tubos (Dittus-Boelter)
- Calcular o coeficiente global U e a área requerida
- Somar as áreas de todas as zonas e comparar com a área disponível
- Gerar dados de perfil de temperatura e fração de vapor para os gráficos

**Entradas:** Dados do formulário (vazões, temperaturas, propriedades dos fluidos, geometria do trocador).

**Saídas:** Resultados por zona e totais (Q, U, A_req, A_disp, sobredimensionamento, perfis).

### `calculations/hydraulic.ts`

Cálculo de perda de carga nos dois lados do trocador.

**Responsabilidades:**
- Perda de carga lado tubos (Darcy-Weisbach + perdas nas curvas de retorno)
- Perda de carga lado casco (método de Kern)
- Cálculo de velocidades e áreas de fluxo
- Verificação contra limites recomendados

**Entradas:** Geometria do trocador, propriedades dos fluidos, vazões.

**Saídas:** ΔP_tubos, ΔP_casco, velocidades, verificações de limites.

### `calculations/mechanical.ts`

Dimensionamento mecânico conforme ASME e TEMA.

**Responsabilidades:**
- Espessura do casco para pressão interna (ASME UG-27)
- Espessura do casco para pressão externa (ASME UG-28)
- Espessura do espelho (TEMA RCB-7)
- Espessura das chicanas (TEMA RCB-4)
- Verificação de vibração (TEMA Section V)

**Entradas:** Pressões de projeto, material, geometria, temperatura.

**Saídas:** Espessuras mínimas, pressões admissíveis, verificação de vibração (aprovado/reprovado).

## Componentes React

### `components/Header.tsx`

Cabeçalho da aplicação com a identidade visual Dantherm.

- Exibe logotipo e nome da empresa
- Navegação principal (se aplicável)
- Responsivo para dispositivos móveis

### `components/InputForm.tsx`

Formulário principal de entrada de dados.

- Organizado em seções: dados do processo, geometria do trocador, materiais
- Seletor de presets para fluidos comuns
- Validação em tempo real dos campos
- Gerenciamento de estado local antes de submeter ao cálculo

### `components/ResultsPanel.tsx`

Painel de exibição dos resultados calculados.

- Resumo geral (Q total, U, sobredimensionamento)
- Tabela de resultados por zona
- Gráficos de perfil de temperatura (Recharts)
- Gráficos de fração de vapor ao longo do trocador
- Resultados hidráulicos (perda de carga)
- Resultados mecânicos (espessuras, verificações)
- Botão de exportação para PDF

## Dados e Presets

### `data/waterProperties.ts`

Banco de dados das propriedades termofísicas da água de 0°C a 200°C, incluindo:
- Massa específica (ρ)
- Calor específico (Cp)
- Viscosidade dinâmica (μ)
- Condutividade térmica (k)
- Número de Prandtl (Pr)

Interpolação linear entre pontos tabelados.

### `data/componentPresets.ts`

Presets de fluidos químicos comuns com suas propriedades termofísicas pré-configuradas, eliminando a necessidade de consulta manual a tabelas.

### `data/temaStandards.ts`

Tabelas e constantes da norma TEMA:
- Espessuras mínimas de chicanas por diâmetro de casco
- Propriedades de materiais (tensão admissível, módulo de elasticidade)
- Fatores de correção

### `data/presetExample.ts`

Caso exemplo completo de um trocador tipo BEM, utilizado para demonstração e testes.

## Diagrama de Dependências

```
App.tsx
├── Header.tsx
├── InputForm.tsx
│   ├── data/componentPresets.ts
│   ├── data/waterProperties.ts
│   ├── data/presetExample.ts
│   └── types/index.ts
├── ResultsPanel.tsx
│   ├── calculations/thermal.ts
│   │   ├── data/waterProperties.ts
│   │   └── types/index.ts
│   ├── calculations/hydraulic.ts
│   │   └── types/index.ts
│   ├── calculations/mechanical.ts
│   │   ├── data/temaStandards.ts
│   │   └── types/index.ts
│   ├── utils/pdfExport.ts
│   │   └── types/index.ts
│   └── types/index.ts
└── types/index.ts
```

## Tecnologias e Ferramentas

| Camada | Tecnologia | Justificativa |
|---|---|---|
| UI | React 19 + TypeScript | Tipagem forte para cálculos de engenharia, ecossistema maduro |
| Build | Vite | HMR rápido, build otimizado |
| Estilos | Tailwind CSS 4 | Prototipação rápida, design system consistente |
| Gráficos | Recharts | Integração nativa com React, gráficos de linha/área |
| PDF | jsPDF | Geração de PDF no lado do cliente, sem dependência de servidor |
| Testes | Vitest | Compatível com Vite, rápido, API similar ao Jest |

## Decisões Arquiteturais

1. **Client-side only:** Todos os cálculos rodam no navegador. Isso garante privacidade dos dados e elimina custos operacionais.

2. **Módulos de cálculo puros:** Os arquivos em `calculations/` são funções puras (sem efeitos colaterais), facilitando testes unitários e manutenção.

3. **Separação dados/lógica/apresentação:** Dados de referência (`data/`), lógica de cálculo (`calculations/`) e interface (`components/`) são independentes entre si.

4. **Tipagem rigorosa:** Todas as interfaces de entrada e saída dos cálculos são definidas em `types/index.ts`, prevenindo erros de unidade e tipo.
