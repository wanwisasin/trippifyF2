import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorArea from '../error/ErrorArea.vue'

describe('ErrorArea.vue', () => {
  it('renders title and message passed as props', () => {
    const wrapper = mount(ErrorArea, {
      props: {
        title: 'AI Service Failed',
        message: 'We could not generate your trip plan.'
      }
    })

    expect(wrapper.text()).toContain('AI Service Failed')
    expect(wrapper.text()).toContain('We could not generate your trip plan.')
  })

  it('renders default title and message when props are missing', () => {
    const wrapper = mount(ErrorArea)
    expect(wrapper.text()).toContain('Oops! Something went wrong.')
    expect(wrapper.text()).toContain('Please try again later or contact support.')
  })

  it('has correct styling classes', () => {
    const wrapper = mount(ErrorArea)
    const container = wrapper.find('div')
    expect(container.classes()).toContain('bg-red-50')
    expect(container.classes()).toContain('text-center')
  })
})
