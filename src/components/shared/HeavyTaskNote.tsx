// Aviso pequeño junto a los botones que ponen a trabajar de verdad al equipo
// (codificar vídeo, pasar un modelo de IA, lotes de fotos grandes): todo corre
// en el navegador, así que conviene decir que va a subir la GPU y la memoria.
// En un equipo justo añade una línea más: la tool ya va de una en una.
//
// Los textos viven aquí y no en el diccionario de cada tool: son los mismos en
// todas, cortos, y así la isla no necesita que la página le pase nada nuevo.
import React, { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import { esEquipoFlojo } from '../../lib/deviceTier';

export type HeavyTaskKind = 'video' | 'ai' | 'images';

interface Textos {
  label: string;
  video: string;
  ai: string;
  images: string;
  weak: string;
}

const TEXTOS: Record<string, Textos> = {
  en: {
    label: 'Heavy on resources',
    video: 'The video is encoded on your device: GPU and memory usage go up while it exports. Long clips or several at once take longer.',
    ai: 'The AI runs on your device: it downloads a model and uses the GPU and memory while it works.',
    images: 'Large images are processed on your device and use a lot of memory, especially in big batches.',
    weak: 'Your device looks modest: it may take longer, and we run less work at once so it stays stable. Closing other heavy tabs helps.',
  },
  es: {
    label: 'Consume bastantes recursos',
    video: 'El vídeo se codifica en tu equipo: mientras exporta sube el uso de GPU y memoria. Los clips largos o varios a la vez tardan más.',
    ai: 'La IA funciona en tu equipo: descarga un modelo y usa la GPU y la memoria mientras trabaja.',
    images: 'Las imágenes grandes se procesan en tu equipo y gastan bastante memoria, sobre todo en lotes grandes.',
    weak: 'Tu equipo parece justo: puede tardar más, y hacemos menos cosas a la vez para que no se cuelgue. Cerrar otras pestañas pesadas ayuda.',
  },
  de: {
    label: 'Ressourcenintensiv',
    video: 'Das Video wird auf deinem Gerät kodiert: Während des Exports steigen GPU- und Speicherauslastung. Lange Clips oder mehrere gleichzeitig dauern länger.',
    ai: 'Die KI läuft auf deinem Gerät: Sie lädt ein Modell herunter und nutzt währenddessen GPU und Arbeitsspeicher.',
    images: 'Große Bilder werden auf deinem Gerät verarbeitet und brauchen viel Speicher, vor allem in großen Stapeln.',
    weak: 'Dein Gerät wirkt eher schwach: Es kann länger dauern, und wir machen weniger gleichzeitig, damit es stabil bleibt. Andere schwere Tabs zu schließen hilft.',
  },
  fr: {
    label: 'Gourmand en ressources',
    video: "La vidéo est encodée sur ton appareil : l'utilisation du GPU et de la mémoire augmente pendant l'export. Les clips longs ou plusieurs à la fois prennent plus de temps.",
    ai: "L'IA tourne sur ton appareil : elle télécharge un modèle et utilise le GPU et la mémoire pendant le traitement.",
    images: 'Les grandes images sont traitées sur ton appareil et consomment beaucoup de mémoire, surtout en gros lots.',
    weak: 'Ton appareil semble modeste : cela peut prendre plus de temps, et on lance moins de travail à la fois pour rester stable. Fermer les autres onglets lourds aide.',
  },
  pt: {
    label: 'Usa bastantes recursos',
    video: 'O vídeo é codificado no seu dispositivo: o uso de GPU e memória sobe durante a exportação. Clipes longos ou vários ao mesmo tempo demoram mais.',
    ai: 'A IA roda no seu dispositivo: baixa um modelo e usa a GPU e a memória enquanto trabalha.',
    images: 'Imagens grandes são processadas no seu dispositivo e usam bastante memória, principalmente em lotes grandes.',
    weak: 'Seu dispositivo parece modesto: pode demorar mais, e fazemos menos coisas ao mesmo tempo para não travar. Fechar outras abas pesadas ajuda.',
  },
  ru: {
    label: 'Требует много ресурсов',
    video: 'Видео кодируется на вашем устройстве: во время экспорта растёт нагрузка на GPU и память. Длинные клипы или несколько сразу обрабатываются дольше.',
    ai: 'ИИ работает на вашем устройстве: он загружает модель и использует GPU и память во время работы.',
    images: 'Большие изображения обрабатываются на вашем устройстве и занимают много памяти, особенно большими пакетами.',
    weak: 'Устройство выглядит слабым: обработка может занять больше времени, и мы выполняем меньше задач одновременно, чтобы всё работало стабильно. Закройте другие тяжёлые вкладки.',
  },
  hi: {
    label: 'ज़्यादा संसाधन लेता है',
    video: 'वीडियो आपके डिवाइस पर एनकोड होता है: एक्सपोर्ट के दौरान GPU और मेमोरी का उपयोग बढ़ता है। लंबे क्लिप या एक साथ कई क्लिप में ज़्यादा समय लगता है।',
    ai: 'AI आपके डिवाइस पर चलता है: यह एक मॉडल डाउनलोड करता है और काम करते समय GPU और मेमोरी का उपयोग करता है।',
    images: 'बड़ी इमेज आपके डिवाइस पर प्रोसेस होती हैं और काफ़ी मेमोरी लेती हैं, ख़ासकर बड़े बैच में।',
    weak: 'आपका डिवाइस साधारण लगता है: ज़्यादा समय लग सकता है, और स्थिरता के लिए हम एक साथ कम काम चलाते हैं। दूसरे भारी टैब बंद करने से मदद मिलती है।',
  },
  ja: {
    label: 'リソースを多く使います',
    video: '動画はお使いの端末でエンコードされます。書き出し中は GPU とメモリの使用量が増えます。長いクリップや複数同時の処理は時間がかかります。',
    ai: 'AI はお使いの端末で動作します。モデルをダウンロードし、処理中は GPU とメモリを使います。',
    images: '大きな画像はお使いの端末で処理され、特に大量の一括処理ではメモリを多く使います。',
    weak: '端末の性能が控えめなようです。時間がかかる場合があり、安定して動くよう同時に行う処理を減らしています。ほかの重いタブを閉じると効果的です。',
  },
  zh: {
    label: '占用资源较多',
    video: '视频在你的设备上编码：导出期间 GPU 和内存占用会升高。长片段或同时处理多个会更慢。',
    ai: 'AI 在你的设备上运行：它会下载模型，并在处理时使用 GPU 和内存。',
    images: '大图片在你的设备上处理，会占用较多内存，批量较大时尤其明显。',
    weak: '你的设备配置较低：处理可能更慢，我们会减少同时进行的任务以保持稳定。关闭其他占用较大的标签页会有帮助。',
  },
};

interface HeavyTaskNoteProps {
  lang: string;
  kind: HeavyTaskKind;
  className?: string;
}

export const HeavyTaskNote: React.FC<HeavyTaskNoteProps> = ({ lang, kind, className = '' }) => {
  const tx = TEXTOS[lang] || TEXTOS.en;
  // Después del montaje: leer navigator en el render rompería la hidratación.
  const [flojo, setFlojo] = useState(false);
  useEffect(() => setFlojo(esEquipoFlojo()), []);

  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2 text-left text-[11px] leading-snug text-slate-400 ${className}`}
    >
      <Gauge className="mt-px h-3.5 w-3.5 shrink-0 text-amber-300/80" aria-hidden="true" />
      <p>
        <span className="font-bold text-amber-200/90">{tx.label}.</span> {tx[kind]}
        {flojo && <span className="mt-1 block text-amber-200/70">{tx.weak}</span>}
      </p>
    </div>
  );
};
