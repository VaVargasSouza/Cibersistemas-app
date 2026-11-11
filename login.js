import {
    auth,
    configurado,
    ehAdministrador
} from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// =====================================================
// ELEMENTOS DA PÁGINA
// =====================================================

// Áreas
const areaLogin = document.getElementById("areaLogin");
const areaCadastro = document.getElementById("areaCadastro");

// Formulários
const formLogin = document.getElementById("formLogin");
const formCadastro = document.getElementById("formCadastro");

// Campos de login
const emailAdmin = document.getElementById("emailAdmin");
const senhaAdmin = document.getElementById("senhaAdmin");

// Campos de cadastro
const nomeCadastro = document.getElementById("nomeCadastro");
const emailCadastro = document.getElementById("emailCadastro");
const senhaCadastro = document.getElementById("senhaCadastro");
const confirmarSenha = document.getElementById("confirmarSenha");

// Botões
const btnEntrar = document.getElementById("btnEntrar");
const btnCadastrar = document.getElementById("btnCadastrar");
const btnMostrarCadastro = document.getElementById("btnMostrarCadastro");
const btnMostrarLogin = document.getElementById("btnMostrarLogin");

// Mensagens
const mensagemLogin = document.getElementById("mensagemLogin");
const mensagemCadastro = document.getElementById("mensagemCadastro");


// =====================================================
// FUNÇÃO PARA MOSTRAR MENSAGENS
// =====================================================

function mostrarMensagem(elemento, texto, tipo = "") {

    if (!elemento) {
        return;
    }

    elemento.textContent = texto;
    elemento.className = `message ${tipo}`;
}


// =====================================================
// ALTERNAR LOGIN / CADASTRO
// =====================================================

if (btnMostrarCadastro) {

    btnMostrarCadastro.addEventListener("click", () => {

        areaLogin.hidden = true;
        areaCadastro.hidden = false;

        mostrarMensagem(mensagemLogin, "");
        mostrarMensagem(mensagemCadastro, "");

        // Coloca o cursor no campo de nome
        setTimeout(() => {
            nomeCadastro?.focus();
        }, 50);
    });
}


if (btnMostrarLogin) {

    btnMostrarLogin.addEventListener("click", () => {

        areaCadastro.hidden = true;
        areaLogin.hidden = false;

        mostrarMensagem(mensagemLogin, "");
        mostrarMensagem(mensagemCadastro, "");

        // Coloca o cursor no campo de e-mail
        setTimeout(() => {
            emailAdmin?.focus();
        }, 50);
    });
}


// =====================================================
// VERIFICAR FIREBASE
// =====================================================

function firebaseDisponivel() {

    if (!configurado || !auth) {

        mostrarMensagem(
            mensagemLogin,
            "Firebase não está configurado corretamente. Verifique o firebase.js.",
            "erro"
        );

        return false;
    }

    return true;
}


// =====================================================
// LOGIN
// =====================================================

if (formLogin) {

    formLogin.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!firebaseDisponivel()) {
            return;
        }


        const email = emailAdmin.value.trim();
        const senha = senhaAdmin.value;


        // Verificação dos campos
        if (!email) {

            mostrarMensagem(
                mensagemLogin,
                "Digite seu e-mail.",
                "erro"
            );

            emailAdmin.focus();

            return;
        }


        if (!senha) {

            mostrarMensagem(
                mensagemLogin,
                "Digite sua senha.",
                "erro"
            );

            senhaAdmin.focus();

            return;
        }


        btnEntrar.disabled = true;
        btnEntrar.textContent = "Verificando...";


        mostrarMensagem(
            mensagemLogin,
            "Realizando login..."
        );


        try {

            // Login no Firebase Authentication
            const credencial = await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );


            const usuario = credencial.user;


            console.log("Usuário autenticado:", usuario.uid);


            // =================================================
            // VERIFICAÇÃO DO ADMINISTRADOR
            // =================================================

            /*if (!ehAdministrador(usuario)) {

                await signOut(auth);

                mostrarMensagem(
                    mensagemLogin,
                    "Conta autenticada, mas você não possui autorização administrativa.",
                    "erro"
                );

                return;
            }*/


            // =================================================
            // LOGIN AUTORIZADO
            // =================================================

            mostrarMensagem(
                mensagemLogin,
                "Login realizado com sucesso! Entrando no portal...",
                "sucesso"
            );


            // Pequeno intervalo para mostrar a mensagem
            setTimeout(() => {

                window.location.href = "./portal.html";

            }, 500);


        } catch (erro) {

            console.error("Erro no login:", erro);


            switch (erro.code) {

                case "auth/invalid-credential":
                case "auth/invalid-login-credentials":

                    mostrarMensagem(
                        mensagemLogin,
                        "E-mail ou senha incorretos.",
                        "erro"
                    );

                    break;


                case "auth/user-disabled":

                    mostrarMensagem(
                        mensagemLogin,
                        "Esta conta foi desativada.",
                        "erro"
                    );

                    break;


                case "auth/too-many-requests":

                    mostrarMensagem(
                        mensagemLogin,
                        "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
                        "erro"
                    );

                    break;


                case "auth/network-request-failed":

                    mostrarMensagem(
                        mensagemLogin,
                        "Falha de conexão. Verifique sua internet.",
                        "erro"
                    );

                    break;


                case "auth/invalid-email":

                    mostrarMensagem(
                        mensagemLogin,
                        "Digite um endereço de e-mail válido.",
                        "erro"
                    );

                    break;


                default:

                    mostrarMensagem(
                        mensagemLogin,
                        "Não foi possível realizar o login. Tente novamente.",
                        "erro"
                    );

                    break;
            }

        } finally {

            btnEntrar.disabled = false;
            btnEntrar.textContent = "Entrar";
        }

    });

}


// =====================================================
// CADASTRO
// =====================================================

if (formCadastro) {

    formCadastro.addEventListener("submit", async (event) => {

        event.preventDefault();


        if (!configurado || !auth) {

            mostrarMensagem(
                mensagemCadastro,
                "Firebase não está configurado corretamente. Verifique o firebase.js.",
                "erro"
            );

            return;
        }


        const nome = nomeCadastro.value.trim();
        const email = emailCadastro.value.trim();
        const senha = senhaCadastro.value;
        const confirmacao = confirmarSenha.value;


        // =================================================
        // VALIDAÇÕES
        // =================================================

        if (!nome) {

            mostrarMensagem(
                mensagemCadastro,
                "Informe seu nome completo.",
                "erro"
            );

            nomeCadastro.focus();

            return;
        }


        if (!email) {

            mostrarMensagem(
                mensagemCadastro,
                "Informe seu e-mail.",
                "erro"
            );

            emailCadastro.focus();

            return;
        }


        if (senha.length < 6) {

            mostrarMensagem(
                mensagemCadastro,
                "A senha precisa ter pelo menos 6 caracteres.",
                "erro"
            );

            senhaCadastro.focus();

            return;
        }


        if (senha !== confirmacao) {

            mostrarMensagem(
                mensagemCadastro,
                "As senhas não são iguais.",
                "erro"
            );

            confirmarSenha.focus();

            return;
        }


        // =================================================
        // DESABILITAR BOTÃO
        // =================================================

        btnCadastrar.disabled = true;
        btnCadastrar.textContent = "Criando conta...";


        mostrarMensagem(
            mensagemCadastro,
            "Cadastrando sua conta..."
        );


        try {

            // =================================================
            // CRIAR USUÁRIO NO FIREBASE AUTHENTICATION
            // =================================================

            const credencial =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    senha
                );


            const usuario = credencial.user;


            console.log(
                "Conta criada com UID:",
                usuario.uid
            );


            // =================================================
            // IMPORTANTE:
            // O CADASTRO NÃO CONCEDE PERMISSÃO ADMINISTRATIVA.
            //
            // Somente os UIDs definidos em firebase.js
            // podem acessar a área administrativa.
            // =================================================

            await signOut(auth);


            // Limpa o formulário
            formCadastro.reset();


            // Volta para a tela de login
            areaCadastro.hidden = true;
            areaLogin.hidden = false;


            mostrarMensagem(
                mensagemLogin,
                "Conta criada com sucesso! Agora faça login. O acesso administrativo depende da autorização da conta.",
                "sucesso"
            );


            // Preenche novamente o e-mail usado
            emailAdmin.value = email;


            // Coloca o cursor na senha
            setTimeout(() => {
                senhaAdmin.focus();
            }, 50);


        } catch (erro) {

            console.error("Erro no cadastro:", erro);


            switch (erro.code) {

                case "auth/email-already-in-use":

                    mostrarMensagem(
                        mensagemCadastro,
                        "Este e-mail já possui uma conta. Tente fazer login.",
                        "erro"
                    );

                    break;


                case "auth/invalid-email":

                    mostrarMensagem(
                        mensagemCadastro,
                        "Digite um endereço de e-mail válido.",
                        "erro"
                    );

                    break;


                case "auth/weak-password":

                    mostrarMensagem(
                        mensagemCadastro,
                        "A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.",
                        "erro"
                    );

                    break;


                case "auth/operation-not-allowed":

                    mostrarMensagem(
                        mensagemCadastro,
                        "O cadastro por e-mail e senha não está habilitado no Firebase Authentication.",
                        "erro"
                    );

                    break;


                case "auth/network-request-failed":

                    mostrarMensagem(
                        mensagemCadastro,
                        "Falha de conexão. Verifique sua internet.",
                        "erro"
                    );

                    break;


                default:

                    mostrarMensagem(
                        mensagemCadastro,
                        "Não foi possível criar a conta. Tente novamente.",
                        "erro"
                    );

                    break;
            }

        } finally {

            btnCadastrar.disabled = false;
            btnCadastrar.textContent = "Criar minha conta";
        }

    });

}


// =====================================================
// COLOCAR CURSOR NO E-MAIL AO ABRIR A PÁGINA
// =====================================================

window.addEventListener("load", () => {

    if (!areaLogin.hidden && emailAdmin) {
        emailAdmin.focus();
    }

});
