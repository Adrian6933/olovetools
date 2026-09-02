# Reclamación de marca de Passbolt SA — qué se hizo y qué contestar

**Fecha:** 2026-08-31
**Reclamante:** Vivien Muller, Head of GTM & UX, Passbolt SA (vivien@passbolt.com), con Clayton en copia
**Petición:** cambiar el nombre de la herramienta y su URL.

## Qué se cambió

| Antes | Ahora |
|---|---|
| Nombre: `PassBolt` | `EntropyBolt` |
| URL: `olovetools.com/{lang}/passbolt/` | `olovetools.com/{lang}/entropy-bolt/` |
| Slug, carpeta, componente, ficheros de idioma | Todos renombrados |
| IDs de anuncio `adsense-passbolt-*` | `adsense-entropy-bolt-*` |

El nombre nuevo mantiene el sufijo `-bolt`, que ya comparten otras 15 herramientas
de la suite (hash-bolt, jwt-bolt, url-bolt, time-bolt…) y que no es lo que se
reclama: la reclamación es sobre la palabra completa "passbolt", que era idéntica
a su marca. "Entropy" describe lo que distingue a la herramienta (calcula la
entropía exacta en bits).

**Las URLs viejas no existen.** Hubo brevemente un 301 desde `/{lang}/passbolt/`
hacia la URL nueva, pero se eliminó a propósito: la web tiene poco tráfico, los
enlaces entrantes que se pierden son pocos y así no queda ninguna ruta con su
marca, ni siquiera como redirección. Ahora `/{lang}/passbolt/` devuelve 404.

Verificado: 0 apariciones de "passbolt" en el código, en el HTML servido, en el
sitemap y en las etiquetas canonical/hreflang.

## Borrador de respuesta (revísalo y envíalo tú)

Responde **al hilo original**, con Clayton en copia.

> Subject: Re: Trademark — tool renamed and URL removed
>
> Hi Vivien,
>
> Thanks for reaching out, and for doing it directly rather than formally.
>
> The change is live. The tool has been renamed to **EntropyBolt** and now sits
> at https://olovetools.com/en/entropy-bolt/ — and at the equivalent path in the
> other eight languages.
>
> The Passbolt name no longer appears anywhere on the site: not as a tool name, a
> URL, a page title, a meta description, in structured data, or in the sitemap. I
> did not even leave a redirect at the old address — /en/passbolt/ and its eight
> translations return 404, so nothing of ours resolves under your name.
>
> One thing that is outside my control: search engines cache their index, so for
> a few weeks a Google search may still surface the old URL. Those pages return
> 404 now and will drop out on their own. I have resubmitted the sitemap and
> requested re-indexing of the new URLs to speed that up, but the timing is
> Google's, not mine. If you come across a stale result, that is the index
> catching up rather than the site still using the name — the URL itself will
> already be dead if you click it.
>
> For the record, there was never any intent to trade on your name or to suggest
> an association. The tool is a small browser-based password and passphrase
> generator, part of a suite where most tools share a "-bolt" suffix, and the
> collision was not deliberate.
>
> Happy to consider this resolved on my side. Let me know if anything else is
> needed.
>
> Best regards,
> Adrián González

## Antes de responderle

Despliega primero. El correo afirma que el cambio está hecho, así que la URL
nueva debe estar viva y la vieja muerta **en producción**, no solo en local.
Después comprueba en el sitio publicado:

```bash
curl -sI https://olovetools.com/en/entropy-bolt/ | head -1
```

Debe responder `200`. Y la vieja:

```bash
curl -sI https://olovetools.com/en/passbolt/ | head -1
```

Debe responder `404`.

## Cosas pendientes que no dependen del código

- **Google Search Console:** pide la indexación de `/{lang}/entropy-bolt/`. Sin
  301 no hay traspaso de posicionamiento, así que la URL nueva empieza de cero;
  las viejas caerán del índice solas al dar 404.
- **AdSense:** los tres bloques cambiaron de ID en el HTML. Los slots se
  reutilizan por posición (no hay unidad por página), así que no hay que tocar
  nada en el panel; esto es solo para que no te extrañe el cambio.
- **Enlaces externos:** si diste de alta la herramienta en algún directorio con
  la URL vieja, actualízala allí — ahora esos enlaces dan 404.
