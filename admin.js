const btnLimpiarLista = document.getElementById("btnLimpiarLista");
const guardarConfigBtn = document.getElementById("guardarConfigBtn");
const tablaConfig = document.getElementById("tablaConfig");

// =============================
// UTILIDADES
// =============================
function formatearNumero(numero) {
  return String(numero).padStart(2, "0");
}

// =============================
// RIFA: LIMPIAR LISTA
// =============================
if (btnLimpiarLista) {
  btnLimpiarLista.addEventListener("click", async () => {
    const confirmar = confirm("¿Seguro que querés limpiar TODA la lista de la rifa?");
    if (!confirmar) return;

    const { error } = await supabaseClient
      .from("numeros_rifa")
      .update({
        nombre: null,
        estado: "libre"
      })
      .gte("numero", 0);

    if (error) {
      console.error("Error al limpiar la lista:", error);
      alert("No se pudo limpiar la lista: " + error.message);
      return;
    }

    alert("Lista limpiada correctamente.");
  });
}

// =============================
// RIFA: DESCARGAR CSV
// =============================
async function descargarCSV() {
  const { data, error } = await supabaseClient
    .from("numeros_rifa")
    .select("numero, nombre, estado")
    .order("numero", { ascending: true });

  if (error) {
    console.error("Error al descargar CSV:", error);
    alert("No se pudo descargar el archivo CSV: " + error.message);
    return;
  }

  let csv = "indice;numero;nombre;estado\n";

  data.forEach((item, index) => {
    const indice = index + 1;
    const numero = String(item.numero).padStart(2, "0");
    const nombre = item.nombre ? item.nombre.replace(/;/g, ",") : "";
    const estado = item.estado || "libre";

    csv += `${indice};${numero};${nombre};${estado}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  link.setAttribute("href", url);
  link.setAttribute("download", `rifa_${fecha}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

window.descargarCSV = descargarCSV;

// =============================
// CONFIG RIFA: CARGAR FORMULARIO
// =============================
async function cargarConfiguracionRifa() {
  const { data, error } = await supabaseClient
    .from("config_rifa")
    .select("*")
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Error al cargar configuración:", error);
    return;
  }

  if (!data || data.length === 0) {
    return;
  }

  const config = data[0];

  document.getElementById("titulo_modal").value = config.titulo_modal || "";
  document.getElementById("subtitulo_modal").value = config.subtitulo_modal || "";
  document.getElementById("valor_numero").value = config.valor_numero || "";
  document.getElementById("forma_pago").value = config.forma_pago || "";
  document.getElementById("whatsapp").value = config.whatsapp || "";
  document.getElementById("mensaje_extra").value = config.mensaje_extra || "";
}

// =============================
// CONFIG RIFA: GUARDAR
// =============================
async function guardarConfiguracionRifa() {
  const titulo_modal = document.getElementById("titulo_modal").value.trim();
  const subtitulo_modal = document.getElementById("subtitulo_modal").value.trim();
  const valor_numero = document.getElementById("valor_numero").value.trim();
  const forma_pago = document.getElementById("forma_pago").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const mensaje_extra = document.getElementById("mensaje_extra").value.trim();

  const { data: existentes, error: errorBuscar } = await supabaseClient
    .from("config_rifa")
    .select("id")
    .order("id", { ascending: true })
    .limit(1);

  if (errorBuscar) {
    console.error("Error al buscar configuración:", errorBuscar);
    alert("No se pudo guardar la información: " + errorBuscar.message);
    return;
  }

  let errorGuardar = null;

  if (existentes && existentes.length > 0) {
    const idConfig = existentes[0].id;

    const { error } = await supabaseClient
      .from("config_rifa")
      .update({
        titulo_modal,
        subtitulo_modal,
        valor_numero,
        forma_pago,
        whatsapp,
        mensaje_extra
      })
      .eq("id", idConfig);

    errorGuardar = error;
  } else {
    const { error } = await supabaseClient
      .from("config_rifa")
      .insert([{
        titulo_modal,
        subtitulo_modal,
        valor_numero,
        forma_pago,
        whatsapp,
        mensaje_extra
      }]);

    errorGuardar = error;
  }

  if (errorGuardar) {
    console.error("Error al guardar configuración:", errorGuardar);
    alert("No se pudo guardar la información: " + errorGuardar.message);
    return;
  }

  alert("Los cambios han sido guardados correctamente");
  await cargarConfiguracionRifa();
  await cargarTablaConfig();
}

if (guardarConfigBtn) {
  guardarConfigBtn.addEventListener("click", guardarConfiguracionRifa);
}

// =============================
// TABLA CONFIG_RIFA
// SOLO: id, valor_numero, forma_pago, acciones
// =============================
async function cargarTablaConfig() {
  if (!tablaConfig) return;

  const { data, error } = await supabaseClient
    .from("config_rifa")
    .select("id, valor_numero, forma_pago")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error al cargar tabla config:", error);
    tablaConfig.innerHTML = `
      <tr>
        <td colspan="4">Error al cargar configuración</td>
      </tr>
    `;
    return;
  }

  tablaConfig.innerHTML = "";

  if (!data || data.length === 0) {
    tablaConfig.innerHTML = `
      <tr>
        <td colspan="4">No hay configuración guardada todavía.</td>
      </tr>
    `;
    return;
  }

  data.forEach(item => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${item.id}</td>
      <td>${item.valor_numero || "-"}</td>
      <td>${item.forma_pago || "-"}</td>
      <td>
        <button onclick="editarConfig(${item.id})">✏️ Editar</button>
      </td>
    `;

    tablaConfig.appendChild(fila);
  });
}

// =============================
// EDITAR CONFIG DESDE TABLA
// =============================
async function editarConfig(id) {
  const { data, error } = await supabaseClient
    .from("config_rifa")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al cargar configuración para editar:", error);
    alert("No se pudo cargar la configuración para editar.");
    return;
  }

  document.getElementById("titulo_modal").value = data.titulo_modal || "";
  document.getElementById("subtitulo_modal").value = data.subtitulo_modal || "";
  document.getElementById("valor_numero").value = data.valor_numero || "";
  document.getElementById("forma_pago").value = data.forma_pago || "";
  document.getElementById("whatsapp").value = data.whatsapp || "";
  document.getElementById("mensaje_extra").value = data.mensaje_extra || "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

window.editarConfig = editarConfig;

// =============================
// INICIO
// =============================

const tablaAdmin = document.getElementById("tablaAdmin");

async function cargarTablaAdmin() {
  console.log("Iniciando carga de tabla admin...");

  if (!tablaAdmin) {
    console.error("No existe #tablaAdmin en el HTML");
    return;
  }

  const { data, error } = await supabaseClient
    .from("numeros_rifa")
    .select("*")
    .order("numero", { ascending: true });

  if (error) {
    console.error("Error al cargar la tabla:", error);
    alert("Error al cargar la tabla: " + error.message);
    return;
  }

  console.log("Datos recibidos:", data);

  tablaAdmin.innerHTML = "";

  data.forEach(item => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${String(item.numero).padStart(2, "0")}</td>
      <td>${item.nombre || "-"}</td>
      <td>${item.estado || "libre"}</td>
    `;

    tablaAdmin.appendChild(fila);
  });
}

cargarTablaAdmin();
cargarConfiguracionRifa();
cargarTablaConfig();