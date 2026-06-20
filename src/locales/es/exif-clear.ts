export default {
  "title": "EXIF-Clear",
  "description": "Inspecciona y elimina EXIF, GPS y metadatos de tus fotos de forma local en tu navegador. Protege tu privacidad.",
  "btn_download_cleaned": "Descargar Imágenes Limpias",
  "btn_download_zip": "Descargar Limpias (.ZIP)",
  "label_upload_box": "Arrastra imágenes aquí o haz clic para explorar",
  "label_files_loaded": "Archivos Cargados",
  "btn_clear_all": "Limpiar Todo",
  "label_options": "Nivel de Eliminación",
  "opt_full_strip": "Limpieza Completa (Recomendado - EXIF, GPS, XMP, Comentarios)",
  "opt_gps_only": "Solo Ubicación GPS",
  "opt_camera_only": "Solo Metadatos de Cámara y Dispositivo",
  "label_meta_details": "Propiedades de Metadatos",
  "meta_make": "Fabricante de Cámara",
  "meta_model": "Modelo de Cámara",
  "meta_datetime": "Fecha/Hora de Captura",
  "meta_gps": "Coordenadas de Ubicación GPS",
  "meta_software": "Software de Edición",
  "status_clean": "Limpio / Sin Metadatos",
  "status_has_meta": "Metadatos Detectados",
  "status_has_gps": "GPS Detectado",
  "no_files_loaded": "No se han cargado imágenes",
  "preview_title": "Inspector de Metadatos",
  "progress_clearing": "Eliminando metadatos de la imagen {current} de {total}...",
  "seo_title": "EXIF-Clear | Eliminar Metadatos EXIF y GPS de Fotos Gratis Online",
  "seo_description": "Elimina etiquetas EXIF, GPS y metadatos de tus imágenes JPEG/PNG online de forma local. Borra localización y datos de cámara por seguridad.",
  "seoHeroTitle": "Elimina Metadatos EXIF y GPS de tus Fotos Offline",
  "seoHeroText": "Protege tu privacidad antes de compartir fotos en internet. EXIF-Clear analiza y limpia cabeceras de metadatos en la RAM del navegador.",
  "seoHeroList": [
    "Identifica coordenadas GPS, modelos de cámara y parámetros de exposición",
    "Limpia todos los bloques de datos como EXIF, XMP y bloques IPTC de Photoshop",
    "Seguridad 100% en el cliente, sin servidores externos ni subidas"
  ],
  "seoBrowserSpeedTitle": "Filtrado Binario de Cabeceras en Tiempo Real",
  "seoBrowserSpeedText": "Analizando los bytes a través de ArrayBuffers, eliminamos los segmentos de metadatos al instante, manteniendo intacta la resolución original sin pérdidas.",
  "seoUseCaseTitle": "Crucial para Fotógrafos, Bloggers y Usuarios de Móvil",
  "seoUseCaseText": "Las fotos de los teléfonos guardan la ubicación geográfica exacta. Limpia los datos EXIF antes de publicar catálogos o portafolios.",
  "seoPrivacyTitle": "Ejecución Local Garantizada",
  "seoPrivacyText": "Ninguna de tus fotos se envía por internet. Las operaciones se realizan estrictamente en local dentro de la pestaña de tu navegador.",
  "faqTitle": "Preguntas Frecuentes",
  "faq": [
    {
      "question": "¿Por qué debería eliminar los metadatos de mis fotos?",
      "answer": "Las cámaras de smartphones inyectan coordenadas GPS, fechas y datos de dispositivo que pueden revelar la ubicación de tu hogar al compartir archivos."
    },
    {
      "question": "¿Este proceso reduce la calidad de la imagen?",
      "answer": "¡No! Solo modificamos las cabeceras binarias (APP1/ancillary). El flujo de píxeles comprimidos (SOS/IDAT) no se altera, manteniendo el 100% de la calidad original."
    },
    {
      "question": "¿Qué formatos de imagen son compatibles?",
      "answer": "EXIF-Clear limpia metadatos en archivos estándar JPEG/JPG, PNG y WebP de forma totalmente offline."
    },
    {
      "question": "¿Cómo se procesan las coordenadas GPS?",
      "answer": "Leemos el segmento APP1 para buscar la estructura TIFF. Si existen punteros de directorio GPS, extraemos la latitud y longitud correspondientes."
    }
  ],
  "footerTagline": "Utilidad gratuita, privada y local para limpiar metadatos de imágenes.",
  "footerCredit": "Parte de la suite oLoveTools"
};
