// Empty stub — see ../../build-bootstrap.ts for rationale.
export default {}
export const useState = () => [undefined, () => undefined]
export const useEffect = () => undefined
export const useMemo = fn => fn()
export const useRef = () => ({ current: undefined })
export const useCallback = fn => fn
export const createElement = () => null
export const Fragment = null
