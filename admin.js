const tablaAdmin = document.getElementById("tablaAdmin");

const tituloModalInput = document.getElementById("tituloModalInput");
const subtituloModalInput = document.getElementById("subtituloModalInput");
const valorNumeroInput = document.getElementById("valorNumeroInput");
const formaPagoInput = document.getElementById("formaPagoInput");
const whatsappInput = document.getElementById("whatsappInput");
const mensajeExtraInput = document.getElementById("mensajeExtraInput");

const btnGuardarConfig = document.getElementById("btnGuardarConfig");
const btnLimpiarGrilla = document.getElementById("btnLimpiarGrilla");

// =========================
// NORMALIZAR ESTADOS
// =========================
function normalizarEstado(estado) {
  if (!estado) return "libre";

  const e = estado.toLowerCase().trim();

  if (e === "reservado") return "pendiente";
  if (e === "vendido") return "confirmado";

  if (e === "pendiente") return "pendiente";
  if (e === "confirmado") return "confirmado";
  if (e === "libre") return "libre";

  return "libre";
}

// =========================
// CARGAR CONFIGURACIÓN
// =========================
async function cargarConfig() {
  try {
    const { data, error } = await supabaseClient
      .from("config_rifa")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.warn("No se pudo cargar config_rifa:", error.message);
      return;
    }

    tituloModalInput.value = data.titulo_modal || "";
    subtituloModalInput.value = data.subtitulo_modal || "";
    valorNumeroInput.value = data.valor_numero || "";
    formaPagoInput.value = data.forma_pago || "";
    whatsappInput.value = data.whatsapp || "";
    mensajeExtraInput.value = data.mensaje_extra || "";

  } catch (err) {
    console.error("Error al cargar configuración:", err);
  }
}

// =========================
// GUARDAR CONFIGURACIÓN
// =========================
async function guardarConfig() {
  try {
    const payload = {
      id: 1,
      titulo_modal: tituloModalInput.value.trim(),
      subtitulo_modal: subtituloModalInput.value.trim(),
      valor_numero: valorNumeroInput.value.trim(),
      forma_pago: formaPagoInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      mensaje_extra: mensajeExtraInput.value.trim()
    };

    const { error } = await supabaseClient
      .from("config_rifa")
      .upsert(payload);

    if (error) {
      console.error("Error al guardar configuración:", error);
      alert("No se pudo guardar la información: " + error.message);
      return;
    }

    alert("Los cambios han sido guardados correctamente.");

  } catch (err) {
    console.error("Error inesperado al guardar config:", err);
    alert("Ocurrió un error inesperado al guardar la configuración.");
  }
}

// =========================
// CARGAR TABLA ADMIN
// =========================
async function cargarTablaAdmin() {
  try {
    const { data, error } = await supabaseClient
      .from("numeros_rifa")
      .select("*")
      .order("numero", { ascending: true });

    if (error) {
      console.error("Error al cargar la tabla:", error);
      alert("Error al cargar la tabla: " + error.message);
      return;
    }

    tablaAdmin.innerHTML = "";

    data.forEach(item => {
      const estado = normalizarEstado(item.estado);
      const fila = document.createElement("tr");

      let accionesHTML = "";

      if (estado === "pendiente") {
        accionesHTML = `
          <button class="btn-confirmar" onclick="confirmarNumero(${item.numero})">Aceptar</button>
          <button class="btn-cancelar" onclick="cancelarNumero(${item.numero})">Cancelar</button>
        `;
      } else if (estado === "confirmado") {
        accionesHTML = `
          <button class="btn-cancelar" onclick="cancelarNumero(${item.numero})">Cancelar</button>
        `;
      } else {
        accionesHTML = `<span style="color:#777;">-</span>`;
      }

      fila.innerHTML = `
        <td>${String(item.numero).padStart(2, "0")}</td>
        <td>${item.nombre || "-"}</td>
        <td>
          <span class="estado-badge ${estado}">${estado}</span>
        </td>
        <td class="acciones-celda">
          ${accionesHTML}
        </td>
      `;

      tablaAdmin.appendChild(fila);
    });

  } catch (err) {
    console.error("Error inesperado al cargar tabla admin:", err);
  }
}

// =========================
// ACEPTAR NÚMERO (CONFIRMAR)
// =========================
async function confirmarNumero(numero) {
  try {
    const { error } = await supabaseClient
      .from("numeros_rifa")
      .update({ estado: "confirmado" })
      .eq("numero", numero);

    if (error) {
      console.error("Error al confirmar número:", error);
      alert("No se pudo confirmar el número: " + error.message);
      return;
    }

    await cargarTablaAdmin();
    alert(`El número ${String(numero).padStart(2, "0")} fue confirmado correctamente.`);

  } catch (err) {
    console.error("Error inesperado al confirmar número:", err);
    alert("Ocurrió un error inesperado.");
  }
}

// =========================
// CANCELAR NÚMERO (VOLVER A LIBRE)
// =========================
async function cancelarNumero(numero) {
  try {
    const { error } = await supabaseClient
      .from("numeros_rifa")
      .update({
        nombre: null,
        estado: "libre"
      })
      .eq("numero", numero);

    if (error) {
      console.error("Error al cancelar número:", error);
      alert("No se pudo cancelar el número: " + error.message);
      return;
    }

    await cargarTablaAdmin();
    alert(`El número ${String(numero).padStart(2, "0")} volvió a LIBRE.`);

  } catch (err) {
    console.error("Error inesperado al cancelar número:", err);
    alert("Ocurrió un error inesperado.");
  }
}

// =========================
// LIMPIAR TODA LA GRILLA
// =========================
async function limpiarGrillaEntera() {
  const confirmar = window.confirm("¿Seguro que querés limpiar toda la grilla? Esto pondrá TODOS los números en LIBRE.");

  if (!confirmar) return;

  try {
    const { error } = await supabaseClient
      .from("numeros_rifa")
      .update({
        nombre: null,
        estado: "libre"
      })
      .neq("numero", -1);

    if (error) {
      console.error("Error al limpiar la grilla:", error);
      alert("No se pudo limpiar la grilla: " + error.message);
      return;
    }

    await cargarTablaAdmin();
    alert("La grilla completa fue reiniciada correctamente.");

  } catch (err) {
    console.error("Error inesperado al limpiar grilla:", err);
    alert("Ocurrió un error inesperado.");
  }
}

// =========================
// EVENTOS
// =========================
if (btnGuardarConfig) {
  btnGuardarConfig.addEventListener("click", guardarConfig);
}

if (btnLimpiarGrilla) {
  btnLimpiarGrilla.addEventListener("click", limpiarGrillaEntera);
}

// =========================
// HACER FUNCIONES GLOBALES
// (porque las usa onclick en la tabla)
// =========================
window.confirmarNumero = confirmarNumero;
window.cancelarNumero = cancelarNumero;

// =========================
// INICIO
// =========================
async function iniciarAdmin() {
  await cargarConfig();
  await cargarTablaAdmin();
}

iniciarAdmin();
// =========================
// DESCARGAR RIFA (CSV)
// =========================
async function descargarRifaCSV() {
  try {
    const { data, error } = await supabaseClient
      .from("numeros_rifa")
      .select("*")
      .order("numero", { ascending: true });

    if (error) {
      console.error("Error al obtener datos para CSV:", error);
      alert("No se pudieron obtener los datos: " + error.message);
      return;
    }

    // Encabezado
    const filas = [["Número", "Nombre", "Estado"]];

    data.forEach(item => {
      filas.push([
        String(item.numero).padStart(2, "0"),
        item.nombre || "-",
        normalizarEstado(item.estado)
      ]);
    });

    // Convertir a texto CSV
    const csvContent = filas
      .map(fila => fila.map(celda => `"${celda}"`).join(","))
      .join("\n");

    // Agregar BOM para que Excel abra bien los acentos
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href     = url;
    link.download = `rifa_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Error inesperado al descargar CSV:", err);
    alert("Ocurrió un error inesperado al descargar.");
  }
}

const btnDescargarRifa = document.getElementById("btnDescargarRifa");
if (btnDescargarRifa) {
  btnDescargarRifa.addEventListener("click", descargarRifaCSV);
}

// =========================
// IMAGEN DE PRESENTACIÓN
// =========================
const STORAGE_BUCKET = "rifa-imagenes"; // <-- nombre del bucket en Supabase Storage
const STORAGE_PATH   = "presentacion/banner.jpg"; // path fijo, siempre sobreescribe

const inputImagen        = document.getElementById("inputImagen");
const btnSeleccionarImg  = document.getElementById("btnSeleccionarImagen");
const btnSubirImagen     = document.getElementById("btnSubirImagen");
const btnQuitarImagen    = document.getElementById("btnQuitarImagen");
const uploadArea         = document.getElementById("uploadArea");
const uploadPlaceholder  = document.getElementById("uploadPlaceholder");
const previewActual      = document.getElementById("previewActual");
const imgPreviewActual   = document.getElementById("imgPreviewActual");
const uploadStatus       = document.getElementById("uploadStatus");

let archivoSeleccionado = null;

// Mostrar estado en el área de upload
function mostrarStatus(mensaje, tipo = "info") {
  uploadStatus.textContent = mensaje;
  uploadStatus.className   = `upload-status visible status-${tipo}`;
}

function ocultarStatus() {
  uploadStatus.className = "upload-status";
}

// Cargar imagen actual desde config_rifa
async function cargarImagenActual() {
  try {
    const { data, error } = await supabaseClient
      .from("config_rifa")
      .select("imagen_url")
      .eq("id", 1)
      .single();

    if (error || !data?.imagen_url) return;

    imgPreviewActual.src      = data.imagen_url;
    previewActual.style.display  = "flex";
    btnQuitarImagen.style.display = "inline-block";
  } catch (err) {
    console.error("Error al cargar imagen actual:", err);
  }
}

// Preview local al seleccionar archivo
function previsualizarArchivo(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    imgPreviewActual.src       = e.target.result;
    previewActual.style.display  = "flex";
    uploadPlaceholder.style.display = "none";
  };
  reader.readAsDataURL(file);
}

// Subir imagen a Supabase Storage y guardar URL en config_rifa
async function subirImagen() {
  if (!archivoSeleccionado) return;

  btnSubirImagen.disabled  = true;
  btnSubirImagen.textContent = "Subiendo...";
  mostrarStatus("Subiendo imagen...", "info");

  try {
    // 1. Subir al bucket (upsert = sobreescribe si ya existe)
    const { error: uploadError } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, archivoSeleccionado, {
        upsert: true,
        contentType: archivoSeleccionado.type
      });

    if (uploadError) {
      mostrarStatus("Error al subir la imagen: " + uploadError.message, "error");
      btnSubirImagen.disabled  = false;
      btnSubirImagen.textContent = "⬆ Subir imagen";
      return;
    }

    // 2. Obtener URL pública
    const { data: urlData } = supabaseClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(STORAGE_PATH);

    // Forzar cache-bust para que index siempre cargue la nueva imagen
    const urlFinal = urlData.publicUrl + "?t=" + Date.now();

    // 3. Guardar URL en config_rifa
    const { error: dbError } = await supabaseClient
      .from("config_rifa")
      .upsert({ id: 1, imagen_url: urlFinal });

    if (dbError) {
      mostrarStatus("Imagen subida pero no se pudo guardar la URL: " + dbError.message, "error");
      return;
    }

    mostrarStatus("✓ Imagen subida y guardada correctamente.", "ok");
    btnSubirImagen.textContent = "⬆ Subir imagen";
    btnQuitarImagen.style.display = "inline-block";
    archivoSeleccionado = null;
    btnSubirImagen.disabled = true;

  } catch (err) {
    console.error("Error inesperado al subir imagen:", err);
    mostrarStatus("Ocurrió un error inesperado.", "error");
    btnSubirImagen.disabled  = false;
    btnSubirImagen.textContent = "⬆ Subir imagen";
  }
}

// Quitar imagen: borra del storage y limpia la URL en config_rifa
async function quitarImagen() {
  const confirmar = window.confirm("¿Seguro que querés quitar la imagen de presentación?");
  if (!confirmar) return;

  mostrarStatus("Quitando imagen...", "info");

  try {
    await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .remove([STORAGE_PATH]);

    const { error } = await supabaseClient
      .from("config_rifa")
      .update({ imagen_url: null })
      .eq("id", 1);

    if (error) {
      mostrarStatus("Error al quitar la imagen: " + error.message, "error");
      return;
    }

    imgPreviewActual.src         = "";
    previewActual.style.display  = "none";
    uploadPlaceholder.style.display = "flex";
    btnQuitarImagen.style.display   = "none";
    archivoSeleccionado = null;
    btnSubirImagen.disabled = true;
    mostrarStatus("Imagen quitada correctamente.", "ok");

  } catch (err) {
    console.error("Error al quitar imagen:", err);
    mostrarStatus("Ocurrió un error inesperado.", "error");
  }
}

// === EVENTOS DEL UPLOADER ===

if (btnSeleccionarImg) {
  btnSeleccionarImg.addEventListener("click", () => inputImagen.click());
}

if (inputImagen) {
  inputImagen.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      mostrarStatus("La imagen no puede superar 5 MB.", "error");
      return;
    }

    archivoSeleccionado = file;
    previsualizarArchivo(file);
    btnSubirImagen.disabled = false;
    ocultarStatus();
  });
}

// Drag & drop
if (uploadArea) {
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (file.size > 5 * 1024 * 1024) {
      mostrarStatus("La imagen no puede superar 5 MB.", "error");
      return;
    }

    archivoSeleccionado = file;
    previsualizarArchivo(file);
    btnSubirImagen.disabled = false;
    ocultarStatus();
  });
}

if (btnSubirImagen) {
  btnSubirImagen.addEventListener("click", subirImagen);
}

if (btnQuitarImagen) {
  btnQuitarImagen.addEventListener("click", quitarImagen);
}

// Cargar imagen actual al iniciar el admin
cargarImagenActual();