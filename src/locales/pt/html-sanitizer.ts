export default {
  "previewTitle": "Pré-visualização do HTML limpo",
  "resetHint": "Começar de novo",
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | Sanitizador e limpador de HTML online com relatório de remoções",
  "seo_description": "Limpe HTML com uma política de lista branca real: remova scripts, manipuladores de eventos, URLs javascript: e etiquetas indesejadas, veja exatamente o que saiu e devolva o que quiser. Tudo no seu navegador.",
  "seoHeroTitle": "Limpador e sanitizador de HTML",
  "badge": "Sanitizador com lista branca",
  "description": "Cole HTML, escolha uma política e carregue no botão. Recebe a marcação limpa mais um relatório detalhado de cada etiqueta e atributo descartado — e pode anular qualquer decisão sem voltar a colar nada.",
  "heroPoints": [
    "Nada corre até carregar no botão",
    "Cada remoção vem detalhada",
    "Nunca sai do seu navegador"
  ],
  "label_input": "HTML de entrada",
  "label_policy": "Política de limpeza",
  "placeholder_input": "Cole aqui o seu HTML, largue um ficheiro .html ou carregue um dos exemplos. Nada corre até carregar em Sanear.",
  "button_open_file": "Abrir ficheiro",
  "button_clear": "Limpar tudo",
  "button_run": "Sanear",
  "button_working": "A limpar…",
  "button_manual": "Manual",
  "button_undo": "Desfazer",
  "button_redo": "Refazer",
  "button_copy": "Copiar",
  "button_copied": "Copiado!",
  "button_download": "Baixar",
  "button_reset": "Redefinir",
  "samples_title": "Experimente",
  "sample_messy": "Colagem suja de CMS",
  "sample_attack": "Payloads XSS conhecidos",
  "preset_strict": "Estrito",
  "preset_strict_hint": "Só texto e ligações. Para tudo o que vai guardar.",
  "preset_email": "Compatível com email",
  "preset_email_hint": "As tabelas e o estilo em linha sobrevivem; o scripting não.",
  "preset_content": "Conteúdo rico",
  "preset_content_hint": "Um corpo de CMS: media, tabelas, data-* e aria-*.",
  "preset_text": "Texto simples",
  "preset_text_hint": "Remove toda a marcação e mantém a ordem de leitura.",
  "preset_custom_active": "Política personalizada — editada à mão.",
  "stale_hint": "A política mudou — volte a executar",
  "shortcut_hint": "Ctrl+Enter para executar · Ctrl+Z para desfazer uma alteração de política",
  "tab_source": "Código limpo",
  "tab_preview": "Pré-visualização",
  "tab_report": "Removido",
  "format_pretty": "Formatado",
  "format_min": "Minificado",
  "format_raw": "Tal como lido",
  "compare_hold": "Manter para comparar",
  "compare_showing": "Original",
  "output_empty": "Foi tudo removido — nada sobreviveu a esta política.",
  "copy_failed": "O seu navegador bloqueou o acesso à área de transferência.",
  "stat_size": "tamanho",
  "stat_elements": "elementos",
  "stat_removed": "removidos",
  "stat_dangerous": "executáveis",
  "stat_time": "tempo",
  "policy_allowed_tags": "Etiquetas permitidas",
  "policy_allowed_attrs": "Atributos permitidos",
  "policy_add_tag": "adicionar etiqueta…",
  "policy_add_attr": "adicionar atributo…",
  "policy_no_tags": "Nenhuma etiqueta permitida — a saída será texto simples",
  "policy_no_attrs": "Nenhum atributo mantido",
  "policy_strip_tags": "Apagar com o conteúdo",
  "policy_strip_hint": "nunca são desembrulhadas: o interior vai também",
  "policy_no_strip": "Nada é apagado com o seu conteúdo",
  "policy_unknown": "Etiquetas não permitidas",
  "policy_unwrap": "Desembrulhar — manter o texto interior",
  "policy_drop": "Descartar — remover toda a subárvore",
  "policy_schemes": "Esquemas de URL aceites",
  "policy_schemes_hint": "qualquer outro em href/src é descartado",
  "policy_data_note": "data:image só aceita formatos raster. As URLs de dados SVG nunca são permitidas: um SVG em linha executa o seu próprio <script> ao ser aberto diretamente.",
  "policy_other": "Atributos e extras",
  "policy_keep_style": "Manter style=\"…\"",
  "policy_keep_class": "Manter class=\"…\"",
  "policy_keep_id": "Manter id / name",
  "policy_keep_comments": "Manter comentários",
  "policy_data_attrs": "Manter atributos data-*",
  "policy_aria_attrs": "Manter aria-* e role",
  "policy_svg_math": "Permitir <svg> e <math>",
  "policy_harden_links": "Acrescentar rel=\"noopener noreferrer\"",
  "policy_strip_target": "Retirar target=\"_blank\"",
  "scheme_https_hint": "Ligações e imagens cifradas.",
  "scheme_http_hint": "HTTP simples — serve para páginas internas, viaja em claro na rede.",
  "scheme_relative_hint": "Caminhos e âncoras sem esquema: /pagina, #seccao, ?q=1.",
  "scheme_mailto_hint": "Ligações de correio.",
  "scheme_tel_hint": "Ligações de telefone, SMS e chamada direta.",
  "scheme_ftp_hint": "Ligações antigas de transferência de ficheiros.",
  "scheme_data_hint": "Imagens embutidas como URL de dados. Só formatos raster.",
  "report_empty": "Nada foi removido — a entrada já cumpria a política.",
  "report_dangerous": "{0} remoções poderiam ter executado código.",
  "report_on": "em",
  "report_keep": "Manter",
  "report_kept": "Mantido",
  "report_keep_it": "Manter isto na saída",
  "report_remove_again": "Voltar a remover",
  "reason_tag-not-allowed": "Etiqueta fora da lista branca",
  "reason_tag-stripped": "Etiqueta apagada com o seu conteúdo",
  "reason_event-handler": "Manipulador de eventos em linha",
  "reason_attr-not-allowed": "Atributo fora da lista branca",
  "reason_bad-scheme": "Esquema de URL não permitido",
  "reason_comment": "Comentário HTML",
  "reason_inline-style": "Atributo style em linha",
  "reason_class-attr": "Atributo class",
  "reason_id-attr": "Atributo id / name",
  "nextStepTitle": "Continue",
  "nextStepHint": "O HTML limpo viaja consigo — sem voltar a carregar",
  "nextDiff": "Comparar com o original",
  "nextCodecard": "Criar imagem do código",
  "nextWordflow": "Analisar o texto",
  "nextBase64": "Codificar em Base64",
  "nextZip": "Comprimir em ZIP",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Traga o HTML",
  "step1Text": "Cole-o, largue um ficheiro .html ou chegue a partir de outra ferramenta. Fica ali à espera: abrir um ficheiro nunca inicia a limpeza.",
  "step2Title": "Escolha a política",
  "step2Text": "Quatro predefinições cobrem os casos habituais. Abra o painel manual para editar você mesmo a lista de etiquetas, a de atributos e os esquemas de URL aceites.",
  "step3Title": "Execute",
  "step3Text": "Uma única passagem constrói a árvore limpa e regista pelo caminho cada decisão. Um megabyte de marcação demora uns milissegundos.",
  "step4Title": "Reveja e anule",
  "step4Text": "O relatório enumera o que saiu e porquê. Se discordar de uma linha, carregue em Manter: a passagem repete-se com essa única exceção.",
  "featuresTitle": "O que faz",
  "features": [
    {
      "title": "Política de lista branca real",
      "text": "Etiquetas, atributos e esquemas de URL são listas separadas que você controla. Bloquear uma etiqueta e deixar os seus atributos intactos não é sanear."
    },
    {
      "title": "Relatório detalhado de remoções",
      "text": "Cada elemento e atributo descartado aparece agrupado com a contagem, uma amostra do que continha e o motivo pelo qual saiu."
    },
    {
      "title": "Anule qualquer decisão",
      "text": "Carregue em Manter numa linha e o saneamento repete-se permitindo exatamente essa coisa. O seu texto original nunca é editado."
    },
    {
      "title": "Os esquemas de URL são verificados",
      "text": "javascript:, data:text/html e vbscript: em href, src, formaction, srcset ou xlink:href são apanhados, incluindo os truques com espaços e entidades."
    },
    {
      "title": "Pré-visualização isolada",
      "text": "O resultado é desenhado num iframe com sandbox vazia e sem referenciador, por isso nada lá dentro pode executar, submeter ou navegar."
    },
    {
      "title": "Formatado, minificado ou tal como lido",
      "text": "Volte a serializar a mesma árvore limpa de três maneiras. O espaçamento dentro de <pre> é preservado mesmo quando o resto é reindentado."
    },
    {
      "title": "Passa para a ferramenta seguinte",
      "text": "Envie o resultado direto para DiffSnap, CodeCard, WordFlow, Base64Bolt ou ZipFlow sem descarregar e voltar a carregar."
    },
    {
      "title": "Nada sai do separador",
      "text": "O saneador é uma biblioteca JavaScript empacotada com a página. Não há envio, nem chamada a uma API, nem pedido a um CDN em momento algum."
    }
  ],
  "seoSecondaryTitle": "Um saneador que mostra o seu trabalho",
  "seoHeroText": "A maioria dos limpadores de HTML online entrega-lhe uma cadeia de texto e espera que confie. Este guarda o registo de decisões: que etiqueta foi descartada, que atributo foi retirado, que URL falhou a verificação de esquema — e deixa-o anular qualquer uma delas com um clique, porque a saída limpa é regenerada a partir da sua política em vez de remendada depois.",
  "seoHeroList": [
    "Lista branca, não lista negra",
    "Atributos verificados, não só etiquetas",
    "Contagens e motivos para cada remoção",
    "Desfazer e refazer sobre a política"
  ],
  "seoUseCaseTitle": "Quando precisa disto",
  "seoUseCaseText": "Limpar o que um editor de texto rico produziu antes de o guardar. Retirar o lixo do Word e do Google Docs de uma colagem no CMS. Tornar seguro marcação de terceiros antes de a desenhar. Extrair texto legível de uma página guardada. Verificar se a marcação em que vai confiar contém algo executável — o exemplo de payloads conhecidos está ali para que veja a resposta em vez de a supor.",
  "seoBrowserSpeedTitle": "Construído sobre DOMPurify",
  "seoBrowserSpeedText": "A análise e as decisões de segurança vêm do DOMPurify, a biblioteca que as próprias equipas de segurança dos navegadores citam, e não de uma passagem escrita à mão sobre querySelectorAll. É usada através da sua API de hooks e pede-se-lhe o DOM intermédio em vez de uma cadeia acabada, que é o que torna possíveis o relatório de remoções e as exceções item a item. Trata do XSS por mutação, da confusão de espaços de nomes e dos truques de URL que um limpador ingénuo deixa passar.",
  "seoPrivacyTitle": "100% privado e seguro",
  "seoPrivacyText": "Sem envios, sem chaves de API e sem rastrear o que cola. A biblioteca vai empacotada com a página, por isso também não se descarrega nada de um CDN. O seu HTML fica na memória do separador e desaparece quando o fecha.",
  "seoKeywordsTitle": "Também conhecido como",
  "seoKeywords": [
    "sanitizador html",
    "limpador html",
    "remover scripts de html",
    "limpar html online",
    "sanear html",
    "retirar etiquetas",
    "dompurify online",
    "filtro xss",
    "lista branca html"
  ],
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "Porque é que não acontece nada quando colo?",
      "answer": "É de propósito. Colar ou abrir um ficheiro só carrega o HTML; o saneamento corre quando carrega em Sanear. Assim escolhe primeiro a política em vez de ver a ferramenta adivinhar, e um documento grande nunca é analisado a cada tecla premida."
    },
    {
      "question": "O que é que o relatório de remoções me permite mesmo fazer?",
      "answer": "Cada linha é uma decisão reversível. Carregar em Manter acrescenta essa única exceção e repete a passagem inteira — permitir de novo um <iframe> não deixa portanto passar também o seu atributo onload. O seu texto de entrada nunca é reescrito, e é por isso que desfazer e refazer continuam baratos."
    },
    {
      "question": "Pôr as etiquetas em lista branca chega para a saída ser segura?",
      "answer": "Não, e esse é o erro da maioria dos limpadores que só olham para etiquetas. Uma etiqueta <a> de qualquer lista branca pode continuar a levar href=\"javascript:…\", por isso aqui os atributos e os esquemas de URL são verificados em separado. Bloquear uma etiqueta deixando os seus atributos intactos não é sanear."
    },
    {
      "question": "Que esquemas de URL passam?",
      "answer": "Só os que assinalar. Todo o resto é descartado de href, src, srcset, action, formaction, poster, cite e xlink:href, incluindo os valores escondidos atrás de tabulações, mudanças de linha ou entidades HTML. data: fica limitado a imagens raster: uma URL de dados SVG executa o seu próprio script quando aberta diretamente, por isso nunca é permitida."
    },
    {
      "question": "A pré-visualização é segura?",
      "answer": "Sim. É desenhada num iframe com o atributo sandbox a valer a cadeia vazia, o que bloqueia scripts, formulários, janelas emergentes e navegação, mais uma política sem referenciador para que nenhuma imagem sobrevivente possa revelar de que página veio."
    },
    {
      "question": "O meu HTML é enviado para algum lado?",
      "answer": "Não. O saneador é JavaScript empacotado com esta página e corre no seu separador. Não há envio, nem chamada a uma API, nem pedido a um CDN — pode confirmar com o separador de rede aberto."
    },
    {
      "question": "Que tamanho de documento aguenta?",
      "answer": "A análise é aproximadamente linear, por isso alguns megabytes de marcação terminam bem abaixo do segundo num portátil normal; o tempo medido aparece depois de cada execução. O realce de sintaxe do painel de saída desliga-se acima de 200 KB, porque a esse tamanho colorir custa mais do que rende."
    }
  ],
  "footerTagline": "Um sanitizador HTML com política de lista branca real e um relatório de remoções que pode contestar — 100% local no seu navegador.",
  "footerCredit": "Parte do conjunto oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contato para ideias e comentários:"
};
