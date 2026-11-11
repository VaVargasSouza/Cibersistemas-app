
import { auth, db, ehAdministrador } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Complete esta lista com todos os alunos da turma.
const ALUNOS = [
    "Alan De Macedo Da Silva",
    "Antony Santiago Belisario Rossi",
    "Arthur Pirondi De Mello",
    "Artur Amarante Boschetti",
    "Bernardo Lemos Gomes",
    "Dafeni Maschio De Oliveira",
    "Eduardo Arnhold Moreira",
    "Enzo Arthur Dos Passos",
    "Erick Da Silva De Melos",
    "Fernando Vinícius Meneghetti",
    "Gabriel Da Costa Machado Vieira",
    "Gabriel De Souza Bentaqui",
    "Gabrielle Soares Veiga",
    "Guilherme Da Silva Guimarães",
    "Gustavo Borges Duarte",
    "Henrique Fiaminghi Gonçalves",
    "Jeancarlo Fermiano Carbonera",
    "Kauan Júnior De Sá Dos Santos",
    "Lara Da Costa Andreolla",
    "Laura Dal Magro",
    "Letícia Barcelos Parrini",
    "Luiza Helena Schussel Bizol",
    "Manuela Manchini Dos Santos",
    "Maria Eduarda Casiraghi",
    "Maria Luiza Carmona Cavalheiro",
    "Mateus Kilder Guedes",
    "Miguel Ferreira",
    "Natália Arenhardt Da Silva",
    "Nicolas Alves Fortuna",
    "Nicolas Marques Cavalheiro",
    "Nicolas Oliveira Da Silva",
    "Samuel Davi Sponga",
    "Vanessa De Vargas Souza Castro",
    "Yago Almeida Furés"
];

const $ = (id) => document.getElementById(id);

let usuarioAtual = null;
let administrador = false;
let escalaAtual = null;

function mostrarMensagem(id, texto, tipo = "") {
    const elemento = $(id);
    if (!elemento) return;

    elemento.textContent = texto;
    elemento.className = `mensagem ${tipo}`.trim();
}

function dataLegivel(valor) {
    if (!valor) return "Data não informada";

    const data = typeof valor.toDate === "function"
        ? valor.toDate()
        : new Date(valor);

    if (Number.isNaN(data.getTime())) return "Data não informada";

    return data.toLocaleString("pt-BR");
}

function criarElemento(tag, texto, classe = "") {
    const elemento = document.createElement(tag);
    elemento.textContent = texto ?? "";
    if (classe) elemento.className = classe;
    return elemento;
}

function criarBotao(texto, acao) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = texto;
    botao.addEventListener("click", acao);
    return botao;
}

function configurarPermissoes() {
    $("emailUsuario").textContent = usuarioAtual.email || "Usuário autenticado";

    $("secaoAdministracao").classList.toggle("oculto", !administrador);

    ["formAviso", "formLink", "acoesEscala"].forEach(id => {
        $(id)?.classList.toggle("oculto", !administrador);
    });
}

// ---------- AUTENTICAÇÃO ----------

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
        window.location.replace("login.html");
        return;
    }

    usuarioAtual = usuario;
    administrador = ehAdministrador(usuario);

    configurarPermissoes();

    await carregarAvisos();
    await carregarLinks();
    await carregarEscala();
});

$("btnSair").addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("login.html");
});

// ---------- AVISOS ----------

$("formAviso").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!administrador) return;

    const id = $("avisoId").value;
    const titulo = $("tituloAviso").value.trim();
    const texto = $("textoAviso").value.trim();

    if (!titulo || !texto) return;

    try {
        if (id) {
            await updateDoc(doc(db, "avisos", id), {
                titulo,
                texto,
                atualizadoEm: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, "avisos"), {
                titulo,
                texto,
                autorUid: usuarioAtual.uid,
                autorEmail: usuarioAtual.email || "Administrador",
                criadoEm: serverTimestamp()
            });
        }

        $("formAviso").reset();
        $("avisoId").value = "";
        $("btnSalvarAviso").textContent = "Publicar aviso";
        $("btnCancelarAviso").classList.add("oculto");

        mostrarMensagem("mensagemAvisos", "Aviso salvo com sucesso.", "sucesso");
        await carregarAvisos();
    } catch (erro) {
        console.error(erro);
        mostrarMensagem("mensagemAvisos", "Não foi possível salvar o aviso. Verifique as regras do Firestore.", "erro");
    }
});

$("btnCancelarAviso").addEventListener("click", () => {
    $("formAviso").reset();
    $("avisoId").value = "";
    $("btnSalvarAviso").textContent = "Publicar aviso";
    $("btnCancelarAviso").classList.add("oculto");
});

async function carregarAvisos() {
    const lista = $("listaAvisos");
    lista.replaceChildren();

    try {
        const consulta = await getDocs(collection(db, "avisos"));

        const avisos = consulta.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        avisos.sort((a, b) => {
            const dataA = a.criadoEm?.toMillis?.() || 0;
            const dataB = b.criadoEm?.toMillis?.() || 0;
            return dataB - dataA;
        });

        if (avisos.length === 0) {
            lista.append(criarElemento("p", "Nenhum aviso publicado."));
            return;
        }

        for (const aviso of avisos) {
            const cartao = criarElemento("article", "", "cartao");
            cartao.append(criarElemento("h3", aviso.titulo));
            cartao.append(criarElemento("p", aviso.texto));
            cartao.append(criarElemento(
                "p",
                `Publicado por ${aviso.autorEmail || "Administrador"} • ${dataLegivel(aviso.criadoEm)}`,
                "meta"
            ));

            if (administrador) {
                const acoes = criarElemento("div", "", "acoes-cartao");

                acoes.append(criarBotao("Editar", () => {
                    $("avisoId").value = aviso.id;
                    $("tituloAviso").value = aviso.titulo || "";
                    $("textoAviso").value = aviso.texto || "";
                    $("btnSalvarAviso").textContent = "Salvar alterações";
                    $("btnCancelarAviso").classList.remove("oculto");
                    $("formAviso").scrollIntoView({ behavior: "smooth" });
                }));

                acoes.append(criarBotao("Excluir", async () => {
                    if (!confirm("Deseja excluir este aviso?")) return;

                    try {
                        await deleteDoc(doc(db, "avisos", aviso.id));
                        await carregarAvisos();
                    } catch (erro) {
                        console.error(erro);
                        mostrarMensagem("mensagemAvisos", "Não foi possível excluir o aviso.", "erro");
                    }
                }));

                cartao.append(acoes);
            }

            lista.append(cartao);
        }
    } catch (erro) {
        console.error(erro);
        mostrarMensagem("mensagemAvisos", "Erro ao carregar os avisos.", "erro");
    }
}

// ---------- LINKS ÚTEIS ----------

$("formLink").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!administrador) return;

    const id = $("linkId").value;
    const titulo = $("tituloLink").value.trim();
    const url = $("urlLink").value.trim();
    const descricao = $("descricaoLink").value.trim();

    try {
        const endereco = new URL(url);

        if (!["https:", "http:"].includes(endereco.protocol)) {
            throw new Error("Endereço inválido.");
        }

        const dados = {
            titulo,
            url: endereco.href,
            descricao
        };

        if (id) {
            await updateDoc(doc(db, "links", id), {
                ...dados,
                atualizadoEm: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, "links"), {
                ...dados,
                autorUid: usuarioAtual.uid,
                autorEmail: usuarioAtual.email || "Administrador",
                criadoEm: serverTimestamp()
            });
        }

        $("formLink").reset();
        $("linkId").value = "";
        $("btnSalvarLink").textContent = "Salvar link";
        $("btnCancelarLink").classList.add("oculto");

        mostrarMensagem("mensagemLinks", "Link salvo com sucesso.", "sucesso");
        await carregarLinks();
    } catch (erro) {
        console.error(erro);
        mostrarMensagem("mensagemLinks", "Confira o endereço e as permissões do Firestore.", "erro");
    }
});

$("btnCancelarLink").addEventListener("click", () => {
    $("formLink").reset();
    $("linkId").value = "";
    $("btnSalvarLink").textContent = "Salvar link";
    $("btnCancelarLink").classList.add("oculto");
});

async function carregarLinks() {
    const lista = $("listaLinks");
    lista.replaceChildren();

    try {
        const consulta = await getDocs(collection(db, "links"));

        const links = consulta.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        links.sort((a, b) =>
            (a.titulo || "").localeCompare(b.titulo || "", "pt-BR")
        );

        if (links.length === 0) {
            lista.append(criarElemento("p", "Nenhum link cadastrado."));
            return;
        }

        for (const link of links) {
            const cartao = criarElemento("article", "", "cartao");
            cartao.append(criarElemento("h3", link.titulo));

            if (link.descricao) {
                cartao.append(criarElemento("p", link.descricao));
            }

            const ancora = criarElemento("a", "Abrir site", "link-externo");
            ancora.href = link.url;
            ancora.target = "_blank";
            ancora.rel = "noopener noreferrer";
            cartao.append(ancora);

            cartao.append(criarElemento(
                "p",
                `Cadastrado por ${link.autorEmail || "Administrador"} • ${dataLegivel(link.criadoEm)}`,
                "meta"
            ));

            if (administrador) {
                const acoes = criarElemento("div", "", "acoes-cartao");

                acoes.append(criarBotao("Editar", () => {
                    $("linkId").value = link.id;
                    $("tituloLink").value = link.titulo || "";
                    $("urlLink").value = link.url || "";
                    $("descricaoLink").value = link.descricao || "";
                    $("btnSalvarLink").textContent = "Salvar alterações";
                    $("btnCancelarLink").classList.remove("oculto");
                    $("formLink").scrollIntoView({ behavior: "smooth" });
                }));

                acoes.append(criarBotao("Excluir", async () => {
                    if (!confirm("Deseja excluir este link?")) return;

                    try {
                        await deleteDoc(doc(db, "links", link.id));
                        await carregarLinks();
                    } catch (erro) {
                        console.error(erro);
                        mostrarMensagem("mensagemLinks", "Não foi possível excluir o link.", "erro");
                    }
                }));

                cartao.append(acoes);
            }

            lista.append(cartao);
        }
    } catch (erro) {
        console.error(erro);
        mostrarMensagem("mensagemLinks", "Erro ao carregar os links.", "erro");
    }
}

// ---------- ESCALA DE LIMPEZA ----------

const TAMANHO_EQUIPE = 4;

// Parte A
function obterNomesAlunos() {
    return [...new Set(
        ALUNOS
            .map(nome => String(nome).trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function normalizarLista(lista, nomes) {
    const conjunto = new Set(
        Array.isArray(lista) ? lista : []
    );

    return nomes.filter(nome => conjunto.has(nome));
}

// Parte B
function selecionarEquipe(nomes, marcados, pendentes) {

    const marcadosSet = new Set(marcados);
    const pendentesSet = new Set(pendentes);

    // Pendentes sempre possuem prioridade.
    const filaPendentes = nomes.filter(
        nome => pendentesSet.has(nome)
    );

    // Alunos que ainda não limparam.
    const naoMarcados = nomes.filter(
        nome =>
            !marcadosSet.has(nome) &&
            !pendentesSet.has(nome)
    );

    // Seleciona até quatro integrantes.
    return [
        ...filaPendentes,
        ...naoMarcados
    ].slice(0, TAMANHO_EQUIPE);
}

// Parte C
function simularConclusao(
    atual,
    estado,
    nomes,
    faltasAtuais = []
) {
    const conjuntoAtual = new Set(atual);
    const conjuntoFaltas = new Set(faltasAtuais);

    // Pendentes que não fazem parte da equipe atual
    // continuam aguardando sua vez.
    const pendentesDepois = estado.pendentes.filter(
        nome => !conjuntoAtual.has(nome)
    );

    // Quem foi registrado como falta continua pendente.
    for (const nome of atual) {
        if (
            conjuntoFaltas.has(nome) &&
            !pendentesDepois.includes(nome)
        ) {
            pendentesDepois.push(nome);
        }
    }

    const pendentesOrganizados = normalizarLista(
        pendentesDepois,
        nomes
    );

    // Alunos que realmente realizaram a limpeza.
    const alunosQueLimparam = atual.filter(
        nome => !conjuntoFaltas.has(nome)
    );

    const pendentesSet = new Set(pendentesOrganizados);
    const marcadosSet = new Set(estado.marcados);

    // Verifica se ainda existem alunos que não foram escalados
    // neste ciclo e não estão pendentes.
    const restantes = nomes.filter(
        nome =>
            !conjuntoAtual.has(nome) &&
            !marcadosSet.has(nome) &&
            !pendentesSet.has(nome)
    );

    // O ciclo termina quando não há mais alunos aguardando
    // a primeira oportunidade de limpeza nem pendências.
    const cicloFinalizado =
        restantes.length === 0 &&
        pendentesOrganizados.length === 0;

    // Se o ciclo terminou, os marcadores anteriores são liberados.
    const marcadosDepois = cicloFinalizado
        ? []
        : estado.marcados.filter(
            nome => !conjuntoAtual.has(nome)
        );

    // Marca quem realmente limpou.
    for (const nome of alunosQueLimparam) {
        if (!marcadosDepois.includes(nome)) {
            marcadosDepois.push(nome);
        }
    }

    return {
        alunosQueLimparam,

        cicloFinalizado,

        estado: {
            marcados: normalizarLista(marcadosDepois, nomes),
            pendentes: pendentesOrganizados,
            faltasAtuais: []
        }
    };
}

// Parte D
function calcularEquipeSeguinte(atual, estado, nomes) {

    const resultado = simularConclusao(
        atual,
        estado,
        nomes,
        estado.faltasAtuais
    );

    const novoEstado = resultado.estado;

    let proxima = selecionarEquipe(
        nomes,
        novoEstado.marcados,
        novoEstado.pendentes
    );

    // Proteção caso todos os alunos já estejam marcados.
    if (!proxima.length && nomes.length) {

        novoEstado.marcados = [];

        proxima = selecionarEquipe(
            nomes,
            novoEstado.marcados,
            novoEstado.pendentes
        );
    }

    return {
        equipe: proxima,
        estadoProjetado: novoEstado
    };
}

// Parte E
async function salvarEscala(
    estado,
    ultima,
    atual,
    proxima
) {
    const lote = writeBatch(db);

    lote.set(doc(db, "escala", "estado"), {
        marcados: [...estado.marcados],
        pendentes: [...estado.pendentes],
        faltasAtuais: [...estado.faltasAtuais],
        atualizadaEm: serverTimestamp()
    });

    lote.set(doc(db, "escala", "ultima"), {
        alunos: [...ultima],
        atualizadaEm: serverTimestamp()
    });

    lote.set(doc(db, "escala", "atual"), {
        alunos: [...atual],
        atualizadaEm: serverTimestamp()
    });

    lote.set(doc(db, "escala", "proxima"), {
        alunos: [...proxima],
        atualizadaEm: serverTimestamp()
    });

    await lote.commit();
}

// Parte F
async function obterRegistroEquipes() {

    const nomes = obterNomesAlunos();

    if (!nomes.length) {
        throw new Error("A lista de alunos está vazia.");
    }

    const referencias = [
        doc(db, "escala", "estado"),
        doc(db, "escala", "ultima"),
        doc(db, "escala", "atual"),
        doc(db, "escala", "proxima")
    ];

    const [
        snapshotEstado,
        snapshotUltima,
        snapshotAtual,
        snapshotProxima
    ] = await Promise.all(
        referencias.map(referencia => getDoc(referencia))
    );

    const dadosEstado = snapshotEstado.exists()
        ? snapshotEstado.data()
        : {};

    let estado = {
        marcados: normalizarLista(
            dadosEstado.marcados,
            nomes
        ),

        pendentes: normalizarLista(
            dadosEstado.pendentes,
            nomes
        ),

        faltasAtuais: []
    };

    let atual = snapshotAtual.exists()
        ? normalizarLista(
            snapshotAtual.data().alunos,
            nomes
        )
        : [];

    // Se ainda não existe uma equipe atual, seleciona a primeira.
    if (!atual.length) {
        atual = selecionarEquipe(
            nomes,
            estado.marcados,
            estado.pendentes
        );
    }

    // Só são consideradas faltas da equipe atual.
    estado.faltasAtuais = normalizarLista(
        dadosEstado.faltasAtuais,
        nomes
    ).filter(nome => atual.includes(nome));

    // Toda falta registrada também precisa estar na fila de pendentes.
    estado.pendentes = normalizarLista(
        [
            ...estado.pendentes,
            ...estado.faltasAtuais
        ],
        nomes
    );

    // Um aluno pendente não pode continuar marcado como quem já limpou.
    estado.marcados = estado.marcados.filter(
        nome => !estado.pendentes.includes(nome)
    );

    const ultima = snapshotUltima.exists()
        ? normalizarLista(
            snapshotUltima.data().alunos,
            nomes
        )
        : [];

    // Calcula a próxima equipe a partir do estado atual.
    const resultado = calcularEquipeSeguinte(
        atual,
        estado,
        nomes
    );

    const proxima = resultado.equipe;

    // Verifica se os documentos precisam ser criados ou corrigidos.
    const mudouEstado =
        !snapshotEstado.exists() ||
        JSON.stringify(dadosEstado.marcados || []) !==
            JSON.stringify(estado.marcados) ||
        JSON.stringify(dadosEstado.pendentes || []) !==
            JSON.stringify(estado.pendentes) ||
        JSON.stringify(dadosEstado.faltasAtuais || []) !==
            JSON.stringify(estado.faltasAtuais);

    const mudouUltima =
        !snapshotUltima.exists() ||
        JSON.stringify(snapshotUltima.data().alunos || []) !==
            JSON.stringify(ultima);

    const mudouAtual =
        !snapshotAtual.exists() ||
        JSON.stringify(snapshotAtual.data().alunos || []) !==
            JSON.stringify(atual);

    const mudouProxima =
        !snapshotProxima.exists() ||
        JSON.stringify(snapshotProxima.data().alunos || []) !==
            JSON.stringify(proxima);

    // Apenas administradores podem inicializar ou corrigir documentos.
    if (
        administrador &&
        (mudouEstado || mudouUltima || mudouAtual || mudouProxima)
    ) {
        await salvarEscala(
            estado,
            ultima,
            atual,
            proxima
        );
    }

    return {
        nomes,
        estado,
        ultima,
        atual,
        proxima
    };
}

// Parte G
async function carregarEscala() {

    try {

        escalaAtual = await obterRegistroEquipes();

        const lista = $("listaEquipes");

        lista.replaceChildren();

        const exibicoes = [
            {
                titulo: "Equipe anterior",
                alunos: escalaAtual.ultima,
                classe: "",
                tipo: "anterior"
            },
            {
                titulo: "Equipe atual",
                alunos: escalaAtual.atual,
                classe: "atual",
                tipo: "atual"
            },
            {
                titulo: "Próxima equipe",
                alunos: escalaAtual.proxima,
                classe: "",
                tipo: "proxima"
            }
        ];

        for (const item of exibicoes) {

            const cartao = criarElemento(
                "article",
                "",
                `cartao-equipe ${item.classe}`.trim()
            );

            cartao.append(
                criarElemento("h3", item.titulo)
            );

            const ol = document.createElement("ol");

            const alunos = [...item.alunos].sort(
                (a, b) => a.localeCompare(b, "pt-BR")
            );

            alunos.forEach(nome => {

                const pendente =
                    escalaAtual.estado.pendentes.includes(nome);

                const texto = pendente
                    ? `${nome} (pendente)`
                    : nome;

                ol.append(
                    criarElemento("li", texto)
                );
            });

            if (!alunos.length) {
                cartao.append(
                    criarElemento(
                        "p",
                        item.tipo === "anterior"
                            ? "Nenhuma equipe concluiu a limpeza ainda."
                            : "Não há alunos disponíveis."
                    )
                );
            }

            cartao.append(ol);
            lista.append(cartao);
        }

        $("acoesEscala").classList.toggle(
            "oculto",
            !administrador
        );

        mostrarMensagem(
            "mensagemEscala",
            "Escala de limpeza atualizada."
        );

    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "mensagemEscala",
            "Não foi possível carregar a escala. Verifique as regras do Firestore.",
            "erro"
        );
    }
}

// Parte H
$("btnConcluirLimpeza").addEventListener("click", async () => {

    if (!administrador || !escalaAtual) return;

    if (!confirm("Confirmar que a equipe atual concluiu a limpeza?")) {
        return;
    }

    try {

        const resultado = simularConclusao(
            escalaAtual.atual,
            escalaAtual.estado,
            escalaAtual.nomes,
            escalaAtual.estado.faltasAtuais
        );

        // Pessoas que efetivamente limparam.
        const ultima = resultado.alunosQueLimparam;

        // Estado atualizado após a conclusão.
        const estado = resultado.estado;

        // A próxima equipe assume a responsabilidade.
        const atual = escalaAtual.proxima;

        // Calcula a equipe seguinte.
        const resultadoProxima = calcularEquipeSeguinte(
            atual,
            estado,
            escalaAtual.nomes
        );

        const proxima = resultadoProxima.equipe;

        await salvarEscala(
            estado,
            ultima,
            atual,
            proxima
        );

        mostrarMensagem(
            "mensagemEscala",
            "Limpeza confirmada! A próxima equipe agora é a responsável.",
            "sucesso"
        );

        await carregarEscala();

    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "mensagemEscala",
            "Não foi possível atualizar a escala.",
            "erro"
        );
    }
});

// Parte I
$("btnRegistrarFalta").addEventListener("click", async () => {

    if (!administrador || !escalaAtual) return;

    // Organiza a equipe atual alfabeticamente.
    const equipeAtual = [...escalaAtual.atual].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
    );

    if (!equipeAtual.length) return;

    // Exibe os alunos numerados.
    const listaAlunos = equipeAtual
        .map((aluno, indice) => `${indice + 1}. ${aluno}`)
        .join("\n");

    const entrada = prompt(
        "Informe a posição ou parte do nome do aluno que não limpou:\n\n" +
        listaAlunos
    );

    if (!entrada || !entrada.trim()) return;

    // Procura o aluno informado.
    const resultado = localizarAlunoEquipe(
        entrada,
        equipeAtual
    );

    let alunoAusente = resultado.aluno;

    // Caso o trecho corresponda a mais de um aluno,
    // solicita que o administrador escolha pela posição.
    if (resultado.encontrados.length > 1) {

        const alternativas = resultado.encontrados
            .map(nome => `${equipeAtual.indexOf(nome) + 1}. ${nome}`)
            .join("\n");

        const escolha = prompt(
            "Encontrei mais de um aluno com esse trecho.\n\n" +
            alternativas +
            "\n\nDigite a posição do aluno desejado:"
        );

        if (!escolha) return;

        const posicao = Number(escolha.trim());

        alunoAusente = resultado.encontrados.find(
            nome => equipeAtual.indexOf(nome) + 1 === posicao
        ) || null;
    }

    if (!alunoAusente) {

        mostrarMensagem(
            "mensagemEscala",
            "Aluno não encontrado. Confira o nome ou a posição informada.",
            "erro"
        );

        return;
    }

    const faltasJaRegistradas = new Set(
        escalaAtual.estado.faltasAtuais || []
    );

    if (faltasJaRegistradas.has(alunoAusente)) {

        mostrarMensagem(
            "mensagemEscala",
            "Esse aluno já está registrado como pendente nesta equipe.",
            "erro"
        );

        return;
    }

    // Procura alguém da próxima equipe para substituir o ausente.
    // Ignora quem já faz parte da equipe atual e quem já foi
    // registrado como ausente no dia de hoje.
    const substituto = escalaAtual.proxima.find(aluno =>
        !equipeAtual.includes(aluno) &&
        !faltasJaRegistradas.has(aluno) &&
        aluno !== alunoAusente
    );

    if (!substituto) {

        mostrarMensagem(
            "mensagemEscala",
            "Não há alunos disponíveis na próxima equipe para realizar a substituição.",
            "erro"
        );

        return;
    }

    try {

        // 1. Registra o aluno como pendente.
        const pendentes = [
            ...new Set([
                ...escalaAtual.estado.pendentes,
                alunoAusente
            ])
        ];

        // 2. Registra a falta da equipe atual.
        const faltasAtuais = [
            ...new Set([
                ...escalaAtual.estado.faltasAtuais,
                alunoAusente
            ])
        ];

        // 3. Retira o aluno ausente da lista de marcados.
        const marcados = escalaAtual.estado.marcados.filter(
            nome => nome !== alunoAusente
        );

        const estado = {
            marcados,
            pendentes,
            faltasAtuais
        };

        // 4. Retira o ausente e coloca o substituto na equipe atual.
        const novaEquipeAtual = equipeAtual.filter(
            nome => nome !== alunoAusente
        );

        novaEquipeAtual.push(substituto);

        novaEquipeAtual.sort(
            (a, b) => a.localeCompare(b, "pt-BR")
        );

        // 5. Recalcula a próxima equipe.
        // O substituto não será escalado novamente no próximo dia,
        // pois será considerado como alguém que limpará hoje.
        const resultadoProxima = calcularEquipeSeguinte(
            novaEquipeAtual,
            estado,
            escalaAtual.nomes
        );

        const proxima = resultadoProxima.equipe;

        // 6. Salva tudo no Firestore.
        await salvarEscala(
            estado,
            escalaAtual.ultima,
            novaEquipeAtual,
            proxima
        );

        mostrarMensagem(
            "mensagemEscala",
            `${alunoAusente} ficou pendente. ${substituto} foi chamado da próxima equipe para limpar hoje.`,
            "sucesso"
        );

        // Atualiza os três cartões.
        await carregarEscala();

    } catch (erro) {

        console.error(erro);

        mostrarMensagem(
            "mensagemEscala",
            "Não foi possível registrar a pendência e realizar a substituição.",
            "erro"
        );
    }
});

// Parte J
function normalizarTextoBusca(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();
}

function localizarAlunoEquipe(entrada, equipe) {
    const texto = normalizarTextoBusca(entrada);

    // Permite selecionar pela posição na equipe.
    if (/^\d+$/.test(texto)) {
        const indice = Number(texto) - 1;

        return {
            aluno: equipe[indice] || null,
            encontrados: []
        };
    }

    // Permite pesquisar por parte do nome.
    const encontrados = equipe.filter(aluno =>
        normalizarTextoBusca(aluno).includes(texto)
    );

    return {
        aluno: encontrados.length === 1 ? encontrados[0] : null,
        encontrados
    };
}
// ---------- PWA ----------

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .catch(erro => console.error("Erro ao registrar o PWA:", erro));
    });
}
