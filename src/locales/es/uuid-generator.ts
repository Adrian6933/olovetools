export default {
  "title": "UUID-Generator",
  "seo_title": "UUID-Generator | Generador gratuito en línea de UUID v4 y v5",
  "seo_description": "Genera UUIDs aleatorios (v4) y UUIDs con nombre (v5) en lote de hasta 500 a la vez 100% localmente en tu navegador usando la Web Crypto API. Generador de UUID gratuito en línea.",
  "seoHeroTitle": "Generador masivo de UUID v4 y v5",
  "seoHeroText": "Genera al instante hasta 500 UUIDs aleatorios (versión 4) o UUIDs con nombre (versión 5 con namespace) usando la Web Crypto API nativa del navegador. Toda la generación ocurre localmente, sin llamadas al servidor ni seguimiento.",
  "label_version": "Versión de UUID",
  "option_v4": "v4 (Aleatorio)",
  "option_v5": "v5 (Con nombre + SHA-1)",
  "label_count": "Cantidad",
  "label_namespace": "UUID de Namespace",
  "label_name": "Nombre",
  "label_uuids_generated": "UUIDs generados",
  "label_no_uuids": "Aún no se han generado UUIDs. Ajusta las opciones de arriba.",
  "error_invalid_namespace": "Formato de UUID de namespace inválido. Usa el formato estándar de UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "error_fix_namespace": "Por favor corrige el UUID de namespace para generar UUIDs v5.",
  "button_regenerate": "Regenerar",
  "button_copied_all": "¡Todo copiado!",
  "button_download": "Descargar .txt",
  "button_reset": "Reiniciar",
  "tooltip_copy": "Copiar al portapapeles",
  "seoBrowserSpeedTitle": "Impulsado por Web Crypto API",
  "seoBrowserSpeedText": "Los UUIDs se generan usando el crypto.randomUUID() nativo del navegador para v4 y crypto.subtle.digest('SHA-1') para v5, garantizando calidad criptográfica a velocidad de hardware sin procesamiento en el servidor.",
  "seoUseCaseTitle": "Generación por lotes",
  "seoUseCaseText": "Genera hasta 500 UUIDs con un solo clic. Perfecto para sembrar bases de datos, generar datos de prueba, IDs de sesión únicos o cualquier escenario que requiera múltiples identificadores únicos a la vez.",
  "seoPrivacyTitle": "100% privado y seguro",
  "seoPrivacyText": "Sin bases de datos, seguimiento ni cargas a la red. Toda la generación de UUIDs ocurre completamente en el subsistema criptográfico de tu navegador. Tus datos nunca salen de tu dispositivo.",
  "seoKeywords": ["generador uuid", "uuid v4", "uuid v5", "generador guid", "uuid aleatorio", "uuid en lote", "identificador único"],
  "faqTitle": "Preguntas frecuentes",
  "faq": [
    {
      "question": "¿Cuál es la diferencia entre UUID v4 y v5?",
      "answer": "UUID v4 se genera usando números aleatorios, lo que hace que cada UUID sea único e impredecible. UUID v5 se genera aplicando hash a un UUID de namespace y una cadena de nombre usando SHA-1, lo que significa que el mismo namespace+nombre siempre produce el mismo UUID."
    },
    {
      "question": "¿Puedo generar múltiples UUIDs a la vez?",
      "answer": "Sí. Usa el control deslizante de cantidad para generar de 1 a 500 UUIDs en un solo lote. Todos los UUIDs se generan al instante y se pueden copiar individualmente o todos a la vez."
    },
    {
      "question": "¿Estos UUIDs son criptográficamente seguros?",
      "answer": "Sí. Los UUIDs versión 4 usan la función crypto.randomUUID() nativa del navegador que proporciona aleatoriedad criptográfica. Los UUIDs versión 5 usan la función de digest SHA-1 de la Web Crypto API."
    }
  ],
  "footerTagline": "Generador masivo de UUID v4 y v5 rápido y seguro impulsado por Web Crypto API — 100% local en tu navegador.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "¡Copiado!",
  "contactForIdeas": "Contacto para ideas y comentarios:"
};
