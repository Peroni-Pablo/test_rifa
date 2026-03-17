const contenedor = document.getElementById("numeros");
const tabla = document.querySelector("#tabla tbody");

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

  if (contenedor) {
    contenedor.innerHTML = "";

    data.forEach(numero => {
      const boton = document.createElement("button");
      boton.textContent = numero.numero.toString().padStart(2, "0");

      // Ocupado si está reservado o confirmado
      if (numero.estado === "reservado" || numero.estado === "confirmado") {
        boton.classList.add("ocupado");
        boton.disabled = true;
      } else {
        boton.onclick = () => comprarNumero(numero.numero);
      }

      contenedor.appendChild(boton);
    });
  }

  if (tabla) {
    tabla.innerHTML = "";

    data.forEach(numero => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${numero.numero.toString().padStart(2, "0")}</td>
        <td>${numero.nombre || "-"}</td>
        <td>${numero.estado || "libre"}</td>
      `;

      tabla.appendChild(fila);
    });
  }
}

// Escuchar cambios en tiempo real
supabaseClient
  .channel("numeros_rifa_changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "numeros_rifa"
    },
    (payload) => {
      console.log("Cambio detectado:", payload);
      cargarNumeros();
    }
  )
  .subscribe();

async function comprarNumero(numero) {
  const nombre = prompt("Ingrese su nombre");
  if (!nombre) return;

  const { error } = await supabaseClient
    .from("numeros_rifa")
    .update({
      nombre: nombre,
      estado: "reservado"
    })
    .eq("numero", numero)
    .eq("estado", "libre");

  if (error) {
    console.log("ERROR SUPABASE:", error);
    alert("No se pudo reservar el número: " + error.message);
  } else {
    console.log("Número reservado correctamente");
    alert("Número reservado correctamente");
    cargarNumeros();
  }
}


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

window.addEventListener("click", function(e) {
  const modal = document.getElementById("modalInfo");
  if (e.target === modal) {
    cerrarInfo();
  }
});

window.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    cerrarInfo();
  }
});

cargarNumeros();
cargarInfoRifa();