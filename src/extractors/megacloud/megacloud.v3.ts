export async function getSourcesV3(embed_url: string, site: string) {
  // Extrae el ID con tu regex, tal cual haces arriba
  const resourceLinkMatch = embed_url.match(/https:\/\/([^/]+)\/embed-2\/(v\d+)\/e-1\/([^?]+)/);

  if (!resourceLinkMatch) {
    throw new Error(`[!] Failed to extract domain and ID from link: ${embed_url}`);
  }

  // Si tu Flask espera solo el ID, toma el [3] del match:
  const id = resourceLinkMatch[3];

  // Prepara la URL del backend Flask
  const apiUrl = `http://127.0.0.1:8446/api?id=${id}`;

  // Haz la petición
  const response = await fetch(apiUrl, {
    headers: {
      // Solo si necesitas un referer, si no, puedes quitarlo
      Referer: site,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  // El backend retorna el JSON
  const extractedData = await response.json();

  // Devuelve sólo lo que pides
  return {
    intro: extractedData.intro,
    outro: extractedData.outro,
    sources: extractedData.sources,
    tracks: extractedData.tracks ?? [], // o subtitles, depende cómo venga
  };
}
