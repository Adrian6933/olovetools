export default {
  "title": "MorseFlow",
  "label_text": "Texto",
  "label_morse": "Morse",
  "label_reference": "Referencia Morse",
  "button_play": "Reproducir",
  "button_stop": "Detener",
  "button_reset": "Restablecer",
  "tooltip_copy": "Copiar",
  "tooltip_mute": "Silenciar",
  "tooltip_unmute": "Activar sonido",
  "seoPrivacyTitle": "100% Privado y Seguro",
  "seoPrivacyText": "Sin bases de datos, seguimientos ni subidas a la red. Tus datos residen estrictamente en memoria local y desaparecen al cerrar la pestaña.",
  "faqTitle": "Preguntas Frecuentes",
  "footerCredit": "Parte de la suite oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacto para ideas y comentarios:",
  "heroBadge": "Manipulador y lector",
  "badgeSource": "origen",
  "placeholderText": "SOS AYUDA",
  "issuesTitle": "{n} caracteres no tienen equivalente en morse; se muestran como {mark}:",
  "labelTimeline": "Línea de tiempo",
  "wpmShort": "ppm",
  "badgeFarnsworth": "farnsworth",
  "labelCharSpeed": "Velocidad de carácter",
  "labelOverall": "Velocidad global",
  "labelTone": "Tono (Hz)",
  "labelWave": "Onda",
  "waveSine": "Senoidal",
  "waveSquare": "Cuadrada",
  "waveTriangle": "Triangular",
  "waveSaw": "Diente de sierra",
  "buttonWav": "Descargar como WAV",
  "buttonCopyBoth": "Copiar ambos",
  "tabListen": "Escuchar",
  "listenIntro": "Abre una grabación o usa el micrófono. El tono se encuentra barriendo la banda, el umbral de encendido sale de la propia grabación y la duración de la unidad se mide de las rachas: aquí nada da por hecho 600 Hz ni 20 ppm.",
  "buttonOpenAudio": "Abrir una grabación",
  "buttonRecord": "Grabar del micrófono",
  "buttonStopRecording": "Parar la grabación",
  "buttonAnalyse": "Decodificarla",
  "parkedHint": "en espera: aún no se ha analizado nada",
  "heardTone": "Tono",
  "heardUnit": "Unidad",
  "heardWpm": "Velocidad",
  "heardConfidence": "Separación",
  "listenFail_no-audio": "Esa grabación es demasiado corta para leerla.",
  "listenFail_no-tone": "No se ha encontrado un tono estable entre 250 y 1600 Hz.",
  "listenFail_no-elements": "Se ha encontrado el tono, pero las marcas y los espacios no se separan con claridad.",
  "listenFailGeneric": "De esa grabación no ha salido nada legible.",
  "ref_letters": "Letras",
  "ref_digits": "Cifras",
  "ref_punctuation": "Puntuación",
  "ref_accented": "Acentuadas",
  "ref_prosigns": "Prosignos",
  "errorAudio": "Este navegador no ha dado a la página un contexto de audio.",
  "errorRender": "Este navegador no puede renderizar audio sin conexión.",
  "errorTooLarge": "Esa grabación es demasiado grande.",
  "errorDecodeAudio": "Ese archivo no se ha podido decodificar como audio.",
  "errorMic": "El micrófono no estaba disponible.",
  "errorRead": "No se ha podido leer ese archivo.",
  "errorFormat": "Suelta un archivo de texto o una grabación.",
  "errorClipboard": "El portapapeles no está disponible en esta página.",
  "handoffReceived": "Recibido desde {tool}.",
  "nextStepTitle": "Sigue",
  "nextStepHint": "El mensaje viaja contigo: sin descargar ni volver a subir",
  "nextAudio": "Edita el audio",
  "nextBinary": "Conviértelo a binario",
  "nextQr": "Haz un QR",
  "nextWordflow": "Cuenta el texto",
  "nextBase64": "Codifícalo",
  "seo_description": "Traduce texto a morse y de vuelta, escúchalo a cualquier velocidad con espaciado Farnsworth, expórtalo como WAV y decodifica una grabación de vuelta a texto: todo en tu navegador, sin subir nada.",
  "seoHeroText": "Un manipulador y un receptor en la misma página: el alfabeto ITU completo con puntuación y prosignos, temporización PARIS estándar con espaciado Farnsworth, y un decodificador que saca el morse de una grabación.",
  "heroText": "Escribe en cualquiera de los dos lados y el otro sigue. Nada se pierde sin avisar, la temporización es la que dice el estándar, y una grabación puede hacer el camino inverso: tono, velocidad y umbral medidos, no supuestos.",
  "seoHeroList": [
    "Puntuación y prosignos",
    "Temporización PARIS",
    "Espaciado Farnsworth",
    "Decodifica una grabación"
  ],
  "seoSecondaryTitle": "En los dos sentidos, y ninguno a ojo",
  "howItWorksTitle": "Cómo funciona",
  "step1Title": "Escríbelo",
  "step1Text": "Cualquiera de las dos cajas manda sobre la otra. La puntuación, las letras acentuadas y prosignos como <SK> están en la tabla, y lo que de verdad no tiene código se marca en vez de borrarse.",
  "step2Title": "Da forma al envío",
  "step2Text": "La velocidad de carácter y la global son mandos separados: eso es Farnsworth. El tono y la onda también son tuyos, y la línea de tiempo enseña cada punto, raya y hueco a su duración real antes de darle al play.",
  "step3Title": "O que escuche",
  "step3Text": "Abre una grabación o usa el micrófono. Barre en busca de la portadora, umbraliza la envolvente con Otsu, agrupa las rachas para hallar la unidad, e informa del tono, la velocidad y con qué limpieza ha separado.",
  "step4Title": "Llévatelo",
  "step4Text": "Copia cualquiera de los dos lados, descarga el tono como WAV renderizado sin conexión a plena calidad, o pasa el mensaje directo a otra herramienta de la suite.",
  "features": [
    {
      "title": "El alfabeto entero",
      "text": "Letras, cifras, los dieciocho signos de puntuación, las letras acentuadas nacionales y los prosignos que se usan de verdad. Lo que no tiene código se señala en vez de borrarse en silencio."
    },
    {
      "title": "Un oscilador, una envolvente",
      "text": "El mensaje entero es un solo tono con una curva de ganancia programada y rampas de 5 ms, en lugar de un oscilador por punto. Menos nodos, sin chasquidos, y un contexto de audio reutilizado en vez de uno nuevo por pulsación."
    },
    {
      "title": "Sabe escuchar",
      "text": "Apúntalo a una grabación o al micrófono. Un barrido de Goertzel encuentra la portadora, Otsu umbraliza la envolvente, y agrupar las rachas da la unidad: tono y velocidad medidos, no supuestos."
    },
    {
      "title": "Farnsworth como es debido",
      "text": "Velocidad de carácter y global separadas, con el tiempo extra repartido por los huecos en la proporción 3:4 que marca la ARRL. Así se aprende a oír letras en vez de contar puntos."
    },
    {
      "title": "Una línea de tiempo legible",
      "text": "Cada punto, raya y hueco dibujado a su duración real, con el cabezal recorriéndola. Al pasar por encima de un bloque te dice cuántos milisegundos dura."
    },
    {
      "title": "Exporta el tono",
      "text": "Renderizado sin conexión a un WAV de 16 bits a 44,1 kHz, para que pueda ir a un vídeo, una clase o un tono de llamada sin volver a grabarlo desde los altavoces."
    },
    {
      "title": "No se sube nada",
      "text": "Traducir, sintetizar y decodificar ocurre todo en esta pestaña. El flujo del micrófono no sale de la página y ninguna grabación se guarda en ningún sitio."
    },
    {
      "title": "Enlaza con el resto de la suite",
      "text": "Manda el mensaje directo a AudioSnap, Binary-Flow, QR Bolt o WordFlow sin descargarlo y volver a subirlo."
    }
  ],
  "seoBrowserSpeedTitle": "El navegador es el transmisor",
  "seoBrowserSpeedText": "Web Audio sintetiza el tono, un contexto offline renderiza el WAV, y decodeAudioData más un filtro de Goertzel leen una grabación de vuelta. Nada de eso necesita servidor, cuenta ni petición de red, y basta cerrar la pestaña para que el mensaje y la grabación desaparezcan.",
  "seoUseCaseTitle": "Para aprenderlo y para leerlo",
  "seoUseCaseText": "Aprender morse es oír los caracteres a velocidad plena con aire entre ellos, que es justo para lo que sirve el espaciado Farnsworth; por eso aquí la velocidad de carácter y la global van por separado. Leerlo es el otro sentido: un trozo de una película, una baliza grabada de un receptor, un acertijo que alguien mandó como nota de voz. Los dos viven en la misma página, y el segundo te dice qué ha medido —el tono en hercios, la unidad en milisegundos, las palabras por minuto resultantes y con qué limpieza se separaron las marcas de los espacios—, así que con una respuesta equivocada se puede discutir en vez de solo estar equivocada.",
  "seoKeywords": [
    "traductor de código morse",
    "decodificador morse",
    "texto a morse",
    "audio morse",
    "temporización farnsworth",
    "morse desde audio",
    "práctica de cw",
    "alfabeto morse"
  ],
  "faq": [
    {
      "question": "¿Se envía mi texto o mi grabación a algún sitio?",
      "answer": "No. La traducción, la síntesis del tono, el renderizado del WAV y la decodificación del audio se ejecutan dentro de tu navegador. El flujo del micrófono no sale de la página y no se guarda nada entre visitas."
    },
    {
      "question": "¿Qué caracteres admite?",
      "answer": "El conjunto ITU completo: A–Z, 0–9, dieciocho signos de puntuación, las letras acentuadas nacionales (À, Ä, Ç, É, Ñ, Ö, Ü, ß y compañía) y los prosignos habituales, que se escriben entre ángulos como <SK>. Un carácter sin equivalente en morse se marca con # y se lista, en vez de desaparecer."
    },
    {
      "question": "¿Qué diferencia hay entre velocidad de carácter y velocidad global?",
      "answer": "Eso es el espaciado Farnsworth. Los puntos y rayas se envían a la velocidad de carácter que fijes, mientras los huecos entre letras y palabras se estiran hasta que el mensaje entero sale a la velocidad global. Así se aprende a reconocer una letra por su ritmo en lugar de contar elementos."
    },
    {
      "question": "¿Cómo decodifica una grabación?",
      "answer": "Barre de 250 a 1600 Hz con un filtro de Goertzel para encontrar la portadora, mide la magnitud en esa única frecuencia en ventanas de 5 ms para obtener una envolvente, elige el umbral de encendido con el método de Otsu, y agrupa las rachas resultantes para hallar la unidad. Tono, duración de la unidad, velocidad y separación entre los dos grupos se informan todos."
    },
    {
      "question": "El decodificador se ha equivocado. ¿Por qué?",
      "answer": "Mira la cifra de separación y el gráfico de la envolvente. Una grabación con ruido, una señal que se desvanece o un pulso manual con espaciado irregular hacen que marcas y espacios se solapen, y cuando se solapan no hay umbral que los separe bien. Recortar el fragmento a la parte más limpia suele arreglarlo."
    },
    {
      "question": "¿Puedo usar el audio en otro sitio?",
      "answer": "Sí. El WAV se renderiza sin conexión a 44,1 kHz, 16 bits, mono, con el tono, la onda y la velocidad que hayas puesto, así que entra directo en un vídeo o en una clase."
    }
  ],
  "seoKeywordsTitle": "Búsquedas relacionadas",
  "footerTagline": "Morse en los dos sentidos: enviado, escuchado y medido.",
  "footer_seo_title": "La temporización es todo el morse",
  "footer_seo_paragraph1": "Un punto y una raya no son tanto dos símbolos como un símbolo en dos longitudes, y todo lo demás en morse es silencio de tres duraciones prescritas. La palabra estándar PARIS mide cincuenta unidades contando el espacio que la sigue, y de ahí sale la cifra conocida: a veinte palabras por minuto la unidad son sesenta milisegundos, un punto es una unidad, una raya tres, el hueco dentro de una letra uno, entre letras tres y entre palabras siete. Falla cualquiera de esas y el ritmo deja de ser legible mucho antes que los elementos sueltos, y por eso un reproductor que gasta dos unidades en el hueco entre letras en vez de tres suena sutilmente apresurado sin llegar a estar claramente mal. Aquí cada duración sale de esa tabla y no de una constante que sonaba bien.",
  "footer_seo_paragraph2": "Leer morse de una grabación es la misma tabla al revés, y la dificultad está en que ninguno de los números se conoce de antemano. El tono puede estar donde el receptor lo dejara; la velocidad es la que le apeteciera al operador; la frontera entre \"suficientemente fuerte para ser marca\" y \"fondo\" depende de la grabación y no de ninguna constante. Así que cada uno se deduce: la portadora de un barrido de Goertzel por la banda, el umbral del método de Otsu sobre el histograma de la envolvente, y la unidad de los dos grupos en los que caen naturalmente las rachas, porque una raya es tres veces un punto y ninguna mano es tan irregular como para borrar del todo esa proporción. Cuando la grabación es demasiado sucia para que esos grupos se separen, eso aparece como una cifra de separación baja, y la respuesta honesta es decirlo en vez de imprimir un disparate con aplomo.",
  "seo_title": "MorseFlow | Traductor de código morse, reproductor y decodificador de audio",
  "seoHeroTitle": "Traductor de código morse y decodificador de audio"
};
