export async function getSourcesV3(embed_url: string, site: string) {
  const resourceLinkMatch = embed_url.match(/https:\/\/([^/]+)\/embed-2\/(v\d+)\/e-1\/([^?]+)/);

  if (!resourceLinkMatch) {
    throw new Error(`[!] Failed to extract domain and ID from link: ${embed_url}`);
  }

  const id = resourceLinkMatch[3];

  const version = resourceLinkMatch[2];

  const apiUrl = `http://127.0.0.1:8446/api?id=${id}&version=${version}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const extractedData = await response.json();

  return {
    intro: extractedData.intro,
    outro: extractedData.outro,
    sources: extractedData.sources,
    tracks: extractedData.tracks ?? [],
  };
}
