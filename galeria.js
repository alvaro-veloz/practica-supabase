// ============================================
// GALERÍA — subir, mostrar, editar y borrar
// ============================================

let archivoSeleccionado = null

// --- Preview cuando se selecciona una imagen ---
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return
  archivoSeleccionado = file
  const preview = document.getElementById('preview')
  preview.src = URL.createObjectURL(file)
  preview.style.display = 'block'
})

// --- Drag & drop ---
const dropzone = document.getElementById('dropzone')

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropzone.classList.add('drag-over')
})

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('drag-over')
})

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

// --- Subir imagen a Supabase Storage + guardar en tabla galeria ---
async function subirImagen() {
  const status = document.getElementById('upload-status')
  const descripcion = document.getElementById('descripcion').value.trim()
  const tags = document.getElementById('tags').value.trim()

  if (!archivoSeleccionado) {
    mostrarStatus(status, 'Selecciona una imagen primero.', 'error')
    return
  }

  mostrarStatus(status, 'Subiendo imagen...', '')

  // 1. Subimos el archivo al bucket "galeria" en Storage
  const nombreArchivo = `${Date.now()}-${archivoSeleccionado.name}`

  const { error: storageError } = await supabase
    .storage
    .from('galeria')
    .upload(nombreArchivo, archivoSeleccionado)

  if (storageError) {
    mostrarStatus(status, 'Error al subir la imagen: ' + storageError.message, 'error')
    return
  }

  // 2. Obtenemos la URL pública de la imagen
  const { data: urlData } = supabase
    .storage
    .from('galeria')
    .getPublicUrl(nombreArchivo)

  const urlPublica = urlData.publicUrl

  // 3. Guardamos los datos en la tabla "galeria"
  const { error: dbError } = await supabase
    .from('galeria')
    .insert([{ url: urlPublica, descripcion, tags }])

  if (dbError) {
    mostrarStatus(status, 'Error al guardar en base de datos: ' + dbError.message, 'error')
    return
  }

  // 4. Limpiamos el formulario y recargamos la galería
  mostrarStatus(status, '✓ Imagen subida correctamente', 'success')
  document.getElementById('descripcion').value = ''
  document.getElementById('tags').value = ''
  document.getElementById('preview').style.display = 'none'
  archivoSeleccionado = null

  cargarGaleria()
}

// --- Cargar y mostrar todas las imágenes ---
async function cargarGaleria() {
  const grid = document.getElementById('gallery-grid')
  grid.innerHTML = '<div class="loading-state">Cargando imágenes...</div>'

  const { data, error } = await supabase
    .from('galeria')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    grid.innerHTML = '<div class="loading-state">Error al cargar imágenes.</div>'
    return
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🖼️</div>
        <p>No hay imágenes todavía. ¡Sube la primera!</p>
      </div>`
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
        <div class="card-actions">
          <button class="btn-edit" onclick="abrirModal('${img.id}', '${(img.descripcion || '').replace(/'/g, "\\'")}', '${(img.tags || '').replace(/'/g, "\\'")}')">
            Editar
          </button>
          <button class="btn-danger" onclick="eliminarImagen('${img.id}', '${img.url}')">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

// --- Eliminar imagen ---
async function eliminarImagen(id, url) {
  if (!confirm('¿Seguro que quieres eliminar esta imagen?')) return

  // Extraemos el nombre del archivo de la URL para borrarlo del Storage
  const nombreArchivo = url.split('/galeria/')[1]

  // Borramos del Storage
  await supabase.storage.from('galeria').remove([nombreArchivo])

  // Borramos de la tabla
  const { error } = await supabase.from('galeria').delete().eq('id', id)

  if (error) {
    alert('Error al eliminar: ' + error.message)
    return
  }

  // Removemos la card del DOM sin recargar todo
  document.getElementById(`card-${id}`)?.remove()

  // Si no quedan cards, mostramos estado vacío
  const grid = document.getElementById('gallery-grid')
  if (grid.children.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🖼️</div>
        <p>No hay imágenes todavía. ¡Sube la primera!</p>
      </div>`
  }
}

// --- Modal editar ---
function abrirModal(id, descripcion, tags) {
  document.getElementById('edit-id').value = id
  document.getElementById('edit-descripcion').value = descripcion
  document.getElementById('edit-tags').value = tags
  document.getElementById('modal').classList.remove('hidden')
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden')
}

async function guardarEdicion() {
  const id = document.getElementById('edit-id').value
  const descripcion = document.getElementById('edit-descripcion').value.trim()
  const tags = document.getElementById('edit-tags').value.trim()

  const { error } = await supabase
    .from('galeria')
    .update({ descripcion, tags })
    .eq('id', id)

  if (error) {
    alert('Error al guardar: ' + error.message)
    return
  }

  cerrarModal()
  cargarGaleria()
}

// Cerrar modal clickando fuera
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal')) cerrarModal()
})

// --- Helper para mensajes de estado ---
function mostrarStatus(el, msg, tipo) {
  el.textContent = msg
  el.className = 'status-msg ' + tipo
}

// --- Cargar galería al iniciar ---
cargarGaleria()
