export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4001/api').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(`Cannot reach the Nexora API at ${API_BASE_URL}. Start the local server and check your connection.`);
  }

  const text = await response.text();
  let payload = {};
  if (text) {
    try { payload = JSON.parse(text); }
    catch { payload = { error: 'The server returned an invalid response.' }; }
  }
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

const productColors = ['mint', 'amber', 'rose', 'lavender', 'blue'];
const productGlyphs = ['◉', '◌', '◈', '◐', '✳'];

export function toUiItems(rows = []) {
  return rows.map((row, index) => {
    const stock = Number(row.qty_on_hand ?? 0);
    return {
      id: String(row.id),
      apiId: Number(row.id),
      displayId: `NX-${String(row.id).padStart(4, '0')}`,
      name: row.name,
      category: row.category || 'Uncategorized',
      sku: row.sku || '',
      price: Number(row.selling_price ?? 0),
      cost: Number(row.avg_cost ?? 0),
      stock,
      reorderThreshold: Number(row.reorder_threshold ?? 8),
      status: stock === 0 ? 'Out of stock' : stock <= Number(row.reorder_threshold ?? 8) ? 'Low stock' : 'In stock',
      color: productColors[index % productColors.length],
      icon: productGlyphs[index % productGlyphs.length],
    };
  });
}
