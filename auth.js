// ============================================
// AUTH — login y logout del admin
// ============================================

// Abre el modal de login
function abrirLogin() {
  document.getElementById('modal-login').classList.remove('hidden')
  document.getElementById('login-email').focus()
}

// Cierra el modal de login
function cerrarLogin() {
  document.getElementById('modal-login').classList.add('hidden')
  document.getElementById('login-error').textContent = ''
  document.getElementById('login-email').value = ''
  document.getElementById('login-password').value = ''
}

// Iniciar sesión con email y contraseña
async function iniciarSesion() {
  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value
  const errorEl = document.getElementById('login-error')

  if (!email || !password) {
    errorEl.textContent = 'Completa todos los campos.'
    return
  }

  errorEl.textContent = 'Entrando...'

  const { data, error } = await db.auth.signInWithPassword({ email, password })

  if (error) {
    errorEl.textContent = 'Email o contraseña incorrectos.'
    return
  }

  cerrarLogin()
  mostrarModoAdmin(data.user.email)
}

// Cerrar sesión
async function cerrarSesion() {
  await db.auth.signOut()
  mostrarModoPublico()
}

// Muestra la UI de admin (upload card, botones editar/borrar)
function mostrarModoAdmin(email) {
  // Header
  document.getElementById('btn-abrir-login').style.display = 'none'
  document.getElementById('admin-logueado').style.display = 'flex'
  document.getElementById('admin-email').textContent = email

  // Mostrar formulario de subida
  document.getElementById('upload-card').style.display = 'block'
  document.getElementById('galeria-subtitulo').textContent = 'Modo admin — puedes subir, editar y eliminar imágenes'

  // Recargar galería para mostrar botones de editar/borrar
  cargarGaleria()
}

// Muestra la UI pública (sin upload, sin botones de editar/borrar)
function mostrarModoPublico() {
  // Header
  document.getElementById('btn-abrir-login').style.display = 'block'
  document.getElementById('admin-logueado').style.display = 'none'

  // Ocultar formulario de subida
  document.getElementById('upload-card').style.display = 'none'
  document.getElementById('galeria-subtitulo').textContent = 'Explora nuestras imágenes'

  // Recargar galería sin botones de admin
  cargarGaleria()
}

// Cerrar modal login clickando fuera
document.getElementById('modal-login').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-login')) cerrarLogin()
})

// Enter en el campo contraseña = iniciar sesión
document.getElementById('login-password')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') iniciarSesion()
})

// Al cargar la página verificamos si ya hay sesión activa
db.auth.getSession().then(({ data }) => {
  if (data.session) {
    mostrarModoAdmin(data.session.user.email)
  }
})
