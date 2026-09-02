export default {
  "copyPath": "Copiar o caminho",
  "copyValue": "Copiar o valor",
  "copyBranch": "Copiar o ramo inteiro",
  "resetHint": "Começar de novo",
  "title": "JSONFlow",
  "description": "Valide, explore e converta JSON no navegador: posição exata do erro, uma árvore recolhível que aguenta arquivos enormes, consultas JSONPath e exportação para CSV, XML, YAML, JSON Schema ou TypeScript.",

  // Ações
  "beautify": "Formatar",
  "minify": "Minificar",
  "sort_keys": "Ordenar chaves",
  "sort_none": "Ordem original",
  "sort_asc": "Chaves A → Z",
  "sort_desc": "Chaves Z → A",
  "clear": "Limpar",
  "load_mock": "Carregar um exemplo",
  "copy": "Copiar",
  "copied": "Copiado!",
  "undo": "Desfazer",
  "redo": "Refazer",
  "close": "Fechar",
  "shortcuts": "Atalhos de teclado",
  "open_file": "Abrir um arquivo",
  "copy_source": "Copiar a origem",
  "download_json": "Baixar .json",
  "reset_view": "Redefinir a visualização",
  "parse_btn": "Analisar",
  "repair_btn": "Reparar",
  "unescape_btn": "Desescapar",
  "jsonl_btn": "Juntar JSON Lines",

  // Indentação
  "indentation": "Indentação",
  "indent_2_spaces": "2 espaços",
  "indent_4_spaces": "4 espaços",
  "indent_tabs": "Tabulações",

  // Validação
  "status_valid": "JSON válido",
  "status_invalid": "JSON inválido: ",
  "status_empty": "Ainda não há nada carregado.",
  "status_checking": "Validando fora da thread principal…",
  "error_at": "linha {0}, coluna {1}",
  "jump_to_error": "Ir até lá",
  "warnings_title": "{0} pontos que vale a pena saber",
  "empty_placeholder": "Cole o JSON aqui, solte um arquivo ou carregue um exemplo…",
  "drop_file_prompt": "Solte um arquivo .json, .jsonl, .csv ou .tsv",
  "editor_title": "Origem",
  "fix_first": "Corrija o erro à esquerda e os painéis se preenchem.",
  "press_parse": "Pressione Analisar para montar a árvore deste documento.",

  // Achados do analisador
  "issueSyntax": "Erro de sintaxe",
  "issueDuplicateKey": "Chave duplicada",
  "issuePrecision": "Número grande demais para o JavaScript",
  "issueDepth": "Aninhamento profundo demais",
  "issueTrailingComma": "Vírgula sobrando",
  "issueComment": "Comentário",
  "issueSingleQuote": "Texto entre aspas simples",
  "issueUnquotedKey": "Chave sem aspas",
  "issuePythonLiteral": "Literal de Python",
  "issueNonFinite": "Não é um número JSON",
  "issueBom": "Marca de ordem de bytes",
  "issueEmpty": "Documento vazio",

  // Abas e visões
  "tab_tree_viewer": "Árvore",
  "tab_formatted_json": "Código",
  "tab_table": "Tabela",
  "tab_convert": "Converter",
  "tab_schema": "Tipos",
  "tab_diff": "Comparar",

  // Controles da árvore
  "search_placeholder": "Filtrar por chave ou valor…",
  "scope_both": "Tudo",
  "scope_keys": "Chaves",
  "scope_values": "Valores",
  "expand_all": "Expandir tudo",
  "collapse_all": "Recolher tudo",
  "depth_label": "Abrir até o nível",
  "depth_option": "Nível {0}",
  "depth_all": "Todos os níveis",
  "no_nodes": "Cole ou solte JSON à esquerda para começar.",
  "no_matches": "Nada corresponde a essa busca.",
  "tree_rows": "{0} linhas",
  "tree_hits": "{0} ocorrências",
  "tree_mounted": "{0} no DOM",
  "tree_capped": "teto atingido: recolha um nível para ver o resto",
  "copy_path": "Copiar o caminho",
  "copy_value": "Copiar o valor",
  "locate": "Mostrar no editor",
  "stale_notice": "O editor mudou desde que isto foi montado. Pressione Analisar para atualizar.",

  // Saída
  "output_size": "{0} caracteres",
  "preview_clipped": "A prévia para em {0} caracteres. Copiar e baixar continuam entregando o conteúdo inteiro.",
  "copy_failed": "O navegador recusou o acesso à área de transferência.",

  // Tabela / CSV
  "flatten_title": "Achatamento",
  "array_json": "Array como JSON",
  "array_expand": "Uma coluna por item",
  "array_join": "Unido",
  "separator_label": "Separador de caminho",
  "table_summary": "{0} linhas × {1} colunas. A prévia mostra as {2} primeiras.",
  "table_wrapped": "O documento não é um array, então virou uma única linha.",
  "export_csv": "Baixar",
  "export_xml": "Baixar XML",
  "import_csv": "CSV ou TSV para JSON",
  "csv_placeholder": "Cole CSV ou TSV aqui para virar JSON…",
  "convert_csv_btn": "Converter em JSON",
  "csv_nest": "Reconstruir o aninhamento a partir de cabeçalhos a.b",
  "csv_nest_hint": "Desligado de propósito: uma coluna first_name precisa continuar first_name, não virar { first: { name } }.",

  // Converter / tipos
  "xml_root": "Elemento raiz",
  "type_name": "Nome",
  "schema_hint": "Deduzido de todos os registros, não só do primeiro: um campo que falta em alguns sai como opcional.",

  // Consultas
  "query_placeholder": "$.usuarios[?(@.idade > 30)].nome",
  "query_matches": "{0} ocorrências",
  "query_use": "Usar como documento",

  // Comparação
  "diff_hint": "Comparado por caminho, não por linha: reordenar chaves não aparece como mudança.",
  "diff_placeholder": "Cole aqui o outro documento JSON…",
  "diff_run": "Comparar",
  "diff_identical": "Os dois documentos são estruturalmente idênticos.",
  "diff_added": "Adicionado",
  "diff_removed": "Removido",
  "diff_changed": "Alterado",
  "diff_type": "Tipo",

  // Barra de execução / arquivos
  "manual_mode": "Modo manual",
  "manual_on": "Nada é montado até você pressionar Analisar.",
  "manual_off": "Documentos abaixo de {0} são montados enquanto você digita; os maiores esperam por Analisar.",
  "parked_hint": "Segurado de propósito: carregar um arquivo desse tamanho no editor é justamente a parte cara.",
  "parked_load": "Carregar assim mesmo",
  "file_too_large": "Esse arquivo é grande demais para abrir numa aba do navegador.",
  "file_failed": "Não foi possível ler esse arquivo.",

  // Estatísticas
  "stat_bytes": "Tamanho",
  "stat_lines": "Linhas",
  "stat_nodes": "Nós",
  "stat_depth": "Profundidade",
  "stat_keys": "Chaves únicas",
  "stat_time": "Análise",
  "stat_offthread": "Worker",

  // Avisos
  "toast_csv_loaded": "{0} linhas importadas de {1}.",
  "toast_jsonl_loaded": "JSON Lines juntado num único array.",
  "toast_needs_valid": "Corrija o erro primeiro: ainda não há o que montar.",
  "toast_repaired": "Reparado como JSON estrito.",
  "toast_unrepairable": "Este documento está quebrado demais para reparo automático.",
  "toast_unescaped": "Desembrulhamos o JSON que estava escondido dentro do texto.",
  "toast_unescape_failed": "Isso não é um texto JSON entre aspas.",

  // Atalhos
  "sc_undo": "Desfazer",
  "sc_redo": "Refazer",
  "sc_parse": "Analisar o documento",
  "sc_beautify": "Formatar",
  "sc_minify": "Minificar",
  "sc_copy": "Copiar a saída formatada",
  "sc_help": "Este painel",

  // Encadeamento
  "nextStepTitle": "Continue",
  "nextStepHint": "O documento vai junto: sem baixar nem enviar de novo",
  "nextDiff": "Comparar",
  "nextCodecard": "Virar imagem de código",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "Calcular o hash",
  "nextMarkdown": "Documentar",

  // Exemplos
  "mock_user_profile": "Perfil de usuário",
  "mock_product_catalog": "Catálogo de produtos",
  "mock_weather_data": "Previsão do tempo",
  "sample_broken": "Configuração quebrada (reparável)",
  "sample_bigint": "Identificadores de 64 bits",

  // Como funciona
  "hero_badge": "Bancada",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Traga o JSON",
  "step1Text": "Cole, solte um arquivo ou deixe outra ferramenta entregar. Nada é enviado, e nada pesado roda antes de você pedir.",
  "step2Title": "Leia o veredito",
  "step2Text": "Válido, ou a linha e a coluna exatas que quebram, mais as chaves duplicadas e os números que o JavaScript não consegue guardar.",
  "step3Title": "Explore",
  "step3Text": "Recolha a árvore, filtre por chave ou valor, ou rode uma expressão JSONPath sobre o documento inteiro.",
  "step4Title": "Leve embora",
  "step4Text": "CSV, XML, YAML, JSON Lines, um JSON Schema, tipos de TypeScript ou Go, ou mande direto para outra ferramenta.",

  "features": [
    {
      "title": "Um analisador de verdade, não JSON.parse",
      "text": "Os erros chegam com linha, coluna e a fileira destacada na margem, em vez de um deslocamento de caracteres que você teria de contar na mão."
    },
    {
      "title": "Identificadores de 64 bits sobrevivem",
      "text": "Identificadores numéricos longos são reescritos dígito a dígito. Qualquer formatador construído sobre JSON.parse os arredonda em silêncio para o double mais próximo."
    },
    {
      "title": "Reparo em um clique",
      "text": "Comentários, vírgulas sobrando, aspas simples, chaves sem aspas, True/False/None do Python e um BOM perdido viram JSON estrito."
    },
    {
      "title": "Consultas JSONPath",
      "text": "Curingas, descida recursiva, fatias e filtros como [?(@.preco > 10)], avaliados na mão: nada do que você digita chega a ser executado."
    },
    {
      "title": "Tipos a partir de dados reais",
      "text": "JSON Schema, interfaces de TypeScript ou structs de Go, deduzidos de todos os registros, então campos que às vezes faltam saem como opcionais."
    },
    {
      "title": "Achatamento honesto",
      "text": "Você escolhe o separador de caminho e o destino dos arrays aninhados. Objetos vazios mantêm sua coluna em vez de sumirem da exportação."
    },
    {
      "title": "Comparação estrutural",
      "text": "Dois documentos comparados caminho a caminho, para que uma ordem de chaves diferente não vire mil mudanças."
    },
    {
      "title": "Arquivos grandes continuam usáveis",
      "text": "A validação vai para um web worker, a árvore só monta as linhas visíveis e o histórico guarda os caracteres alterados, não uma cópia do documento."
    }
  ],

  // SEO e textos
  "seo_title": "JSONFlow | Formatador, validador, visualizador e conversor de JSON",
  "seo_description": "Formate, valide e explore JSON com a posição exata do erro e uma árvore que aguenta arquivos grandes. Converta para CSV, XML, YAML ou JSON Lines, gere JSON Schema e tipos de TypeScript e rode consultas JSONPath, tudo no seu navegador.",
  "seoHeroTitle": "Format, explore and convert JSON safely.",
  "seoHeroText": "Respostas de API carregam tokens, dados de clientes e identificadores internos. O JSONFlow não manda nada para lugar nenhum: o analisador, a árvore, as consultas e as exportações rodam dentro desta aba, então colar aqui uma resposta de produção é tão privado quanto abri-la no seu editor.",
  "seoHeroList": [
    "100% local: nada é enviado",
    "Linha e coluna exatas de cada erro",
    "CSV, XML, YAML, Schema e TypeScript"
  ],
  "seoBrowserSpeedTitle": "Tudo roda nesta aba",
  "seoBrowserSpeedText": "O analisador, a árvore recolhível, o motor de JSONPath e todas as exportações são JavaScript comum rodando no seu aparelho. Não há etapa de envio, não há servidor e não há requisição levando seus dados: desligue a conexão depois que a página carregar e a ferramenta continua funcionando.",
  "seoSecondaryTitle": "A bancada de JSON completa para quem programa.",
  "seoKeywordsTitle": "Palavras-chave",
  "seoKeywords": [
    "formatador JSON",
    "validador JSON",
    "visualizador JSON",
    "JSON para CSV",
    "JSON para XML",
    "JSON para YAML",
    "CSV para JSON",
    "embelezador JSON",
    "JSONPath",
    "gerador de JSON Schema",
    "JSON para TypeScript",
    "comparar JSON",
    "reparar JSON",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "Para que as pessoas usam",
  "seoUseCaseText": "Achar a vírgula que quebra um arquivo de configuração, transformar uma resposta de API em planilha, gerar a interface de TypeScript de um endpoint que ninguém documentou, conferir se duas versões do mesmo payload realmente diferem e abrir logs em que o JSON chegou embrulhado num texto entre aspas.",
  "seoPrivacyTitle": "Por que aqui local importa",
  "seoPrivacyText": "Um payload JSON quase nunca é anônimo: leva tokens de acesso, endereços de e-mail, números de pedido e endpoints internos. Colar isso num formatador hospedado entrega tudo ao servidor de outra pessoa. Aqui nada sai da aba, então não há o que registrar, guardar em cache ou vazar.",

  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "Meu JSON é enviado para algum servidor?",
      "answer": "Não. Análise, validação, árvore, consultas e todas as exportações rodam dentro desta aba do navegador. Você pode desconectar da rede depois que a página carregar e tudo continua funcionando."
    },
    {
      "question": "Até que tamanho de arquivo ele realmente aguenta?",
      "answer": "Num notebook comum, um documento de 1,5 MB com 180 000 nós é analisado em bem menos de um décimo de segundo, e arquivos de várias dezenas de megabytes ainda abrem: a validação vai para um web worker e a árvore só desenha as linhas visíveis. O que limita é a memória, não a ferramenta: acima de uns 100 MB uma aba de navegador sofre com qualquer programa. Tudo acima de 2 MB fica retido atrás de um botão em vez de ser carregado sozinho, então um arquivo grande nunca congela a página ao chegar."
    },
    {
      "question": "Por que meus identificadores longos mudam em outros formatadores?",
      "answer": "O JSON.parse transforma todo número num ponto flutuante de 64 bits, que não representa exatamente inteiros acima de 2^53: um identificador do Twitter, do Discord ou um Snowflake perde os últimos dígitos. O JSONFlow mantém os dígitos originais do texto de origem e avisa quando um número entra nessa faixa."
    },
    {
      "question": "Meu arquivo tem comentários e vírgulas sobrando. Isso é problema?",
      "answer": "Não. Quando a análise estrita falha, uma passada tolerante roda automaticamente e, se der certo, aparece um botão Reparar. Ele lida com comentários, vírgulas sobrando, aspas simples, chaves sem aspas, True/False/None do Python, NaN e Infinity, e reescreve o documento como JSON estrito."
    },
    {
      "question": "Como funciona o achatamento de JSON para CSV?",
      "answer": "Cada item do array de primeiro nível vira uma linha, e as chaves aninhadas viram colunas com pontos, como user.address.city. Você escolhe o separador e se os arrays aninhados ganham uma coluna cada, continuam como JSON ou são unidos. Na volta, os cabeçalhos são lidos ao pé da letra: uma coluna first_name continua first_name, a menos que você peça o aninhamento explicitamente."
    },
    {
      "question": "O que posso escrever na barra de consulta?",
      "answer": "Um subconjunto de JSONPath: $.users[0].name, curingas com [*], descida recursiva com .., fatias como [0:5], índices negativos e filtros do tipo [?(@.price > 10)] ou [?(@.name =~ ^a)]. As expressões são interpretadas na mão, nunca avaliadas como código."
    }
  ],
  "footerTagline": "Utilitários rápidos, caprichados e privados para designers e desenvolvedores.",
  "footerCredit": "Parte da suíte oLoveTools"
};
