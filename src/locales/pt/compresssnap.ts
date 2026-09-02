export default {
  "resetHint": "Começar de novo",
  "title": "CompressSnap",
  "badge": "Compressão de imagem",
  "description": "Comprima JPEG, PNG, WebP, AVIF e HEIC no seu navegador — na qualidade que escolher ou no tamanho que precisa cumprir — e veja exatamente quanto custou.",
  "seo_title": "CompressSnap | Comprime imagens para um tamanho exato",
  "seo_description": "Comprima e redimensione imagens JPEG, PNG, WebP, AVIF, HEIC e TIFF. Cumpra um limite em kilobytes, reduza a paleta de um PNG, converta entre formatos e veja a perda de qualidade SSIM medida em cada arquivo. Roda fora da thread principal e não envia nada.",
  "dropzonePrompt": "Solte imagens aqui, ou clique para escolher",
  "dropzoneSubtitle": "JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF e o HEIC do iPhone. Imagens muito grandes são limitadas ao que um canvas de navegador aguenta.",
  "rejectedFiles": "{n} arquivo(s) não eram imagens e ficaram de fora.",
  "compressBtn": "Comprimir {n}",
  "recompressBtn": "As opções mudaram — rode de novo",
  "downloadBtn": "Baixar",
  "downloadAllBtn": "Baixar Tudo (ZIP)",
  "clearBtn": "Limpar Tudo",
  "removeBtn": "Remover",
  "closeBtn": "Fechar",
  "statusQueued": "na fila",
  "statusDecoding": "decodificando…",
  "statusCompressing": "comprimindo…",
  "statusSkipped": "já é menor do que conseguiríamos deixar",
  "statusError": "falhou",
  "workerOn": "fora da thread principal",
  "workerOff": "thread principal",
  "workerHint": "Onde a codificação acontece. Fora da thread principal a página continua respondendo durante o lote.",
  "attemptsHint": "Codificações necessárias para caber no limite",
  "originalSize": "Tamanho original",
  "compressedSize": "Tamanho comprimido",
  "savings": "Economizado",
  "avgSsim": "SSIM médio",
  "presetLight": "Leve",
  "presetBalanced": "Equilibrada",
  "presetWeb": "Para a web",
  "presetStrong": "Forte",
  "formatLabel": "Formato de Saída",
  "formatOriginal": "Manter",
  "avifUnsupported": "Este navegador não sabe escrever AVIF, então ele não é oferecido.",
  "qualityLabel": "Qualidade",
  "qualityHint": "Menos qualidade, arquivo menor. A perda medida aparece em cada resultado.",
  "qualityFromBudget": "A qualidade está sendo buscada para caber no limite de tamanho abaixo.",
  "pngColorsLabel": "Cores do PNG",
  "pngColorsAll": "todas",
  "ditherLabel": "Pontilhar os degradês",
  "pngNote": "O PNG não tem ajuste de qualidade — todo codificador ignora. O que o deixa menor é reduzir a paleta, e em arte chapada, capturas e logotipos isso não aparece.",
  "budgetLabel": "Limite de tamanho",
  "budgetToggle": "Deixar cada imagem abaixo de um tamanho",
  "budgetHint": "A qualidade é buscada por bisseção até caber.",
  "budgetPngNote": "Um limite em bytes precisa de uma qualidade para buscar; o PNG não tem. Use a paleta.",
  "resizeModeLabel": "Modo de redimensionamento",
  "resizeNone": "Nenhum",
  "resizeLongEdge": "Lado maior",
  "resizeScale": "Escala",
  "resizeCustom": "Personalizado",
  "longEdgeLabel": "Lado mais longo (px)",
  "longEdgeHint": "Nunca amplia — uma imagem menor fica como está.",
  "scaleLabel": "Escala",
  "widthLabel": "Largura (px)",
  "heightLabel": "Altura (px)",
  "keepAspectLabel": "Manter proporção",
  "measureLabel": "Medir a perda de qualidade (SSIM)",
  "measureHint": "Decodifica o resultado e compara. Custa um pouco de tempo por imagem.",
  "bandIdentical": "Indistinguível",
  "bandExcellent": "Excelente",
  "bandGood": "Boa",
  "bandFair": "Aceitável",
  "bandPoor": "Perda visível",
  "compareBtn": "Visualizar & Comparar",
  "originalLabel": "Original",
  "compressedLabel": "Comprimido",
  "nextStepTitle": "Continuar",
  "nextStepHint": "A imagem viaja com você — sem baixar nem reenviar",
  "nextCrop": "Recortar",
  "nextWatermark": "Colocar marca d'água",
  "nextExif": "Conferir os metadados",
  "nextZip": "Compactar",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Solte as fotos",
  "step1Text": "Cole, escolha ou arraste. Elas entram na fila: nada é codificado até você apertar o botão, então uma pasta com quarenta não trava a aba.",
  "step2Title": "Escolha a troca",
  "step2Text": "Uma qualidade, um tamanho em kilobytes para não passar, um formato, um lado maior no limite. O PNG ganha uma paleta em vez de um controle de qualidade.",
  "step3Title": "Deixe rodar",
  "step3Text": "A codificação acontece fora da thread principal, então a página continua respondendo enquanto o lote avança.",
  "step4Title": "Leve os arquivos",
  "step4Text": "Um a um, todos em um ZIP, ou direto para a próxima ferramenta sem baixar nada.",
  "features": [
    {
      "title": "Codifica fora da thread principal",
      "text": "Um Web Worker com OffscreenCanvas faz o trabalho e os bitmaps são transferidos em vez de copiados, então um lote de fotos de celular não trava mais a aba em que roda."
    },
    {
      "title": "Comprimir para um tamanho, não no chute",
      "text": "Dê um limite em kilobytes e ele busca a qualidade por bisseção até o arquivo caber, depois informa em que qualidade parou e quantas tentativas levou."
    },
    {
      "title": "A perda é um número",
      "text": "Cada resultado é decodificado de volta e comparado com a origem por SSIM, então \"qualidade 70\" deixa de ser sensação e vira 0,981 ao lado do tamanho que isso rendeu."
    },
    {
      "title": "PNG que emagrece de verdade",
      "text": "Redução de paleta por median-cut com pontilhado opcional. É o único controle que um PNG tem — o argumento de qualidade é ignorado por qualquer codificador — e rende em capturas, logotipos e arte chapada. Uma foto salva como PNG se resolve melhor convertendo para JPEG ou WebP, e a ferramenta avisa em vez de devolver um arquivo maior."
    },
    {
      "title": "Os formatos que você tem de verdade",
      "text": "O HEIC do iPhone e o TIFF são convertidos na entrada, AVIF e WebP são escritos na saída quando o navegador consegue, e a rotação do EXIF é aplicada para nada sair deitado."
    },
    {
      "title": "Nada sai da aba",
      "text": "Decodificação, codificação, paleta e medição rodam no seu navegador. Sem API, sem upload, sem conta."
    }
  ],
  "seoHeroTitle": "O compressor de imagens que diz quanto a compressão custou",
  "seoHeroText": "O CompressSnap lê JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF e os HEIC que um iPhone produz, e escreve de volta JPEG, PNG, WebP e AVIF. Ele cumpre um limite em bytes buscando a qualidade que cabe, emagrece PNGs reduzindo a paleta em vez de fingir que um controle de qualidade faz algo, e mede cada resultado contra a origem para que a troca feita fique visível.",
  "seoHeroList": [
    "Sem necessidade de registro",
    "Comprima várias imagens ao mesmo tempo",
    "Converta para WebP, JPG ou PNG"
  ],
  "seoBrowserSpeedTitle": "Medido, não chutado",
  "seoBrowserSpeedText": "Cada arquivo comprimido é decodificado de novo e comparado com o que entrou. O número é SSIM, a medida que acompanha o que as pessoas realmente notam, e fica ao lado do tamanho para que os dois possam ser pesados um contra o outro.",
  "seoSecondaryTitle": "Por que comprimir suas imagens?",
  "seoUseCaseTitle": "Os casos chatos, resolvidos",
  "seoUseCaseText": "Um HEIC recém-saído de um iPhone, uma foto vertical cuja rotação mora numa etiqueta EXIF, uma captura PNG que engorda ao passar por JPEG, um quadro de 48 megapixels que não cabe num canvas: todos são o caso normal, e cada um é convertido, girado, marcado ou limitado em vez de falhar em silêncio.",
  "seoPrivacyTitle": "Inteiramente no seu navegador",
  "seoPrivacyText": "Não existe API por trás desta página. Os decodificadores, o codificador, a redução de paleta e a medição de qualidade são JavaScript rodando na sua aba, então a foto de um cliente ainda não publicada nunca sai da sua máquina.",
  "seoKeywordsTitle": "Palavras-chave",
  "seoKeywords": [
    "compressor de imagens",
    "comprimir jpeg online",
    "comprimir png",
    "converter para webp",
    "converter para avif",
    "heic para jpg",
    "comprimir imagem para 200kb",
    "reduzir tamanho de imagem",
    "compressão em lote",
    "redimensionar imagens online",
    "reduzir paleta png",
    "qualidade de imagem ssim"
  ],
  "faqTitle": "Perguntas Frequentes",
  "faq": [
    {
      "question": "Meus dados são enviados para algum servidor?",
      "answer": "Não. Decodificação, codificação, redução de paleta e medição de qualidade rodam dentro do seu navegador. Uma imagem aberta aqui não sai da aba."
    },
    {
      "question": "Por que comprimir um PNG não faz nada?",
      "answer": "Porque o PNG é sem perdas e todo codificador ignora o argumento de qualidade — mostrar um controle de qualidade para PNG, como era antes, enganava. O que o deixa menor é usar menos cores, então para PNG existe um controle de paleta. Em capturas, logotipos e arte chapada, cair para 64 ou 128 cores é invisível e muitas vezes reduz o arquivo pela metade."
    },
    {
      "question": "Dá para comprimir para um tamanho específico?",
      "answer": "Sim. Ligue o limite de tamanho, digite um número em kilobytes, e o codificador busca a qualidade por bisseção até o arquivo caber — no máximo oito tentativas. Cada resultado mostra em que qualidade parou e quantas codificações foram necessárias."
    },
    {
      "question": "O que é SSIM e por que devo me importar?",
      "answer": "Similaridade estrutural: um número de 0 a 1 sobre o quanto a imagem comprimida se parece com a original, ponderado como a visão humana. É medido decodificando o resultado e comparando pixel a pixel. Acima de 0,98 quase ninguém percebe; abaixo de 0,95 os artefatos começam a aparecer. Transforma \"a qualidade 70 está boa?\" em algo que dá para ler na tela."
    },
    {
      "question": "Ele aceita fotos do meu iPhone?",
      "answer": "Sim. HEIC e HEIF são convertidos na entrada, assim como TIFF, e a rotação que o iPhone guarda na etiqueta EXIF é aplicada para uma foto vertical não sair deitada. A versão antiga rejeitava HEIC já no seletor de arquivos."
    },
    {
      "question": "Por que uma das minhas imagens voltou sem mudanças?",
      "answer": "Porque comprimi-la a deixaria maior. Isso acontece principalmente com capturas e gráficos chapados passados por JPEG em qualidade alta. Em vez de entregar um arquivo pior, a ferramenta marca e mantém o original."
    },
    {
      "question": "Os dados EXIF são removidos?",
      "answer": "Sim — recodificar através de um canvas descarta todos os blocos de metadados, incluindo coordenadas GPS e dados da câmera. A única parte que importa visualmente, a etiqueta de orientação, é aplicada aos pixels antes para a imagem ficar em pé."
    },
    {
      "question": "Um lote grande trava a página?",
      "answer": "Não. A codificação roda num Web Worker com OffscreenCanvas e os dados de imagem são transferidos em vez de copiados, então a página continua respondendo enquanto a fila avança. Duas imagens são codificadas por vez, o que é rápido sem manter vários quadros em resolução plena na memória ao mesmo tempo."
    }
  ],
  "footerTagline": "Comprima, redimensione e converta imagens no seu navegador, com a perda de qualidade medida.",
  "footerCredit": "Parte da suíte oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "E-mail copiado para a área de transferência!",
  "contactForIdeas": "Contato para ideias e feedback:",
  "presetsLabel": "Predefinições rápidas",
  "presetExtreme": "Extrema",
  "summaryTitle": "Resultado estimado",
  "scaleHint": "Reduz a largura e a altura da imagem.",
  "followGlobalBtn": "Usar ajustes globais",
  "statusDone": "Concluído",
  "individualSettings": "Configurações Individuais",
  "globalSettings": "Configurações Globais",
  "originalFormat": "Formato Original",
  "compareTitle": "Comparação Visual Antes e Depois",
  "privacyPolicy": "Política de Privacidade",
  "termsOfService": "Termos de Serviço",
  "cookiePolicy": "Política de Cookies",
  "privacyContent": "Sua privacidade é importante para nós.\n\nColetamos apenas as informações necessárias para fornecer nosso serviço. Isso inclui dados técnicos sobre seu navegador e dispositivo para garantir que a ferramenta funcione corretamente.\n\nNunca armazenamos, rastreamos ou analisamos suas imagens. Todo o processamento ocorre localmente no seu navegador, garantindo que seus dados nunca saiam do seu dispositivo.",
  "termsContent": "Ao usar o CompressSnap, você concorda com estes termos.\n\n1. Esta ferramenta é fornecida \"como está\", sem quaisquer garantias.\n2. Não somos responsáveis por qualquer perda de dados ou problemas decorrentes do uso desta ferramenta.\n3. Você é responsável pelo conteúdo que processa usando esta ferramenta.\n4. Reservamo-nos o direito de modificar estes termos a qualquer momento.",
  "cookiesContent": "Usamos cookies para melhorar sua experiência.\n\n1. Cookies Essenciais: Necessários para o funcionamento básico do site.\n2. Cookies de Preferência: Usados para lembrar seu idioma e configurações de consentimento de cookies.\n\nVocê pode gerenciar ou desativar os cookies através das configurações do seu navegador a qualquer momento.",
  "contact": "Contato"
};
