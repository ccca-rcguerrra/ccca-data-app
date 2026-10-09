# Bases Externas — coletas SEMAS-PA

## Objetivo
Permitir ao analista disparar e acompanhar a coleta dos dados da SEMAS-PA, executando a pipeline completa (busca → PDF → leitura → carga) para **AUTEFs** e **Guias florestais (GF)**, com recorte padrão de **ano inteiro**.

Fora da v1: reprocessar documentos existentes (hoje ignorados), pausar/cancelar, executar etapas isoladas.

## Escopo e decisões
- **Base:** AUTEFs e GFs (ambas na v1).
- **Recorte padrão:** ano inteiro, para as duas bases.
  - AUTEF: filtro `ano`.
  - GF: ano convertido em `data_inicio` (01/01) e `data_fim` (31/12).
- **Pipeline:** completa (sem execução de etapas isoladas).
- **Permissão:** qualquer usuário pode disparar, por enquanto. O solicitante é registrado, mas não há controle de permissão.
- **Entrega:** primeiro o protótipo `.pen`; backend depois.

## Navegação
Novo item no menu lateral: **Bases Externas › SEMAS-PA** (a SEMAS-PA é a primeira fonte externa; outras poderão ser adicionadas), com três estados (listar, criar, detalhar).

## Estados e componentes

### 1. Coletas (lista)
- Cabeçalho: título **Coletas** + botão **Nova coleta** (canto superior direito).
- Tabela: `Base · Recorte · Situação · Gravados · Já existentes · Falhas · Início · Solicitante`.
- Filtros: base, situação, período da execução.
- Situações: `Na fila`, `Em processamento`, `Concluída`, `Concluída com pendências`, `Falhou`.

### 2. Nova coleta (painel lateral)
1. **Base** — AUTEFs | GFs (alterna o formulário).
2. **Recorte** — **Ano** (obrigatório).
3. **Mais filtros** (recolhido) — AUTEFs: título, processo, proprietário/detentor; GFs: número, tipo, situação, origem/destino.
4. **Opções avançadas** (recolhido) — páginas inicial/final, "recomeçar busca".
5. **Resumo** legível + aviso "Documentos já cadastrados serão ignorados."
6. **Iniciar coleta**.

### 3. Detalhes da execução
- Resumo (base, filtros, solicitante, início, duração).
- Busca na fonte (páginas consultadas, encontrados).
- Processamento (aguardando, em andamento, gravados, falhos, já existentes).
- Pendências de PDF (gravado sem dados do PDF).
- Resultado por documento (identificação, etapa, resultado, mensagem).
- Ações: copiar configuração, ver erros, exportar.

## Contrato de dados (a criar no backend)
```
Execução { id, base, filtros, solicitante, status, criadoEm, iniciadoEm, concluidoEm }
Busca     { paginasConsultadas, paginasTotal, encontrados }
Processo  { aguardando, emAndamento, gravados, falhas, jaExistentes, semPdf }
Documento { id, numero, etapa, resultado, mensagem, atualizadoEm }
```
Distinção crítica: "enviado à fila" ≠ "gravado na base".

## Backend — existe vs. falta
- ✅ Disparar pipeline (AUTEF/GF), filtros, dedup, retomada de página.
- ❌ Histórico durável por execução/analista; contadores consolidados; resultado por documento; reprocessar/pausar/cancelar (fora v1).

## Protótipo (.pen)
Três frames separados:
1. **Coletas** — lista com execuções e filtros.
2. **Nova coleta** — painel lateral, AUTEFs + seletor de ano.
3. **Detalhes** — execução de um ano, com busca, processamento e resultado por documento.
