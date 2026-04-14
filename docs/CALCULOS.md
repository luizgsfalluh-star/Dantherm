# Documentação de Cálculos — Dantherm

Referência completa de todas as fórmulas utilizadas nos módulos de cálculo térmico, hidráulico e mecânico do sistema.

---

## 1. Cálculo Térmico — Modelo por Zonas (Subcondensador)

O modelo zona-por-zona divide o trocador em segmentos onde as propriedades dos fluidos podem ser consideradas aproximadamente constantes. Isso é essencial para subcondensadores com condensação parcial e presença de incondensáveis, onde a composição e as propriedades variam significativamente ao longo do comprimento.

### 1.1 Carga Térmica por Zona

```
Q_zona = ṁ × Δh
```

| Variável | Descrição | Unidade |
|---|---|---|
| `Q_zona` | Carga térmica da zona | W |
| `ṁ` | Vazão mássica do fluido quente | kg/s |
| `Δh` | Variação de entalpia na zona (inclui calor sensível e latente) | J/kg |

**Referência:** Kern, D.Q. — "Process Heat Transfer", Cap. 12.

**Limites de aplicabilidade:** Válido para escoamento em regime permanente. Para zonas com mudança de fase, Δh inclui o calor latente de condensação/vaporização.

### 1.2 Temperatura de Saída — Lado Tubos

```
T_tubos_saída = T_tubos_entrada + Q_zona / (ṁ_tubos × Cp_tubos)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `T_tubos_saída` | Temperatura de saída do fluido nos tubos na zona | °C |
| `T_tubos_entrada` | Temperatura de entrada do fluido nos tubos na zona | °C |
| `Q_zona` | Carga térmica da zona | W |
| `ṁ_tubos` | Vazão mássica lado tubos | kg/s |
| `Cp_tubos` | Calor específico a pressão constante do fluido nos tubos | J/(kg·K) |

**Referência:** Incropera & DeWitt — "Fundamentals of Heat and Mass Transfer", Cap. 11.

### 1.3 LMTD — Diferença Média Logarítmica de Temperatura

```
LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁ / ΔT₂)
```

Para arranjo contracorrente:
```
ΔT₁ = T_quente_entrada - T_frio_saída
ΔT₂ = T_quente_saída - T_frio_entrada
```

| Variável | Descrição | Unidade |
|---|---|---|
| `LMTD` | Diferença média logarítmica de temperatura | °C |
| `ΔT₁` | Diferença de temperatura na extremidade 1 | °C |
| `ΔT₂` | Diferença de temperatura na extremidade 2 | °C |

**Referência:** Incropera & DeWitt, Cap. 11.

**Limites:** Quando ΔT₁ ≈ ΔT₂, utiliza-se a média aritmética para evitar divisão por zero (ln(1) = 0).

### 1.4 Fator de Correção Ft

```
R = (T_quente_entrada - T_quente_saída) / (T_frio_saída - T_frio_entrada)
P = (T_frio_saída - T_frio_entrada) / (T_quente_entrada - T_frio_entrada)
```

```
Ft = f(R, P, configuração de passes)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `R` | Razão de capacidades térmicas | adimensional |
| `P` | Efetividade térmica | adimensional |
| `Ft` | Fator de correção da LMTD | adimensional |

**Referência:** TEMA Standards, 10th Edition — Figuras T-3.

**Limites:** Ft deve ser >= 0.75 para projeto viável. Valores abaixo indicam cruzamento de temperaturas e necessidade de reconfigurar os passes.

### 1.5 Coeficiente de Película — Lado Casco (Método de Kern)

```
h_o = 0.36 × (k / D_e) × Re^0.55 × Pr^(1/3) × (μ / μ_w)^0.14
```

| Variável | Descrição | Unidade |
|---|---|---|
| `h_o` | Coeficiente de película lado casco | W/(m²·K) |
| `k` | Condutividade térmica do fluido | W/(m·K) |
| `D_e` | Diâmetro equivalente do casco | m |
| `Re` | Número de Reynolds no casco | adimensional |
| `Pr` | Número de Prandtl do fluido | adimensional |
| `μ` | Viscosidade dinâmica do fluido na temperatura bulk | Pa·s |
| `μ_w` | Viscosidade dinâmica do fluido na temperatura da parede | Pa·s |

**Referência:** Kern, D.Q. — "Process Heat Transfer", Cap. 7, Eq. 7.24.

**Limites de aplicabilidade:**
- Reynolds: 2.000 < Re < 1.000.000
- Escoamento no lado casco com chicanas segmentadas
- Não se aplica a escoamento laminar (Re < 2.000)

### 1.6 Diâmetro Equivalente

**Arranjo triangular (30°):**
```
D_e = (4 × (P_t² × √3/4 - π × d_o²/8)) / (π × d_o / 2)
```

**Arranjo quadrado (90°):**
```
D_e = (4 × (P_t² - π × d_o²/4)) / (π × d_o)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `D_e` | Diâmetro equivalente | m |
| `P_t` | Passo dos tubos (pitch) | m |
| `d_o` | Diâmetro externo dos tubos | m |

**Referência:** Kern, D.Q. — "Process Heat Transfer", Cap. 7.

### 1.7 Coeficiente de Película — Lado Tubos (Dittus-Boelter)

```
Nu = 0.023 × Re^0.8 × Pr^n
```

Onde `n = 0.4` para aquecimento e `n = 0.3` para resfriamento do fluido nos tubos.

```
h_i = Nu × k / d_i
```

| Variável | Descrição | Unidade |
|---|---|---|
| `Nu` | Número de Nusselt | adimensional |
| `Re` | Número de Reynolds nos tubos | adimensional |
| `Pr` | Número de Prandtl do fluido | adimensional |
| `h_i` | Coeficiente de película lado tubos | W/(m²·K) |
| `k` | Condutividade térmica do fluido | W/(m·K) |
| `d_i` | Diâmetro interno dos tubos | m |

**Referência:** Dittus, F.W. & Boelter, L.M.K. (1930); Incropera & DeWitt, Cap. 8.

**Limites de aplicabilidade:**
- Reynolds: Re > 10.000 (escoamento turbulento completamente desenvolvido)
- Prandtl: 0.6 < Pr < 160
- L/d_i > 10 (comprimento de desenvolvimento)

### 1.8 Coeficiente Global de Transferência de Calor

```
1/U_o = 1/h_o + R_fo + (d_o × ln(d_o/d_i)) / (2 × k_w) + (d_o/d_i) × R_fi + (d_o/d_i) × (1/h_i)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `U_o` | Coeficiente global referido à área externa | W/(m²·K) |
| `h_o` | Coeficiente de película lado casco | W/(m²·K) |
| `h_i` | Coeficiente de película lado tubos | W/(m²·K) |
| `R_fo` | Fator de incrustação lado casco (fouling) | m²·K/W |
| `R_fi` | Fator de incrustação lado tubos (fouling) | m²·K/W |
| `k_w` | Condutividade térmica da parede do tubo | W/(m·K) |
| `d_o` | Diâmetro externo do tubo | m |
| `d_i` | Diâmetro interno do tubo | m |

**Referência:** Incropera & DeWitt, Cap. 11; TEMA Standards.

### 1.9 Área Requerida por Zona

```
A_req = Q_zona / (U_o × LMTD × Ft)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `A_req` | Área de troca requerida na zona | m² |
| `Q_zona` | Carga térmica da zona | W |
| `U_o` | Coeficiente global de transferência de calor | W/(m²·K) |
| `LMTD` | Diferença média logarítmica de temperatura | °C |
| `Ft` | Fator de correção | adimensional |

### 1.10 Área Disponível

```
A_disp = N_t × π × d_o × L_efetiva
```

| Variável | Descrição | Unidade |
|---|---|---|
| `A_disp` | Área de troca disponível total | m² |
| `N_t` | Número de tubos | adimensional |
| `d_o` | Diâmetro externo dos tubos | m |
| `L_efetiva` | Comprimento efetivo dos tubos | m |

**Sobredimensionamento:**
```
Sobredimensionamento (%) = ((A_disp - A_req) / A_req) × 100
```

Valores típicos aceitáveis: 10% a 30%.

---

## 2. Cálculo Hidráulico

### 2.1 Perda de Carga — Lado Tubos (Darcy-Weisbach)

```
ΔP_tubos = (f × L × N_passes × ρ × v²) / (2 × d_i) + 4 × N_passes × (ρ × v²) / 2
```

| Variável | Descrição | Unidade |
|---|---|---|
| `ΔP_tubos` | Perda de carga total lado tubos | Pa |
| `f` | Fator de atrito de Darcy | adimensional |
| `L` | Comprimento dos tubos | m |
| `N_passes` | Número de passes nos tubos | adimensional |
| `ρ` | Massa específica do fluido | kg/m³ |
| `v` | Velocidade do fluido nos tubos | m/s |
| `d_i` | Diâmetro interno dos tubos | m |

O primeiro termo representa a perda de carga por atrito ao longo dos tubos. O segundo termo representa a perda de carga nas curvas de retorno (return bends), estimada como 4 cargas de velocidade por passe.

**Fator de atrito (Colebrook simplificado para tubos lisos):**
```
f = 0.184 × Re^(-0.2)    (para Re > 30.000, tubos lisos)
```

**Referência:** Kern, D.Q. — "Process Heat Transfer", Cap. 7.

**Limites:**
- Válido para escoamento turbulento (Re > 10.000)
- Tubos lisos ou com rugosidade desprezível
- Velocidade máxima recomendada nos tubos: 3 m/s (líquidos), 30 m/s (gases)

### 2.2 Perda de Carga — Lado Casco (Método de Kern)

```
ΔP_casco = (f × D_s × (N_b + 1) × ρ × v_s²) / (2 × D_e)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `ΔP_casco` | Perda de carga total lado casco | Pa |
| `f` | Fator de atrito no casco | adimensional |
| `D_s` | Diâmetro interno do casco | m |
| `N_b` | Número de chicanas | adimensional |
| `ρ` | Massa específica do fluido | kg/m³ |
| `v_s` | Velocidade de fluxo cruzado no casco | m/s |
| `D_e` | Diâmetro equivalente | m |

**Referência:** Kern, D.Q. — "Process Heat Transfer", Cap. 7.

**Limites:**
- Perda de carga máxima recomendada lado casco: 70 kPa (líquidos), 14 kPa (gases/vapores)

### 2.3 Área de Fluxo Cruzado no Casco

```
A_s = (D_s × B × C') / P_t
```

| Variável | Descrição | Unidade |
|---|---|---|
| `A_s` | Área de fluxo cruzado no casco | m² |
| `D_s` | Diâmetro interno do casco | m |
| `B` | Espaçamento entre chicanas | m |
| `C'` | Folga entre tubos (clearance) = P_t - d_o | m |
| `P_t` | Passo dos tubos | m |

---

## 3. Cálculo Mecânico

### 3.1 Casco — Pressão Interna (ASME UG-27)

```
t_min = (P × R_i) / (S × E - 0.6 × P)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `t_min` | Espessura mínima requerida do casco | mm |
| `P` | Pressão de projeto interna | MPa |
| `R_i` | Raio interno do casco | mm |
| `S` | Tensão admissível do material na temperatura de projeto | MPa |
| `E` | Eficiência da junta soldada | adimensional |

**Referência:** ASME BPVC Section VIII, Division 1, UG-27.

**Limites:**
- t_min não deve exceder 0.5 × R_i
- Pressão não excede 0.385 × S × E

### 3.2 Casco — Pressão Externa (ASME UG-28)

O cálculo de pressão externa segue o procedimento iterativo da ASME UG-28:

**Etapa 1 — Calcular a razão L/D_o e D_o/t:**
```
L/D_o = comprimento entre linhas de suporte / diâmetro externo do casco
D_o/t = diâmetro externo do casco / espessura do casco
```

**Etapa 2 — Determinar o fator A a partir das cartas ASME (Figura G do Subparte 3):**
```
A = f(L/D_o, D_o/t)
```

**Etapa 3 — Determinar o fator B a partir das curvas do material:**
```
B = f(A, material, temperatura)
```

**Etapa 4 — Pressão externa admissível:**
```
P_a = (4 × B) / (3 × (D_o / t))
```

| Variável | Descrição | Unidade |
|---|---|---|
| `P_a` | Pressão externa admissível | MPa |
| `B` | Fator de material (ASME) | MPa |
| `D_o` | Diâmetro externo do casco | mm |
| `t` | Espessura do casco | mm |
| `L` | Comprimento entre linhas de suporte | mm |

**Referência:** ASME BPVC Section VIII, Division 1, UG-28.

**Critério:** P_a deve ser >= P_projeto_externa. Caso contrário, aumentar a espessura ou adicionar anéis de reforço.

### 3.3 Espelho (Tubesheet) — TEMA

```
t_espelho = F_r × G × √(P / (η × S))
```

| Variável | Descrição | Unidade |
|---|---|---|
| `t_espelho` | Espessura mínima do espelho | mm |
| `F_r` | Fator de fixação (depende do tipo de suporte) | adimensional |
| `G` | Diâmetro médio da gaxeta ou diâmetro do anel de vedação | mm |
| `P` | Pressão de projeto (a maior entre lado casco e lado tubos) | MPa |
| `η` | Eficiência de ligamento do espelho | adimensional |
| `S` | Tensão admissível do material do espelho | MPa |

**Eficiência de ligamento:**
```
η = (P_t - d_furo) / P_t
```

| Variável | Descrição | Unidade |
|---|---|---|
| `P_t` | Passo dos tubos | mm |
| `d_furo` | Diâmetro do furo no espelho | mm |

**Referência:** TEMA Standards, 10th Edition, Seção RCB-7.

**Valores típicos de F_r:**
- Espelho fixo: F_r = 1.0
- Espelho flutuante: F_r = 1.25
- Cabeçote tipo U: F_r = 1.0

### 3.4 Chicanas — TEMA RCB-4

**Espessura mínima da chicana:**

A espessura mínima da chicana depende do diâmetro do casco, conforme tabela TEMA RCB-4.41:

| Diâmetro do Casco (mm) | Espessura Mínima (mm) |
|---|---|
| 152 - 356 | 3.2 |
| 357 - 711 | 4.8 |
| 712 - 978 | 6.4 |
| 979 - 1524 | 9.5 |
| > 1524 | 12.7 |

**Espaçamento entre chicanas:**
```
B_min = 0.2 × D_s    (ou 50 mm, o que for maior)
B_max = D_s           (espaçamento máximo)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `B_min` | Espaçamento mínimo entre chicanas | mm |
| `B_max` | Espaçamento máximo entre chicanas | mm |
| `D_s` | Diâmetro interno do casco | mm |

**Referência:** TEMA Standards, 10th Edition, RCB-4.

### 3.5 Verificação de Vibração — TEMA Section V

A vibração induzida por escoamento é um dos principais modos de falha em trocadores casco-tubos. A verificação segue os critérios da TEMA Section V.

**Frequência natural do tubo (modo fundamental):**
```
f_n = (C_n / (2π)) × √((E × I) / (ρ_t × A_t)) × (1 / L_span²)
```

| Variável | Descrição | Unidade |
|---|---|---|
| `f_n` | Frequência natural do tubo | Hz |
| `C_n` | Constante de modo (depende das condições de contorno) | adimensional |
| `E` | Módulo de elasticidade do material do tubo | Pa |
| `I` | Momento de inércia da seção transversal do tubo | m⁴ |
| `ρ_t` | Massa linear do tubo (incluindo fluido interno) | kg/m |
| `A_t` | Área da seção transversal do tubo | m² |
| `L_span` | Vão livre entre suportes (chicanas) | m |

**Velocidade crítica (desprendimento de vórtices):**
```
V_crit = f_n × d_o / St
```

| Variável | Descrição | Unidade |
|---|---|---|
| `V_crit` | Velocidade crítica de fluxo cruzado | m/s |
| `f_n` | Frequência natural do tubo | Hz |
| `d_o` | Diâmetro externo do tubo | m |
| `St` | Número de Strouhal (tipicamente 0.2 para cilindros) | adimensional |

**Critério:** A velocidade real de fluxo cruzado no casco deve ser inferior à velocidade crítica:
```
V_real < V_crit
```

Se V_real >= V_crit, há risco de vibração ressonante. Medidas corretivas incluem: reduzir o espaçamento entre chicanas, aumentar a espessura dos tubos, ou utilizar chicanas anti-vibração.

**Referência:** TEMA Standards, 10th Edition, Section V — "Flow-Induced Vibration".

---

## Resumo de Referências

| Código | Referência Completa |
|---|---|
| KERN | Kern, D.Q. — "Process Heat Transfer", McGraw-Hill, 1950 |
| INCROPERA | Incropera, F.P. & DeWitt, D.P. — "Fundamentals of Heat and Mass Transfer", Wiley |
| TEMA | TEMA Standards, 10th Edition — Tubular Exchanger Manufacturers Association |
| ASME | ASME BPVC Section VIII, Division 1 |
| BELL | Taborek, J. — Bell-Delaware method, Heat Exchanger Design Handbook |
