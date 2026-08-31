export default {
  "languageName": "Português",
  "header": {
    "subtitle": "CONVERSOR DE FORMATOS DE IMAGEM"
  },
  "hero": {
    "badge": "Funciona no teu navegador",
    "title": "Converte imagens para o formato de que precisas,",
    "titleHighlight": "e vê o que custou",
    "subtitle": "Larga até 50 fotos, escolhe formato, tamanho e peso, e converte quando estiveres pronto. Nada é enviado e nada começa antes de carregares no botão.",
    "trust1": "Sem envios nem conta",
    "trust2": "Qualidade medida (SSIM)",
    "trust3": "Lotes de 50"
  },
  "dropzone": {
    "title": "Larga aqui as tuas imagens",
    "subtitle": "Até {max} de cada vez. Também podes colar da área de transferência.",
    "waits": "Os ficheiros ficam à espera aqui: a conversão só arranca quando carregas em Converter.",
    "tooMany": "A fila comporta 50 imagens; os ficheiros a mais ficaram de fora.",
    "unsupported": "EPS e RAW de câmara não se conseguem descodificar num navegador, por isso foram ignorados.",
    "decodeFailed": "Esse ficheiro não pôde ser descodificado como imagem.",
    "full": "A fila está cheia. Retira uma imagem para acrescentar outra."
  },
  "stage": {
    "original": "Original",
    "converted": "Convertida",
    "stale": "Definições alteradas",
    "zoomIn": "Aproximar",
    "zoomOut": "Afastar",
    "fit": "Ajustar",
    "splitLabel": "Divisória de comparação",
    "stageHint": "Roda para ampliar sobre o ponteiro, arrasta para deslocar. Mantém Espaço, Alt ou o botão direito para ver o original."
  },
  "controls": {
    "presetsTitle": "Predefinições",
    "presets": {
      "web": "Web (WEBP, 1920px)",
      "social": "Redes (JPG, 1440px)",
      "archive": "Arquivo (PNG, tamanho real)",
      "email": "E-mail (menos de 500 KB)"
    },
    "presetsHint": "Uma predefinição apenas preenche os comandos abaixo. Ignora-a e define tudo à mão se preferires.",
    "outputFormat": "Formato de saída",
    "formatUnavailable": "O teu navegador não sabe escrever este formato",
    "formatUnavailableHint": "Os formatos riscados são aqueles para os quais este navegador não tem codificador. Verificamo-lo em vez de o supor, por isso nunca levas um PNG com a extensão trocada.",
    "qualityTitle": "Qualidade e peso",
    "quality": "Qualidade",
    "qualityLossless": "Este formato é sem perdas, por isso a qualidade não faz nada aqui.",
    "targetSize": "Apontar a um peso máximo",
    "targetSizeHint": "A qualidade é procurada por bisseção: até 8 codificações para ficar mesmo abaixo do limite.",
    "resizeTitle": "Tamanho",
    "resizeModes": {
      "none": "Manter",
      "scale": "Escala",
      "longEdge": "Lado maior",
      "dimensions": "Exato"
    },
    "scale": "Escala",
    "longEdgeHint": "lado mais comprido",
    "lockAspect": "Manter a proporção",
    "fits": {
      "contain": "Conter",
      "cover": "Cobrir",
      "stretch": "Esticar"
    },
    "sharpen": "Focar depois de redimensionar",
    "sharpenHint": "Máscara de nitidez só sobre a luminância, para que as arestas fiquem nítidas sem halos de cor.",
    "transformTitle": "Rotação e fundo",
    "flipH": "Espelhar na horizontal",
    "flipV": "Espelhar na vertical",
    "background": "Fundo por baixo da imagem (formatos sem transparência)",
    "engineTitle": "Motor",
    "measureQuality": "Medir a qualidade",
    "measureQualityHint": "Volta a descodificar o resultado e compara-o com o original (SSIM). Custa uns milissegundos.",
    "livePreview": "Pré-visualização em direto",
    "livePreviewHint": "Desligada por omissão: com ela, cada alteração volta a converter a imagem selecionada.",
    "undo": "Anular",
    "redo": "Refazer",
    "historyHint": "Histórico de definições"
  },
  "editor": {
    "startOver": "Começar de novo",
    "shortcuts": "← → para andar, Enter para converter, Ctrl+Z para anular",
    "queue": "Fila",
    "addMore": "Acrescentar",
    "remove": "Tirar da fila",
    "perImage": "Definições só para esta imagem",
    "perImageOn": "Esta imagem ignora as definições globais.",
    "perImageOff": "Esta imagem segue as definições globais.",
    "convert": "Converter",
    "convertAll": "Converter tudo",
    "converting": "A converter",
    "reading": "A ler",
    "download": "Descarregar",
    "downloadZip": "ZIP",
    "dimensions": "Dimensões",
    "size": "Peso",
    "vsOriginal": "face ao original",
    "quality": "Qualidade",
    "attempts": "passagens",
    "ssimBands": {
      "identical": "indistinguível",
      "excellent": "excelente",
      "good": "boa",
      "fair": "nota-se de perto",
      "poor": "claramente degradada"
    },
    "icoMultisize": "O .ico leva versões de 16, 32, 48, 64, 128 e 256 px; o tamanho mostrado é o da maior que lá está dentro.",
    "missedTarget": "Não foi possível cumprir o peso máximo nem com a qualidade mais baixa. Este é o resultado mais pequeno possível.",
    "notConverted": "Ainda por converter",
    "notConvertedHint": "O teu ficheiro está carregado e à espera. Ajusta o que precisares e carrega em Converter.",
    "engineNote": "A codificação corre em {n} workers em segundo plano, por isso a página nunca congela. Cada imagem é descodificada uma vez e todas as conversões partem daí.",
    "dismiss": "Dispensar",
    "backToTop": "Voltar ao topo"
  },
  "next": {
    "nextStepTitle": "Continua",
    "nextStepHint": "O resultado viaja contigo, sem voltar a enviar",
    "nextCompress": "Comprimir",
    "nextCrop": "Recortar",
    "nextExif": "Retirar metadados",
    "nextWatermark": "Pôr marca de água",
    "nextCutout": "Tirar o fundo"
  },
  "how": {
    "title": "Como funciona",
    "subtitle": "Três passos, e nenhum arranca sozinho.",
    "steps": [
      {
        "title": "Larga os ficheiros",
        "text": "São descodificados uma vez e ficam à espera na fila. Nada é convertido e nada sai do teu dispositivo."
      },
      {
        "title": "Escolhe a saída",
        "text": "Formato, qualidade, tamanho, rotação, fundo. Ou uma predefinição e está feito."
      },
      {
        "title": "Converte e compara",
        "text": "Levas o peso, as dimensões e uma nota SSIM do que a conversão custou."
      }
    ]
  },
  "features": {
    "title": "O que faz e um conversor qualquer não faz",
    "items": [
      {
        "title": "Workers em paralelo",
        "desc": "A codificação corre fora do fio principal e repartida por vários workers, por isso a página continua a responder com 50 imagens na fila."
      },
      {
        "title": "Formatos verificados, não supostos",
        "desc": "Cada codificador é testado ao arrancar com uma codificação real de dois pixéis. Um navegador que não sabe escrever AVIF não to oferece."
      },
      {
        "title": "Qualidade que se pode ler",
        "desc": "Uma nota SSIM contra o original diz-te o que a compressão custou de verdade, e não só quanto poupaste."
      },
      {
        "title": "Peso alvo",
        "desc": "Dizes \"menos de 500 KB\" e a qualidade é procurada por bisseção, até 8 codificações, para ficar mesmo abaixo."
      },
      {
        "title": "Nada é enviado",
        "desc": "Descodificar, redimensionar e codificar acontece tudo no teu navegador. Nenhum servidor vê as tuas fotos, e funciona sem ligação."
      },
      {
        "title": "Lotes com exceções por imagem",
        "desc": "Até 50 imagens de uma vez, e qualquer uma pode sair da regra com o seu próprio formato e tamanho."
      }
    ]
  },
  "formats": {
    "title": "Os formatos, e o que cada um dá de verdade",
    "subtitle": "Entrada: JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, TIFF e HEIC. EPS e RAW de câmara precisam de um interpretador PostScript e de uma tabela por modelo de câmara, por isso não são aceites em vez de voltarem calados como um PNG.",
    "rows": [
      {
        "label": "WEBP",
        "desc": "Hoje o melhor equilíbrio entre peso e qualidade para a web, com transparência. Suportado em tudo o que interessa."
      },
      {
        "label": "AVIF",
        "desc": "Ainda mais pequeno com a mesma qualidade, mas só alguns navegadores o sabem escrever. Se o teu não conseguir, o botão fica desativado."
      },
      {
        "label": "JPG",
        "desc": "O formato fotográfico universal. Sem transparência, por isso és tu que escolhes a cor de fundo que fica por baixo."
      },
      {
        "label": "PNG",
        "desc": "Sem perdas e com transparência. O cursor de qualidade não faz nada aqui, e é por isso que aparece apagado."
      },
      {
        "label": "ICO",
        "desc": "Um ícone multitamanho a sério: 16, 32, 48, 64, 128 e 256 px num único ficheiro, recortado ao quadrado pelo centro."
      },
      {
        "label": "PDF",
        "desc": "Uma página ajustada à imagem, com um JPEG lá dentro na qualidade que escolheste."
      },
      {
        "label": "TIFF",
        "desc": "RGBA sem compressão para impressão e arquivo. Também é aceite como entrada."
      },
      {
        "label": "SVG",
        "desc": "Um invólucro: o rasterizado vai embutido dentro de um SVG. Não vetoriza — nenhuma ferramenta de navegador o faz — mas serve onde só aceitam .svg."
      }
    ]
  },
  "app": {
    "footer": "Corre tudo no teu navegador.",
    "contactFeedback": "CONTATO PARA IDEIAS E FEEDBACK:",
    "copiedEmail": "Copiado!"
  },
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "As minhas imagens são enviadas para algum lado?",
      "answer": "Não. Descodificar, redimensionar e codificar acontece dentro do teu navegador, com o canvas e web workers. Não vai nada para nenhum servidor e, depois de a página carregar, funciona sem qualquer ligação."
    },
    {
      "question": "Porque há formatos riscados?",
      "answer": "Porque o teu navegador não tem codificador para eles. Os navegadores não avisam: se lhes pedires um GIF ou um HEIC, devolvem um PNG com o tipo trocado sem dizer nada. Ao arrancar codificamos dois pixéis em cada formato e vemos o que sai mesmo, por isso só te é oferecido o que funciona."
    },
    {
      "question": "Consegue converter para HEIC, EPS ou RAW de câmara?",
      "answer": "Não, e já não finge que sim. Nenhum navegador sabe escrever HEIC, o EPS precisa de um interpretador PostScript e o RAW é um formato de sensor diferente em cada modelo de câmara. HEIC e TIFF são aceites como entrada; os ficheiros EPS e RAW são recusados com uma mensagem em vez de voltarem como um PNG mal etiquetado."
    },
    {
      "question": "O que é o número SSIM que aparece ao lado do resultado?",
      "answer": "É uma nota de semelhança entre a imagem convertida e o original, de 0 a 1. Acima de 0,98 a diferença custa muito a ver; abaixo de 0,95 começam a notar-se artefactos em fotografias. Existe porque \"poupaste 68%\" só conta a metade simpática da história."
    },
    {
      "question": "Porque não acontece nada quando largo um ficheiro?",
      "answer": "É de propósito. Largar um ficheiro apenas o descodifica e o põe na fila. A conversão — a parte cara — espera que carregues em Converter, para deixares tudo preparado em vez de correres atrás de uma pré-visualização que se reinicia sozinha."
    },
    {
      "question": "Perde-se detalhe ao redimensionar?",
      "answer": "Qualquer redução grande perde, mas quanto depende do motor. Alguns navegadores reduzem numa só passagem com um núcleo de 2x2 e deitam fora os restantes pixéis, o que se vê como arestas serrilhadas. O FormatFlow mede isso ao arrancar — reduz um padrão de teste e compara-o com uma média exata — e só recorre a reduzir a imagem a metades sucessivas quando o navegador precisa. Se o navegador já filtra bem, essas passagens a mais custariam tempo sem mudar nada, por isso são saltadas. Por cima ainda podes acrescentar uma passagem de nitidez."
    },
    {
      "question": "Porque é que as fotos do telemóvel já não aparecem rodadas?",
      "answer": "Porque a imagem é descodificada com createImageBitmap e a orientação EXIF é aplicada aí, uma só vez. O método anterior carregava o ficheiro num elemento <img>, onde uns navegadores aplicam a etiqueta de orientação e outros não, e o canvas ficava com a imagem por rodar."
    },
    {
      "question": "Quantas imagens posso converter de uma vez?",
      "answer": "Cinquenta. São codificadas ao mesmo tempo repartidas por vários workers em segundo plano, e cada uma pode levar o seu próprio formato e tamanho se ligares as definições por imagem."
    }
  ],
  "seoKeywordsTitle": "Palavras-chave",
  "seoKeywords": [
    "conversor de imagens",
    "converter HEIC para JPG",
    "PNG para WEBP",
    "JPG para AVIF",
    "WEBP para PNG",
    "TIFF para JPG",
    "imagem para ICO",
    "gerador de favicon",
    "imagem para PDF",
    "conversor de imagens em lote",
    "redimensionar imagens online",
    "comprimir imagens para um peso definido",
    "conversor de imagens offline",
    "conversor de imagens grátis sem enviar nada"
  ],
  "footer_seo_title": "Um conversor que te conta o que fez",
  "footer_seo_paragraph1": "O FormatFlow converte imagens entre JPG, PNG, WEBP, AVIF, ICO, PDF, TIFF e SVG inteiramente dentro do teu navegador. Lê HEIC de iPhone e TIFF como entrada, redimensiona por escala, por lado maior ou para dimensões exatas, roda, espelha, escolhe a cor de fundo para os formatos sem transparência e consegue acertar num peso máximo procurando a qualidade certa.",
  "footer_seo_paragraph2": "O que não faz é mentir-te. Os formatos que o teu navegador não sabe codificar aparecem desativados em vez de devolverem um PNG com a extensão trocada, EPS e RAW de câmara são recusados de imediato, e cada resultado vem com o seu peso, as suas dimensões e uma nota SSIM da qualidade que custou. Não é enviado nada: todo o processo corre na tua máquina.",
  "seo_title": "FormatFlow | Conversor de imagens com qualidade medida",
  "seo_description": "Converte imagens para WEBP, AVIF, JPG, PNG, ICO, PDF, TIFF ou SVG no teu navegador. Lotes de 50, peso alvo, ICO multitamanho a sério, entrada HEIC e TIFF, e nota de qualidade SSIM. Não é enviado nada."
};
