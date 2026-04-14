import React, { useState, useRef, useEffect } from 'react';
import { Heart, ChevronDown, Check, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES } from '../constants';
import { LanguageCode } from '../types';
import { Modal } from './Modal';

type ModalType = 'privacy' | 'terms' | 'cookies' | null;

export const Layout: React.FC<{ lang: string, children: React.ReactNode }> = ({ lang, children }) => {
  const currentLang = (LANGUAGES.some(l => l.code === lang) ? lang : 'en') as LanguageCode;

  // Simple translations for the layout
  const layoutTranslations: Record<LanguageCode, any> = {
    en: { 
      footerRights: "All Rights Reserved", privacyPolicy: "Privacy Policy", termsOfService: "Terms of Service", cookiesPolicy: "Cookies Policy",
      contactTitle: "Got an idea?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "Copied!",
      contactText: "Contact for ideas & feedback:", contactModal: "For any questions or suggestions, please contact us at:",
      modals: {
        privacy: {
          p1: "Your privacy is important to us. It is oLoveTools' policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.",
          h1: "1. Information we collect",
          p2: "We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.",
          h2: "2. Use of Information",
          p3: "We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we'll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification."
        },
        terms: {
          h1: "1. Terms",
          p1: "By accessing the website at oLoveTools, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.",
          h2: "2. Use License",
          p2: "Permission is granted to temporarily download one copy of the materials (information or software) on oLoveTools' website for personal, non-commercial transitory viewing only.",
          h3: "3. Disclaimer",
          p3: "The materials on oLoveTools' website are provided on an 'as is' basis. oLoveTools makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights."
        },
        cookies: {
          p1: "This Cookie Policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.",
          h1: "What are cookies?",
          p2: "Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.",
          h2: "How do we use cookies?",
          p3: "We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. We use essential cookies to remember your language preference and other settings."
        }
      }
    },
    es: { 
      footerRights: "Todos los derechos reservados", privacyPolicy: "Política de Privacidad", termsOfService: "Términos de Servicio", cookiesPolicy: "Política de Cookies",
      contactTitle: "¿Tienes una idea?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "¡Copiado!",
      contactText: "Contacto para ideas y feedback:", contactModal: "Para cualquier duda o sugerencia, contáctanos en:",
      modals: {
        privacy: {
          p1: "Su privacidad es importante para nosotros. Es política de oLoveTools respetar su privacidad con respecto a cualquier información que podamos recopilar de usted en nuestro sitio web y otros sitios que poseemos y operamos.",
          h1: "1. Información que recopilamos",
          p2: "Solo solicitamos información personal cuando realmente la necesitamos para brindarle un servicio. La recopilamos por medios justos y legales, con su conocimiento y consentimiento. También le informamos por qué la recopilamos y cómo se utilizará.",
          h2: "2. Uso de la información",
          p3: "Solo conservamos la información recopilada durante el tiempo que sea necesario para brindarle el servicio solicitado. Los datos que almacenamos los protegeremos dentro de medios comercialmente aceptables para evitar pérdidas y robos, así como el acceso, divulgación, copia, uso o modificación no autorizados."
        },
        terms: {
          h1: "1. Términos",
          p1: "Al acceder al sitio web en oLoveTools, usted acepta estar sujeto a estos términos de servicio, a todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de las leyes locales aplicables.",
          h2: "2. Licencia de uso",
          p2: "Se concede permiso para descargar temporalmente una copia de los materiales (información o software) en el sitio web de oLoveTools solo para visualización transitoria personal y no comercial.",
          h3: "3. Descargo de responsabilidad",
          p3: "Los materiales en el sitio web de oLoveTools se proporcionan 'tal cual'. oLoveTools no ofrece garantías, expresas o implícitas, y por la presente renuncia y niega todas las demás garantías, incluidas, entre otras, las garantías implícitas o condiciones de comerciabilidad, idoneidad para un propósito particular o no infracción de propiedad intelectual u otra violación de derechos."
        },
        cookies: {
          p1: "Esta Política de Cookies explica qué son las cookies y cómo las usamos. Debe leer esta política para comprender qué tipo de cookies usamos, o la información que recopilamos usando cookies y cómo se usa esa información.",
          h1: "¿Qué son las cookies?",
          p2: "Las cookies son pequeños archivos de texto que se almacenan en su computadora o dispositivo móvil cuando visita un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.",
          h2: "¿Cómo usamos las cookies?",
          p3: "Usamos cookies para mejorar su experiencia de navegación, mostrar anuncios o contenido personalizados y analizar nuestro tráfico. Usamos cookies esenciales para recordar su preferencia de idioma y otras configuraciones."
        }
      }
    },
    hi: { 
      footerRights: "सर्वाधिकार सुरक्षित", privacyPolicy: "गोपनीयता नीति", termsOfService: "सेवा की शर्तें", cookiesPolicy: "कुकीज़ नीति",
      contactTitle: "क्या आपके पास कोई विचार है?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "कॉपी किया गया!",
      contactText: "विचारों और फीडबैक के लिए संपर्क करें:", contactModal: "किसी भी प्रश्न या सुझाव के लिए, कृपया हमसे यहाँ संपर्क करें:",
      modals: {
        privacy: {
          p1: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है। oLoveTools की नीति हमारी वेबसाइट और हमारे स्वामित्व और संचालन वाली अन्य साइटों पर आपसे एकत्र की जाने वाली किसी भी जानकारी के संबंध में आपकी गोपनीयता का सम्मान करना है।",
          h1: "1. जानकारी जो हम एकत्र करते हैं",
          p2: "हम केवल तभी व्यक्तिगत जानकारी मांगते हैं जब हमें आपको सेवा प्रदान करने के लिए वास्तव में इसकी आवश्यकता होती है। हम इसे आपके ज्ञान और सहमति से उचित और कानूनी तरीकों से एकत्र करते हैं। हम आपको यह भी बताते हैं कि हम इसे क्यों एकत्र कर रहे हैं और इसे कैसे उपयोग किया जाएगा।",
          h2: "2. जानकारी का उपयोग",
          p3: "हम केवल तभी तक एकत्र की गई जानकारी को बनाए रखते हैं जब तक आपको आपकी अनुरोधित सेवा प्रदान करने के लिए आवश्यक हो। जो डेटा हम संग्रहीत करते हैं, उसे नुकसान और चोरी, साथ ही अनधिकृत पहुंच, प्रकटीकरण, प्रतिलिपि, उपयोग या संशोधन को रोकने के लिए व्यावसायिक रूप से स्वीकार्य साधनों के भीतर सुरक्षित करेंगे।"
        },
        terms: {
          h1: "1. शर्तें",
          p1: "oLoveTools पर वेबसाइट तक पहुंचकर, आप सेवा की इन शर्तों, सभी लागू कानूनों और विनियमों से बाध्य होने के लिए सहमत हैं, और सहमत हैं कि आप किसी भी लागू स्थानीय कानूनों के अनुपालन के लिए जिम्मेदार हैं।",
          h2: "2. उपयोग लाइसेंस",
          p2: "केवल व्यक्तिगत, गैर-व्यावसायिक अस्थायी देखने के लिए oLoveTools की वेबसाइट पर सामग्री (जानकारी या सॉफ़्टवेयर) की एक प्रति अस्थायी रूप से डाउनलोड करने की अनुमति दी जाती है।",
          h3: "3. अस्वीकरण",
          p3: "oLoveTools की वेबसाइट पर सामग्री 'जैसी है' वैसी ही प्रदान की जाती है। oLoveTools कोई वारंटी, व्यक्त या निहित नहीं देता है, और इसके द्वारा अन्य सभी वारंटियों को अस्वीकार करता है और नकारता है।"
        },
        cookies: {
          p1: "यह कुकी नीति बताती है कि कुकीज़ क्या हैं और हम उनका उपयोग कैसे करते हैं। आपको इस नीति को पढ़ना चाहिए ताकि आप समझ सकें कि हम किस प्रकार की कुकीज़ का उपयोग करते हैं।",
          h1: "कुकीज़ क्या हैं?",
          p2: "कुकीज़ छोटी टेक्स्ट फाइलें हैं जो आपके कंप्यूटर या मोबाइल डिवाइस पर संग्रहीत होती हैं जब आप किसी वेबसाइट पर जाते हैं।",
          h2: "हम कुकीज़ का उपयोग कैसे करते हैं?",
          p3: "हम आपकी भाषा वरीयता और अन्य सेटिंग्स को याद रखने के लिए आवश्यक कुकीज़ का उपयोग करते हैं।"
        }
      }
    },
    de: { 
      footerRights: "Alle Rechte vorbehalten", privacyPolicy: "Datenschutzrichtlinie", termsOfService: "Nutzungsbedingungen", cookiesPolicy: "Cookie-Richtlinie",
      contactTitle: "Hast du eine Idee?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "Kopiert!",
      contactText: "Kontakt für Ideen & Feedback:", contactModal: "Bei Fragen oder Anregungen kontaktieren Sie uns bitte unter:",
      modals: {
        privacy: {
          p1: "Ihre Privatsphäre ist uns wichtig. Es ist die Richtlinie von oLoveTools, Ihre Privatsphäre in Bezug auf alle Informationen zu respektieren, die wir möglicherweise auf unserer Website und anderen von uns betriebenen Websites von Ihnen sammeln.",
          h1: "1. Informationen, die wir sammeln",
          p2: "Wir fragen nur nach persönlichen Informationen, wenn wir sie wirklich benötigen, um Ihnen einen Dienst bereitzustellen. Wir sammeln sie auf faire und rechtmäßige Weise, mit Ihrem Wissen und Ihrer Zustimmung. Wir teilen Ihnen auch mit, warum wir sie sammeln und wie sie verwendet werden.",
          h2: "2. Verwendung von Informationen",
          p3: "Wir bewahren gesammelte Informationen nur so lange auf, wie es erforderlich ist, um Ihnen den gewünschten Service zu bieten. Welche Daten wir speichern, schützen wir mit kommerziell akzeptablen Mitteln, um Verlust und Diebstahl sowie unbefugten Zugriff, Offenlegung, Kopieren, Verwendung oder Änderung zu verhindern."
        },
        terms: {
          h1: "1. Bedingungen",
          p1: "Durch den Zugriff auf die Website unter oLoveTools erklären Sie sich mit diesen Nutzungsbedingungen sowie allen geltenden Gesetzen und Vorschriften einverstanden und stimmen zu, dass Sie für die Einhaltung aller geltenden lokalen Gesetze verantwortlich sind.",
          h2: "2. Nutzungslizenz",
          p2: "Es wird die Erlaubnis erteilt, vorübergehend eine Kopie der Materialien (Informationen oder Software) auf der Website von oLoveTools nur für die persönliche, nicht kommerzielle, vorübergehende Betrachtung herunterzuladen.",
          h3: "3. Haftungsausschluss",
          p3: "Die Materialien auf der Website von oLoveTools werden 'wie besehen' zur Verfügung gestellt. oLoveTools gibt keine ausdrücklichen oder stillschweigenden Garantien ab und lehnt hiermit alle anderen Garantien ab und verneint sie, einschließlich, aber nicht beschränkt auf stillschweigende Garantien oder Bedingungen der Marktgängigkeit, der Eignung für einen bestimmten Zweck oder der Nichtverletzung von geistigem Eigentum oder anderen Rechtsverletzungen."
        },
        cookies: {
          p1: "Diese Cookie-Richtlinie erklärt, was Cookies sind und wie wir sie verwenden. Sie sollten diese Richtlinie lesen, damit Sie verstehen, welche Art von Cookies wir verwenden, oder welche Informationen wir mithilfe von Cookies sammeln und wie diese Informationen verwendet werden.",
          h1: "Was sind Cookies?",
          p2: "Cookies sind kleine Textdateien, die auf Ihrem Computer oder Mobilgerät gespeichert werden, wenn Sie eine Website besuchen. Sie werden häufig verwendet, um Websites funktionsfähig zu machen oder effizienter arbeiten zu lassen sowie um den Eigentümern der Website Informationen bereitzustellen.",
          h2: "Wie verwenden wir Cookies?",
          p3: "Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern, personalisierte Anzeigen oder Inhalte bereitzustellen und unseren Datenverkehr zu analysieren. Wir verwenden wesentliche Cookies, um Ihre Spracheinstellung und andere Einstellungen zu speichern."
        }
      }
    },
    fr: { 
      footerRights: "Tous droits réservés", privacyPolicy: "Politique de confidentialité", termsOfService: "Conditions d'utilisation", cookiesPolicy: "Politique relative aux cookies",
      contactTitle: "Vous avez une idée ?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "Copié !",
      contactText: "Contact pour idées & feedback :", contactModal: "Pour toute question ou suggestion, veuillez nous contacter à :",
      modals: {
        privacy: {
          p1: "Votre confidentialité est importante pour nous. La politique d'oLoveTools est de respecter votre vie privée concernant toute information que nous pourrions collecter auprès de vous sur notre site Web et sur d'autres sites que nous possédons et exploitons.",
          h1: "1. Informations que nous collectons",
          p2: "Nous ne demandons des informations personnelles que lorsque nous en avons réellement besoin pour vous fournir un service. Nous les collectons par des moyens équitables et légaux, avec votre connaissance et votre consentement. Nous vous indiquons également pourquoi nous les collectons et comment elles seront utilisées.",
          h2: "2. Utilisation des informations",
          p3: "Nous ne conservons les informations collectées que le temps nécessaire pour vous fournir le service demandé. Les données que nous stockons seront protégées par des moyens commercialement acceptables pour éviter la perte et le vol, ainsi que l'accès, la divulgation, la copie, l'utilisation ou la modification non autorisés."
        },
        terms: {
          h1: "1. Conditions",
          p1: "En accédant au site Web oLoveTools, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable du respect des lois locales applicables.",
          h2: "2. Licence d'utilisation",
          p2: "L'autorisation est accordée de télécharger temporairement une copie du matériel (information ou logiciel) sur le site Web d'oLoveTools pour une visualisation transitoire personnelle et non commerciale uniquement.",
          h3: "3. Clause de non-responsabilité",
          p3: "Le matériel sur le site Web d'oLoveTools est fourni « tel quel ». oLoveTools ne donne aucune garantie, expresse ou implicite, et décline et annule par la presente toutes les autres garanties, y compris, sans s'y limiter, les garanties ou conditions implicites de qualité marchande, d'adéquation à un usage particulier, ou de non-violation de la propriété intellectuelle ou autre violation des droits."
        },
        cookies: {
          p1: "Cette politique relative aux cookies explique ce que sont les cookies et comment nous les utilisons. Vous devriez lire cette politique afin de comprendre quel type de cookies nous utilisons, ou les informations que nous collectons à l'aide de cookies et comment ces informations sont utilisées.",
          h1: "Que sont les cookies ?",
          p2: "Les cookies sont de petits fichiers texte qui sont stockés sur votre ordinateur ou appareil mobile lorsque vous visitez un site Web. Ils sont largement utilisés pour faire fonctionner les sites Web, ou les faire fonctionner plus efficacement, ainsi que pour fournir des informations aux propriétaires du site.",
          h2: "Comment utilisons-nous les cookies ?",
          p3: "Nous utilisons cookies pour améliorer votre expérience de navigation, diffuser des publicités ou du contenu personnalisés et analyser notre trafic. Nous utilisons des cookies essentiels pour mémoriser votre préférence de langue et d'autres paramètres."
        }
      }
    },
    pt: { 
      footerRights: "Todos os direitos reservados", privacyPolicy: "Política de Privacidade", termsOfService: "Termos de Serviço", cookiesPolicy: "Política de Cookies",
      contactTitle: "Tem uma ideia?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "Copiado!",
      contactText: "Contato para ideias e feedback:", contactModal: "Para quaisquer dúvidas ou sugestões, contacte-nos em:",
      modals: {
        privacy: {
          p1: "Sua privacidade é importante para nós. É política do oLoveTools respeitar sua privacidade em relação a qualquer informação que possamos coletar de você em nosso site e em outros sites que possuímos e operamos.",
          h1: "1. Informações que coletamos",
          p2: "Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.",
          h2: "2. Uso de Informações",
          p3: "Retemos as informações coletadas apenas pelo tempo necessário para fornecer o serviço solicitado. Os dados que armazenamos, protegeremos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados."
        },
        terms: {
          h1: "1. Termos",
          p1: "Ao acessar o site oLoveTools, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicables.",
          h2: "2. Licença de Uso",
          p2: "É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site do oLoveTools apenas para visualização transitória pessoal e não comercial.",
          h3: "3. Isenção de responsabilidade",
          p3: "Os materiais no site do oLoveTools são fornecidos 'como estão'. O oLoveTools não oferece garantias, expressas ou implicitas, e por meio deste isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implicitas ou condições de comercialização, adequação a um propósito específico ou não violação de propriedade intelectual ou outra violação de direitos."
        },
        cookies: {
          p1: "Esta Política de Cookies explica o que são cookies e como os usamos. Você deve ler esta política para entender que tipo de cookies usamos, ou as informações que coletamos usando cookies e como essas informações são usadas.",
          h1: "O que são cookies?",
          p2: "Cookies são pequenos arquivos de texto armazenados no seu computador ou dispositivo móvel quando você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem, ou funcionarem com mais eficiência, bem como para fornecer informações aos proprietários do site.",
          h2: "Como usamos os cookies?",
          p3: "Usamos cookies para melhorar sua experiência de navegação, veicular anúncios ou conteúdo personalizado e analisar nosso tráfego. Usamos cookies essenciais para lembrar sua preferência de idioma e outras configurações."
        }
      }
    },
    ru: { 
      footerRights: "Все права защищены", privacyPolicy: "Политика конфиденциальности", termsOfService: "Условия использования", cookiesPolicy: "Политика использования файлов cookie",
      contactTitle: "Есть идея?", contactEmail: "adrian.contact.me.69@gmail.com", copied: "Копировать!",
      contactText: "Контакт для идей и отзывов:", contactModal: "По любым вопросам или предложениям, пожалуйста, свяжитесь с нами по адресу:",
      modals: {
        privacy: {
          p1: "Ваша конфиденциальность важна для нас. Политика oLoveTools заключается в уважении вашей конфиденциальности в отношении любой информации, которую мы можем собирать от вас на нашем веб-сайте и других сайтах, которыми мы владеем и управляем.",
          h1: "1. Информация, которую мы собираем",
          p2: "Мы запрашиваем личную информацию только тогда, когда она нам действительно нужна для предоставления вам услуги. Мы собираем ее законными и справедливыми способами, с вашего ведома и согласия. Мы также сообщаем вам, почему мы ее собираем и как она будет использоваться.",
          h2: "2. Использование информации",
          p3: "Мы храним собранную информацию только до тех пор, пока это необходимо для предоставления вам запрошенной услуги. Данные, которые мы храним, мы будем защищать коммерчески приемлемыми средствами для предотвращения потери и кражи, а также несанкционированного доступа, раскрытия, копирования, использования или изменения."
        },
        terms: {
          h1: "1. Условия",
          p1: "Посещая веб-сайт oLoveTools, вы соглашаетесь соблюдать эти условия обслуживания, все применимые законы и правила, а также соглашаетесь с тем, что вы несете ответственность за соблюдение любых применимых местных законов.",
          h2: "2. Лицензия на использование",
          p2: "Разрешается временная загрузка одной копии материалов (информации или программного обеспечения) на веб-сайте oLoveTools только для личного некоммерческого временного просмотра.",
          h3: "3. Отказ от ответственности",
          p3: "Материалы на веб-сайте oLoveTools предоставляются «как есть». oLoveTools не дает никаких гарантий, явных или подразумеваемых, и настоящим отказывается от всех других гарантий, включая, помимо прочего, подразумеваемые гарантии или условия товарной пригодности, пригодности для определенной цели или ненарушения прав интеллектуальной собственности или иного нарушения прав."
        },
        cookies: {
          p1: "Эта Политика использования файлов cookie объясняет, что такое файлы cookie и как мы их используем. Вам следует прочитать эту политику, чтобы понять, какой тип файлов cookie мы используем, или какую информацию мы собираем с помощью файлов cookie и как эта информация используется.",
          h1: "Что такое файлы cookie?",
          p2: "Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем компьютере или мобильном устройстве при посещении веб-сайта. Они широко используются для того, чтобы веб-сайты работали или работали более эффективно, а также для предоставления информации владельцам сайта.",
          h2: "Как мы используем файлы cookie?",
          p3: "Мы используем файлы cookie для улучшения вашего опыта просмотра, показа персонализированной рекламы или контента, а также для анализа нашего трафика. Мы используем основные файлы cookie для запоминания ваших языковых предпочтений и других настроек."
        }
      }
    },
    ja: { 
      footerRights: "All Rights Reserved", privacyPolicy: "プライバシーポリシー", termsOfService: "利用規約", cookiesPolicy: "クッキーポリシー",
      contactTitle: "アイデアはありますか？", contactEmail: "adrian.contact.me.69@gmail.com", copied: "コピーしました！",
      contactText: "アイデアやフィードバックの連絡先：", contactModal: "ご質問やご提案がございましたら、こちらまでご連絡ください：",
      modals: {
        privacy: {
          p1: "お客様のプライバシーは私たちにとって重要です。oLoveToolsのポリシーは、当社のWebサイトおよび当社が所有および運営する他のサイト全体でお客様から収集する可能性のある情報に関して、お客様のプライバシーを尊重することです。",
          h1: "1. 収集する情報",
          p2: "私たちは、お客様にサービスを提供するために本当に必要な場合にのみ個人情報を求めます。私たちは、お客様の知識と同意を得て、公正かつ合法的な手段でそれを収集します。また、収集する理由と使用方法についてもお知らせします。",
          h2: "2. 情報の使用",
          p3: "収集した情報は、要求されたサービスを提供するために必要な期間のみ保持します。保存するデータは、紛失や盗難、不正アクセス、開示、コピー、使用、変更を防ぐために、商業的に許容される手段で保護します。"
        },
        terms: {
          h1: "1. 利用規約",
          p1: "oLoveToolsのWebサイトにアクセスすることにより、これらの利用規約、適用されるすべての法律および規制に拘束されることに同意し、適用される現地の法律を遵守する責任があることに同意するものとします。",
          h2: "2. 使用ライセンス",
          p2: "個人的、非営利の一時的な閲覧のみを目的として、oLoveToolsのWebサイト上の資料（情報またはソフトウェア）のコピーを1部一時的にダウンロードする許可が与えられます。",
          h3: "3. 免責事項",
          p3: "oLoveToolsのWebサイト上の資料は「現状有姿」で提供されます。oLoveToolsは、明示または黙示を問わず、いかなる保証も行わず、商品性、特定の目的への適合性、または知的財産の非侵害またはその他の権利の侵害の黙示の保証または条件を含むがこれらに限定されない、他のすべての保証を否認および無効にします。"
        },
        cookies: {
          p1: "このクッキーポリシーは、クッキーとは何か、およびその使用方法について説明しています。このポリシーを読んで、使用するクッキーの種類、またはクッキーを使用して収集する情報と、その情報がどのように使用されるかを理解する必要があります。",
          h1: "クッキーとは何ですか？",
          p2: "クッキーは、Webサイトにアクセスしたときにコンピューターまたはモバイルデバイスに保存される小さなテキストファイルです。これらは、Webサイトを機能させるため、またはより効率的に機能させるため、およびサイトの所有者に情報を提供するために広く使用されています。",
          h2: "クッキーをどのように使用しますか？",
          p3: "クッキーを使用して、ブラウジングエクスペリエンスを向上させ、パーソナライズされた広告やコンテンツを提供し、トラフィックを分析します。言語設定やその他の設定を記憶するために、不可欠なクッキーを使用します।"
        }
      }
    },
    zh: { 
      footerRights: "保留所有权利", privacyPolicy: "隐私政策", termsOfService: "服务条款", cookiesPolicy: "Cookie 政策",
      contactTitle: "有想法吗？", contactEmail: "adrian.contact.me.69@gmail.com", copied: "已复制！",
      contactText: "创意与反馈联系方式：", contactModal: "如有任何疑问或建议，请通过以下方式联系我们：",
      modals: {
        privacy: {
          p1: "您的隐私对我们很重要。oLoveTools 的政策是尊重您在我们的网站以及我们拥有和运营的其他网站上可能收集的任何信息的隐私。",
          h1: "1. 我们收集的信息",
          p2: "我们只有在真正需要为您提供服务时才会要求提供个人信息。我们在您知情并同意的情况下，通过公平合法的方式收集它。我们还会让您知道我们收集它的原因以及将如何使用它。",
          h2: "2. 信息的使用",
          p3: "我们仅在为您提供所需服务所需的时间内保留收集的信息。对于我们存储的数据，我们将在商业上可接受的范围内对其进行保护，以防止丢失和被盗，以及未经授权的访问、披露、复制、使用或修改。"
        },
        terms: {
          h1: "1. 条款",
          p1: "通过访问 oLoveTools 的网站，您同意受这些服务条款、所有适用法律和法规的约束，并同意您有责任遵守任何适用的当地法律。",
          h2: "2. 使用许可",
          p2: "允许暂时下载 oLoveTools 网站上的材料（信息或软件）的一份副本，仅供个人、非商业的暂时查看。",
          h3: "3. 免责声明",
          p3: "oLoveTools 网站上的材料按“原样”提供。oLoveTools 不作任何明示或暗示的保证，并在此声明并否定所有其他保证，包括但不限于适销性、特定用途的适用性或不侵犯知识产权或其他侵权行为 की暗示保证或条件。"
        },
        cookies: {
          p1: "本 Cookie 政策解释了什么是 Cookie 以及我们如何使用它们。您应该阅读本政策，以便了解我们使用的 Cookie 类型，或者我们使用 Cookie 收集的信息以及该信息的使用方式。",
          h1: "什么是 Cookie？",
          p2: "Cookie 是您访问网站时存储在您的计算机或移动设备上的小文本文件。它们被广泛用于使网站工作或更有效地工作，以及向网站所有者提供信息。",
          h2: "我们如何使用 Cookie？",
          p3: "我们使用 Cookie 来增强您的浏览体验、提供个性化广告或内容并分析我们的流量。我们使用基本 Cookie 来记住您的语言偏好和其他设置।"
        }
      }
    }
  };

  const t = layoutTranslations[currentLang];

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Persist language on every page load
  useEffect(() => {
    localStorage.setItem('olovetools_lang', currentLang);
  }, [currentLang]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang: LanguageCode) => {
    setIsLangMenuOpen(false);
    localStorage.setItem('olovetools_lang', newLang);
    window.location.href = `/${newLang}`;
  };

  const [copied, setCopied] = useState(false);
  
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(t.contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-[#0f0f12]/80 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href={`/${currentLang}`} className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-indigo-500/20">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-2xl font-bold text-white font-outfit tracking-tight">
                oLoveTools
              </span>
            </a>
            
            <div className="flex items-center gap-6">
              {/* Language Selector */}
              <div className="relative" ref={langMenuRef}>
                <button 
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 border border-white/10 text-slate-200 text-sm font-medium backdrop-blur-md cursor-pointer"
                >
                  <span className="bg-indigo-500/20 text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                    {currentLang}
                  </span>
                  <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === currentLang)?.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-[#0a0a0c] backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] py-3 z-50 overflow-hidden ring-1 ring-emerald-500/10 box-shadow-emerald"
                  >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    {LANGUAGES.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors cursor-pointer ${
                          currentLang === language.code 
                            ? 'bg-indigo-500/10 text-indigo-300' 
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                         <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                           currentLang === language.code ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400'
                         }`}>
                           {language.code}
                         </span>
                         <span className="font-medium">{language.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0f0f12] py-12 md:py-16 mt-auto relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Heart className="w-4 h-4 text-indigo-500 fill-indigo-500" />
              </div>
              <span className="font-bold text-white font-outfit text-xl tracking-tight">oLoveTools</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-white/10" />
            <span className="text-slate-500 text-sm font-medium">© {currentYear} {t.footerRights}</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
            <div className="flex flex-col items-center md:items-end gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">{t.contactText}</span>
              <div className="relative w-full max-w-[280px] md:w-auto">
                <button 
                  onClick={handleCopyEmail}
                  className="flex items-center justify-center md:justify-start gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group cursor-pointer relative overflow-hidden w-full"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors truncate">{t.contactEmail}</span>
                  <AnimatePresence>
                    {copied && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-emerald-500 text-white text-xs font-bold z-10"
                      >
                        <Check className="w-3.5 h-3.5 inline-block mr-1.5" /> {t.copied}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
            <div className="hidden md:block h-6 w-px bg-white/10" />
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-xs text-slate-500 font-bold uppercase tracking-[0.15em] w-full md:w-auto">
              <button onClick={() => setActiveModal('privacy')} className="hover:text-indigo-400 transition-colors cursor-pointer py-2 md:py-0 w-full md:w-auto">{t.privacyPolicy}</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-indigo-400 transition-colors cursor-pointer py-2 md:py-0 w-full md:w-auto">{t.termsOfService}</button>
              <button onClick={() => setActiveModal('cookies')} className="hover:text-indigo-400 transition-colors cursor-pointer py-2 md:py-0 w-full md:w-auto">{t.cookiesPolicy}</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)} title={t.privacyPolicy}>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.privacy.p1}
        </p>
        <h3 className="text-xl font-semibold text-white mt-8 mb-4 font-outfit">{t.modals.privacy.h1}</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.privacy.p2}
        </p>
        <h3 className="text-xl font-semibold text-white mt-8 mb-4 font-outfit">{t.modals.privacy.h2}</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.privacy.p3}
        </p>

        <div className="pt-8 border-t border-white/5 mt-8">
          <p className="text-slate-400 text-sm mb-4">{t.contactModal}</p>
          <button 
            onClick={handleCopyEmail}
            className="flex items-center justify-center sm:justify-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-fit group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
          >
            <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-white font-mono text-sm sm:text-base truncate">{t.contactEmail}</span>
            <AnimatePresence>
              {copied && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-emerald-500 text-white text-[15px] font-bold z-10"
                >
                  <Check className="w-4 h-4 inline-block mr-1.5" /> {t.copied}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)} title={t.termsOfService}>
        <h3 className="text-xl font-semibold text-white mt-4 mb-4 font-outfit">{t.modals.terms.h1}</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.terms.p1}
        </p>
        <h3 className="text-xl font-semibold text-white mt-8 mb-4 font-outfit">{t.modals.terms.h2}</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.terms.p2}
        </p>
        <h3 className="text-xl font-semibold text-white mt-8 mb-4 font-outfit">{t.modals.terms.h3}</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.terms.p3}
        </p>

        <div className="pt-8 border-t border-white/5 mt-8">
          <p className="text-slate-400 text-sm mb-4">{t.contactModal}</p>
          <button 
            onClick={handleCopyEmail}
            className="flex items-center justify-center sm:justify-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-fit group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
          >
            <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-white font-mono text-sm sm:text-base truncate">{t.contactEmail}</span>
            <AnimatePresence>
              {copied && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-emerald-500 text-white text-[15px] font-bold z-10"
                >
                  <Check className="w-4 h-4 inline-block mr-1.5" /> {t.copied}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'cookies'} onClose={() => setActiveModal(null)} title={t.cookiesPolicy}>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.cookies.p1}
        </p>
        <h3 className="text-xl font-semibold text-white mt-8 mb-4 font-outfit">{t.modals.cookies.h1}</h3>
        <p className="text-slate-300 leading-relaxed mb-6">
          {t.modals.cookies.p2}
        </p>
        <h3 className="text-xl font-semibold text-white mt-8 mb-4 font-outfit">{t.modals.cookies.h2}</h3>
        <p className="text-slate-300 leading-relaxed mb-8">
          {t.modals.cookies.p3}
        </p>
        
        <div className="pt-8 border-t border-white/5 mt-8">
          <p className="text-slate-400 text-sm mb-4">{t.contactModal}</p>
          <button 
            onClick={handleCopyEmail}
            className="flex items-center justify-center sm:justify-start gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl w-full sm:w-fit group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
          >
            <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-white font-mono text-sm sm:text-base truncate">{t.contactEmail}</span>
            <AnimatePresence>
              {copied && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-emerald-500 text-white text-[15px] font-bold z-10"
                >
                  <Check className="w-4 h-4 inline-block mr-1.5" /> {t.copied}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </Modal>
    </div>
  );
};
