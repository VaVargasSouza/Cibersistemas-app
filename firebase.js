
// ============================================
// IMPORTAÇÕES DO FIREBASE
// ============================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================
// CONFIGURAÇÃO DO PROJETO
// ============================================

// Copie os valores reais em:
// Firebase Console > Configurações do projeto > Seus aplicativos

const firebaseConfig = {
  apiKey: "AIzaSyAW6A1JAROnwGv3glygrJn54llUXh4j3ic",
  authDomain: "site-cibersistemas.firebaseapp.com",
  projectId: "site-cibersistemas",
  storageBucket: "site-cibersistemas.firebasestorage.app",
  messagingSenderId: "394567759144",
  appId: "1:394567759144:web:decb43c4c62381c09c0c1d",
};


// ============================================
// UID DOS ADMINISTRADORES
// ============================================

export const EDITOR_UIDS = [
    "O42wiQpDwDhcvoeiLjdftDcRa9u1",
    "EQhgJwqhK7h6ScmY9dJathKLOPs1",
    "BrjwN2RVWVT1vQOoYyRDdjtC6Q82",
    "R2LasyC77ua2w4KFKQKsYbUNC2u1"
];


// ============================================
// VERIFICAÇÃO DA CONFIGURAÇÃO
// ============================================

export const configurado =
    !Object.values(firebaseConfig).some(valor =>
        !valor ||
        valor.startsWith("SUA_") ||
        valor.startsWith("SEU_")
    );


// ============================================
// INICIALIZAÇÃO DO FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);


// ============================================
// SERVIÇOS
// ============================================

export const auth = getAuth(app);

export const db = getFirestore(app);


// ============================================
// VERIFICAÇÃO DE ADMINISTRADOR
// ============================================

export function ehAdministrador(usuario) {
    return Boolean(
        usuario &&
        EDITOR_UIDS.includes(usuario.uid)
    );
}

