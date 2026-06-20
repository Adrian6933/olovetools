export default {
  "title": "Hash-Bolt",
  "description": "Calcula hashes criptográficos (MD5, SHA-1, SHA-256, SHA-512) para textos y archivos 100% en local dentro de tu navegador.",
  "input_text_tab": "Entrada de Texto",
  "input_file_tab": "Hash de Archivo",
  "placeholder_text": "Escribe o pega tu texto aquí para calcular su hash en tiempo real...",
  "label_algorithm": "Función Hash",
  "label_expected_hash": "Comparar con Checksum (Opcional)",
  "match_success": "Verificado: ¡Los hashes coinciden correctamente!",
  "match_fail": "Error: ¡Los hashes no coinciden!",
  "match_placeholder": "Pega el hash esperado para verificar la integridad...",
  "file_drag_active": "Suelta el archivo aquí...",
  "file_drag_inactive": "Arrastra y suelta un archivo aquí, o haz clic para seleccionar",
  "file_size_warning": "Los archivos grandes se procesan en bloques para evitar bloqueos del navegador.",
  "file_processing": "Leyendo y calculando hash...",
  "file_processing_speed": "Velocidad",
  "file_processing_time": "Tiempo tomado",
  "format_uppercase": "Salida en mayúsculas",
  "format_base64": "Formato Base64",
  "copied": "¡Copiado!",
  "tooltip_copy": "Copiar al portapapeles",
  "seoHeroTitle": "Generador rápido de firmas digitales y Checksums offline",
  "seoHeroText": "Verifica la integridad de tus archivos y calcula firmas digitales (MD5, SHA-1, SHA-256, SHA-384, SHA-512) localmente. Proceso 100% privado y seguro.",
  "seoBrowserSpeedTitle": "Motor de Hashing Local",
  "seoBrowserSpeedText": "Todos los cálculos se realizan localmente utilizando la API Web Crypto del navegador. La velocidad es máxima y sin transferencia de datos.",
  "seoUseCaseTitle": "Soporte para archivos gigantes",
  "seoUseCaseText": "Arrastra instaladores o archivos grandes. Nuestro lector en lote procesa el archivo por fragmentos sin agotar la memoria RAM del navegador.",
  "seoPrivacyTitle": "100% Privado y Seguro",
  "seoPrivacyText": "Sin bases de datos ni envíos por red. Tus textos y archivos binarios permanecen en la RAM local de tu pestaña y se eliminan al cerrarla.",
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Se suben mis archivos o textos para calcular el hash?",
      "answer": "No. Todo el proceso ocurre en local en tu navegador. Ninguna parte del archivo o texto se envía a servidores externos."
    },
    {
      "question": "¿Cómo verifico la integridad de un instalador descargado?",
      "answer": "Sube el instalador en el panel de archivos, pega el hash proporcionado por el autor en el campo de verificación y comprueba si el estado cambia a verde."
    },
    {
      "question": "¿Por qué MD5 usa un motor personalizado?",
      "answer": "Los navegadores modernos excluyen MD5 de Web Crypto por seguridad. Implementamos un motor MD5 en JS puro para verificar archivos antiguos de forma segura."
    }
  ],
  "footerTagline": "Generador de firmas y checksums criptográficos seguro y local.",
  "footerCredit": "Parte de la suite oLoveTools"
};
