// Loopback visual fixture only; never imported by product code.
export const usePathname = () => new URLSearchParams(location.search).get('route') || '/admin/dashboard';
export const useSearchParams = () => new URLSearchParams(location.search);
const router = { prefetch() {}, refresh() {}, replace() {}, push() {}, back() {} };
export const useRouter = () => router;
