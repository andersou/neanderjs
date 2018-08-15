// neander-js - A Neander machine simulator. 
// Written by Vítor De Araújo, http://inf.ufrgs.br/~vbuaraujo .
// No copyright -- this program is in public domain.

version = "0.0.6, 2018";

op = new Array();
op[0] = "NOP";
op[1] = "STA";
op[2] = "LDA";
op[3] = "ADD";
op[4] = "OR";
op[5] = "AND";
op[6] = "NOT";
op[8] = "JMP";
op[9] = "JN";
op[10] = "JZ";
op[15] = "HLT";

mem = new Array();
type = new Array();
zflag = true;
nflag = true;

function init() {
    document.getElementById("title").innerHTML = "Neander-js version " + version;
    document.code.sel.style.display = "none";
    document.data.sel.style.display = "none";
    initselect(document.code.sel);
    initselect(document.data.sel);
    for (i = 0; i < 256; i++) {
        mem[i] = 0;
        type[i] = (-1);
    }
    setmem(0, 0, true);
    document.code.sel.style.display = "block";
    document.data.sel.style.display = "block";
    setac(0);
    setpc(0);

    // impexp_do(0, document.impexp);
}

function initselect(sel) {
    // Initializes a SELECT element.
    while (sel.options.length > 0)
        sel.remove(0);
    for (i = 0; i < 256; i++) {
        e = document.createElement("option");
        sel.add(e, null);
    }
}

function fmt(n) {
    if (n < 10)
        return ("\240\240" + n);
    else if (n < 100)
        return ("\240" + n);
    else
        return n;
}

function setmem(qpos, data, loop) {
    // Sets a memory position.

    cods = document.code.sel;
    dats = document.data.sel;

    if (!(qpos >= 0 && qpos <= 255)) return;

    for (pos = qpos; pos <= 255; pos++) {
        if (pos == qpos) {
            data = unsigned(data - 0);
            mem[pos] = data;
        } else {
            if (pos != 0 && type[pos - 1] < 1 && type[pos] >= 0) return;
            if (pos != 0 && type[pos - 1] == 1 && type[pos] == -1) return;
            data = mem[pos];
        }

        if (pos == 0 || type[pos - 1] < 1) {
            // We have an instruction.
            opc = Math.floor(data / 16);
            opm = op[opc];
            if (!opm) opm = "???";
            ltype = arity(opc);
            cods.options[pos].text = fmt(pos) + ".  " + fmt(data) + "  " + opm;
        } else {
            // We have an address.
            ltype = -1;
            cods.options[pos].text = fmt(pos) + ".  " + fmt(data) + "\240\240\240\240\240[" + data + "]";
        }

        dats.options[pos].text = fmt(pos) + ". " + fmt(data) + "  (" + signed(data) + ")";

        if (ltype != type[pos])
            type[pos] = ltype;
        else
            break;

        if (!loop) break;
    }
}

function arity(c) {
    // Determines the number of arguments an instruction takes.
    if (!op[c] || c == 0 || c == 6 || c == 15) return 0;
    else return 1;
}

function signed(n) {
    // Returns the signed version of an 8-bit 2-complement number.
    if (n >= 128) return -(255 - n + 1);
    else return n;
}

function unsigned(n) {
    // Inverse of signed(n).
    if (n < 0) return (255 + (n - 0) + 1);
    else return n;
}

function updatemem(form) {
    pos = form.sel.selectedIndex - 0;
    val = form.val.value;
    let index = op.indexOf(val.toUpperCase());
    if (index !== -1) {
        val = index * 16;
    } else {
        val = val - 0;
    }
    setmem(pos, val, true);
    if (pos < 255) {
        form.sel.selectedIndex++;
        select(form);
    }
}

function select(form) {
    pos = form.sel.selectedIndex;
    form.addr.value = '[' + pos + ']';
    form.val.value = mem[pos];
    form.val.focus();
    form.val.select();
}

function setac(data) {
    // Sets the accumulator.
    data = data - 0;
    if (data < 0) data = unsigned(data);
    data &= 255;
    panel = document.panel;
    panel.ac.value = data;
    panel.acsigned.value = signed(data);
    panel.acbinary.value = tobinary(data);
    if (data >= 128) {
        nflag = true;
        zflag = false;
    } else {
        nflag = false;
        if (data == 0)
            zflag = true;
        else
            zflag = false;
    }

    if (nflag) panel.nflag.style.background = "#00FF00";
    else panel.nflag.style.background = "#C0C0C0";
    if (zflag) panel.zflag.style.background = "#00FF00";
    else panel.zflag.style.background = "#C0C0C0";
}

function ac() {
    return document.panel.ac.value - 0;
}

function setpc(data) {
    // Sets the program counter;
    if (!(data >= 0 && data <= 255)) data = 255;

    panel = document.panel;
    panel.pc.value = data;
    panel.pcbinary.value = tobinary(data);

    code = document.code;
    code.sel.selectedIndex = data;
    select(code);
}

function pc() {
    return document.panel.pc.value - 0;
}

function tobinary(n) {
    // Returns the binary encoded version of a number.
    s = "";
    for (i = 7; i >= 0; i--) {
        if (n & Math.pow(2, i)) s += "1";
        else s += "0";
    }
    return s;
}

function stepResult() {
    // The instruction under PC.
    cont = true;
    opc = Math.floor(mem[pc()] / 16);
    arg = 0;
    if (arity(opc) > 0) {
        if (pc() < 255) {
            arg = mem[pc() + 1];
            setpc(pc() + 1);
        } else
            return false;
    }
    if (pc() == 255)
        cont = false;
    else
        setpc(pc() + 1);

    if (opc == 15) return false;
    if (op[opc])
        return (eval("op_" + op[opc] + "(" + arg + ")") && cont);
    return true;
}

function run() {
    while (stepResult());
}

function op_NOP(arg) {
    return true;
}

function op_STA(arg) {
    setmem(arg, ac(), true);
    return true;
}

function op_LDA(arg) {
    setac(mem[arg]);
    return true;
}

function op_ADD(arg) {
    setac((ac() + mem[arg]) & 255);
    return true;
}

function op_OR(arg) {
    setac(ac() | mem[arg]);
    return true;
}

function op_AND(arg) {
    setac(ac() & mem[arg]);
    return true;
}

function op_NOT(arg) {
    setac(255 - ac());
    return true;
}

function op_JMP(arg) {
    setpc(arg);
    return true;
}

function op_JN(arg) {
    if (nflag) setpc(arg);
    return true;
}

function op_JZ(arg) {
    if (zflag) setpc(arg);
    return true;
}

function op_HLT(arg) {
    return false;
}

// Tabbing.
function bringtab(name) {
    divs = document.getElementsByTagName("div");
    for (i = 0; i < divs.length; i++) {
        if (divs.item(i).id == "div_" + name) {
            divs.item(i).className = "active";
            document.getElementById("link_" + name).className = "active";
        } else if (divs.item(i).id && divs.item(i).id.substr(0, 4) == "div_") {
            divs.item(i).className = "inactive";
            document.getElementById("link_" + divs.item(i).id.substr(4)).className = "inactive";
        }
    }
}

// Importing and exporting.
// The import/export functions must be of the form:
//   impexp_TYPE(form, pane, operation)
// 'form' is the import/export HTML form, which contains the 'code' textarea
// and any options that the function creates. 'pane' is the options pane div
// element, which is to be set by the function to contain its operation options.
// 'operation' is 0 for CONFIG, 1 for IMPORT (load code into the memory), and
// 2 for EXPORT (make code from the memory contents). When called in CONFIG mode, 
// the function must set its options pane.

hexdigit = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f');

function hex(n) {
    // Returns the number n (between 0 and 255) in hexadecimal.
    return hexdigit[Math.floor(n / 16)] + hexdigit[n % 16];
}

var header = "034e4452";
function impexp_hexmem(form, pane, operation) {
    

    if (operation == 0) {
        pane.innerHTML = "" +
            "<B>Dica:<\/B> No GNU/Linux, você pode converter o formato hexmem " +
            "para o formato MEM do Neander usando o comando <TT>xxd<\/TT>, que " +
            "acompanha o editor de texto Vim." +
            "<BR> &ndash; Para converter de <U>hexmem<\/U> para <U>mem<\/U>: salve o código acima " +
            "em um arquivo texto e use:<BR><TT>xxd -r -p arquivo.hex >arquivo.mem<\/TT>" +
            "<BR> &ndash; Para converter de <U>mem<\/U> para <U>hexmem<\/U>:<BR>" +
            "<TT>xxd -p arquivo.mem >arquivo.hex<\/TT>";
    } else if (operation == 1) {
        txt = form.code.value;
        carregarHexmem(txt);
    } else if (operation == 2) {
        // out = header;
        // for (i = 0; i < 256; i++) {
        //     out += hex(mem[i]) + "00";
        //     if (i % 15 == 12) out += "\n";
        // }
        form.code.value = gerarHexmem();
    }

}
function carregarHexmem(txt){
    if (txt.substr(0, 8) != header) {
        if (!confirm("Cabeçalho incorreto. Prosseguir?"))
            return 1;
    }
    memp = 0;
    txtp = 8;
    while (txtp < txt.length) {
        if (txt.charAt(txtp) == '\n' || txt.charAt(txtp) == '\r') {
            txtp++;
            continue;
        }
        setmem(memp++, parseInt(txt.substr(txtp, 2), 16), false);
        txtp += 4;
    }
    setmem(0, mem[0], true);
}

function gerarHexmem() {
    let out = header;
    for (i = 0; i < 256; i++) {
        out += hex(mem[i]) + "00";
        if (i % 15 == 12) out += "\n";
    }
    return out;
}

function impexp_do(operation, form) {
    // TODO: It would be far better to access the optspane from the form element. (How?)
    if (operation == 1) {
        document.code.sel.style.display = "none";
        document.data.sel.style.display = "none";
    }
    eval("impexp_" + form.formatname.value + "(form, document.getElementById('impexp_optspane'), operation)");

    if (operation == 1) {
        document.code.sel.style.display = "block";
        document.data.sel.style.display = "block";
    }
}
function salvarProjeto(event) {
    event.preventDefault();
    let nome = $("#nome-projeto").val();
    if (nome)
        inserirItem({
            nome: nome,
            data: new Date(),
            codigo: gerarHexmem()
        });
    $("#nome-projeto").val("")
    carregarProjetos();
}

function reset_neander(hardReset) {
    setac(0);
    setpc(0);
    if (hardReset) {
        for (i = 0; i < 256; i++) {
            mem[i] = 0;
            type[i] = (-1);
        }
        setmem(0, 0, true);
    }
}

function _itemProjetoModelo(id, nome) {
    let modelo = $.parseHTML("<li class=\"list-group-item\">    <div>        <span class=\"id\">14</span>        <span class=\"nome\">            projeto x        </span>    </div>    <div class=\"btn-group\" role=\"group\" aria-label=\"...\">        <button type=\"button\" class=\"btn btn-primary btn-abrir-projeto\">Abrir</button>        <button type=\"button\" class=\"btn btn-danger btn-excluir-projeto\">Excluir</button>    </div></li>")[0]
    modelo.querySelector(".nome").innerHTML = nome;
    modelo.querySelector(".id").innerHTML = id;
    return modelo;
}
function carregarProjetos() {
    let listaProjetos = $("#lista-projetos");
    listaProjetos.html("");
    listarItems().then(projetos => {
        projetos.forEach(projeto => {
            console.log(projeto)
            let item = _itemProjetoModelo(projeto.key, projeto.value.nome)
            console.log(item)
            listaProjetos.append(item)
        })
    }).then(ev => {
        $('.btn-excluir-projeto').on('click', function (event) {
            let id = event.target.parentNode.parentNode.querySelector(".id").innerHTML
            console.log(id)
            removerItem(parseInt(id));
            carregarProjetos();
        })
        $('.btn-abrir-projeto').on('click', function (event) {
            let id = event.target.parentNode.parentNode.querySelector(".id").innerHTML
            carregarItem(parseInt(id)).then((item)=>{
                carregarHexmem(item.codigo);
            })
            //carrega projeto
        })
    })

    //event bindings



}