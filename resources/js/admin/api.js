const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

async function request(method, url, data = null) {
  const isFormData = data instanceof FormData;
  const actualMethod = isFormData && ['PUT', 'PATCH', 'DELETE'].includes(method) ? 'POST' : method;

  const opts = {
    method: actualMethod,
    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf() },
    credentials: 'include',
  };

  if (data && method !== 'GET') {
    if (isFormData) {
      if (actualMethod !== method) data.append('_method', method);
      opts.body = data;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.message || `Erreur ${res.status}`);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

export const api = {
  get:   (url)       => request('GET', url),
  post:  (url, data) => request('POST', url, data),
  put:   (url, data) => request('PUT', url, data),
  patch: (url, data) => request('PATCH', url, data),
  del:   (url)       => request('DELETE', url),
};
