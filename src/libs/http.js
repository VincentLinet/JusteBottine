const TIMEOUT = 15_000;

const defaults = { "User-Agent": "Mozilla/5.0 (compatible; justebottine)" };

const request = async (url, { headers = {} } = {}) => {
  const response = await fetch(url, { headers: { ...defaults, ...headers }, signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} on ${url}`);
  return response;
};

export const json = async (url, options) => (await request(url, options)).json();

export const text = async (url, options) => (await request(url, options)).text();
