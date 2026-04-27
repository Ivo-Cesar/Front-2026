const produtos = {
    "123": {"nome": "Coca-cola espumante", "preco": 9.99 },
    "456": {"nome": "Um mamute pequenino", "preco": 8.99 },
    "789": {"nome": "Vampiro Doidão",      "preco": 4.69 }
};

let carrinho = [];

const audio = new Audio("bip.mp3");

window.onload = () => {
    document.getElementById("cod").focus();
}

function addProduto(){
    const codValue = document.getElementById("cod");
    const qtdValue = document.getElementById("qtd");

    const codigo = codValue.value;
    const quantidade = qtdValue.value;
    
    if(!produtos[codigo]){
        AlertItem();
        return;
    }

    const produtobase = produtos[codigo];
    const item = {
        nome: produtobase.nome,
        preco: produtobase.preco,
        quantidade: quantidade,
        subtotal: produtobase.preco * quantidade
    };

    carrinho.push(item);
    audio.currentTime = 0;
    audio.play();

    atualizarTela();
}

function atualizarTela(){
    const lista = getElementById("lista");
    lista.innerHTML = "";

    let total = 0;

    carrinho.forEach((item, index) => {
        total += item.subtotal;

        const li = document.createElement("li");
        li.className = "list-group-item";

        li.innerHTML = `<div class="d-flex justify-content-content-between">
            <strong>${item.nome}</strong>
            <small> ${item.quantidade} x R$ ${item.preco} = <strong> ${item.subtotal} </strong> </small>`;
        
        lista.appendChild(li);
    });
}
