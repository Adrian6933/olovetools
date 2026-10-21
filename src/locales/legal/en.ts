export default {
  privacy: {
    title: "Privacy Policy",
    description: "Comprehensive privacy policy for oLoveTools.",
    content: `
      <h2>1. Introduction</h2>
      <p>Your privacy is important to us. It is oLoveTools' policy to respect your privacy regarding any information we may collect from you across our website, olovetools.com, and other sites we own and operate.</p>
      <br/>
      <h2>2. Information we collect</h2>
      <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
      <p>For most of our tools (such as Clipy, TwitchBolt, FormatFlow, and PasteSnap), processing happens entirely in your browser. We do not store your clips, images, or formatted code on our servers.</p>
      <br/>
      <h2>3. Third-Party Services and Ads</h2>
      <p>Our website uses Google AdSense to serve ads. Google uses cookies to serve ads based on a user's prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.</p>
      <br/>
      <h2>4. Data Retention</h2>
      <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
      <br/>
      <h2>5. User Rights</h2>
      <p>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</p>
    `
  },
  terms: {
    title: "Terms of Service",
    description: "Terms and conditions for using oLoveTools.",
    content: `
      <h2>1. Terms</h2>
      <p>By accessing the website at oLoveTools, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
      <br/>
      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily download one copy of the materials (information or software) on oLoveTools' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
      <br/>
      <h2>3. Disclaimer</h2>
      <p>The materials on oLoveTools' website are provided on an 'as is' basis. oLoveTools makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
      <br/>
      <h2>4. Limitations</h2>
      <p>In no event shall oLoveTools or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on oLoveTools' website.</p>
      <br/>
      <h2>5. Third-Party Content</h2>
      <p>Some of our tools (e.g., Clipy, TwitchBolt) interact with third-party APIs (like Twitch). By using these tools, you must also comply with the respective Terms of Service of those third-party platforms. We do not host or own the media content retrieved through these APIs.</p>
    `
  },
  cookies: {
    title: "Cookies Policy",
    description: "Information about our use of cookies and tracking technologies.",
    content: `
      <h2>1. What are cookies?</h2>
      <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
      <br/>
      <h2>2. How we use cookies</h2>
      <p>We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. We use essential cookies to remember your language preference and other settings.</p>
      <br/>
      <h2>3. Google AdSense Cookies</h2>
      <p>We use Google AdSense to serve ads on our site. Google's use of the DART cookie enables it to serve ads to our users based on their visit to our site and other sites on the Internet. Users may opt out of the use of the DART cookie by visiting the Google ad and content network privacy policy.</p>
      <br/>
      <h2>4. Managing Cookies</h2>
      <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.</p>
    `
  },
  about: {
    title: "About oLoveTools",
    description: "Who makes oLoveTools, which tools use a server, how the site is paid for and how to get in touch.",
    content: `
      <h2>Who is behind it</h2>
      <p>oLoveTools is a one-person project. Every tool is designed, written and maintained by Adrián González, a developer based in Spain.</p>
      <h2>What runs where</h2>
      <p>Most tools work entirely inside your browser: compressing an image, merging a PDF, reading a QR code or formatting JSON happens on your own device, and the file is never uploaded.</p>
      <p>A few tools cannot work that way, and they say so on their own page:</p>
      <ul>
        <li>The Twitch, Kick, TikTok and X clip tools relay requests through this site, because those platforms do not let a browser fetch their videos directly.</li>
        <li>Text to speech sends your text to Microsoft's speech service through this site.</li>
        <li>WHOIS lookups and some FormatFlow conversions run on this site's server.</li>
      </ul>
      <p>The site keeps no copy of what you process. The only thing it counts is how many times each tool is opened, with no cookie or identifier attached.</p>
      <h2>How it is paid for</h2>
      <p>The tools are free and need no account. The site shows ads from Google AdSense; you choose what you consent to in the banner on your first visit, and the <a href="/en/cookies/">cookie policy</a> explains the details.</p>
      <h2>Some places to start</h2>
      <ul>
        <li>Images: <a href="/en/compresssnap/">CompressSnap</a>, <a href="/en/formatflow/">FormatFlow</a>, <a href="/en/backgroundremover/">Background Remover</a></li>
        <li>Documents and QR codes: <a href="/en/pdf-flow/">PDFFlow</a>, <a href="/en/qr-bolt/">QRBolt</a>, <a href="/en/qr-reader/">QR Reader</a></li>
        <li>Clips: <a href="/en/clipy/">Clipy</a> and <a href="/en/twitchbolt/">TwitchBolt</a> for Twitch, <a href="/en/klipy/">Klipy</a> and <a href="/en/kickbolt/">KickBolt</a> for Kick</li>
        <li>Code: <a href="/en/json-flow/">JSONFlow</a>, <a href="/en/regex-flow/">RegexFlow</a>, <a href="/en/uuid-generator/">UUID Generator</a></li>
      </ul>
      <h2>Contact</h2>
      <p>Bugs, ideas or a tool you are missing: write to <a href="mailto:adrian.contact.me.69@gmail.com">adrian.contact.me.69@gmail.com</a>.</p>
    `
  },
  nav: {
    home: "Home",
    privacy: "Privacy",
    terms: "Terms",
    cookies: "Cookies",
    about: "About"
  }
};
