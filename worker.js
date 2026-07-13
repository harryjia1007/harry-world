/* ============================================================
   Harry World — Cloudflare Worker
   目前只做一件事：/api/spotify 回傳「正在聽 / 近期常聽」歌曲。
   其他所有路徑照舊直接交給靜態檔案（env.ASSETS）處理。
   金鑰（Client ID / Secret / Refresh Token）存在 Cloudflare Secrets，
   不會出現在程式碼或 GitHub repo 裡。
   ============================================================ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/spotify') {
      return handleSpotify(env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleSpotify(env) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'public, max-age=90',
  };

  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
    return new Response(JSON.stringify({ nowPlaying: null, topTracks: [] }), { headers });
  }

  try {
    const token = await getAccessToken(env);

    const [nowRes, topRes] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=6', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    let nowPlaying = null;
    if (nowRes.status === 200) {
      const nowData = await nowRes.json();
      if (nowData && nowData.is_playing && nowData.item) {
        nowPlaying = simplifyTrack(nowData.item);
      }
    }

    let topTracks = [];
    if (topRes.status === 200) {
      const topData = await topRes.json();
      topTracks = (topData.items || []).map(simplifyTrack);
    }

    return new Response(JSON.stringify({ nowPlaying, topTracks }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ nowPlaying: null, topTracks: [] }), { headers });
  }
}

function simplifyTrack(item) {
  const artist = (item.artists || []).map(a => a.name).join(', ');
  const images = item.album?.images || [];
  const image = images[images.length - 1]?.url || images[0]?.url || null;
  return {
    name: item.name,
    artist,
    url: item.external_urls?.spotify || null,
    image,
  };
}

async function getAccessToken(env) {
  const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error('spotify token refresh failed: ' + res.status);
  const data = await res.json();
  return data.access_token;
}
