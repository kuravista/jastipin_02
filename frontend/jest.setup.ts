/**
 * Jest Setup - Frontend
 * Configures testing environment for React components
 * Located in frontend/ directory for proper module resolution
 */

import '@testing-library/jest-dom'

// Mock next/navigation BEFORE any test file loads
// This is called before tests run
jest.doMock('next/navigation', () => {
  const useRouter = () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })
  return {
    useRouter,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }
})

// Mock next/image
jest.doMock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props,
      key: null,
      ref: null,
    }
  },
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Warning: useLayoutEffect'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
