export default {
  "title": "Gerador de UUID",
  "badge": "Identificadores únicos",
  "description": "Gera UUID v1, v3, v4, v5, v6 e v7, além de ULID, NanoID e ObjectId do MongoDB — em lotes, no formato exato que o teu código espera e sem um único pedido de rede.",
  "seo_title": "Gerador de UUID | v4, v7, v5, ULID e NanoID em lote",
  "seo_description": "Gerador de UUID online e gratuito: v1, v3, v4, v5, v6, v7, nil e max, mais ULID, NanoID e ObjectId. Lotes grandes, formatação de saída configurável e inspetor byte a byte, tudo dentro do navegador.",
  "groupUuid": "UUID da RFC 9562",
  "groupOther": "Outros identificadores",
  "kindHelp_v4": "122 bits de entropia da fonte aleatória criptográfica do navegador. A escolha por omissão quando só precisas de algo único.",
  "kindHelp_v7": "Uma marca temporal Unix de 48 bits em milissegundos seguida de bits aleatórios, com um contador para que os identificadores criados no mesmo milissegundo continuem ordenados. A escolha moderna para chaves de base de dados.",
  "kindHelp_v1": "Marca temporal mais um identificador de nó. Esta ferramenta usa um nó aleatório com o bit de multicast ativo, por isso o teu MAC real nunca fica exposto.",
  "kindHelp_v6": "Os campos do v1 reordenados para a marca temporal ficar à frente. Ordena-se cronologicamente como bytes crus, coisa que o v1 não faz.",
  "kindHelp_v3": "MD5 de um espaço de nomes e de um nome. O mesmo par dá sempre o mesmo UUID: escreve um nome por linha para obteres um lote.",
  "kindHelp_v5": "SHA-1 de um espaço de nomes e de um nome. Determinista como o v3, mas com o resumo mais forte. Um nome por linha.",
  "kindHelp_nil": "Os 128 bits a zero: o UUID canónico de \"sem valor\".",
  "kindHelp_max": "Os 128 bits a um: o limite superior do espaço de UUID, usado como sentinela.",
  "kindHelp_ulid": "26 caracteres em base32 de Crockford: 48 bits de tempo e 80 de aleatoriedade, ordenável alfabeticamente e indiferente a maiúsculas.",
  "kindHelp_nanoid": "21 caracteres seguros em URL, cerca de 126 bits de entropia. Mais curto do que um UUID e válido num URL sem escapes.",
  "kindHelp_objectid": "O identificador de 12 bytes que o MongoDB põe em cada documento: 4 bytes de tempo, 5 aleatórios e 3 de contador.",
  "label_count": "Quantos",
  "hint_big_batch": "Acima de 10 000 o cursor para; escreve o número exato. A pré-visualização fica nas 300 linhas — copiar e transferir cobrem sempre o lote inteiro.",
  "label_namespace": "Espaço de nomes",
  "label_names": "Nomes — um por linha",
  "hint_deterministic": "O mesmo espaço de nomes e o mesmo nome produzem sempre o mesmo identificador: é para isso que existem o v3 e o v5. Se queres um lote, dá-lhe um lote de nomes.",
  "button_generate": "Gerar",
  "button_working": "A trabalhar…",
  "tooltip_undo": "Lote anterior (Ctrl+Z)",
  "tooltip_redo": "Lote seguinte (Ctrl+Shift+Z)",
  "button_clear": "Limpar tudo",
  "error_invalid_namespace": "Esse espaço de nomes não é um UUID válido.",
  "error_clipboard": "O navegador recusou o acesso à área de transferência. Usa o botão de transferência.",
  "error_generic": "Algo correu mal ao gerar. Tenta um lote mais pequeno.",
  "error_unrecognised": "Isso não parece um identificador que esta ferramenta reconheça.",
  "stat_count": "gerados",
  "stat_time": "milissegundos",
  "stat_rate": "por segundo",
  "stat_duplicates": "duplicados",
  "empty_state": "Ainda não foi gerado nada. Escolhe um tipo, define a quantidade e carrega em Gerar.",
  "label_showing": "A mostrar {shown} de {total}",
  "label_uuids_generated": "identificadores",
  "tooltip_copy": "Copiar para a área de transferência",
  "button_copy_all": "Copiar tudo",
  "button_copied_all": "Copiado",
  "label_format": "Forma da saída",
  "placeholder_prefix": "prefixo",
  "placeholder_suffix": "sufixo",
  "label_inspect": "Inspecionar e compor",
  "button_load_list": "Carregar uma lista de um ficheiro",
  "button_blank": "Começar com 16 bytes vazios",
  "placeholder_inspect": "Cola qualquer UUID, ULID ou ObjectId",
  "field_timestamp": "marca temporal",
  "byte_version": "byte 6 — nibble de versão",
  "byte_variant": "byte 8 — bits de variante",
  "button_now": "agora",
  "button_reroll": "Sortear de novo os 8 bytes finais",
  "button_revert": "reverter",
  "button_copy": "Copiar",
  "button_use_crafted": "Usar como saída",
  "imported_summary": "Encontrados {count} identificadores na lista vinda de {from}.",
  "imported_unique": "{n} únicos",
  "imported_inspect": "Inspecionar o primeiro",
  "nextStepTitle": "Continua",
  "nextStepHint": "A lista viaja contigo — sem transferir nem voltar a enviar",
  "nextDiff": "Comparar dois lotes",
  "nextHash": "Calcular o hash",
  "nextJson": "Abrir como JSON",
  "nextRegex": "Testar um padrão",
  "nextZip": "Comprimir em ZIP",
  "howItWorksTitle": "Como funciona",
  "step1Title": "Escolhe o tipo",
  "step1Text": "Onze ao todo, do v4 de sempre ao v7 ordenado por tempo, ULID ou um ObjectId do Mongo.",
  "step2Title": "Define o lote",
  "step2Text": "Quantos e com que forma: maiúsculas, hífenes, envolvimento, prefixo e formato de exportação.",
  "step3Title": "Carrega em gerar",
  "step3Text": "Nada corre antes disso. O lote é construído num worker e cronometrado ao décimo de milissegundo.",
  "step4Title": "Leva-o contigo",
  "step4Text": "Copia, transfere em txt, csv, json ou SQL, ou envia a lista diretamente para outra ferramenta.",
  "features": [
    {
      "title": "Onze tipos de identificador",
      "text": "UUID v1, v3, v4, v5, v6, v7, nil e max, mais ULID, NanoID e ObjectId do MongoDB."
    },
    {
      "title": "Ordenados por tempo e monótonos",
      "text": "v7, v6 e ULID mantêm um contador, por isso os identificadores criados no mesmo milissegundo guardam a ordem de criação."
    },
    {
      "title": "Também os lê",
      "text": "Cola qualquer identificador para veres versão, variante, marca temporal, nó e bytes crus — e edita um único nibble."
    },
    {
      "title": "Fora da linha principal",
      "text": "Os lotes correm num Web Worker, com o tempo exato de geração e uma varredura de duplicados sobre o lote inteiro."
    },
    {
      "title": "A saída como precisas",
      "text": "Maiúsculas, hífenes, chavetas, urn:uuid:, aspas, prefixo e sufixo, exportado em txt, csv, json ou SQL."
    },
    {
      "title": "Nada sai do separador",
      "text": "Entropia da Web Crypto, nenhuma chamada de rede e nada guardado entre visitas."
    }
  ],
  "seoHeroTitle": "Todos os formatos de identificador, gerados localmente",
  "seoHeroText": "A maioria dos geradores dá-te um v4 e fica por aí. Este cobre toda a família da RFC 9562, os formatos ordenáveis que a substituíram na prática e os identificadores usados por outros ecossistemas, com a saída moldada exatamente como a tua migração, o teu ficheiro de dados iniciais ou o teu fixture de testes precisa.",
  "seoHeroList": [
    "11 tipos de identificador",
    "Lotes até 100 000",
    "Inspetor byte a byte",
    "Zero chamadas de rede"
  ],
  "seoBrowserSpeedTitle": "Ordenáveis por construção",
  "seoBrowserSpeedText": "Chaves v4 aleatórias espalham as escritas por todo o índice B-tree. O v7, o v6 e o ULID põem o tempo à frente, por isso as linhas novas caem no fim do índice em vez de por todo o lado — e esta ferramenta mantém um contador dentro de cada milissegundo para a ordem aguentar mesmo num ciclo apertado.",
  "seoSecondaryTitle": "Feito para o trabalho que vem depois do identificador",
  "seoUseCaseTitle": "Dados iniciais, fixtures e migrações",
  "seoUseCaseText": "Gera cem mil chaves, exporta-as diretamente como INSERT de SQL ou array JSON e passa a lista à ferramenta de diferenças, de hash ou de arquivo sem passar pela pasta de transferências.",
  "seoPrivacyTitle": "Local, e verificável",
  "seoPrivacyText": "A entropia vem da Web Crypto API dentro do teu separador. Não há chamada a API, nem descarga de CDN, nem WebAssembly obtido à parte: o hash usado pelo v3 e pelo v5 está embutido na própria página, por isso a ferramenta funciona com a rede desligada.",
  "seoKeywordsTitle": "Palavras-chave",
  "seoKeywords": [
    "gerador de uuid",
    "uuid v4 aleatório",
    "uuid v7 ordenado por tempo",
    "uuid v5 com nome",
    "gerador de guid",
    "gerador de ulid",
    "nanoid curto",
    "uuid em lote",
    "descodificador de uuid"
  ],
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "Que versão de UUID devo usar?",
      "answer": "v4 quando só precisas de unicidade. v7 quando o identificador passa a chave primária, porque a marca temporal inicial mantém as escritas do índice juntas. v5 quando a mesma entrada tem de dar sempre o mesmo identificador."
    },
    {
      "question": "Porque é que dez UUID v5 saem todos iguais?",
      "answer": "Porque é isso que o v5 significa: um espaço de nomes mais um nome dão um identificador. Se queres dez diferentes, dá-lhe dez nomes diferentes, um por linha."
    },
    {
      "question": "Qual é a diferença entre v7 e ULID?",
      "answer": "Ambos são uma marca temporal de 48 bits seguida de aleatoriedade. O v7 é um UUID a sério e cabe numa coluna UUID; o ULID são 26 caracteres em base32, mais curtos de ler e indiferentes a maiúsculas, mas não é um UUID."
    },
    {
      "question": "São criptograficamente seguros?",
      "answer": "A aleatoriedade vem de crypto.getRandomValues, a mesma fonte que o navegador usa para o seu próprio material de chaves. Repara que um v1 ou um v7 expõe de propósito a hora de criação, por isso não é um segredo."
    },
    {
      "question": "Quantos posso gerar de uma vez?",
      "answer": "Até 100 000 por lote. A lista mostra as primeiras 300 linhas para a página continuar fluida; copiar, transferir e os botões de passagem trabalham sempre sobre o lote completo."
    },
    {
      "question": "É enviado alguma coisa para um servidor?",
      "answer": "Não. A geração, a inspeção e a exportação acontecem no navegador, e a página não faz qualquer pedido enquanto a usas."
    }
  ],
  "footerTagline": "UUID de v1 a v7, ULID, NanoID e ObjectId — gerados, inspecionados e exportados inteiramente no teu navegador.",
  "footerCredit": "Parte da suite oLoveTools",
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contacto para ideias e comentários:",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
