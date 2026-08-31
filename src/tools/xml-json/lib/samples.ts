// ============================================================================
// Sample documents.
// ----------------------------------------------------------------------------
// Real shapes people actually paste, chosen so each one exercises a different
// corner: namespaces, CDATA, mixed content, attribute-heavy nodes, repeated
// siblings. The old tool shipped one bookstore and nothing else.
// ============================================================================

export interface Sample {
  id: string;
  /** Dictionary key for the label; the id is the fallback. */
  key: string;
  direction: 'xml-to-json' | 'json-to-xml';
  body: string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'bookstore',
    key: 'sample_bookstore',
    direction: 'xml-to-json',
    body: `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">12.99</price>
  </book>
  <book category="poetry">
    <title lang="en">Leaves of Grass</title>
    <author>Walt Whitman</author>
    <year>1855</year>
    <price currency="USD">9.50</price>
  </book>
</bookstore>`,
  },
  {
    id: 'rss',
    key: 'sample_rss',
    direction: 'xml-to-json',
    body: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Release notes</title>
    <link>https://example.com/releases</link>
    <item>
      <title>Version 2.4</title>
      <dc:creator>build-bot</dc:creator>
      <pubDate>Tue, 04 Mar 2025 09:00:00 GMT</pubDate>
      <description><![CDATA[Adds <strong>XPath</strong> search & round-trip checks.]]></description>
    </item>
    <item>
      <title>Version 2.3</title>
      <dc:creator>build-bot</dc:creator>
      <pubDate>Mon, 10 Feb 2025 09:00:00 GMT</pubDate>
      <description><![CDATA[Fixes attribute ordering.]]></description>
    </item>
  </channel>
</rss>`,
  },
  {
    id: 'mixed',
    key: 'sample_mixed',
    direction: 'xml-to-json',
    body: `<?xml version="1.0" encoding="UTF-8"?>
<!-- Mixed content: text and elements interleaved. Only the ordered
     projection survives this one intact; try the round-trip meter. -->
<article id="a-42" xml:lang="en">
  <p>The parser keeps <em>order</em> and <strong>boundaries</strong>, not just values.</p>
  <p>An empty element <br/> and an entity: &amp;amp; &#169;</p>
  <footer><![CDATA[raw <markup> stays raw]]></footer>
</article>`,
  },
  {
    id: 'soap',
    key: 'sample_soap',
    direction: 'xml-to-json',
    body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:m="https://example.com/stock">
  <soap:Header>
    <m:Trans soap:mustUnderstand="1">234</m:Trans>
  </soap:Header>
  <soap:Body>
    <m:GetPriceResponse>
      <m:Price currency="EUR">34.50</m:Price>
      <m:Updated>2025-03-04T09:00:00Z</m:Updated>
    </m:GetPriceResponse>
  </soap:Body>
</soap:Envelope>`,
  },
  {
    id: 'config',
    key: 'sample_config',
    direction: 'json-to-xml',
    body: `{
  "configuration": {
    "@environment": "production",
    "appSettings": {
      "add": [
        { "@key": "timeout", "@value": "30" },
        { "@key": "retries", "@value": "3" }
      ]
    },
    "connectionStrings": {
      "add": { "@name": "main", "@provider": "sqlite" }
    },
    "featureFlags": {
      "flag": ["xpath", "roundtrip", "worker"]
    }
  }
}`,
  },
  {
    id: 'awkward',
    key: 'sample_awkward',
    direction: 'json-to-xml',
    body: `{
  "2024": { "quarter one": 12, "quarter two": 18 },
  "notes": null,
  "tags": ["a", "b"],
  "text/plain": "keys that are not legal XML names get repaired, not dropped"
}`,
  },
];

export const SAMPLE_XML = SAMPLES[0].body;
export const SAMPLE_JSON = SAMPLES.find(s => s.id === 'config')!.body;
