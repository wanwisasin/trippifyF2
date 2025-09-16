import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import FullErrorPage from '../error/FullErrorPage.vue'


describe('FullErrorPage.vue', () => {
  it('renders default 404 error page', () => {
    const wrapper = mount(FullErrorPage, {
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('Page Not Found')
    expect(wrapper.text()).toContain('The page you’re looking for doesn’t exist.')
  })

  it('renders custom 403 error page', () => {
    const wrapper = mount(FullErrorPage, {
      props: {
        code: '403',
        title: 'Access Denied',
        message: 'You are not authorized to view this page.'
      },
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    expect(wrapper.text()).toContain('403')
    expect(wrapper.text()).toContain('Access Denied')
    expect(wrapper.text()).toContain('You are not authorized to view this page.')
  })

  it('renders 410 error (trip expired)', () => {
    const wrapper = mount(FullErrorPage, {
      props: {
        code: '410',
        title: 'Trip Expired',
        message: 'This shared trip link has expired.'
      },
      global: {
        stubs: { RouterLink: RouterLinkStub }
      }
    })

    expect(wrapper.text()).toContain('410')
    expect(wrapper.text()).toContain('Trip Expired')
    expect(wrapper.text()).toContain('This shared trip link has expired.')
  })
})
