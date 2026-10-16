describe('Finases', () => {
  it('abre el resumen desde la ruta principal', () => {
    cy.visit('/')
    cy.url().should('include', '/folder/Resumen')
    cy.contains('#container', 'Tu dinero, con dirección.')
  })

  it('permite navegar al módulo de ingresos', () => {
    cy.visit('/folder/Ingresos')
    cy.contains('#container', 'Nuevo pago de nómina')
  })
})
