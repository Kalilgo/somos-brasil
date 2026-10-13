import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('muestra el emoji, el titulo y la bajada', () => {
    render(<EmptyState emoji="🦜" title="Nada por acá" cta="Proponé la primera idea" />)
    expect(screen.getByText('🦜')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nada por acá' })).toBeInTheDocument()
    expect(screen.getByText('Proponé la primera idea')).toBeInTheDocument()
  })

  it('usa h3 por defecto y respeta `as`', () => {
    const { rerender } = render(<EmptyState emoji="🗓️" title="Itinerario" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Itinerario' })).toBeInTheDocument()

    rerender(<EmptyState emoji="🗓️" title="Itinerario" as="h2" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Itinerario' })).toBeInTheDocument()
  })

  it('sin actionLabel no muestra boton', () => {
    render(<EmptyState emoji="🏆" title="Sin ranking" onAction={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('con accion muestra el boton y dispara onAction al click', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(
      <EmptyState
        emoji="🏝️"
        title="No hay viajes"
        cta="Creá el primero"
        actionLabel="Crear viaje"
        onAction={onAction}
      />,
    )

    const boton = screen.getByRole('button', { name: 'Crear viaje' })
    await user.click(boton)
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
