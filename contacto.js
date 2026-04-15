// ============================================
// FORMULARIO DE CONTACTO
// Guarda los mensajes en la tabla "contactos"
// ============================================

async function enviarContacto() {
  const status = document.getElementById('form-status')
  const nombre = document.getElementById('f-nombre').value.trim()
  const email = document.getElementById('f-email').value.trim()
  const mensaje = document.getElementById('f-mensaje').value.trim()

  // Validación básica
  if (!nombre || !email || !mensaje) {
    mostrarStatusForm(status, 'Por favor completa todos los campos.', 'error')
    return
  }

  if (!email.includes('@')) {
    mostrarStatusForm(status, 'Escribe un email válido.', 'error')
    return
  }

  mostrarStatusForm(status, 'Enviando...', '')

  // Insertamos en la tabla "contactos" de Supabase
  const { error } = await db
    .from('contactos')
    .insert([{ nombre, email, mensaje }])

  if (error) {
    mostrarStatusForm(status, 'Error al enviar: ' + error.message, 'error')
    return
  }

  // Limpiamos el formulario
  document.getElementById('f-nombre').value = ''
  document.getElementById('f-email').value = ''
  document.getElementById('f-mensaje').value = ''

  mostrarStatusForm(status, '✓ Mensaje enviado correctamente', 'success')
}

function mostrarStatusForm(el, msg, tipo) {
  el.textContent = msg
  el.className = 'status-msg ' + tipo
}
