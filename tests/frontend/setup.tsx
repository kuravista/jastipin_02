/**
 * Frontend Test Setup
 * Configures testing environment for React components
 */

import '@testing-library/jest-dom'

// Mock next/navigation - provides router and pathname hooks
jest.mock('next/navigation', () => {
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
}, { virtual: true })

// Mock next/image - provides Image component
jest.mock(
  'next/image',
  () => ({
    __esModule: true,
    default: (props: any) => ({
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: props,
      key: null,
      ref: null,
    }),
  }),
  { virtual: true }
)

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
