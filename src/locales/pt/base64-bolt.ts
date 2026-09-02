export default {
  "resetHint": "Começar de novo",
  "title": "Base64Bolt",
  "seo_title": "Base64Bolt | Codificador e decodificador Base64 com inspetor de bytes",
  "seo_description": "Codifique texto ou qualquer ficheiro para Base64, decodifique um payload e recupere o ficheiro real, leia os bytes em hexadecimal, use o alfabeto seguro para URL, retire o padding e quebre as linhas às 76 colunas. Grátis e inteiramente no seu navegador.",
  "seoHeroTitle": "Base64 Encoder, Decoder & Inspector",
  "badge": "Kit Base64",
  "description": "Codifique qualquer ficheiro — não apenas imagens — com o alfabeto, o padding e a largura de linha que quem vai ler realmente espera. Decodifique um payload e descubra o que ele é de facto: o formato lido dos seus bytes mágicos, os primeiros bytes em hexadecimal, o tamanho depois do gzip e o SHA-256.",
  "heroPoints": [
    "Qualquer tipo de ficheiro",
    "Alfabeto seguro para URL",
    "Inspetor hexadecimal"
  ],

  "tab_text": "Texto",
  "tab_file": "Ficheiro para Base64",
  "tab_decode": "Base64 para ficheiro",

  "optionsTitle": "Saída",
  "alphabetStandard": "A-Z a-z 0-9 + /",
  "alphabetUrl": "Seguro para URL - _",
  "alphabetStandardHint": "O alfabeto padrão do RFC 4648: + e / para os dois últimos valores.",
  "alphabetUrlHint": "O alfabeto seguro para URL: - e _ em vez de + e /, para o payload atravessar intacto uma query string, um nome de ficheiro ou um JWT.",
  "padding": "Padding =",
  "paddingHint": "A cauda de = completa a saída até um múltiplo de quatro caracteres. Retirá-lo é legal e é o que os JWT fazem, mas alguns parsers estritos continuam a exigi-lo.",
  "wrap": "Quebrar",
  "wrapNone": "não",
  "crlfHint": "Quebra as linhas com CRLF em vez de LF, que é o que MIME e PEM especificam de facto.",
  "charset": "Conjunto de caracteres",
  "engineNative": "Motor nativo",
  "engineFallback": "Motor de compatibilidade",
  "engineNativeHint": "O seu navegador converte os bytes ele mesmo, numa única chamada a nível de motor.",
  "engineFallbackHint": "O seu navegador não tem conversão Base64 nativa, por isso o payload é processado em blocos de 32 KB. Mesmo resultado, um pouco mais lento.",

  "mode_encode": "Codificar",
  "mode_decode": "Decodificar",
  "altHint": "Mantenha Alt para ver a operação inversa",
  "holdCompare": "Mantenha premido para ver a sua entrada",
  "undo": "Desfazer",
  "redo": "Refazer",
  "loadSample": "Carregar um exemplo",
  "button_clear": "Limpar tudo",
  "cancel": "Parar",
  "runBtn": "Executar",
  "encodeBtn": "Codificar para Base64",
  "decodeBtn": "Decodificar",
  "downloadTxt": "Descarregar como .txt",
  "openTextFile": "Abrir um .txt / .b64",
  "copied": "Copiado!",
  "copyFailed": "O seu navegador bloqueou o acesso à área de transferência",
  "tooltip_copy": "Copiar para a área de transferência",
  "chars": "car.",

  "label_input": "Texto simples",
  "label_base64_input": "Cadeia Base64",
  "label_base64_output": "Base64",
  "label_decoded_output": "Texto decodificado",
  "label_showing_input": "A sua entrada",
  "label_stage_file": "Escolha um ficheiro",
  "label_snippet": "Pronto a colar",
  "label_decoded": "O que saiu",
  "placeholder_encode": "Escreva ou cole o texto a codificar…",
  "placeholder_decode": "Cole uma cadeia Base64 ou um URL data:…",
  "placeholder_decode_file": "Cole um payload Base64 ou um URL data: completo…",
  "placeholder_output": "O resultado aparece aqui…",
  "placeholder_file_output": "Prepare um ficheiro e prima Codificar para obter o snippet.",
  "placeholder_decoded": "Cole um payload para ver o que ele é na realidade.",
  "previewTruncated": "A mostrar os primeiros {0} caracteres. Copiar e descarregar usam o resultado completo.",
  "bigInputHint": "Esta entrada é grande, por isso não é recodificada a cada tecla. Prima Executar quando quiser.",

  "file_drag": "Largue aqui qualquer ficheiro, ou clique para o escolher",
  "file_formats": "Qualquer tipo de ficheiro: imagens, tipos de letra, PDF, WASM. Até {0}.",
  "willProduce": "vai produzir ~{0} caracteres",
  "nothingAutomatic": "Ainda não foi lido nada. Escolha as suas opções e prima Codificar.",
  "optionsChanged": "As opções mudaram desde esta execução. Prima Codificar outra vez.",

  "statBytes": "Payload",
  "statChars": "Base64",
  "statOverhead": "Tamanho vs origem",
  "statGzip": "Com gzip",
  "statFormat": "Detetado",
  "statAlphabet": "Alfabeto",
  "statRoundTrip": "Ida e volta",
  "statTime": "Levou",
  "roundTripOk": "Reversível",
  "roundTripFail": "Não reversível",

  "sha256Title": "SHA-256 dos bytes originais",
  "sha256TitleDecoded": "SHA-256 dos bytes decodificados",
  "sha256Hint": "Compare-o depois de decodificar noutro sítio para provar que nada se perdeu no caminho.",
  "hexTitle": "Primeiros bytes",
  "hexEmpty": "Ainda não há bytes.",
  "hexTruncated": "A mostrar os primeiros {0} de {1}.",
  "mimeOverrideTitle": "Tratar como",
  "mimeMismatch": "O URL data: diz {0}, mas os bytes dizem {1}.",
  "noPreview": "Este formato não tem pré-visualização no navegador. Descarregue-o ou envie-o para outra ferramenta.",

  "issuesTitle": "O que detetámos",
  "issue_invalid-char": "O caráter {0} na posição {1} não faz parte do alfabeto Base64; foi ignorado.",
  "issue_whitespace-stripped": "Foram removidas {0} quebras de linha ou espaços antes de decodificar.",
  "issue_padding-added": "Faltava ao payload um grupo completo, por isso assumiram-se {0} caráter(es) de padding.",
  "issue_non-canonical": "O último caráter ({0}) leva bits que são descartados. Nenhum codificador gera isso, por isso a cadeia está provavelmente truncada ou editada à mão.",
  "issue_mixed-alphabet": "A entrada mistura os dois alfabetos (+ / e - _). Foi decodificada como Base64 padrão.",
  "issue_data-url": "Foi removido um prefixo de URL data: que declarava {0} antes de decodificar.",
  "issue_lost_surrogate": "{0} surrogate(s) sem par não podiam ser representados em UTF-8 e foram substituídos.",

  "error_bad-length": "A este payload sobra um caráter em relação a um grupo completo de quatro. Seis bits soltos não são um byte, por isso o final não pode ser recuperado: a cadeia está truncada.",
  "error_undecodable": "Estes caracteres não formam um Base64 válido.",
  "error_not-base64-data-url": "Esse URL data: está codificado com percentagens, não em Base64, por isso aqui não há nada para decodificar.",
  "error_not-utf8": "O Base64 é válido, mas os bytes por trás não são texto UTF-8 — são dados binários. Use o separador Base64 para ficheiro para ver o que são, ou mude o conjunto de caracteres para Latin-1.",
  "error_too-large": "Este payload é demasiado grande para o seu navegador o manter como uma única cadeia.",
  "error_crashed": "O codificador falhou com este ficheiro.",
  "error_no-input": "Não há nada preparado para codificar.",
  "errorTooBig": "Esse ficheiro tem {0}; o limite é {1}.",

  "nextStepTitle": "Continue",
  "nextStepHint": "O resultado viaja consigo — sem descarregar nem voltar a enviar",
  "nextCompress": "Comprimir",
  "nextCrop": "Recortar",
  "nextFavicon": "Fazer um favicon",
  "nextHash": "Obter o hash",
  "nextJson": "Abrir o JSON",
  "nextUrl": "Codificar para URL",
  "nextDiff": "Comparar duas versões",
  "nextCodecard": "Transformar em imagem",

  "howItWorksTitle": "Como funciona",
  "step1Title": "Traga o payload",
  "step1Text": "Escreva-o, cole-o, largue um ficheiro de qualquer tipo, ou deixe outra ferramenta da suite passá-lo. Largar um ficheiro ainda não lê nada.",
  "step2Title": "Escolha como sai",
  "step2Text": "Alfabeto padrão ou seguro para URL, padding sim ou não, quebrado às 64, 76 ou 100 colunas com LF ou CRLF. São precisamente as opções em que os parsers reais discordam.",
  "step3Title": "Olhe para os bytes",
  "step3Text": "O formato é lido dos números mágicos, não adivinhado pelo nome. Tem o despejo hexadecimal, o tamanho com gzip, o SHA-256 e uma verificação de reversibilidade.",
  "step4Title": "Leve-o",
  "step4Text": "Copie a cadeia crua, um URL data:, uma regra CSS, uma etiqueta img, um corpo JSON ou um bloco PEM — ou envie o ficheiro decodificado direto para outra ferramenta.",

  "features": [
    {
      "title": "Três bytes, quatro caracteres",
      "text": "Base64 custa sempre 33% mais do que os bytes que transporta, e a ferramenta mostra os dois números mais o tamanho com gzip, porque em payloads parecidos com texto o gzip recupera quase tudo e num PNG quase nada."
    },
    {
      "title": "Alfabeto seguro para URL",
      "text": "Mude para - e _ e o payload sobrevive a uma query string, a um nome de ficheiro ou a um JWT sem nada para escapar. O padding também pode ser retirado, que é o que os formatos de token esperam."
    },
    {
      "title": "Inspetor hexadecimal",
      "text": "Veja os bytes reais, dezasseis por linha, com o ASCII imprimível ao lado. O número mágico fica destacado, por isso um ficheiro truncado denuncia-se de imediato."
    },
    {
      "title": "Diz-lhe o que se partiu",
      "text": "Que caráter não está no alfabeto e em que posição, se faltava padding, se o último caráter leva bits que são descartados. Não um «Base64 inválido» seco."
    },
    {
      "title": "Formato lido dos bytes",
      "text": "PNG, JPEG, GIF, WebP, AVIF, HEIC, PDF, ZIP e os formatos Office que vão lá dentro, WOFF2, MP4, WASM, SQLite e mais, identificados pela assinatura — para que o download leve a extensão certa."
    },
    {
      "title": "Ficheiros grandes não travam",
      "text": "Os ficheiros são consumidos em blocos de 3 MB num fio separado, com barra de progresso real e um botão Parar que funciona. O separador continua a responder enquanto se converte um payload de 200 MB."
    },
    {
      "title": "Mensurável, não apenas produzido",
      "text": "Cada execução traz o tamanho com gzip e o SHA-256, calculados sobre os mesmos bytes. É assim que decide se incorporar ganha a um segundo pedido, e assim que prova que a ida e volta não perdeu nada."
    },
    {
      "title": "Verificação de reversibilidade",
      "text": "Cada codificação de texto é imediatamente decodificada outra vez e comparada byte a byte, por isso uma combinação de alfabeto e padding que o seu consumidor rejeitaria é avisada antes de a colar."
    }
  ],

  "seoSecondaryTitle": "O payload, não só a cadeia",
  "seoHeroText": "A maioria das ferramentas Base64 dá-lhe uma cadeia e fica por aí. Esta guarda os bytes: identifica o formato pela assinatura, despeja o primeiro kilobyte em hexadecimal, mede o que o payload custa realmente depois do gzip, faz-lhe o hash para poder provar a ida e volta, e diz-lhe exatamente que caráter em que posição partiu um payload em vez de culpar o conjunto. Ao codificar aceita qualquer ficheiro — um tipo de letra, um PDF, um módulo WebAssembly — porque Base64 nunca foi só sobre imagens.",
  "seoHeroList": [
    "Alfabetos padrão e seguro para URL",
    "Padding opcional, quebra às 64/76/100 colunas",
    "Deteção de formato por bytes mágicos",
    "Tamanho com gzip e SHA-256"
  ],
  "seoBrowserSpeedTitle": "Nada sai do seu navegador",
  "seoBrowserSpeedText": "Codificar, decodificar, detetar o formato, o despejo hexadecimal, a medição com gzip e o SHA-256 são todos APIs nativas do navegador a correr no seu próprio separador, num fio separado para tudo o que é grande. Não há envio, nem pedido, nem nada para registar — e isso importa, porque os payloads que as pessoas colam numa ferramenta Base64 são rotineiramente chaves privadas, tokens de sessão e documentos internos.",
  "seoUseCaseTitle": "Feita para os payloads que chegam sem etiqueta",
  "seoUseCaseText": "Um blob saído de uma coluna de base de dados sem nenhum MIME anotado em parte alguma. Um segmento de JWT que não decodifica porque usa o alfabeto seguro para URL e não tem padding. Um SVG incorporado numa folha de estilos que aparece como imagem partida. Um URL data: que diz image/png quando os bytes são claramente um JPEG. Um certificado quebrado às 64 colunas que um parser estrito rejeita. O Base64Bolt lê todos, diz o que os bytes são de facto, e deixa-o levar o resultado como ficheiro com a extensão certa.",
  "seoPrivacyTitle": "Sem contas, sem limites, sem envios",
  "seoPrivacyText": "Não há registo, nem quota diária, nem um plano pago a esconder metade útil da ferramenta. Os ficheiros que abre são lidos localmente e nunca transmitidos; o separador esquece tudo quando o fecha.",
  "seoKeywordsTitle": "Pesquisas relacionadas",
  "seoKeywords": [
    "codificar base64",
    "decodificar base64",
    "ficheiro para base64",
    "base64 para ficheiro",
    "conversor data url",
    "decodificar base64url",
    "imagem para base64",
    "base64 para imagem",
    "decodificar base64 online",
    "visualizador hexadecimal base64"
  ],

  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "Porque é que o meu JWT ou token falha noutros sítios e aqui funciona?",
      "answer": "Porque usa o alfabeto seguro para URL — hífen e underscore em vez de mais e barra — e normalmente tem o padding retirado. Um decodificador que só conhece o alfabeto padrão rebenta no primeiro hífen. O Base64Bolt deteta que alfabeto a entrada usa, restaura o padding que falta, e avisa-o das duas coisas."
    },
    {
      "question": "O Base64 torna o meu ficheiro maior?",
      "answer": "Sempre, exatamente um terço: cada três bytes tornam-se quatro caracteres, mais até dois de padding. Se isso lhe custa algo depende da compressão, e é por isso que a ferramenta mostra o tamanho com gzip ao lado do bruto. Incorporar um SVG pequeno normalmente ganha; incorporar um JPEG grande normalmente perde, porque já está comprimido e o Base64 desfaz parte disso."
    },
    {
      "question": "Posso codificar algo que não seja uma imagem?",
      "answer": "Sim, qualquer ficheiro. Tipos de letra para uma regra @font-face, um PDF para um link de download, um módulo WebAssembly, um ZIP, um clip de áudio. A antiga limitação a imagens era arbitrária: ao Base64 é indiferente o que os bytes significam."
    },
    {
      "question": "O que significa «o último caráter leva bits que são descartados»?",
      "answer": "Cada caráter Base64 guarda seis bits, mas o último grupo de um payload muitas vezes precisa de menos. QQ== e QR== decodificam ambos para o único byte 0x41, porque os últimos quatro bits do R são atirados fora. Nenhum codificador produz a segunda forma, por isso vê-la significa que a cadeia foi truncada ou editada à mão — vale a pena saber antes de confiar no resultado."
    },
    {
      "question": "Porque é que ao decodificar diz que os bytes não são UTF-8?",
      "answer": "Porque não são texto. O Base64 transporta bytes, e muitíssimos payloads são imagens, arquivos comprimidos ou chaves. O comportamento antigo era dizer «Base64 inválido», o que era simplesmente falso: o Base64 estava perfeito. Mude para o separador Base64 para ficheiro e a ferramenta identifica o formato e deixa-o descarregá-lo."
    },
    {
      "question": "Devo quebrar a saída às 76 colunas?",
      "answer": "Só se algo mais adiante o esperar. Os corpos MIME e os blocos PEM são quebrados por especificação — PEM às 64 colunas, MIME às 76 — e alguns parsers de correio rejeitam uma única linha enorme. Para um URL data: numa folha de estilos ou num campo JSON, deixe a quebra desativada."
    },
    {
      "question": "É enviado algo para um servidor?",
      "answer": "Não. Cada passo é uma API nativa do navegador a correr no seu separador, por isso a ferramenta continua a funcionar sem ligação depois de a página carregar. Nada é enviado, guardado remotamente ou registado."
    }
  ],

  "footerTagline": "Codifique qualquer ficheiro para Base64 e decodifique qualquer payload de volta: alfabeto seguro para URL, padding opcional, inspetor hexadecimal e deteção de formato por bytes mágicos, tudo no seu navegador.",
  "footerCredit": "Parte da suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contacte para ideias e comentários:"
};
