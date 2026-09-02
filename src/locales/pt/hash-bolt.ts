export default {
  "resetHint": "Começar de novo",
  "title": "HashBolt",
  "badge": "Checksums e integridade de ficheiros",
  "description": "Calcula MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3 ou CRC-32 de ficheiros de qualquer tamanho ou de texto simples e compara o resultado com o checksum publicado pelo fabricante. O ficheiro é lido aos pedaços dentro do teu navegador e nunca é enviado.",
  "seo_title": "HashBolt | Gerador e verificador online de MD5, SHA-256, SHA-512 e BLAKE3",
  "seo_description": "Gera e verifica checksums de ficheiros no navegador: MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32, xxHash e HMAC. Ficheiros de vários gigabytes, lotes e verificação de SHA256SUMS. Nada é enviado.",
  "modeFile": "Ficheiros",
  "modeText": "Texto",
  "modeCompare": "Comparar",
  "dropTitle": "Larga aqui os teus ficheiros",
  "dropHint": "De qualquer tipo e tamanho, quantos quiseres. Nada é lido até carregares em Calcular.",
  "browseBtn": "Escolher ficheiros",
  "folderBtn": "Pasta inteira",
  "pasteHint": "ou cola com Ctrl+V",
  "queueTitle": "Fila ({count})",
  "clearBtn": "Limpar",
  "removeBtn": "Remover",
  "statusQueued": "à espera",
  "statusCancelled": "parado",
  "staleNotice": "definições alteradas",
  "pendingCount": "faltam {count} por calcular",
  "computeBtn": "Calcular hashes",
  "computeAgainBtn": "Calcular de novo",
  "cancelBtn": "Parar",
  "algoTitle": "Algoritmos",
  "algoNone": "Nenhum selecionado",
  "algoHint": "Marca os que precisares: o ficheiro é lido uma só vez e todos os resumos saem dessa mesma passagem.",
  "groupChecksum": "Checksums e legados",
  "groupSha2": "Família SHA-2",
  "groupModern": "Modernos",
  "brokenTag": "As colisões são viáveis: serve contra corrupção, não contra manipulação",
  "outputTitle": "Saída",
  "formatHex": "Hex",
  "formatBase64": "Base64",
  "formatBase64Url": "Base64URL",
  "uppercaseLabel": "MAIÚSCULAS",
  "groupedLabel": "Agrupado",
  "hmacTitle": "HMAC (hash com chave)",
  "hmacHint": "Assina o conteúdo com um segredo partilhado: sem a chave, o resumo não serve de nada a ninguém.",
  "hmacPlaceholder": "Chave secreta",
  "hmacSkipped": "{algos} não têm modo HMAC e são ignorados.",
  "textLabel": "Texto a hashear",
  "textPlaceholder": "Escreve ou cola o que quiseres — o resumo actualiza-se enquanto escreves.",
  "textHint": "Hashear texto não é o mesmo que hashear um ficheiro que o contém: uma quebra de linha final ou um CRLF do Windows mudam o resultado.",
  "normalizeEolLabel": "Normalizar fins de linha do Windows (CRLF → LF)",
  "compareHint": "Dois hashes, sem ficheiro. Cola o que o fabricante publicou e o que te deram — hex ou Base64, em maiúsculas ou minúsculas.",
  "compareA": "Hash A",
  "compareB": "Hash B",
  "compareEqual": "Idênticos. O mesmo resumo, seja qual for a notação de cada lado.",
  "compareDifferent": "Diferentes. Descrevem conteúdos distintos.",
  "compareInvalid": "Um deles não é um hash em hex nem em Base64.",
  "resultsTitle": "Resumos",
  "resultsEmpty": "Põe um ficheiro na fila, marca os algoritmos que precisas e carrega em Calcular.",
  "resultsEmptyText": "Começa a escrever e os resumos aparecem aqui.",
  "resultsEmptyCompare": "O modo comparar não calcula nada: só te diz se dois resumos são o mesmo valor.",
  "copyBtn": "Copiar",
  "copyAllBtn": "Copiar tudo",
  "downloadSumsBtn": "Descarregar ficheiro SUMS",
  "verifyTitle": "Verificar contra um checksum",
  "verifyPlaceholder": "Cola um hash, ou um ficheiro SHA256SUMS inteiro — as linhas são emparelhadas pelo nome do ficheiro.",
  "verifyHint": "Hex e Base64 funcionam, em qualquer caixa. Um comprimento que nenhum algoritmo marcado produz é assinalado em vez de ser dado como divergência.",
  "verifySummary": "{count} checksum(s) lidos · {ok} verificados · {bad} sem corresponder",
  "verifyMatch": "Corresponde — o mesmo resumo {algo}.",
  "verifyMismatch": "Não corresponde. Este ficheiro não é o que esse checksum descreve.",
  "verifyUnknownLength": "Esse comprimento de checksum não corresponde a nenhum dos algoritmos marcados. Marca o correcto e calcula outra vez.",
  "nextStepTitle": "Continua daqui",
  "nextStepHint": "O mesmo ficheiro vai contigo — sem voltar a enviar",
  "nextZip": "Meter em ZIP",
  "nextCompress": "Comprimir",
  "nextFormat": "Mudar de formato",
  "nextExif": "Apagar metadados",
  "nextCrop": "Recortar",
  "nextPdf": "Dividir ou juntar",
  "nextFrames": "Tirar um fotograma",
  "nextAudio": "Cortar ou converter",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Põe na fila o que queres verificar",
  "step1Text": "Larga ficheiros, escolhe uma pasta inteira, cola um, ou muda para o separador de texto. Ainda não se lê nada.",
  "step2Title": "Escolhe os algoritmos",
  "step2Text": "Um ou uma dúzia. Partilham uma única passagem pelo ficheiro, por isso três resumos custam pouco mais do que um.",
  "step3Title": "Carrega em Calcular",
  "step3Text": "O ficheiro passa aos pedaços por um worker: a barra de progresso é real e uma imagem de 20 GB nunca vai parar à RAM.",
  "step4Title": "Compara com o valor publicado",
  "step4Text": "Cola um hash ou um ficheiro SUMS completo. A comparação é pelo valor, não pela forma como estava escrito.",
  "features": [
    {
      "title": "Lê em fluxo, não engole de uma vez",
      "text": "Os ficheiros são lidos aos pedaços dentro de um worker, por isso a memória mantém-se estável e a barra mede bytes realmente hasheados. Uma ISO de vários gigabytes é trabalho de rotina."
    },
    {
      "title": "Doze resumos, uma só leitura",
      "text": "MD5, SHA-1, SHA-256/384/512, SHA3-256/512, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32 e xxHash64, todos alimentados pela mesma passagem sobre o ficheiro."
    },
    {
      "title": "Uma verificação que se explica",
      "text": "Cola um hash ou uma listagem SHA256SUMS inteira. Compara por valor entre hex e Base64, e um comprimento que não pertence a nenhum algoritmo marcado é identificado como tal em vez de ser dado como falha."
    },
    {
      "title": "Pastas e lotes",
      "text": "Mete cem ficheiros na fila, hasheia-os um a seguir ao outro e exporta um ficheiro SUMS compatível com o coreutils para publicar ao lado da tua descarga."
    },
    {
      "title": "HMAC e todas as notações",
      "text": "Resumos HMAC com chave, saída em hex, Base64 e Base64URL, maiúsculas e vista agrupada. Mudar qualquer uma dessas opções repinta de imediato em vez de reler o ficheiro."
    },
    {
      "title": "Nada é enviado",
      "text": "O motor é WebAssembly embebido na própria página. Sem CDN, sem API, sem envios: desliga a rede depois de carregar e continua a funcionar."
    }
  ],
  "seoHeroTitle": "Verifica uma descarga antes de confiar nela",
  "seoHeroText": "Um checksum é a única forma barata de saber que o instalador que acabaste de descarregar é, byte a byte, o que foi publicado, e não uma transferência truncada ou um espelho trocado. O HashBolt calcula essa impressão digital localmente: os ficheiros atravessam um motor WebAssembly aos pedaços, por isso o tamanho deixa de ser um limite, e cada algoritmo marcado é alimentado pela mesma leitura. Depois colas o valor publicado — um hash solto, uma listagem SHA256SUMS, uma linha ao estilo BSD — e recebes um veredicto que diz também qual foi o algoritmo que correspondeu.",
  "seoHeroList": [
    "Ficheiros de qualquer tamanho",
    "Doze algoritmos numa passagem",
    "Verificação de SHA256SUMS",
    "Funciona offline depois de carregado"
  ],
  "seoBrowserSpeedTitle": "Um motor WebAssembly dentro de um worker",
  "seoBrowserSpeedText": "O cálculo corre fora da thread principal sobre WebAssembly compilado, uma ordem de grandeza mais rápido do que o JavaScript escrito à mão que a maioria das ferramentas online ainda usa para MD5. Como consome o ficheiro como fluxo, o pico de memória é um pedaço e não o ficheiro inteiro, e a interface continua a responder enquanto um arquivo de 4 GB é lido.",
  "seoSecondaryTitle": "O que um checksum prova e o que não prova",
  "seoUseCaseTitle": "Descargas, cópias de segurança e duplicados",
  "seoUseCaseText": "Verifica uma ISO de Linux ou um instalador contra o hash da página oficial. Confirma que um ficheiro copiado para um disco externo chegou intacto. Detecta dois ficheiros iguais com nomes diferentes comparando resumos em vez de os abrir. E gera um ficheiro SUMS para acompanhar a tua própria publicação, para que outros possam fazer o mesmo.",
  "seoPrivacyTitle": "Não pode divulgar aquilo que nunca envia",
  "seoPrivacyText": "Esta ferramenta não tem qualquer ponto de envio e o cálculo não envolve nenhum pedido de rede: o módulo WebAssembly está embebido na página, por isso funciona com a ligação desligada. Os teus ficheiros, o teu texto e qualquer chave HMAC que escrevas ficam no separador e desaparecem quando o fechas.",
  "seoKeywordsTitle": "Palavras-chave",
  "seoKeywords": [
    "Gerador MD5 online",
    "Checksum SHA-256",
    "Verificar hash de ficheiro",
    "Verificador SHA256SUMS",
    "BLAKE3 online",
    "Calculadora CRC-32",
    "Gerador HMAC",
    "Verificar integridade de ficheiros"
  ],
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "O meu ficheiro é enviado para algum lado?",
      "answer": "Não. O motor de hashing é WebAssembly embebido na página e corre num worker dentro do teu navegador. Não há ponto de envio, nem chamadas a uma API, nem pedidos a um CDN, por isso a ferramenta continua a funcionar com a rede desligada."
    },
    {
      "question": "Até que tamanho de ficheiro aguenta?",
      "answer": "Não há um tecto fixo: o ficheiro é consumido como fluxo em pedaços pequenos, por isso só há um pedaço em memória de cada vez e imagens de disco com vários gigabytes são rotina. O que te limita na prática é a velocidade de leitura do teu disco, que é exactamente o que o indicador de velocidade mostra."
    },
    {
      "question": "Como verifico uma ISO ou um instalador descarregado?",
      "answer": "Põe o ficheiro na fila, marca o algoritmo que o fabricante usou (SHA-256 em quase todos os casos), carrega em Calcular e cola o valor publicado na caixa de verificação. Também podes colar o ficheiro SHA256SUMS inteiro: as linhas são emparelhadas com os teus ficheiros pelo nome."
    },
    {
      "question": "Porque é que o MD5 tem um aviso?",
      "answer": "Porque hoje é barato construir dois ficheiros diferentes com o mesmo resumo MD5, e o mesmo se passa com o SHA-1. Continuam perfeitamente válidos para apanhar uma transferência corrompida, que é para o que serve normalmente o checksum de uma página de descargas, mas não provam nada perante alguém que tenha alterado o ficheiro de propósito."
    },
    {
      "question": "O meu hash não bate certo com o do site. E agora?",
      "answer": "Confirma primeiro que comparaste o mesmo algoritmo: um hash de 64 caracteres pode ser SHA-256, SHA3-256, BLAKE2b ou BLAKE3, e a ferramenta diz-te qual correspondeu. Depois volta a descarregar o ficheiro: uma divergência genuína é quase sempre uma transferência interrompida ou um espelho defeituoso. Se persistir com uma descarga nova, não executes o ficheiro."
    },
    {
      "question": "Porque é que hashear texto dá um resultado diferente do ficheiro com o mesmo texto?",
      "answer": "Porque um ficheiro costuma trazer algo que a caixa de texto não tem: uma quebra de linha final, fins de linha CRLF do Windows ou uma marca BOM de UTF-8. A ferramenta hasheia exactamente os bytes que lhe dás, e há um interruptor para normalizar CRLF em LF quando precisas de bater certo com um valor gerado em Linux."
    },
    {
      "question": "Para que serve o HMAC?",
      "answer": "Um hash simples prova que o conteúdo não mudou por acidente, mas qualquer pessoa o pode recalcular. Um HMAC mistura uma chave secreta no resumo, por isso só quem tem essa chave consegue gerar ou verificar o valor. É o que usam as assinaturas de API e a verificação de webhooks."
    }
  ],
  "footerTagline": "Gerador e verificador de checksums gratuito para ficheiros e texto, a correr inteiramente no teu navegador.",
  "footerCredit": "Parte da suite oLoveTools"
};
