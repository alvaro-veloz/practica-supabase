// ============================================
// GALERÍA — subir, mostrar, editar y borrar
// ============================================

let archivoSeleccionado = null

document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return
  archivoSeleccionado = file
  const preview = document.getElementById('preview')
  preview.src = URL.createObjectURL(file)
  preview.style.display = 'block'
})

const dropzone = document.getElementById('dropzone')
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over') })
dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('drag-over') })
dropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropzone.classList.remove('drag-over')
  const file = e.dataTransfer.files[0]
  if (!file || !file.type.startsWith('image/')) return
  archivoSeleccionado = file
  const preview = document.getElementById('preview')
  preview.src = URL.createObjectURL(file)
  preview.style.display = 'block'
})

async function subirImagen() {
  const status = document.getElementById('upload-status')
  const descripcion = document.getElementById('descripcion').value.trim()
  const tags = document.getElementById('tags').value.trim()

  if (!archivoSeleccionado) { mostrarStatus(status, 'Selecciona una imagen primero.', 'error'); return }
  mostrarStatus(status, 'Subiendo imagen...', '')

  const nombreArchivo = `${Date.now()}-${archivoSeleccionado.name}`
  const { error: storageError } = await db.storage.from('galeria').upload(nombreArchivo, archivoSeleccionado)
  if (storageError) { mostrarStatus(status, 'Error: ' + storageError.message, 'error'); return }

  const { data: urlData } = db.storage.from('galeria').getPublicUrl(nombreArchivo)
  const urlPublica = urlData.publicUrl

  const { error: dbError } = await db.from('galeria').insert([{ url: urlPublica, descripcion, tags }])
  if (dbError) { mostrarStatus(status, 'Error: ' + dbError.message, 'error'); return }

  mostrarStatus(status, '✓ Imagen subida correctamente', 'success')
  document.getElementById('descripcion').value = ''
  document.getElementById('tags').value = ''
  document.getElementById('preview').style.display = 'none'
  archivoSeleccionado = null
  cargarGaleria()
}

async function cargarGaleria() {
  const grid = document.getElementById('gallery-grid')
  grid.innerHTML = '<div class="loading-state">Cargando imágenes...</div>'

  const { data: sessionData } = await db.auth.getSession()
  const esAdmin = !!sessionData.session

  const { data, error } = await db.from('galeria').select('*').order('created_at', { ascending: false })

  if (error) { grid.innerHTML = '<div class="loading-state">Error al cargar imágenes.</div>'; return }

  if (!data || data.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🖼️</div><p>No hay imágenes todavía.</p></div>`
    return
  }

  grid.innerHTML = data.map(img => `
    <div class="gallery-card" id="card-${img.id}">
      <img src="${img.url}" alt="${img.descripcion || 'Imagen'}" loading="lazy"/>
      <div class="card-body">
        <p class="card-descripcion">${img.descripcion || 'Sin descripción'}</p>
        <div class="card-tags">
          ${img.tags ? img.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('') : ''}
        </div>
        ${esAdmin ? `
        <div class="card-actions">
          <button class="btn-edit" onclick="abrirModal('${img.id}', '${(img.descripcion || '').replace(/'/g, "\\'")}', '${(img.tags || '').replace(/'/g, "\\'")}')">Editar</button>
          <button class="btn-danger" onclick="eliminarImagen('${img.id}', '${img.url}')">Eliminar</button>
        </div>` : ''}
      </div>
    </div>
  `).join('')
}

async function eliminarImagen(id, url) {
  if (!confirm('¿Seguro que quieres eliminar esta imagen?')) return
  const nombreArchivo = url.split('/galeria/')[1]
  await db.storage.from('galeria').remove([nombreArchivo])
  const { error } = await db.from('galeria').delete().eq('id', id)
  if (error) { alert('Error al eliminar: ' + error.message); return }
  document.getElementById(`card-${id}`)?.remove()
  const grid = document.getElementById('gallery-grid')
  if (grid.children.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🖼️</div><p>No hay imágenes todavía.</p></div>`
  }
}

function abrirModal(id, descripcion, tags) {
  document.getElementById('edit-id').value = id
  document.getElementById('edit-descripcion').value = descripcion
  document.getElementById('edit-tags').value = tags
  document.getElementById('modal').classList.remove('hidden')
}

function cerrarModal() { document.getElementById('modal').classList.add('hidden') }

async function guardarEdicion() {
  const id = document.getElementById('edit-id').value
  const descripcion = document.getElementById('edit-descripcion').value.trim()
  const tags = document.getElementById('edit-tags').value.trim()
  const { error } = await db.from('galeria').update({ descripcion, tags }).eq('id', id)
  if (error) { alert('Error: ' + error.message); return }
  cerrarModal()
  cargarGaleria()
}

document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal')) cerrarModal()
})

function mostrarStatus(el, msg, tipo) {
  el.textContent = msg
  el.className = 'status-msg ' + tipo
}

cargarGaleria()
