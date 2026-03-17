const tablaAdmin = document.getElementById("tablaAdmin");

// Inputs config modal
const tituloModalInput = document.getElementById("tituloModal");
const subtituloModalInput = document.getElementById("subtituloModal");
const valorNumeroInput = document.getElementById("valorNumero");
const formaPagoInput = document.getElementById("formaPago");
const whatsappModalInput = document.getElementById("whatsappModal");
const mensajeExtraInput = document.getElementById("mensajeExtra");
const btnGuardarInfo = document.getElementById("btnGuardarInfo");

/* =========================
   CARGAR TABLA DE NÚMEROS
========================= */
async function cargarTablaAdmin() {
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

/* =========================
   CARGAR CONFIG DEL MODAL
========================= */
async function cargarConfigModal() {
  const { data, error } = await supabaseClient
    .from("config_rifa")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al cargar config_rifa:", error);
    return;
  }

  if (!data) {
    tituloModalInput.value = "";
    subtituloModalInput.value = "";
    valorNumeroInput.value = "";
    formaPagoInput.value = "";
    whatsappModalInput.value = "";
    mensajeExtraInput.value = "";
    return;
  }

  tituloModalInput.value = data.titulo_modal || "";
  subtituloModalInput.value = data.subtitulo_modal || "";
  valorNumeroInput.value = data.valor_numero || "";
  formaPagoInput.value = data.forma_pago || "";
  whatsappModalInput.value = data.whatsapp || "";
  mensajeExtraInput.value = data.mensaje_extra || "";
}

/* =========================
   GUARDAR CONFIG DEL MODAL
========================= */
async function guardarConfigModal() {
  const payload = {
    titulo_modal: tituloModalInput.value.trim(),
    subtitulo_modal: subtituloModalInput.value.trim(),
    valor_numero: valorNumeroInput.value.trim(),
    forma_pago: formaPagoInput.value.trim(),
    whatsapp: whatsappModalInput.value.trim(),
    mensaje_extra: mensajeExtraInput.value.trim()
  };

  const { data: existente, error: errorBuscar } = await supabaseClient
    .from("config_rifa")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (errorBuscar) {
    console.error("Error al buscar config existente:", errorBuscar);
    alert("Error al buscar configuración: " + errorBuscar.message);
    return;
  }

  let errorGuardar = null;

  if (existente && existente.id) {
    const { error } = await supabaseClient
      .from("config_rifa")
      .update(payload)
      .eq("id", existente.id);

    errorGuardar = error;
  } else {
    const { error } = await supabaseClient
      .from("config_rifa")
      .insert([payload]);

    errorGuardar = error;
  }

  if (errorGuardar) {
    console.error("Error al guardar config:", errorGuardar);
    alert("Error al guardar la configuración: " + errorGuardar.message);
    return;
  }

  alert("Los cambios han sido guardados correctamente");
  await cargarConfigModal();
}

/* =========================
   EVENTOS
========================= */
if (btnGuardarInfo) {
  btnGuardarInfo.addEventListener("click", guardarConfigModal);
}

/* =========================
   INICIO
========================= */
async function initAdmin() {
  await cargarTablaAdmin();
  await cargarConfigModal();
}

initAdmin();