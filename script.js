const contenedor = document.getElementById("numeros");

// =============================
// CARGAR NÚMEROS
// =============================
async function cargarNumeros() {
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

    if (numero.estado === "reservado" || numero.estado === "confirmado") {
      boton.classList.add("ocupado");
      boton.disabled = true;
    } else {
      boton.onclick = () => comprarNumero(numero.numero);
    }

    contenedor.appendChild(boton);
  });
}

// =============================
// RESERVAR NÚMERO
// =============================
async function comprarNumero(numero) {
  const nombre = prompt("Ingrese su nombre");
  if (!nombre || !nombre.trim()) return;

  const { data, error } = await supabaseClient
    .from("numeros_rifa")
    .update({
      nombre: nombre.trim(),
      estado: "reservado"
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

  const tituloInfo = document.getElementById("tituloInfo");
  const subtituloInfo = document.getElementById("subtituloInfo");
  const infoValor = document.getElementById("infoValor");
  const infoPago = document.getElementById("infoPago");
  const infoMensajeExtra = document.getElementById("infoMensajeExtra");
  const btnWhatsapp = document.getElementById("btnWhatsappInfo");

  if (tituloInfo) tituloInfo.textContent = config.titulo_modal || "Información de la Rifa";
  if (subtituloInfo) subtituloInfo.textContent = config.subtitulo_modal || "";
  if (infoValor) infoValor.textContent = config.valor_numero || "-";
  if (infoPago) infoPago.textContent = config.forma_pago || "-";
  if (infoMensajeExtra) infoMensajeExtra.textContent = config.mensaje_extra || "-";

  if (btnWhatsapp) {
    if (config.whatsapp && config.whatsapp.trim() !== "") {
      btnWhatsapp.href = `https://wa.me/${config.whatsapp}?text=Hola%20quiero%20consultar%20por%20la%20rifa`;
      btnWhatsapp.style.display = "flex";
    } else {
      btnWhatsapp.href = "#";
      btnWhatsapp.style.display = "none";
    }
  }
}

// =============================
// MODAL INFO
// =============================
function abrirInfo() {
  const modal = document.getElementById("modalInfo");
  if (modal) {
    modal.classList.add("mostrar");
    document.body.classList.add("modal-abierto");
  }
}

function cerrarInfo() {
  const modal = document.getElementById("modalInfo");
  if (modal) {
    modal.classList.remove("mostrar");
    document.body.classList.remove("modal-abierto");
  }
}

window.abrirInfo = abrirInfo;
window.cerrarInfo = cerrarInfo;

window.addEventListener("click", function (e) {
  const modal = document.getElementById("modalInfo");
  if (e.target === modal) {
    cerrarInfo();
  }
});

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    cerrarInfo();
  }
});

// =============================
// TIEMPO REAL: NUMEROS_RIFA
// =============================
supabaseClient
  .channel("numeros_rifa_changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "numeros_rifa"
    },
    () => {
      cargarNumeros();
    }
  )
  .subscribe();

// =============================
// TIEMPO REAL: CONFIG_RIFA
// PARA QUE EL MODAL SE ACTUALICE SOLO
// =============================
supabaseClient
  .channel("config_rifa_changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "config_rifa"
    },
    () => {
      cargarInfoRifa();
    }
  )
  .subscribe();

// =============================
// INICIO
// =============================
cargarNumeros();
cargarInfoRifa();