const tablaAdmin = document.getElementById("tablaAdmin");
const btnLimpiarLista = document.getElementById("btnLimpiarLista");

async function cargarTablaAdmin() {
  const { data, error } = await supabaseClient
    .from("numeros_rifa")
    .select("*")
    .order("numero", { ascending: true });

  if (error) {
    console.error("Error al cargar la tabla:", error);
    alert("Error al cargar los números de la rifa: " + error.message);
    return;
  }

  tablaAdmin.innerHTML = "";

  data.forEach(item => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${formatearNumero(item.numero)}</td>
      <td>${item.nombre || "-"}</td>
      <td style="font-weight:bold; color:${obtenerColorEstado(item.estado || "libre")};">
        ${item.estado || "libre"}
      </td>
      <td>
        <button onclick="confirmarNumero('${item.numero}')">✅ Confirmar</button>
        <button onclick="cancelarNumero('${item.numero}')">❌ Cancelar</button>
      </td>
    `;

    tablaAdmin.appendChild(fila);
  });
}

async function confirmarNumero(numero) {
  const confirmar = confirm(`¿Querés confirmar el número ${formatearNumero(numero)}?`);
  if (!confirmar) return;

  const { data, error: errorBuscar } = await supabaseClient
    .from("numeros_rifa")
    .select("*")
    .eq("numero", numero)
    .single();

  if (errorBuscar) {
    console.error("Error al buscar número:", errorBuscar);
    alert("No se pudo buscar el número: " + errorBuscar.message);
    return;
  }

  if (!data.nombre || data.estado === "libre") {
    alert("No podés confirmar un número que está libre.");
    return;
  }

  const { error } = await supabaseClient
    .from("numeros_rifa")
    .update({ estado: "confirmado" })
    .eq("numero", numero);

  if (error) {
    console.error("Error al confirmar número:", error);
    alert("No se pudo confirmar el número: " + error.message);
    return;
  }

  alert(`Número ${formatearNumero(numero)} confirmado correctamente.`);
  cargarTablaAdmin();
}

async function cancelarNumero(numero) {
  const confirmar = confirm(`¿Querés cancelar/liberar el número ${formatearNumero(numero)}?`);
  if (!confirmar) return;

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

  alert(`Número ${formatearNumero(numero)} liberado correctamente.`);
  cargarTablaAdmin();
}

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
    cargarTablaAdmin();
  });
}

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

  // Encabezados
  let csv = "indice;numero;nombre;estado\n";

  // Filas
  data.forEach((item, index) => {
    const indice = index + 1;
    const numero = String(item.numero).padStart(2, "0");
    const nombre = item.nombre ? item.nombre.replace(/;/g, ",") : "";
    const estado = item.estado || "libre";

    csv += `${indice};${numero};${nombre};${estado}\n`;
  });

  // BOM para que Excel lea bien acentos/ñ
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Nombre del archivo con fecha
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

function obtenerColorEstado(estado) {
  switch (estado) {
    case "libre":
      return "green";
    case "reservado":
      return "orange";
    case "confirmado":
      return "red";
    default:
      return "black";
  }
}

function formatearNumero(numero) {
  return String(numero).padStart(2, "0");
}

window.confirmarNumero = confirmarNumero;
window.cancelarNumero = cancelarNumero;

cargarTablaAdmin();

async function cargarConfiguracionRifa() {
  const { data, error } = await supabaseClient
    .from("config_rifa")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    console.error("Error al cargar configuración:", error);
    return;
  }

  document.getElementById("titulo_modal").value = data.titulo_modal || "";
  document.getElementById("subtitulo_modal").value = data.subtitulo_modal || "";
  document.getElementById("valor_numero").value = data.valor_numero || "";
  document.getElementById("forma_pago").value = data.forma_pago || "";
  document.getElementById("whatsapp").value = data.whatsapp || "";
  document.getElementById("mensaje_extra").value = data.mensaje_extra || "";
}

async function guardarConfiguracionRifa() {
  const titulo_modal = document.getElementById("titulo_modal").value.trim();
  const subtitulo_modal = document.getElementById("subtitulo_modal").value.trim();
  const valor_numero = document.getElementById("valor_numero").value.trim();
  const forma_pago = document.getElementById("forma_pago").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const mensaje_extra = document.getElementById("mensaje_extra").value.trim();

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
    .eq("id", 1);

  if (error) {
    console.error("Error al guardar configuración:", error);
    alert("No se pudo guardar la información.");
    return;
  }

  alert("Información guardada correctamente.");
}

const guardarConfigBtn = document.getElementById("guardarConfigBtn");
if (guardarConfigBtn) {
  guardarConfigBtn.addEventListener("click", guardarConfiguracionRifa);
}

cargarConfiguracionRifa();