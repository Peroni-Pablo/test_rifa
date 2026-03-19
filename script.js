const contenedor = document.getElementById("numeros");

// =============================
// NORMALIZAR ESTADOS
// =============================
function normalizarEstado(estado) {
  if (!estado) return "libre";
  const e = estado.toLowerCase().trim();
  if (e === "reservado" || e === "pendiente") return "pendiente";
  if (e === "vendido"   || e === "confirmado") return "confirmado";
  return "libre";
}

// =============================
// BLOQUEO — fuente de verdad
// Siempre consulta Supabase y devuelve true/false
// =============================
async function cargarBloqueo() {
  try {
    const { data, error } = await supabaseClient
      .from("config_rifa")
      .select("bloqueado")
      .eq("id", 1)
      .single();

    console.log("[bloqueo] data:", data, "| error:", error);

    if (error) {
      console.warn("[bloqueo] Error al leer config_rifa:", error.message);
      return false;
    }
    if (!data) {
      console.warn("[bloqueo] No se encontró la fila id=1 en config_rifa");
      return false;
    }

    console.log("[bloqueo] valor:", data.bloqueado, "| tipo:", typeof data.bloqueado);
    return data.bloqueado === true;

  } catch (err) {
    console.error("[bloqueo] Error inesperado:", err);
    return false;
  }
}

// =============================
// CARGAR NÚMEROS
// =============================
async function cargarNumeros() {
  const bloqueado = await cargarBloqueo();

  const { data, error } = await supabaseClient
    .from("numeros_rifa")
    .select("*")
    .order("numero", { ascending: true });

  if (error) {
    console.error("Error al cargar números:", error);
    alert("Error al cargar números: " + error.message);
    return;
  }

  if (!contenedor) return;

  contenedor.innerHTML = "";

  data.forEach(numero => {
    const boton = document.createElement("button");
    boton.textContent = numero.numero.toString().padStart(2, "0");

    const estado = normalizarEstado(numero.estado);
    boton.classList.add(estado);

    if (estado === "libre" && !bloqueado) {
      boton.onclick = () => comprarNumero(numero.numero);
    } else {
      boton.disabled = true;
      if (estado === "libre" && bloqueado) {
        boton.title = "La selección de números está temporalmente deshabilitada.";
      }
    }

    contenedor.appendChild(boton);
  });
}

// =============================
// RESERVAR NÚMERO
// =============================
async function comprarNumero(numero) {
  // Verificar bloqueo en tiempo real antes de cualquier acción
  const bloqueado = await cargarBloqueo();
  if (bloqueado) {
    alert("La selección de números está temporalmente deshabilitada.");
    await cargarNumeros();
    return;
  }

  // Pedir nombre
  const nombre = prompt("Ingrese su nombre:");
  if (!nombre || !nombre.trim()) return;

  // Pedir teléfono
  const telefono = prompt("Ingrese su número de teléfono (10 dígitos):");
  if (telefono === null) return;

  // Validar: exactamente 10 dígitos numéricos
  const soloNumeros = telefono.trim().replace(/\s/g, "");
  if (!/^\d{10}$/.test(soloNumeros)) {
    alert("Ingrese un número de teléfono válido (exactamente 10 dígitos numéricos).");
    return;
  }

  const { data, error } = await supabaseClient
    .from("numeros_rifa")
    .update({
      nombre:   nombre.trim(),
      telefono: soloNumeros,
      estado:   "pendiente"
    })
    .eq("numero", numero)
    .eq("estado", "libre")
    .select();

  if (error) {
    console.error("ERROR SUPABASE:", error);
    alert("No se pudo reservar el número: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("Ese número ya fue reservado por otra persona.");
    cargarNumeros();
    return;
  }

  alert(`Número ${String(numero).padStart(2, "0")} reservado correctamente`);
  cargarNumeros();
}

// =============================
// CARGAR INFO DEL MODAL
// =============================
async function cargarInfoRifa() {
  const { data, error } = await supabaseClient
    .from("config_rifa")
    .select("*")
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Error al cargar info de la rifa:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.warn("No hay configuración guardada en config_rifa");
    return;
  }

  const config = data[0];

  const tituloInfo       = document.getElementById("tituloInfo");
  const subtituloInfo    = document.getElementById("subtituloInfo");
  const infoValor        = document.getElementById("infoValor");
  const infoPago         = document.getElementById("infoPago");
  const infoMensajeExtra = document.getElementById("infoMensajeExtra");
  const btnWhatsapp      = document.getElementById("btnWhatsappInfo");

  if (tituloInfo)       tituloInfo.textContent       = config.titulo_modal    || "Información de la Rifa";
  if (subtituloInfo)    subtituloInfo.textContent    = config.subtitulo_modal || "";
  if (infoValor)        infoValor.textContent        = config.valor_numero    || "-";
  if (infoPago)         infoPago.textContent         = config.forma_pago      || "-";
  if (infoMensajeExtra) infoMensajeExtra.textContent = config.mensaje_extra   || "-";

  if (btnWhatsapp) {
    if (config.whatsapp && config.whatsapp.trim() !== "") {
      btnWhatsapp.href          = `https://wa.me/${config.whatsapp}?text=Hola%20quiero%20consultar%20por%20la%20rifa`;
      btnWhatsapp.style.display = "flex";
    } else {
      btnWhatsapp.href          = "#";
      btnWhatsapp.style.display = "none";
    }
  }
}

// =============================
// BANNER DE PRESENTACIÓN
// =============================
async function cargarBanner() {
  try {
    const { data, error } = await supabaseClient
      .from("config_rifa")
      .select("imagen_url")
      .eq("id", 1)
      .single();

    if (error) {
      console.warn("cargarBanner: error al leer config_rifa →", error.message);
      return;
    }

    if (!data?.imagen_url) {
      console.info("cargarBanner: no hay imagen_url guardada.");
      return;
    }

    const banner    = document.getElementById("bannerPresentacion");
    const bannerImg = document.getElementById("bannerImg");

    if (!banner || !bannerImg) return;

    bannerImg.src        = data.imagen_url + "?t=" + Date.now();
    banner.style.display = "flex";
    document.body.classList.add("banner-abierto");

  } catch (err) {
    console.error("cargarBanner: error inesperado →", err);
  }
}

function cerrarBanner() {
  const banner = document.getElementById("bannerPresentacion");
  if (banner) {
    banner.classList.add("cerrando");
    setTimeout(() => {
      banner.style.display = "none";
      banner.classList.remove("cerrando");
      document.body.classList.remove("banner-abierto");
    }, 280);
  }
}

window.cerrarBanner = cerrarBanner;

// =============================
// MODAL INFO
// =============================
async function abrirInfo() {
  const modal = document.getElementById("modalInfo");
  if (!modal) return;

  await cargarInfoRifa();

  modal.classList.add("mostrar");
  document.body.classList.add("modal-abierto");
}

function cerrarInfo() {
  const modal = document.getElementById("modalInfo");
  if (modal) {
    modal.classList.remove("mostrar");
    document.body.classList.remove("modal-abierto");
  }
}

window.abrirInfo  = abrirInfo;
window.cerrarInfo = cerrarInfo;

window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalInfo");
  if (e.target === modal) cerrarInfo();
});

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    cerrarInfo();
    cerrarBanner();
  }
});

// =============================
// TIEMPO REAL: NUMEROS_RIFA
// =============================
supabaseClient
  .channel("numeros_rifa_changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "numeros_rifa" }, () => {
    cargarNumeros();
  })
  .subscribe();

// =============================
// TIEMPO REAL: CONFIG_RIFA
// =============================
supabaseClient
  .channel("config_rifa_changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "config_rifa" }, () => {
    cargarInfoRifa();
    cargarNumeros(); // re-renderiza con el estado de bloqueo actualizado
  })
  .subscribe();

// =============================
// INICIO
// =============================
cargarNumeros();
cargarInfoRifa();
cargarBanner();