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

cargarNumeros();