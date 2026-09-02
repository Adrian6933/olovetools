export default {
  "resetHint": "Começar de novo",
  "title": "CleanSnap",
  "seo_title": "CleanSnap | Tira marcas de água e objetos das tuas fotos",
  "seo_description": "Pinta por cima de uma marca de água, de um logótipo ou de um objeto a mais e o CleanSnap reconstrói o que estava por trás copiando pedaços da própria foto. Corre no teu navegador, com barra de progresso e botão de cancelar. Não é enviado nada.",
  "seoHeroTitle": "CleanSnap",
  "seoHeroText": "Pinta por cima do que queres tirar e o buraco é reconstruído com o resto da foto — com textura e arestas, não com uma mancha.",
  "seoBrowserSpeedTitle": "O trabalho corre num fio à parte",
  "seoBrowserSpeedText": "Reconstruir um buraco obriga a varrer a foto à procura de pedaços que encaixem, e isso pesa mesmo. Corre num Web Worker com barra de progresso a sério e botão de cancelar, por isso a página nunca congela enquanto trabalha.",
  "seoUseCaseTitle": "Quatro preenchimentos, e cada um diz o que faz",
  "seoUseCaseText": "Dois reconstroem: pedaços para textura e detalhe, difusão para céus e paredes lisas. Dois só tapam: desfoque e mosaico. Estão em grupos separados porque tapar não é o mesmo que tirar.",
  "seoPrivacyTitle": "A foto não sai do teu dispositivo",
  "seoPrivacyText": "Sem envios, sem conta e sem descarregar modelo nenhum. A imagem é descodificada, editada e exportada dentro do teu navegador e, depois de a página carregar, funciona sem ligação.",
  "hero": {
    "badge": "Corre no teu navegador",
    "title": "Pinta por cima do que sobra.",
    "titleHighlight": "O resto da foto preenche.",
    "subtitle": "O CleanSnap reconstrói o buraco copiando pedaços da própria imagem, por isso a textura e as arestas continuam lá dentro. Não é enviado nada, e nada começa até carregares no botão.",
    "trust1": "Sem envios nem conta",
    "trust2": "Resolução completa",
    "trust3": "Dá para cancelar"
  },
  "ui": {
    "dropTitle": "Larga aqui uma foto",
    "dropHint": "Ou clica para escolher uma. Também podes colar da área de transferência.",
    "reading": "A ler a imagem…",
    "newImage": "Outra imagem",
    "scaledNote": "A trabalhar em tamanho reduzido — o ficheiro tinha {w}×{h}",
    "shortcuts": "B/R/C/E ferramentas · [ ] pincel · Espaço para espreitar · Enter para aplicar",
    "brush": "Pincel",
    "rect": "Retângulo",
    "circle": "Elipse",
    "eraser": "Despintar",
    "pan": "Deslocar",
    "size": "Tamanho",
    "invert": "Inverter",
    "clearSel": "Limpar",
    "apply": "Preencher a seleção",
    "cancel": "Cancelar",
    "undo": "Anular",
    "redo": "Refazer",
    "reset": "Reiniciar",
    "download": "Descarregar",
    "quality": "Qualidade",
    "output": "Saída",
    "tookMs": "{ms} ms",
    "stageOriginal": "Original",
    "stageCurrent": "Cópia de trabalho",
    "stageHint": "Roda para ampliar · arrasta com H para deslocar · mantém Espaço ou o botão direito para ver o original",
    "zoomIn": "Aproximar",
    "zoomOut": "Afastar",
    "fit": "Ajustar",
    "dismiss": "Dispensar",
    "errors": {
      "decode": "Esse ficheiro não pôde ser aberto como imagem.",
      "nomask": "Pinta alguma coisa primeiro: não há seleção nenhuma para preencher."
    },
    "fill": {
      "rebuildTitle": "Reconstruir o que lá estava",
      "hideTitle": "Só tapar",
      "hideNote": "Estes dois não tiram nada: cobrem. Servem para uma cara ou uma matrícula, e não servem para uma marca de água que queres ver desaparecer.",
      "methods": {
        "patch": "Pedaços",
        "smooth": "Suave",
        "blur": "Desfoque",
        "pixelate": "Mosaico"
      },
      "methodHints": {
        "patch": "Copia pedaços que encaixam de outras partes da foto e avança para dentro, a começar pelas arestas. O único que devolve textura.",
        "smooth": "Espalha para o buraco as cores à volta. Perfeito para um céu ou uma parede lisa; uma mancha em tudo o que tenha detalhe.",
        "blur": "Faz a média do que está à volta sobre a seleção. Tapa, não reconstrói.",
        "pixelate": "Substitui a seleção por blocos. Tapa, não reconstrói."
      },
      "patchSize": "Tamanho do pedaço",
      "patchSizeHint": "Pequeno segue melhor o detalhe fino; grande copia textura mais coerente. 9 px chega para quase todas as marcas de água.",
      "searchRadius": "Raio de procura",
      "searchRadiusHint": "Até onde procurar pedaços à volta do buraco. Mais longe é mais lento e raramente melhor: o pedaço bom costuma estar mesmo ao lado.",
      "strength": "Intensidade",
      "grow": "Alargar seleção",
      "growHint": "As marcas de água têm um halo suave que não se vê enquanto pintas. Dois pixéis a mais costumam apanhá-lo.",
      "feather": "Suavizar a costura",
      "featherHint": "Funde o contorno para que o arranjo não se denuncie por um degrau de um pixel."
    }
  },
  "next": {
    "nextStepTitle": "Continua",
    "nextStepHint": "A foto limpa viaja contigo, sem voltar a enviar",
    "nextCrop": "Recortar",
    "nextWatermark": "Pôr a tua marca",
    "nextCompress": "Comprimir",
    "nextFormat": "Mudar de formato",
    "nextExif": "Retirar metadados"
  },
  "how": {
    "title": "Como funciona",
    "subtitle": "Três passos, e o pesado espera por ti.",
    "steps": [
      {
        "title": "Abre a foto",
        "text": "É descodificada uma vez e fica em resolução completa. Não se altera nada e nada sai do teu dispositivo."
      },
      {
        "title": "Pinta por cima",
        "text": "Pincel, retângulo ou elipse. Aproxima-te o que for preciso: a seleção é guardada no tamanho real da foto, não no da pré-visualização."
      },
      {
        "title": "Preenche",
        "text": "Escolhe um método e carrega no botão. Tens barra de progresso, botão de cancelar e o tempo que demorou."
      }
    ]
  },
  "features": {
    "title": "O que mudou por dentro",
    "items": [
      {
        "title": "Pedaços, não uma mancha",
        "desc": "O buraco é preenchido copiando pedaços de outras partes da mesma foto, por isso o tijolo continua tijolo e a relva continua relva. A difusão sozinha só consegue dar a superfície mais lisa que encaixa nas margens."
      },
      {
        "title": "As arestas continuam",
        "desc": "A ordem de preenchimento é decidida por quanta estrutura atravessa cada ponto do contorno, por isso uma linha ou um horizonte entra primeiro no buraco e segue a direito em vez de ficar cortado."
      },
      {
        "title": "Fora do fio principal",
        "desc": "O trabalho corre num Web Worker por troços cronometrados: a barra anda, a página continua a dar para usar e o Cancelar pára mesmo a meio."
      },
      {
        "title": "A seleção é tua",
        "desc": "Alarga-a, aperta-a, inverte-a, suaviza a costura — e corre outra vez com outro método sobre a mesma seleção sem repintar nada."
      },
      {
        "title": "Não é enviado nada",
        "desc": "Descodificar, editar e exportar acontece tudo no teu navegador. Sem conta, sem modelo para descarregar, e funciona sem ligação."
      },
      {
        "title": "Anular que custa kilobytes",
        "desc": "Guarda-se só o retângulo que mudou, não a imagem inteira: quarenta passos de histórico cabem no espaço que um ocupava."
      }
    ]
  },
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "A minha foto é enviada para algum lado?",
      "answer": "Não. É descodificada, editada e exportada dentro do teu navegador, com o canvas e um Web Worker. Não vai nada para nenhum servidor, não há conta, e depois de a página carregar funciona sem ligação nenhuma."
    },
    {
      "question": "Há algum modelo de IA por trás?",
      "answer": "Não, e já não diz que há. A versão anterior oferecia um \"modo IA\" que corria exatamente a mesma difusão do modo normal, apenas com mais iterações. O que há agora é propagação de pedaços: o buraco é preenchido copiando bocados reais da tua própria foto. Sem rede neuronal, sem descarregar nada, e a dizer o que faz de verdade."
    },
    {
      "question": "Porque é que às vezes o resultado continua estranho?",
      "answer": "Porque o preenchimento só pode usar o que já está na imagem. Se o que tiraste tapava algo único — uma cara, texto, um objeto irrepetível — não há de onde copiar, e o que sai é uma textura plausível, não a verdade. Funciona melhor em fundos que se repetem: céu, paredes, folhagem, alcatrão, água."
    },
    {
      "question": "Para que serve cada preenchimento?",
      "answer": "Pedaços para tudo o que tenha textura ou estrutura. Suave para céus, paredes lisas e degradés, onde é ao mesmo tempo mais rápido e melhor. Desfoque e mosaico não tiram absolutamente nada: cobrem, que é o que queres para uma cara ou uma matrícula e exatamente o que não queres para uma marca de água."
    },
    {
      "question": "A seleção parece certa mas fica um contorno ténue. Porquê?",
      "answer": "As marcas de água costumam ser semitransparentes e ter um halo suave de uns poucos pixéis, fácil de não ver enquanto pintas. Sobe \"Alargar seleção\" dois ou três pixéis para que o halo fique dentro do buraco e seja reconstruído também."
    },
    {
      "question": "Posso parar um preenchimento que está a demorar demais?",
      "answer": "Podes. Reconstruir obriga a varrer a foto à procura de pedaços que encaixem, por isso uma seleção grande demora mesmo. O trabalho é partido em troços curtos dentro de um fio em segundo plano, e é isso que permite que a barra ande e que o Cancelar surta efeito a meio, não só no fim."
    },
    {
      "question": "Reduz a minha foto?",
      "answer": "Só acima de uns 24 megapixéis, e quando o faz di-lo no ecrã com as dimensões originais. A versão anterior cortava em silêncio todas as imagens para 1920 pixéis, por isso descarregavas algo mais pequeno do que tinhas aberto sem nunca saberes."
    },
    {
      "question": "Que formatos posso abrir e guardar?",
      "answer": "Abre JPG, PNG, WebP, AVIF, GIF e o HEIC que os iPhone fazem. Guarda em PNG, JPG ou WebP, com cursor de qualidade para os dois com perdas — a versão antiga escrevia sempre PNG, o que transformava um JPEG pequeno num ficheiro bem maior."
    }
  ],
  "seoKeywordsTitle": "Palavras-chave",
  "seoKeywords": [
    "tirar marca de água de uma foto",
    "removedor de marca de água",
    "tirar objetos de uma foto",
    "inpainting online",
    "preenchimento com base no conteúdo online",
    "apagar objetos de imagens",
    "tirar logótipo de uma imagem",
    "tirar texto de uma foto",
    "retoque de fotos no navegador",
    "tirar marcas de água grátis sem enviar",
    "tirar pessoas das fotos",
    "carimbo de clonagem online"
  ],
  "footer_seo_title": "Uma ferramenta de retoque que mostra o que faz",
  "footer_seo_paragraph1": "O CleanSnap tira marcas de água, logótipos, datas e objetos indesejados das fotos inteiramente dentro do teu navegador. Pintas por cima do que queres ver desaparecer com pincel, retângulo ou elipse, aproximando-te o quanto precisares, e o buraco é reconstruído copiando pedaços que encaixam de outras partes da mesma imagem — arestas e linhas primeiro, para que a estrutura continue através do buraco em vez de parar nele.",
  "footer_seo_paragraph2": "E recusa-se a prometer mais do que faz. Não há modelo de IA nem um \"modo inteligente\" que afinal é o mesmo código duas vezes; o desfoque e o mosaico ficam no seu próprio grupo porque tapam em vez de tirar; a imagem mantém a resolução e avisa quando não consegue; e o preenchimento corre num fio em segundo plano com uma barra que podes cancelar. Não é enviado nada em momento nenhum.",
  "footerCredit": "Parte do conjunto oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contato para ideias e comentários:",
  "footerTagline": "Tira marcas de água e objetos indesejados das fotos pintando por cima. O buraco é reconstruído com a própria imagem, inteiramente no teu navegador."
};
