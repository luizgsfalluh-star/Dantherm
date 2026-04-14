# Dantherm — Calculadora de Trocador de Calor Casco e Tubos

<p align="center">
  <strong>Ferramenta de cálculo térmico, hidráulico e mecânico para trocadores de calor tipo casco e tubos, seguindo normas TEMA e ASME.</strong>
</p>

## Sobre

Aplicação web desenvolvida para a **Dantherm Indústria e Comércio Ltda**, fabricante de trocadores de calor desde 1968, sediada em Guarulhos/SP.

### Funcionalidades Principais

- Cálculo térmico por zonas (zone-by-zone) para subcondensadores com condensação parcial e incondensáveis
- Cálculo hidráulico (perda de carga) lado tubos e lado casco (método de Kern)
- Cálculo mecânico: casco (ASME UG-28), espelho (TEMA), chicanas com verificação de vibração
- Gráficos de perfil de temperatura e fração de vapor ao longo do trocador
- Exportação de Memorial de Cálculo em PDF profissional
- Banco de dados de propriedades da água (0-200°C)
- Presets de componentes químicos comuns
- Interface responsiva com identidade visual Dantherm

## Como Rodar

### Pré-requisitos
- Node.js 18+
- npm 9+

### Instalação e Execução

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### Testes

```bash
npm test
```

### Build de Produção

```bash
npm run build
npm run preview
```

## Stack Técnica

| Tecnologia | Uso |
|---|---|
| React 19 + TypeScript | Framework de UI |
| Vite | Build tool |
| Tailwind CSS 4 | Estilização |
| Recharts | Gráficos de perfil térmico |
| jsPDF | Exportação de PDF |
| Vitest | Testes unitários |

## Estrutura do Projeto

```
src/
├── calculations/        # Módulos de cálculo (térmico, hidráulico, mecânico)
│   ├── thermal.ts       # Motor térmico zona-por-zona
│   ├── hydraulic.ts     # Perda de carga (Kern)
│   └── mechanical.ts    # Casco (ASME), espelho, chicanas (TEMA)
├── components/          # Componentes React
│   ├── Header.tsx       # Cabeçalho com identidade Dantherm
│   ├── InputForm.tsx    # Formulário de dados de entrada
│   └── ResultsPanel.tsx # Painel de resultados e gráficos
├── data/                # Bancos de dados e presets
│   ├── waterProperties.ts    # Propriedades da água 0-200°C
│   ├── componentPresets.ts   # Fluidos pré-configurados
│   ├── temaStandards.ts      # Tabelas TEMA (chicanas, materiais)
│   └── presetExample.ts      # Caso exemplo BEM
├── types/               # Definições TypeScript
│   └── index.ts
├── utils/               # Utilitários
│   └── pdfExport.ts     # Geração do memorial de cálculo PDF
├── App.tsx              # Componente raiz
├── main.tsx             # Entry point
└── index.css            # Estilos base + tema Tailwind
docs/
├── CALCULOS.md          # Documentação completa das fórmulas
├── ARQUITETURA.md       # Arquitetura da aplicação
└── IDENTIDADE-VISUAL.md # Guia de identidade visual
```

## Referências Bibliográficas

- **TEMA Standards**, 10th Edition — Tubular Exchanger Manufacturers Association
- **ASME BPVC Section VIII**, Division 1 — UG-28 (pressão externa)
- **Kern, D.Q.** — "Process Heat Transfer", McGraw-Hill, 1950
- **Incropera, F.P. & DeWitt, D.P.** — "Fundamentals of Heat and Mass Transfer"
- **Taborek, J.** — Bell-Delaware method, Heat Exchanger Design Handbook

## Licença

Uso interno — Dantherm Indústria e Comércio Ltda.
