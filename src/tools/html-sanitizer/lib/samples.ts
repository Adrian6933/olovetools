// ============================================================================
// Demo payloads
// ----------------------------------------------------------------------------
// Two buttons, two very different jobs. "Messy paste" is what actually lands in
// a CMS when someone copies out of Word or a marketing page. "Attack sample"
// collects the payloads the previous version of this tool let straight through
// (javascript: hrefs, data:text/html, formaction, mXSS) so anyone can verify
// the fix in one click instead of taking our word for it.
// ============================================================================

export const SAMPLE_MESSY = `<!-- pasted out of a CMS -->
<div class="wysiwyg-root" id="content-1" style="font-family:Calibri; mso-line-height:115%">
  <o:p></o:p>
  <font face="Calibri" size="3" color="#1f497d">
    <h2 class="Heading2" style="margin:0cm 0cm 8pt">Quarterly summary</h2>
  </font>
  <p class="MsoNormal" style="margin-bottom:8pt">
    Revenue grew <b><span style="color:#70AD47">18%</span></b> against a
    <a href="/reports/q3" target="_blank" onclick="track('cta')">flat forecast</a>.
  </p>
  <table border="1" cellpadding="4" cellspacing="0" width="100%">
    <tr><th>Region</th><th>Change</th></tr>
    <tr><td>EMEA</td><td>+22%</td></tr>
    <tr><td>APAC</td><td>+9%</td></tr>
  </table>
  <script>window.__analytics.push({page:'q3'});</script>
  <style>.wysiwyg-root p { margin: 0 }</style>
  <iframe src="https://player.example.com/embed/9f2" width="560" height="315"></iframe>
</div>`;

export const SAMPLE_ATTACK = `<p>Looks harmless enough.</p>
<a href="javascript:alert(document.domain)">Click me</a>
<a href="data:text/html,<script>alert(1)</script>">Or me</a>
<img src=x onerror="alert(1)">
<form action="//evil.example"><button formaction="javascript:alert(1)">Send</button></form>
<div style="background:url(javascript:alert(1))">styled</div>
<svg><use xlink:href="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+"/></svg>
<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">
<template><script>alert('template')</script></template>
<base href="//evil.example/">
<meta http-equiv="refresh" content="0;url=javascript:alert(1)">
<a href="  jav&#x09;ascript:alert(1)">whitespace trick</a>`;

/** What the clipboard holds after copying a few paragraphs out of Google Docs. */
export const SAMPLE_DOCS = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-4f1c2a9e-7fff-1b2c-3d4e-5f6a7b8c9d0e"><h2 dir="ltr" style="line-height:1.38;margin-top:18pt;margin-bottom:6pt;"><span style="font-size:16pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Launch checklist</span></h2><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;">Before the release, review the </span><a href="https://example.com/notes" style="text-decoration:none;"><span style="font-size:11pt;font-family:Arial,sans-serif;color:#1155cc;text-decoration:underline;">release notes</span></a><span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;font-weight:700;">&nbsp;carefully</span><span style="font-size:11pt;font-family:Arial,sans-serif;">.</span></p><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;"><br></span></p><ul style="margin-top:0;margin-bottom:0;padding-inline-start:48px;"><li dir="ltr" style="list-style-type:disc;font-size:11pt;" aria-level="1"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;" role="presentation"><span style="font-size:11pt;font-family:Arial,sans-serif;">Update the changelog</span></p></li><li dir="ltr" style="list-style-type:disc;font-size:11pt;" aria-level="1"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;" role="presentation"><span style="font-size:11pt;font-family:Arial,sans-serif;font-style:italic;">Tag the version</span></p></li></ul><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">&nbsp;</span></p></b>`;
