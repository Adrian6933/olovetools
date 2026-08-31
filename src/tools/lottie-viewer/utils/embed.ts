// ============================================================================
// Embed snippets.
//
// Getting an edited Lottie onto a page is the step everybody has to google.
// These are the three shapes that cover it, generated against the settings the
// user actually picked in the player rather than a generic template.
// ============================================================================

export type EmbedFlavor = 'webComponent' | 'react' | 'vanilla';

export interface EmbedOptions {
  fileName: string;
  loop: boolean;
  speed: number;
  width: number;
  height: number;
}

const CDN_NOTE =
  '<!-- The player script is loaded from a CDN; the animation file itself stays on your own server. -->';

export function buildEmbedSnippet(flavor: EmbedFlavor, options: EmbedOptions): string {
  const { fileName, loop, speed, width, height } = options;
  const src = `/${fileName}`;

  if (flavor === 'webComponent') {
    return `${CDN_NOTE}
<script src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.7.2/dist/dotlottie-wc.js" type="module"></script>

<dotlottie-wc
  src="${src}"
  style="width: ${width}px; height: ${height}px"
  speed="${speed}"
  ${loop ? 'loop\n  ' : ''}autoplay
></dotlottie-wc>`;
  }

  if (flavor === 'react') {
    return `// npm i lottie-react
import Lottie from 'lottie-react';
import animationData from './${fileName}';

export function Animation() {
  return (
    <Lottie
      animationData={animationData}
      loop={${loop}}
      style={{ width: ${width}, height: ${height} }}
    />
  );
}`;
  }

  return `<!-- npm i lottie-web  (or load it from a CDN) -->
<div id="animation" style="width: ${width}px; height: ${height}px"></div>

<script type="module">
  import lottie from 'https://cdn.jsdelivr.net/npm/lottie-web@5.13.0/build/player/esm/lottie.min.js';

  const animation = lottie.loadAnimation({
    container: document.getElementById('animation'),
    renderer: 'svg',
    loop: ${loop},
    autoplay: true,
    path: '${src}',
  });
  animation.setSpeed(${speed});
</script>`;
}
