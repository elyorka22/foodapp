/** Base path for the customer-facing storefront (all panels use their own prefix). */
export const CUSTOMER = '/customer';

export function customerPath(path = '/') {
  if (path === '/') return CUSTOMER;
  return `${CUSTOMER}${path.startsWith('/') ? path : `/${path}`}`;
}
