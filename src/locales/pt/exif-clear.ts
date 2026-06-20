export default {
  "title": "EXIF-Clear",
  "description": "Inspecione e remova metadados EXIF, GPS e outros de suas fotos localmente no seu navegador. Proteja sua privacidade online.",
  "btn_download_cleaned": "Baixar Imagens Limpas",
  "btn_download_zip": "Baixar Limpas (.ZIP)",
  "label_upload_box": "Arraste imagens aqui ou clique para selecionar",
  "label_files_loaded": "Arquivos Carregados",
  "btn_clear_all": "Limpar Tudo",
  "label_options": "Nível de Remoção",
  "opt_full_strip": "Limpeza Completa (Recomendado - EXIF, GPS, XMP, Comentários)",
  "opt_gps_only": "Apenas Localização GPS",
  "opt_camera_only": "Apenas Dados de Câmera e Dispositivo",
  "label_meta_details": "Propriedades dos Metadados",
  "meta_make": "Fabricante da Câmera",
  "meta_model": "Modelo da Câmera",
  "meta_datetime": "Data/Hora da Foto",
  "meta_gps": "Coordenadas GPS",
  "meta_software": "Software de Edição",
  "status_clean": "Limpo / Sem Metadados",
  "status_has_meta": "Metadados Encontrados",
  "status_has_gps": "GPS Encontrado",
  "no_files_loaded": "Nenhuma imagem carregada",
  "preview_title": "Inspetor de Metadados",
  "progress_clearing": "Removendo metadados da imagem {current} de {total}...",
  "seo_title": "EXIF-Clear | Remover Metadados EXIF e GPS de Fotos Grátis Online",
  "seo_description": "Remova tags EXIF, GPS e metadados de imagens JPEG/PNG de forma local online. Apague dados de geolocalização e câmera por segurança.",
  "seoHeroTitle": "Limpe Dados EXIF e GPS de Suas Imagens Offline",
  "seoHeroText": "Proteja seus dados de privacidade antes de postar fotos. O EXIF-Clear analisa e limpa os cabeçalhos de metadados na memória do navegador.",
  "seoHeroList": [
    "Identifique coordenadas GPS, modelos de dispositivos e dados de exposição",
    "Remove blocos de dados completos como EXIF, XMP e blocos IPTC do Photoshop",
    "100% local e seguro no cliente, sem servidores ou upload de arquivos"
  ],
  "seoBrowserSpeedTitle": "Filtragem Binária de Cabeçalhos em Tempo Real",
  "seoBrowserSpeedText": "Trabalhando diretamente em ArrayBuffers nos bytes dos arquivos, removemos os metadados instantaneamente, sem alterar a resolução ou qualidade original.",
  "seoUseCaseTitle": "Essencial para Fotógrafos, Blogueiros e Usuários de Celular",
  "seoUseCaseText": "Fotos tiradas em smartphones contêm localização exata por GPS. Remova essas informações antes de postar seus portfolios ou anúncios.",
  "seoPrivacyTitle": "Privacidade Local Garantida",
  "seoPrivacyText": "Nenhum arquivo ou imagem é enviado pela internet. O processamento acontece estritamente na guia ativa do seu navegador.",
  "faqTitle": "Perguntas Frequentes",
  "faq": [
    {
      "question": "Por que devo remover metadados de minhas fotos?",
      "answer": "As câmeras dos celulares salvam coordenadas GPS, data e marca do aparelho nos arquivos, o que pode expor sua localização residencial ao compartilhar."
    },
    {
      "question": "Isso reduz a qualidade das imagens?",
      "answer": "Não! Modificamos apenas as tabelas binárias de metadados (APP1/ancillary). O fluxo de pixels comprimidos (SOS/IDAT) permanece idêntico, preservando 100% da nitidez."
    },
    {
      "question": "Quais formatos de imagem são suportados?",
      "answer": "O EXIF-Clear suporta e limpa metadados de arquivos JPEG/JPG, PNG e WebP de maneira offline."
    },
    {
      "question": "Como as coordenadas GPS são lidas?",
      "answer": "Analisamos a seção APP1 em busca da tabela TIFF. Se encontrarmos ponteiros de diretório GPS, convertemos os valores de latitude e longitude."
    }
  ],
  "footerTagline": "Utilitário gratuito, privado e local para limpeza de metadados em imagens.",
  "footerCredit": "Parte da suite oLoveTools"
};
