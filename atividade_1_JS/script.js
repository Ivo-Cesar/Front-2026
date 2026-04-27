const cria = document.getElementById("main");
const btn = document.getElementById("btn");

const estados = {
    normal:  "./imagensJS/Criatura fofinha de pelúcia verde menta.png",
    puto: "./imagensJS/Brava.png",
    morto: "./imagensJS/morto.png",
    comendo: "./imagensJS/criatura_comendo.png",
    alimentado: "./imagensJS/",  
};

let contador = 0;
let intervalo = null;
let timeClick = null;
let timeOut = null;

function controlador (){
    if(intervalo) clearInterval(intervalo)
        
        intervalo = setInterval(() => {
            contador++;

            console.log("tempo:",contador);
            
            if (contador == 30){
                cria.src = estados.puto;
            }

            if(contador == 60){
                cria.src = estados.morto;
                clearInterval(intervalo);
            }
        }, 1000);
}

function alimentando(){
    cria.src = estados.comendo;
    contador = 0;
    console.log("alimentando");

    if(timeClick) clearInterval(timeClick);;

    timeClick = setTimeout(() => {
        cria.src = estados.comendo;
        timeOut = setTimeout(() => {
            cria.src = estados.normal;
        }, 2000);
    }, 5000);
}

controlador();

function mudarClima() {
    const checkbox = document.getElementById("theme-toggle");
    const html = document.documentElement; 
    const corpo = document.body;

    if (checkbox.checked) {
        // DIA
        html.setAttribute("data-theme", "cupcake"); 
        corpo.style.backgroundImage = "url('./imagensJS/fundo.png')";
        console.log("Bom dia!");
    } else {
        // NOITE
        html.setAttribute("data-theme", "dracula"); 
        corpo.style.backgroundImage = "url('./imagensJS/noite.png')";
        console.log("Boa noite!");
    }
}

window.onload = mudarClima;