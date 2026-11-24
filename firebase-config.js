import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpCcFOBm8smfGe8bR8eAk04h9_b3g1ScU",
    authDomain: "kixuz-rol.firebaseapp.com",
    projectId: "kixuz-rol",
    storageBucket: "kixuz-rol.firebasestorage.app",
    messagingSenderId: "430394972675",
    appId: "1:430394972675:web:6811861650fde334c00c36"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const normHandle = h => {
    const s = String(h || "").trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "_");
    return s ? "@" + s : "";
};

window.KIXUZ_DB = {
    configurado: true,
    usuarioActual: null,
    perfilCuenta: null,

    async registrarCuenta({ email, password, apodo }) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        const perfil = {
            uid,
            email,
            apodo: String(apodo || email.split("@")[0] || "Usuario").trim(),
            privado: true,
            creadoEn: Date.now()
        };
        await setDoc(doc(db, "cuentas", uid), perfil, { merge: true });
        this.usuarioActual = cred.user;
        this.perfilCuenta = perfil;
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        return perfil;
    },

    async iniciarSesion({ email, password }) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        let perfil = {
            uid,
            email: cred.user.email,
            apodo: (cred.user.email || "Usuario").split("@")[0],
            privado: true
        };
        try {
            const snap = await getDoc(doc(db, "cuentas", uid));
            if (snap.exists()) perfil = { ...perfil, ...snap.data() };
        } catch {}
        this.usuarioActual = cred.user;
        this.perfilCuenta = perfil;
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        return perfil;
    },

    async cerrarSesion() {
        await signOut(auth);
        this.usuarioActual = null;
        this.perfilCuenta = null;
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
    },

    async guardarSubpersonaje(personaje) {
        if (!personaje?.handle) return;
        const h = normHandle(personaje.handle);
        const payload = {
            ...personaje,
            handle: h,
            uidMaestro: auth.currentUser?.uid || personaje.uidMaestro || "",
            actualizadoEn: Date.now()
        };
        try {
            await setDoc(doc(db, "personajes", h.slice(1)), payload, { merge: true });
        } catch {}
    },

    async listarPersonajesPublicos() {
        const lista = [];
        try {
            const subs = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]");
            if (Array.isArray(subs)) lista.push(...subs);
        } catch {}
        try {
            const snap = await getDocs(collection(db, "personajes"));
            snap.forEach(d => lista.push(d.data()));
        } catch {}
        return lista;
    },

    async buscarPersonajePublico(handle) {
        const h = normHandle(handle);
        if (!h) return null;
        try {
            const snap = await getDoc(doc(db, "personajes", h.slice(1)));
            if (snap.exists()) return snap.data();
        } catch {}
        return null;
    }
};

onAuthStateChanged(auth, async user => {
    window.KIXUZ_DB.usuarioActual = user || null;
    if (user) {
        let perfil = {
            uid: user.uid,
            email: user.email,
            apodo: (user.email || "Usuario").split("@")[0],
            privado: true
        };
        try {
            const snap = await getDoc(doc(db, "cuentas", user.uid));
            if (snap.exists()) perfil = { ...perfil, ...snap.data() };
        } catch {}
        window.KIXUZ_DB.perfilCuenta = perfil;
    } else {
        window.KIXUZ_DB.perfilCuenta = null;
    }
    window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
});