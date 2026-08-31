export default {
  "title": "MorseFlow",
  "label_text": "Texto",
  "label_morse": "Morse",
  "label_reference": "Referência Morse",
  "button_play": "Reproduzir",
  "button_stop": "Parar",
  "button_reset": "Redefinir",
  "tooltip_copy": "Copiar",
  "tooltip_mute": "Silenciar",
  "tooltip_unmute": "Ativar som",
  "seoPrivacyTitle": "100% Privado e Seguro",
  "seoPrivacyText": "Sem bancos de dados, rastreamento ou envios de rede. Seus dados residem estritamente na memória local e desaparecem ao fechar a aba.",
  "faqTitle": "Perguntas Frequentes",
  "footerCredit": "Parte do conjunto oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contato para ideias e comentários:",
  "heroBadge": "Manipulador e leitor",
  "badgeSource": "origem",
  "placeholderText": "SOS AJUDA",
  "issuesTitle": "{n} caracteres não têm equivalente em morse; aparecem como {mark}:",
  "labelTimeline": "Linha de tempo",
  "wpmShort": "ppm",
  "badgeFarnsworth": "farnsworth",
  "labelCharSpeed": "Velocidade de carácter",
  "labelOverall": "Velocidade global",
  "labelTone": "Tom (Hz)",
  "labelWave": "Onda",
  "waveSine": "Senoidal",
  "waveSquare": "Quadrada",
  "waveTriangle": "Triangular",
  "waveSaw": "Dente de serra",
  "buttonWav": "Descarregar como WAV",
  "buttonCopyBoth": "Copiar ambos",
  "tabListen": "Ouvir",
  "listenIntro": "Abra uma gravação ou use o microfone. O tom encontra-se varrendo a banda, o limiar sai da própria gravação e a duração da unidade mede-se pelas séries: aqui nada assume 600 Hz nem 20 ppm.",
  "buttonOpenAudio": "Abrir uma gravação",
  "buttonRecord": "Gravar do microfone",
  "buttonStopRecording": "Parar a gravação",
  "buttonAnalyse": "Descodificar",
  "parkedHint": "em espera — ainda não se analisou nada",
  "heardTone": "Tom",
  "heardUnit": "Unidade",
  "heardWpm": "Velocidade",
  "heardConfidence": "Separação",
  "listenFail_no-audio": "Essa gravação é demasiado curta para se ler.",
  "listenFail_no-tone": "Não se encontrou um tom estável entre 250 e 1600 Hz.",
  "listenFail_no-elements": "Encontrou-se o tom, mas as marcas e os espaços não se separam com clareza.",
  "listenFailGeneric": "Dessa gravação não saiu nada legível.",
  "ref_letters": "Letras",
  "ref_digits": "Algarismos",
  "ref_punctuation": "Pontuação",
  "ref_accented": "Acentuadas",
  "ref_prosigns": "Prosinais",
  "errorAudio": "Este navegador não deu à página um contexto de áudio.",
  "errorRender": "Este navegador não consegue renderizar áudio offline.",
  "errorTooLarge": "Essa gravação é demasiado grande.",
  "errorDecodeAudio": "Esse ficheiro não pôde ser descodificado como áudio.",
  "errorMic": "O microfone não estava disponível.",
  "errorRead": "Não foi possível ler esse ficheiro.",
  "errorFormat": "Largue um ficheiro de texto ou uma gravação.",
  "errorClipboard": "A área de transferência não está disponível nesta página.",
  "handoffReceived": "Recebido de {tool}.",
  "nextStepTitle": "Continue",
  "nextStepHint": "A mensagem viaja consigo — sem descarregar nem voltar a enviar",
  "nextAudio": "Edite o áudio",
  "nextBinary": "Converta para binário",
  "nextQr": "Faça um QR",
  "nextWordflow": "Conte o texto",
  "nextBase64": "Codifique-o",
  "seo_description": "Traduza texto para morse e de volta, ouça-o a qualquer velocidade com espaçamento Farnsworth, exporte como WAV e descodifique uma gravação de volta a texto — tudo no seu navegador, sem enviar nada.",
  "seoHeroText": "Um manipulador e um recetor na mesma página: o alfabeto ITU completo com pontuação e prosinais, temporização PARIS padrão com espaçamento Farnsworth, e um descodificador que lê o morse de uma gravação.",
  "heroText": "Escreva de qualquer um dos lados e o outro acompanha. Nada se perde sem aviso, a temporização é a do padrão, e uma gravação pode fazer o caminho inverso: tom, velocidade e limiar medidos, não supostos.",
  "seoHeroList": [
    "Pontuação e prosinais",
    "Temporização PARIS",
    "Espaçamento Farnsworth",
    "Descodifica uma gravação"
  ],
  "seoSecondaryTitle": "Nos dois sentidos, e nenhum a olho",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Escreva",
  "step1Text": "Qualquer uma das caixas comanda a outra. Pontuação, letras acentuadas e prosinais como <SK> estão na tabela, e o que realmente não tem código é marcado em vez de apagado.",
  "step2Title": "Dê forma ao envio",
  "step2Text": "Velocidade de carácter e velocidade global são comandos separados: é isso que Farnsworth significa. O tom e a onda também são seus, e a linha de tempo mostra cada ponto, traço e intervalo na duração real antes de carregar em reproduzir.",
  "step3Title": "Ou deixe-o ouvir",
  "step3Text": "Abra uma gravação ou use o microfone. Varre à procura da portadora, aplica o limiar de Otsu à envolvente, agrupa as séries para achar a unidade, e reporta o tom, a velocidade e com que limpeza separou.",
  "step4Title": "Leve consigo",
  "step4Text": "Copie qualquer um dos lados, descarregue o tom como WAV renderizado offline em plena qualidade, ou passe a mensagem direta a outra ferramenta da suite.",
  "features": [
    {
      "title": "O alfabeto inteiro",
      "text": "Letras, algarismos, os dezoito sinais de pontuação, as letras acentuadas nacionais e os prosinais mesmo usados. O que não tem código é assinalado em vez de apagado em silêncio."
    },
    {
      "title": "Um oscilador, uma envolvente",
      "text": "A mensagem inteira é um único tom guiado por uma curva de ganho programada com rampas de 5 ms, em vez de um oscilador por ponto. Menos nós, sem estalidos, e um contexto de áudio reutilizado."
    },
    {
      "title": "Sabe ouvir",
      "text": "Aponte-o a uma gravação ou ao microfone. Uma varredura de Goertzel encontra a portadora, Otsu aplica o limiar à envolvente, e agrupar as séries dá a unidade: tom e velocidade medidos, não supostos."
    },
    {
      "title": "Farnsworth como deve ser",
      "text": "Velocidade de carácter e global separadas, com o tempo extra distribuído pelos intervalos na proporção 3:4 que a ARRL define. É assim que se aprende a ouvir letras em vez de contar pontos."
    },
    {
      "title": "Uma linha de tempo legível",
      "text": "Cada ponto, traço e intervalo desenhado na duração real, com o cursor a percorrê-la. Ao passar por cima de um bloco vê quantos milissegundos dura."
    },
    {
      "title": "Exporte o tom",
      "text": "Renderizado offline para um WAV de 16 bits a 44,1 kHz, pronto para um vídeo, uma aula ou um toque, sem o regravar dos altifalantes."
    },
    {
      "title": "Nada é enviado",
      "text": "Traduzir, sintetizar e descodificar acontece tudo neste separador. O fluxo do microfone não sai da página e nenhuma gravação é guardada."
    },
    {
      "title": "Passa a bola ao resto da suite",
      "text": "Envie a mensagem diretamente para o AudioSnap, Binary-Flow, QR Bolt ou WordFlow sem a descarregar e voltar a enviar."
    }
  ],
  "seoBrowserSpeedTitle": "O navegador é o transmissor",
  "seoBrowserSpeedText": "A Web Audio sintetiza o tom, um contexto offline renderiza o WAV, e o decodeAudioData mais um filtro de Goertzel leem uma gravação de volta. Nada disso precisa de servidor, conta ou pedido de rede, e basta fechar o separador para a mensagem e a gravação desaparecerem.",
  "seoUseCaseTitle": "Para o aprender e para o ler",
  "seoUseCaseText": "Aprender morse é ouvir os caracteres a toda a velocidade com ar entre eles, que é precisamente para o que serve o espaçamento Farnsworth; por isso aqui a velocidade de carácter e a global andam separadas. Lê-lo é o outro sentido: um excerto de um filme, um farol gravado de um recetor, um enigma que alguém mandou como nota de voz. Ambos vivem na mesma página, e o segundo diz-lhe o que mediu — o tom em hertz, a unidade em milissegundos, as palavras por minuto resultantes e com que limpeza as marcas se separaram dos espaços — para que uma resposta errada possa ser discutida em vez de apenas estar errada.",
  "seoKeywords": [
    "tradutor de código morse",
    "descodificador morse",
    "texto para morse",
    "áudio morse",
    "temporização farnsworth",
    "morse a partir de áudio",
    "prática de cw",
    "alfabeto morse"
  ],
  "faq": [
    {
      "question": "O meu texto ou a minha gravação são enviados para algum lado?",
      "answer": "Não. A tradução, a síntese do tom, a renderização do WAV e a descodificação do áudio correm dentro do seu navegador. O fluxo do microfone não sai da página e nada fica guardado entre visitas."
    },
    {
      "question": "Que caracteres são suportados?",
      "answer": "O conjunto ITU completo: A–Z, 0–9, dezoito sinais de pontuação, as letras acentuadas nacionais (À, Ä, Ç, É, Ñ, Ö, Ü, ß e companhia) e os prosinais habituais, escritos entre ângulos como <SK>. Um carácter sem equivalente em morse é marcado com # e listado, em vez de desaparecer."
    },
    {
      "question": "Qual é a diferença entre velocidade de carácter e velocidade global?",
      "answer": "É o espaçamento Farnsworth. Os pontos e traços saem à velocidade de carácter que definir, enquanto os intervalos entre letras e palavras são esticados até a mensagem inteira sair à velocidade global. É assim que se aprende a reconhecer uma letra pelo ritmo em vez de contar elementos."
    },
    {
      "question": "Como descodifica uma gravação?",
      "answer": "Varre 250–1600 Hz com um filtro de Goertzel para achar a portadora, mede a magnitude nessa única frequência em janelas de 5 ms para obter uma envolvente, escolhe o limiar pelo método de Otsu, e agrupa as séries resultantes para achar a unidade. Tom, duração da unidade, velocidade e separação entre os dois grupos são todos reportados."
    },
    {
      "question": "O descodificador enganou-se. Porquê?",
      "answer": "Veja o número da separação e o gráfico da envolvente. Uma gravação ruidosa, um sinal a desvanecer ou uma manipulação manual irregular fazem marcas e espaços sobreporem-se, e nesse caso não há limiar que os separe bem. Cortar o excerto para a parte mais limpa costuma resolver."
    },
    {
      "question": "Posso usar o áudio noutro lado?",
      "answer": "Sim. O WAV é renderizado offline a 44,1 kHz, 16 bits, mono, com o tom, a onda e a velocidade que escolheu, por isso entra direto num vídeo ou numa aula."
    }
  ],
  "seoKeywordsTitle": "Pesquisas relacionadas",
  "footerTagline": "Morse nos dois sentidos: enviado, ouvido e medido.",
  "footer_seo_title": "A temporização é o morse todo",
  "footer_seo_paragraph1": "Um ponto e um traço não são tanto dois símbolos como um símbolo em dois comprimentos, e todo o resto do morse é silêncio de três durações prescritas. A palavra padrão PARIS mede cinquenta unidades contando o espaço que a segue, e daí sai o número conhecido: a vinte palavras por minuto a unidade são sessenta milissegundos, um ponto é uma unidade, um traço três, o intervalo dentro de uma letra um, entre letras três e entre palavras sete. Falhe uma delas e o ritmo deixa de ser legível muito antes dos elementos soltos, e por isso um leitor que gasta duas unidades no intervalo entre letras em vez de três soa subtilmente apressado sem chegar a estar claramente errado. Aqui cada duração sai dessa tabela e não de uma constante que soava bem.",
  "footer_seo_paragraph2": "Ler morse de uma gravação é a mesma tabela ao contrário, e a dificuldade é que nenhum dos números se conhece de antemão. O tom pode estar onde o recetor o deixou; a velocidade é a que o operador quis; a fronteira entre \"alto que chegue para ser marca\" e \"fundo\" depende da gravação e não de qualquer constante. Por isso cada um é deduzido: a portadora de uma varredura de Goertzel, o limiar do método de Otsu sobre o histograma da envolvente, e a unidade dos dois grupos em que as séries caem naturalmente, já que um traço vale três pontos e nenhuma mão é irregular ao ponto de apagar essa proporção. Quando a gravação é demasiado suja para esses grupos se separarem, isso aparece como um número de separação baixo, e a resposta honesta é dizê-lo em vez de imprimir um disparate com confiança.",
  "seo_title": "MorseFlow | Tradutor de código morse, reprodutor e descodificador de áudio",
  "seoHeroTitle": "Tradutor de código morse e descodificador de áudio"
};
