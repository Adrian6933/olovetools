export default {
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contato para ideias e comentários:",
  "resetHint": "Começar de novo",
  "title": "GIFBolt",
  "description": "Extraia quadros de um vídeo ou enfileire imagens, edite a linha do tempo e codifique um GIF com paleta global e compressão entre quadros, tudo no seu navegador.",
  "tab_video": "Vídeo para GIF",
  "tab_images": "Imagens para GIF",
  "label_upload_video": "Enviar Vídeo",
  "label_upload_images": "Enviar Imagens",
  "label_duration": "Atraso do quadro (ms)",
  "label_fps": "Taxa de quadros (FPS)",
  "label_size": "Largura do GIF",
  "label_quality": "Qualidade da compressão",
  "label_trim": "Intervalo de corte",
  "label_start": "Tempo de início",
  "label_end": "Tempo de fim",
  "btn_generate": "Gerar GIF",
  "btn_generating": "Compilando GIF...",
  "btn_download": "Baixar GIF",
  "text_progress_extract": "Extraindo quadros...",
  "text_progress_compile": "Compilando quadros...",
  "history_title": "Histórico Recente de GIF",
  "no_history": "Nenhum histórico de GIF ainda.",
  "clear_history": "Limpar Histórico",
  "quality_high": "Alta qualidade",
  "quality_medium": "Qualidade média",
  "quality_low": "Qualidade baixa (Rápido)",
  "drop_zone_video": "MP4, WebM, MOV, MKV, AVI — ou imagens PNG, JPG, WebP, AVIF, GIF, BMP e HEIC.",
  "drop_zone_images": "PNG, JPG, WebP, AVIF, GIF, BMP e HEIC. Solte na ordem em que quiser que sejam exibidas.",
  "seo_title": "GIFBolt | Conversor Grátis de Vídeo para GIF e Imagens para GIF Online",
  "seo_description": "Converta vídeo ou sequências de imagens em GIFs animados no navegador: linha do tempo editável, paleta global, pontilhado Floyd–Steinberg e compressão entre quadros. Nada é enviado.",
  "seoHeroTitle": "Transforme um vídeo ou um monte de imagens em GIF, dentro do próprio navegador",
  "seoHeroText": "Extraia os quadros de um clipe, edite a linha do tempo e codifique com paleta global, pontilhado e compressão entre quadros. Nada é enviado.",
  "seoHeroList": [
    "Os quadros continuam editáveis antes de codificar",
    "Uma única paleta para o laço inteiro",
    "Nada é enviado e nada é baixado"
  ],
  "seoBrowserSpeedTitle": "Um codificador de GIF de verdade, não um despejo de canvas",
  "seoBrowserSpeedText": "Os quadros são lidos direto do vídeo já decodificado com redimensionamento de alta qualidade, sem nunca passar por um JPEG intermediário. A paleta é construída por corte mediano sobre a animação inteira, os pixels são mapeados com pontilhado Floyd–Steinberg em serpentina, e tudo o que um quadro compartilha com o anterior é gravado como transparente e herdado. O trabalho é dividido entre vários web workers, então a página continua respondendo e a barra de progresso acompanha quadros reais.",
  "seoUseCaseTitle": "Para relatos de bug, demonstrações e laços de reação",
  "seoUseCaseText": "Grave um bug uma vez e corte para os quatro segundos que importam. Transforme o passeio por um design em algo que roda sozinho dentro de um pull request. Ou enfileire algumas capturas e ajuste o tempo delas à mão. A linha do tempo continua editável até você apertar codificar.",
  "seoPrivacyTitle": "Nada é enviado e nada é baixado",
  "seoPrivacyText": "Cada etapa roda nesta aba: o decodificador de vídeo é o do próprio navegador, o quantizador e o compressor LZW são JavaScript que vem junto com a página, e o resultado é um Blob que nunca sai da sua máquina. Não há servidor para onde mandar arquivos nem modelo ou codec buscado num CDN. A contrapartida é honesta: tudo esbarra na sua memória RAM, então um clipe em 4K precisa ser cortado e reduzido antes de conseguir ser codificado.",
  "faqTitle": "Perguntas Frequentes",
  "faq": [
    {
      "question": "Existe limite de tamanho de arquivo?",
      "answer": "Fixo não, mas real sim: os quadros ficam na memória da sua aba. Um GIF de 480 px e 4 segundos a 12 fps são cerca de 50 MB de dados de trabalho e codifica em poucos segundos; um clipe em 4K esgota a aba muito antes de terminar. Corte o trecho e baixe o tamanho de trabalho — é para isso que esses controles existem."
    },
    {
      "question": "Por que meu GIF continua tão grande?",
      "answer": "O GIF é um formato de 1987: 256 cores e nenhuma compensação de movimento. Reduza primeiro a largura, depois a taxa de quadros e depois a paleta. Deixar “reaproveitar os pixels que não mudam” ligado costuma valer mais que as três coisas juntas: numa gravação de tela isso elimina quase o arquivo inteiro."
    },
    {
      "question": "Por que a taxa de quadros não é exatamente a que escolhi?",
      "answer": "O GIF guarda cada espera em centésimos de segundo, então só existem taxas do tipo 100/n. Pedir 12 fps significa na prática 8 centésimos por quadro, ou seja, 12,5. O painel mostra a taxa que você vai obter de fato, não a pedida."
    },
    {
      "question": "Quais formatos posso usar?",
      "answer": "Qualquer vídeo que o navegador consiga reproduzir — MP4/H.264, WebM, MOV e muitas vezes MKV — além de PNG, JPG, WebP, AVIF, GIF, BMP e o HEIC do iPhone para imagens. Um GIF animado colocado como imagem contribui apenas com o primeiro quadro."
    },
    {
      "question": "Alguma coisa é enviada para um servidor?",
      "answer": "Não. Não existe etapa de envio nem requisição externa: o codificador vem junto com a página e roda em web workers dentro desta aba."
    },
    {
      "question": "Dá para manter a transparência?",
      "answer": "Dá, com a chave “manter a transparência”. O GIF aceita exatamente uma cor totalmente transparente, então bordas suaves viram bordas duras. Não pode ser combinado com o reaproveitamento de pixels, porque os dois precisam da mesma vaga transparente."
    }
  ],
  "footerTagline": "Ferramentas de criação de GIF gratuitas, privadas e personalizáveis em cliente.",
  "footerCredit": "Parte da suite oLoveTools",
  "badge": "Vídeo e imagens → GIF",
  "dropTitle": "Solte um vídeo ou um conjunto de imagens",
  "dropHintNothing": "Soltar um arquivo não dispara nada: você escolhe os ajustes e aperta o botão.",
  "modeAuto": "Extrair um trecho",
  "modeManual": "Escolher quadros à mão",
  "manualHint": "Percorra o vídeo e adicione exatamente os quadros que quiser. Nenhuma etapa automática é executada.",
  "btnCapture": "Capturar este quadro",
  "labelWorkingSize": "Tamanho de trabalho",
  "extractSummary": "{0} quadros a {1}×{2}. Daqui em diante o GIF só pode diminuir.",
  "btnExtract": "Extrair os quadros",
  "btnExtractAgain": "Extrair de novo",
  "waitingHint": "Ajuste o trecho e aperte o botão. Até lá nada é executado.",
  "btnPlay": "Reproduzir",
  "btnPause": "Pausar",
  "btnPrevFrame": "Quadro anterior",
  "btnNextFrame": "Próximo quadro",
  "btnUndo": "Desfazer",
  "btnRedo": "Refazer",
  "frameSummary": "{0} quadros · {1} fps reais",
  "btnSelectAll": "Selecionar tudo",
  "btnSelectNone": "Limpar a seleção",
  "btnDeleteSelected": "Excluir {0}",
  "btnKeepSelected": "Manter apenas estes",
  "btnReverse": "Inverter",
  "btnPingPong": "Ida e volta",
  "btnHalve": "Descartar um a cada dois",
  "btnAddImages": "Adicionar imagens",
  "btnResetDelays": "Redefinir o ritmo",
  "delayHint": "O GIF guarda as esperas em centésimos de segundo, então o valor se ajusta aos 10 ms mais próximos e nunca fica abaixo de 20.",
  "outputTitle": "Saída",
  "qualityCustom": "Personalizada",
  "labelDiff": "Reaproveitar os pixels que não mudam",
  "diffHint": "Grava só o que se moveu entre quadros. A maior economia em gravações de tela.",
  "showAdvanced": "Ajustar os detalhes",
  "hideAdvanced": "Ocultar os detalhes",
  "labelColors": "Tamanho da paleta",
  "labelDither": "Pontilhado",
  "ditherHint": "Troca um pouco de ruído pelas faixas que uma paleta chapada deixa nos degradês.",
  "labelDitherStrength": "Intensidade do pontilhado",
  "labelTolerance": "Tolerância por pixel",
  "labelAlpha": "Manter a transparência",
  "alphaHint": "Leva os pixels transparentes para o alfa de 1 bit do GIF. Não pode ser combinado com o reaproveitamento de pixels.",
  "labelBackground": "Fundo",
  "labelFit": "Quando os formatos não batem",
  "fitContain": "Encaixar com margem",
  "fitCover": "Preencher e cortar",
  "fitStretch": "Esticar",
  "labelLoop": "Repetir para sempre",
  "loopHint": "Desligue para reproduzir um número fixo de vezes e parar no último quadro.",
  "labelLoopCount": "Reproduções",
  "btnCancel": "Cancelar",
  "phaseRaster": "Preparando os quadros…",
  "phasePalette": "Montando a paleta…",
  "resultTitle": "Resultado",
  "statSize": "Peso",
  "statFrames": "Quadros",
  "statSizePx": "Dimensões",
  "statColors": "Cores",
  "statReuse": "Pixels reaproveitados",
  "statTime": "Codificado em",
  "statFps": "Taxa real de quadros",
  "statPerFrame": "Por quadro",
  "btnCopy": "Copiar",
  "dismissLabel": "Fechar",
  "errorVideo": "Este navegador não consegue decodificar esse vídeo. Tente MP4 (H.264) ou WebM.",
  "errorImages": "Pelo menos uma dessas imagens não pôde ser decodificada.",
  "errorExtract": "Não foi possível ler os quadros. O vídeo pode usar um codec que este navegador só suporta pela metade.",
  "errorEncode": "A codificação falhou. Tente com menos quadros ou uma largura menor.",
  "errorClipboard": "Seu navegador bloqueou a área de transferência. Baixe o arquivo em vez disso.",
  "errorTooManyFrames": "Parado em {0} quadros — acima disso o GIF não é o formato certo.",
  "stageSource": "Quadro de origem",
  "stageResult": "GIF codificado",
  "stageHint": "A roda dá zoom no cursor e arrastar desloca.",
  "stageHintCompare": "A roda dá zoom no cursor e arrastar desloca. Segure Alt ou o botão direito para ver a origem sob o GIF.",
  "zoomIn": "Aproximar",
  "zoomOut": "Afastar",
  "zoomReset": "Redefinir a vista",
  "stripHint": "Arraste pela tira para selecionar quadros. Segure Alt ou use o botão direito para desmarcar.",
  "shortcutsTitle": "Atalhos",
  "shortcuts": [
    {
      "keys": "Espaço",
      "label": "reproduzir / pausar"
    },
    {
      "keys": "← →",
      "label": "avançar um quadro"
    },
    {
      "keys": "Del",
      "label": "excluir a seleção"
    },
    {
      "keys": "A / D",
      "label": "selecionar tudo / nada"
    },
    {
      "keys": "Ctrl+Z",
      "label": "desfazer"
    },
    {
      "keys": "Enter",
      "label": "codificar"
    }
  ],
  "nextStepTitle": "Continue daqui",
  "nextStepHint": "Envia o quadro exibido como PNG, sem reenviar nada",
  "nextCrop": "Recortar",
  "nextCompress": "Comprimir",
  "nextCutout": "Tirar o fundo",
  "nextWatermark": "Colocar marca d’água",
  "nextMeme": "Virar meme",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Solte o arquivo",
  "step1Text": "Um vídeo ou um monte de imagens. Nada é enviado e nada começa sozinho.",
  "step2Title": "Escolha o trecho",
  "step2Text": "Marque o início, o fim e a taxa de quadros e extraia — ou pegue os quadros um a um, à mão.",
  "step3Title": "Edite a linha do tempo",
  "step3Text": "Apague quadros, inverta a ordem, segure um por mais tempo e ajuste cores e pontilhado.",
  "step4Title": "Codifique e confira",
  "step4Text": "Segure Alt sobre a prévia para comparar o GIF com a origem e depois baixe ou mande para outra ferramenta.",
  "features": [
    {
      "title": "Uma paleta para o clipe inteiro",
      "text": "As cores são escolhidas por corte mediano sobre todos os quadros de uma vez, então nada muda de tom no meio do laço."
    },
    {
      "title": "Só o que se moveu é gravado",
      "text": "Os pixels que um quadro compartilha com o anterior são herdados em vez de recodificados. Numa gravação de tela isso é quase o arquivo todo."
    },
    {
      "title": "Pontilhado que acaba com as faixas",
      "text": "Difusão Floyd–Steinberg em serpentina, com a intensidade num controle, para os degradês continuarem limpos até com 64 cores."
    },
    {
      "title": "Uma linha do tempo editável",
      "text": "Apague quadros, inverta a sequência, faça um palíndromo, segure um único quadro. Desfazer não custa nada: guarda identificadores, não bitmaps."
    },
    {
      "title": "Codificado em todos os seus núcleos",
      "text": "A animação é dividida entre vários web workers, então a aba continua utilizável e a barra de progresso conta quadros de verdade."
    },
    {
      "title": "Nada sai da aba",
      "text": "O decodificador, a paleta e o compressor são JavaScript rodando na sua máquina. Sem upload e sem modelo baixado de um CDN."
    },
    {
      "title": "Encadeado com o resto da suíte",
      "text": "Passe o quadro exibido direto para recortar, comprimir ou remover o fundo sem baixar antes."
    }
  ],
  "seoKeywordsTitle": "Buscas relacionadas",
  "seoKeywords": [
    "vídeo para gif",
    "criar gif",
    "imagens para gif",
    "mp4 para gif",
    "comprimir gif",
    "gif animado",
    "conversor de gif grátis",
    "editor de gif"
  ]
};
