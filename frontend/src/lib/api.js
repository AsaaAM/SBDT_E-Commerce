// API Client Helper
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.INTERNAL_BACKEND_URL || 'http://localhost:5000/api';
};

export async function fetchApi(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ikea_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let msg = data.message || `Request failed with status ${response.status}`;
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      msg = data.errors.map((e) => e.message).join('. ');
    }
    const error = new Error(msg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number || 0);
};
