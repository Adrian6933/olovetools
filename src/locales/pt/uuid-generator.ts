export default {
  "title": "UUID Generator",
  "seo_title": "UUID Generator | Gerador gratuito online de UUID v4 e v5",
  "seo_description": "Gere UUIDs aleatórios (v4) e UUIDs nomeados (v5) em lote de até 500 de cada vez 100% localmente no seu navegador usando a Web Crypto API. Gerador de UUID gratuito online.",
  "seoHeroTitle": "Gerador em lote de UUID v4 e v5",
  "seoHeroText": "Gere instantaneamente até 500 UUIDs aleatórios (versão 4) ou UUIDs nomeados (versão 5 com namespace) usando a Web Crypto API nativa do navegador. Toda a geração acontece localmente — sem chamadas ao servidor, sem rastreamento.",
  "label_version": "Versão do UUID",
  "option_v4": "v4 (Aleatório)",
  "option_v5": "v5 (Nomeado + SHA-1)",
  "label_count": "Quantidade",
  "label_namespace": "UUID de Namespace",
  "label_name": "Nome",
  "label_uuids_generated": "UUIDs gerados",
  "label_no_uuids": "Ainda não há UUIDs gerados. Ajuste as opções acima.",
  "error_invalid_namespace": "Formato de UUID de namespace inválido. Use o formato padrão de UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "error_fix_namespace": "Por favor, corrija o UUID de namespace para gerar UUIDs v5.",
  "button_regenerate": "Regenerar",
  "button_copied_all": "Tudo copiado!",
  "button_download": "Baixar .txt",
  "button_reset": "Redefinir",
  "tooltip_copy": "Copiar para a área de transferência",
  "seoBrowserSpeedTitle": "Powered pela Web Crypto API",
  "seoBrowserSpeedText": "Os UUIDs são gerados usando o crypto.randomUUID() nativo do navegador para v4 e crypto.subtle.digest('SHA-1') para v5, garantindo qualidade criptográfica na velocidade do hardware sem processamento no servidor.",
  "seoUseCaseTitle": "Geração em lote",
  "seoUseCaseText": "Gere até 500 UUIDs em um único clique. Perfeito para popular bancos de dados, gerar dados de teste, IDs de sessão únicos ou qualquer cenário que exija múltiplos identificadores únicos ao mesmo tempo.",
  "seoPrivacyTitle": "100% privado e seguro",
  "seoPrivacyText": "Sem bancos de dados, rastreamento ou uploads de rede. Toda a geração de UUIDs acontece inteiramente no subsistema criptográfico do seu navegador. Seus dados nunca saem do seu dispositivo.",
  "seoKeywords": [
    "gerador uuid",
    "uuid v4",
    "uuid v5",
    "gerador guid",
    "uuid aleatório",
    "uuid em lote",
    "identificador único"
  ],
  "faqTitle": "Perguntas frequentes",
  "faq": [
    {
      "question": "Qual é a diferença entre UUID v4 e v5?",
      "answer": "O UUID v4 é gerado usando números aleatórios, tornando cada UUID único e imprevisível. O UUID v5 é gerado aplicando hash a um UUID de namespace e uma string de nome usando SHA-1, o que significa que o mesmo namespace+nome sempre produz o mesmo UUID."
    },
    {
      "question": "Posso gerar múltiplos UUIDs ao mesmo tempo?",
      "answer": "Sim. Use o controle deslizante de quantidade para gerar de 1 a 500 UUIDs em um único lote. Todos os UUIDs são gerados instantaneamente e podem ser copiados individualmente ou todos de uma vez."
    },
    {
      "question": "Estes UUIDs são criptograficamente seguros?",
      "answer": "Sim. UUIDs da versão 4 usam a função crypto.randomUUID() nativa do navegador que fornece aleatoriedade criptográfica. UUIDs da versão 5 usam a função de digest SHA-1 da Web Crypto API."
    }
  ],
  "footerTagline": "Gerador em lote de UUID v4 e v5 rápido e seguro powered pela Web Crypto API — 100% local no seu navegador.",
  "footerCredit": "Parte do conjunto oLoveTools",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copiado!",
  "contactForIdeas": "Contato para ideias e comentários:",
  "button_copy_all": "Copiar Tudo"
};
