const contenedor = document.getElementById("numeros");
const tabla = document.querySelector("#tabla tbody");

async function cargarNumeros() {

const { data, error } = await supabaseClient
.from("numeros_rifa")
.select("*")
.order("numero");

if (error) {
console.error(error);
return;
}

if (contenedor) {

contenedor.innerHTML = "";

data.forEach(numero => {

const boton = document.createElement("button");

boton.textContent = numero.numero.toString().padStart(2,"0");

if (numero.ocupado) {
boton.classList.add("ocupado");
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
<td>${numero.numero}</td>
<td>${numero.nombre || "-"}</td>
<td>${numero.ocupado ? "Ocupado" : "Libre"}</td>
`;

tabla.appendChild(fila);

});

}

}

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

console.log("Cambio detectado", payload);

cargarNumeros();

}
)
.subscribe();

async function comprarNumero(numero){

const nombre = prompt("Ingrese su nombre");
if(!nombre) return;

await supabaseClient
.from("numeros_rifa")
.update({
nombre: nombre,
ocupado: true
})
.eq("numero", numero)
.eq("ocupado", false)

if(error){
  console.log("ERROR SUPABASE:", error);
}else{
  console.log("Numero reservado correctamente");
}

}

cargarNumeros();

