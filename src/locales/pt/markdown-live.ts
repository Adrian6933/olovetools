export default {
  "resetHint": "Começar de novo",
  "title": "MarkdownLive",
  "description": "Escreve Markdown à esquerda e vê o documento a construir-se à direita — listas aninhadas, listas de tarefas, tabelas, notas de rodapé e código realçado, tudo interpretado dentro do teu separador.",
  "badge": "Markdown, renderizado no teu separador",
  "placeholder": "# Bem-vindo ao MarkdownLive\n\nEscreve à esquerda e o documento constrói-se sozinho à direita. Nada é enviado para lado nenhum.\n\n## Tudo o que entende\n\nO texto pode ficar a **negrito**, *itálico*, ~~rasurado~~, ==realçado== ou como `código em linha`, e uma ligação como [oLoveTools](https://olovetools.com) abre num separador novo. Um endereço solto como https://olovetools.com transforma-se em ligação por si só.\n\n### Código, com cores de sintaxe a sério\n\n```js\nfunction saudar(nome) {\n  return `Olá, ${nome}!`;\n}\n\nsaudar('Mundo');\n```\n\n### Listas que se aninham\n\n- Um ponto\n  - e outro aninhado\n    - e mais um nível\n- [x] Uma tarefa terminada\n- [ ] Uma ainda por fazer\n\n1. Os itens numerados\n2. contam-se sozinhos\n\n### Citações e tabelas\n\n> Uma citação pode conter **qualquer coisa**, incluindo `código`.\n>\n> > Até outra citação.\n\n| Funcionalidade | Onde corre | Estado |\n| :--- | :---: | ---: |\n| Analisador | O teu navegador | Pronto |\n| Temas | O teu navegador | 5 |\n| Exportações | O teu navegador | MD · HTML · PDF |\n\nE uma nota de rodapé para os detalhes.[^1]\n\n[^1]: As notas são reunidas no fim do documento, com uma ligação de volta ao sítio onde as escreveste.\n",
  "editorPlaceholder": "Escreve Markdown aqui…",
  "editorLabel": "Código Markdown",
  "previewEmpty": "O teu documento renderizado aparece aqui.",
  "tocEmpty": "Ainda não há títulos. Acrescenta uma linha começada por # e ela aparece aqui.",
  "htmlHint": "HTML semântico sem classes de framework — cola-o directamente num CMS.",
  "resetTitle": "Começar um documento novo",
  "openFile": "Abrir ficheiro",
  "pasteText": "Colar",
  "startFrom": "Começar com",
  "tplBlank": "Documento em branco",
  "tplSample": "Passeio pela sintaxe",
  "clear": "Limpar",
  "pastedName": "Texto colado",
  "fromTool": "enviado por {tool}",
  "stagedHint": "Ainda não foi carregado nada — diz o que deve acontecer ao texto que já tens.",
  "stagedReplace": "Substituir o editor",
  "stagedAppend": "Acrescentar no fim",
  "stagedDiscard": "Descartar",
  "dismiss": "Fechar",
  "style_label": "Tema",
  "style_default": "Ardósia predefinida",
  "style_github": "GitHub claro",
  "style_clean": "Diário limpo",
  "style_retro": "Máquina de escrever",
  "style_cyberpunk": "Néon cyberpunk",
  "pane_editor": "Editor",
  "pane_split": "Dividido",
  "pane_preview": "Pré-visualização",
  "preview_mode": "Pré-visualização",
  "html_mode": "HTML",
  "toc_mode": "Índice",
  "syncScroll": "Deslocamento ligado",
  "rendering": "A renderizar…",
  "frontMatter": "Front matter",
  "tooltip_h1": "Título 1",
  "tooltip_h2": "Título 2",
  "tooltip_bold": "Negrito",
  "tooltip_italic": "Itálico",
  "tooltip_strike": "Rasurado",
  "tooltip_mark": "Realce",
  "tooltip_link": "Ligação",
  "tooltip_image": "Imagem",
  "tooltip_code": "Código em linha",
  "tooltip_codeblock": "Bloco de código",
  "tooltip_ul": "Lista com marcas",
  "tooltip_ol": "Lista numerada",
  "tooltip_task": "Lista de tarefas",
  "tooltip_quote": "Citação",
  "tooltip_table": "Tabela",
  "tooltip_hr": "Separador",
  "tooltip_undo": "Anular",
  "tooltip_redo": "Refazer",
  "tooltip_indent": "Indentar",
  "sample_bold": "texto a negrito",
  "sample_italic": "texto em itálico",
  "sample_strike": "texto rasurado",
  "sample_mark": "texto realçado",
  "sample_link": "texto da ligação",
  "sample_image": "descrição da imagem",
  "sample_code": "código",
  "sample_codeblock": "const resposta = 42;",
  "sample_col1": "Coluna",
  "sample_col2": "Valor",
  "sample_cell": "Linha",
  "words": "palavras",
  "characters": "caracteres",
  "minRead": "min de leitura",
  "headings": "títulos",
  "tasksDone": "tarefas",
  "historySize": "{steps} passos anuláveis · {bytes}",
  "btn_copy_md": "Copiar MD",
  "btn_copy_rich": "Copiar formatado",
  "btn_copy_rich_hint": "Cola num documento ou num e-mail mantendo a formatação",
  "btn_copy_html": "Copiar HTML",
  "btn_download_md": "Descarregar MD",
  "btn_download_html": "Descarregar HTML",
  "btn_download_pdf": "Exportar para PDF",
  "copied": "Copiado!",
  "noticeCleared": "Editor limpo. Ctrl+Z traz o teu texto de volta.",
  "errorTooBig": "Esse ficheiro é maior do que {size} e não cabe num separador do navegador.",
  "errorRead": "Não foi possível ler esse ficheiro.",
  "errorClipboard": "O navegador não permitiu ler a área de transferência. Cola directamente no editor.",
  "errorClipboardWrite": "A área de transferência não está disponível neste navegador.",
  "errorExport": "Não foi possível produzir essa exportação.",
  "nextStepTitle": "Continuar",
  "nextStepHint": "O teu documento vai contigo — sem voltar a enviar",
  "nextWordflow": "Rever a escrita",
  "nextDiff": "Comparar duas versões",
  "nextTts": "Ouvir em voz alta",
  "nextCodecard": "Transformar em imagem",
  "nextHash": "Calcular o hash",
  "templates": [
    {
      "name": "README de projecto",
      "body": "# Nome do projecto\n\nUma frase sobre o que isto faz e para quem é.\n\n## Instalação\n\n```bash\nnpm install nome-do-projecto\n```\n\n## Utilização\n\n```js\nimport { coisa } from 'nome-do-projecto';\n\ncoisa({ rapido: true });\n```\n\n## Opções\n\n| Opção | Tipo | Predefinição | O que faz |\n| :--- | :--- | :--- | :--- |\n| `rapido` | booleano | `false` | Salta o caminho lento |\n\n## Contribuir\n\n- [ ] Faz um fork do repositório\n- [ ] Abre um pull request\n\n## Licença\n\nMIT\n"
    },
    {
      "name": "Notas de reunião",
      "body": "# Reunião — tema\n\n**Data:** \n**Presentes:** \n\n## Ordem de trabalhos\n\n1. Primeiro ponto\n2. Segundo ponto\n\n## Decisões\n\n> Escreve o que foi mesmo decidido, não o que foi discutido.\n\n## Tarefas\n\n- [ ] Quem faz o quê e até quando\n- [ ] Segunda tarefa\n\n## Adiado\n\nO que fica deliberadamente para outro dia.\n"
    },
    {
      "name": "Registo de alterações",
      "body": "# Registo de alterações\n\nTodas as alterações relevantes do projecto, da mais recente para a mais antiga.\n\n## [1.1.0]\n\n### Adicionado\n\n- A novidade\n\n### Corrigido\n\n- O que estava avariado\n\n### Removido\n\n- ~~O que ninguém usava~~\n\n## [1.0.0]\n\nPrimeira versão pública.\n"
    },
    {
      "name": "Artigo de blogue",
      "body": "---\ntitle: O título\ndate: 2026-01-01\ntags: [markdown, escrita]\n---\n\n# O título\n\nUm primeiro parágrafo que diga o que o leitor leva daqui.\n\n## A primeira ideia\n\nTexto, com uma ligação para [algo relevante](https://example.com) e uma citação:\n\n> Uma frase que vale a pena citar.\n\n## A segunda ideia\n\n![Descrição da imagem](https://example.com/imagem.png)\n\n## O que fica\n\n- O primeiro ponto\n- O segundo ponto\n"
    }
  ],
  "heroPoints": [
    "Markdown ao estilo GitHub, interpretado a sério",
    "Listas aninhadas, tarefas, notas e tabelas",
    "Cores de sintaxe nos blocos de código",
    "Exporta para MD, HTML autónomo ou PDF"
  ],
  "step1Title": "Escreve, cola ou abre um ficheiro",
  "step1Text": "Escreve directamente no editor, cola da área de transferência, larga um ficheiro .md sobre a área de trabalho, ou começa a partir de um dos modelos. Um ficheiro que chega fica em espera até dizeres se substitui o teu texto ou se lhe é acrescentado.",
  "step2Title": "Vê-o renderizar enquanto escreves",
  "step2Text": "O documento é analisado fora da linha principal e a pré-visualização acompanha o cursor. Deslocar um painel move o outro, por isso o que estás a editar é sempre o que estás a olhar.",
  "step3Title": "Escolhe o aspecto",
  "step3Text": "Cinco temas de pré-visualização, de uma página sóbria ao estilo GitHub a uma folha de máquina de escrever. O tema não é só decoração de ecrã: viaja para o ficheiro HTML exportado e para a página impressa.",
  "step4Title": "Leva-o contigo",
  "step4Text": "Descarrega o Markdown, um ficheiro HTML autónomo ou um PDF sem nada da mobília desta página. Ou envia o documento directamente para outra ferramenta oLoveTools sem passar pela pasta de transferências.",
  "features": [
    {
      "title": "Um analisador a sério, não uma pilha de expressões regulares",
      "text": "O documento passa a árvore sintáctica e só depois a HTML, por isso as listas aninhadas mantêm o aninhamento, uma barra vertical perdida numa frase não é lida como tabela, e os nomes_com_underscore ficam intactos em vez de se encherem de itálicos."
    },
    {
      "title": "Blocos de código com cores de sintaxe",
      "text": "Os blocos delimitados são realçados em mais de vinte linguagens, de JavaScript e Python a SQL, YAML ou Dockerfiles. As gramáticas só são descarregadas quando um documento contém código a sério."
    },
    {
      "title": "Uma pré-visualização que acompanha",
      "text": "A análise corre num Web Worker, para o cursor não engasgar num README longo. Se os workers estiverem bloqueados, o mesmo código corre em linha e a pré-visualização aparece na mesma."
    },
    {
      "title": "Temas que sobrevivem à exportação",
      "text": "Ardósia, GitHub claro, Diário limpo, Máquina de escrever e Néon cyberpunk. A folha de estilos usada no ecrã é a que é escrita no ficheiro exportado, por isso o que descarregas parece-se com o que viste."
    },
    {
      "title": "Exportações mesmo utilizáveis",
      "text": "Copia HTML semântico sem classes de framework, copia texto formatado para um e-mail, descarrega uma página autónoma, ou imprime um PDF só com o documento — sem cabeçalho, sem barra de ferramentas, sem anúncios."
    },
    {
      "title": "Um índice construído a partir dos teus títulos",
      "text": "Cada título recebe uma âncora estável e aparece num índice clicável, por isso uma especificação longa é navegável enquanto ainda a escreves."
    },
    {
      "title": "Anular que guarda edições, não cópias",
      "text": "O histórico guarda apenas os caracteres que mudaram, por isso centenas de passos sobre um documento longo custam kilobytes em vez de megabytes. O teu rascunho também fica guardado localmente entre visitas."
    },
    {
      "title": "Encadeado com o resto da suite",
      "text": "Envia o documento terminado para o WordFlow para rever a escrita, para o DiffSnap para comparar duas versões, ou para o TTS-Bolt para o ouvir — sem descarregar e voltar a enviar nada."
    }
  ],
  "seoHeroTitle": "Editor de Markdown online gratuito com pré-visualização ao vivo",
  "seoHeroText": "O MarkdownLive é um editor de Markdown a duas colunas que renderiza enquanto escreves. Suporta a sintaxe ao estilo GitHub que as pessoas escrevem mesmo: listas aninhadas e de tarefas, tabelas com alinhamento, notas de rodapé, rasurado, realces, ligações automáticas, títulos sublinhados, front matter e blocos de código com cores de sintaxe. O editor ajuda pelo caminho: continua as listas ao carregar em Enter, indenta com o tabulador, envolve a selecção em negrito ou itálico a partir do teclado, e transforma um URL colado numa ligação à volta do que estivesse seleccionado.",
  "seoBrowserSpeedTitle": "Tudo acontece dentro do teu separador",
  "seoBrowserSpeedText": "Não há passo de envio nem conta. O analisador, o realce de sintaxe, os temas e todas as exportações correm como JavaScript no teu navegador, e é por isso que a ferramenta funciona com a rede desligada. O teu rascunho é guardado no armazenamento local deste navegador para que uma recarga não o perca, e basta limpar os dados do navegador para o remover: nunca foi enviado para lado nenhum que houvesse que apagar.",
  "seoHeroList": [
    "Sem envios, sem conta, sem servidor",
    "Funciona offline depois de a página carregar",
    "Rascunho guardado localmente entre visitas",
    "Não há nada para apagar do nosso lado"
  ],
  "seoSecondaryTitle": "Feito para documentos que têm de sair do editor",
  "seoUseCaseTitle": "READMEs, documentação, notas e artigos",
  "seoUseCaseText": "Escreve o README de um projecto com a sua tabela de opções e exemplos de código, guarda notas de reunião com listas de tarefas que mostram o que continua em aberto, escreve um registo de alterações, ou monta um artigo de blogue com front matter antes de o passares a um gerador de sites estáticos. O painel de índice torna um documento longo em algo por onde se salta, e a contagem de palavras e a estimativa de leitura dizem-te quando um artigo já é suficientemente longo.",
  "seoPrivacyTitle": "Privado por construção",
  "seoPrivacyText": "Rascunhos por publicar, documentação interna e notas de cliente são exactamente o tipo de texto que não deve ser colado no servidor de outra pessoa. Aqui não tem para onde ir: o documento nunca sai da página onde é escrito.",
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "Que sintaxe Markdown é suportada?",
      "answer": "O conjunto ao estilo GitHub: títulos em forma ATX (#) e sublinhada, negrito, itálico, rasurado, realce, código em linha, blocos de código delimitados e indentados, citações que se aninham, listas ordenadas e não ordenadas que se aninham, listas de tarefas, tabelas com alinhamento por coluna, imagens, ligações, URLs soltos, notas de rodapé, linhas horizontais, quebras de linha forçadas, escapes com barra invertida, e front matter em YAML, que é mantido fora do resultado renderizado."
    },
    {
      "question": "O meu documento é enviado ou guardado num servidor?",
      "answer": "Não. A análise, a renderização, o realce e todas as exportações correm no teu navegador, e nenhuma parte do documento é transmitida. A única cópia que sobrevive ao separador é o rascunho guardado no armazenamento local deste navegador para que uma recarga não perca o teu trabalho; limpar os dados do navegador remove-o."
    },
    {
      "question": "Como funciona o «Exportar para PDF»?",
      "answer": "Constrói uma cópia limpa do documento no tema que escolheste e entrega só isso à caixa de impressão do navegador, onde escolhes «Guardar como PDF». O cabeçalho, a barra de ferramentas, os blocos de anúncios e o rodapé da página não fazem parte do que é impresso — recebes o documento, em papel branco, com as quebras de página fora do meio dos blocos de código e das tabelas."
    },
    {
      "question": "Qual é a diferença entre «Copiar HTML» e «Copiar formatado»?",
      "answer": "O «Copiar HTML» põe o markup na área de transferência como texto: etiquetas semânticas sem classes de framework, prontas a colar num CMS, num modelo ou num construtor de e-mails. O «Copiar formatado» põe o documento na área de transferência como texto formatado, por isso colar num processador de texto, num documento ou num cliente de e-mail mantém os títulos, o negrito e as listas em vez de mostrar sinais de maior e menor."
    },
    {
      "question": "Posso abrir um ficheiro Markdown que já tenho?",
      "answer": "Sim — usa «Abrir ficheiro» ou larga-o sobre a área de trabalho. Nada é carregado nas tuas costas: o ficheiro fica em espera e decides se substitui o editor ou se é acrescentado ao que já lá está. O mesmo vale para documentos entregues por outra ferramenta oLoveTools."
    },
    {
      "question": "Que atalhos de teclado existem?",
      "answer": "Ctrl+B para negrito, Ctrl+I para itálico, Ctrl+E para código em linha, Ctrl+K para uma ligação à volta da selecção, Ctrl+Z e Ctrl+Y para anular e refazer. O tabulador e Shift+Tab indentam e desindentam as linhas seleccionadas, e o Enter continua uma lista, uma numeração ou uma citação — carregar nele num item vazio termina a lista em vez de acrescentar mais uma marca morta."
    },
    {
      "question": "Que tamanho de documento aguenta?",
      "answer": "Aceita ficheiros até 8 MB, muito mais do que qualquer documento escrito à mão. A análise acontece num Web Worker para o editor continuar a responder em ficheiros longos, e o histórico de anulação guarda apenas os caracteres que mudaram em vez de uma cópia do documento por passo."
    }
  ],
  "seoKeywordsTitle": "Pesquisas relacionadas",
  "seoKeywords": [
    "editor markdown",
    "pré-visualização markdown",
    "markdown para html",
    "markdown para pdf",
    "editor markdown online",
    "markdown estilo github",
    "editor de readme",
    "gerador de tabelas markdown",
    "markdown ao vivo",
    "editor markdown gratuito"
  ],
  "footerTagline": "Um editor de Markdown gratuito, privado e local com pré-visualização ao vivo.",
  "footerCredit": "Parte da suite oLoveTools",
  "seo_title": "MarkdownLive | Editor de Markdown online gratuito com pré-visualização",
  "seo_description": "Escreve Markdown e vê-o renderizado enquanto escreves. Listas aninhadas, tabelas, notas, tarefas e código com cores. Exporta para MD, HTML ou PDF. Gratuito e totalmente local."
};
