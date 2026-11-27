import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = window.KIXUZ_FIREBASE_CONFIG || {
    apiKey: "AIzaSyDummyKeyKixuzRol000000000000000",
    authDomain: "kixuz-rol.firebaseapp.com",
    projectId: "kixuz-rol",
    storageBucket: "kixuz-rol.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
};

const configurado = Boolean(
    firebaseConfig &&
    firebaseConfig.apiKey &&
    !String(firebaseConfig.apiKey).includes("DummyKey")
);

let app = null;
let auth = null;
let db = null;

if (configurado) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

const norm = v => String(v || "").trim().toLowerCase();
const normHandle = v => {
    const s = norm(v).replace(/^@+/, "").replace(/\s+/g, "_");
    return s ? "@" + s : "";
};

function normalizarFichaPersonaje(raw = {}) {
    const handle = normHandle(raw.handle || raw.usuario || raw.nombre || "");
    const nombre = String(raw.nombre || handle.replace(/^@/, "") || "Personaje").trim();
    return {
        ...raw,
        id: raw.id || (raw.uidMaestro ? `${raw.uidMaestro}_${handle.replace(/^@/, "")}` : handle),
        nombre,
        handle,
        avatar: raw.avatar || raw.avatarData || raw.fotoPerfil || "",
        banner: raw.banner || raw.bannerData || raw.portada || "",
        fondo: raw.fondo || raw.fondoData || raw.background || "",
        bio: raw.bio || raw.biografia || "",
        edad: raw.edad || "",
        especie: raw.especie || raw.raza || "",
        genero: raw.genero || "",
        ocupacion: raw.ocupacion || "",
        universo: raw.universo || (Array.isArray(raw.universos) ? raw.universos[0] : "") || "",
        pareja: raw.pareja || raw.estadoSentimentalHandle || "",
        habilidades: Array.isArray(raw.habilidades) ? raw.habilidades : [],
        debilidades: Array.isArray(raw.debilidades) ? raw.debilidades : []
    };
}

function leerLocales() {
    try {
        const arr = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]");
        if (!Array.isArray(arr)) return [];
        return arr
            .filter(p => p && !p.esPlaceholder && normHandle(p.handle) !== "@cypher_hacker")
            .map(normalizarFichaPersonaje);
    } catch {
        return [];
    }
}

function guardarLocales(lista) {
    try {
        localStorage.setItem("kixuz_subpersonajes", JSON.stringify(lista));
    } catch {}
}

window.KIXUZ_DB = {
    configurado,
    auth,
    db,
    usuarioActual: null,
    perfilCuenta: null,
    esAdmin: false,

    normalizarFichaPersonaje,

    async registrarCuenta({ email, password, nombreMaestro }) {
        if (!configurado) throw new Error("Firebase no configurado.");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (nombreMaestro) {
            await updateProfile(cred.user, { displayName: nombreMaestro });
        }
        const esAdmin = norm(nombreMaestro) === "kixuz";
        const perfil = {
            uid: cred.user.uid,
            email,
            nombreMaestro: nombreMaestro || email.split("@")[0],
            privacidad: "privada",
            rolSistema: esAdmin ? "admin" : "usuario",
            creadoEn: serverTimestamp()
        };
        await setDoc(doc(db, "cuentas", cred.user.uid), perfil, { merge: true });
        this.usuarioActual = cred.user;
        this.perfilCuenta = perfil;
        this.esAdmin = esAdmin;
        return cred.user;
    },

    async iniciarSesion({ email, password }) {
        if (!configurado) throw new Error("Firebase no configurado.");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        this.usuarioActual = cred.user;
        await this.cargarPerfilCuenta(cred.user.uid);
        await this.cargarSubpersonajes();
        return cred.user;
    },

    async cerrarSesion() {
        if (configurado && auth) await signOut(auth);
        this.usuarioActual = null;
        this.perfilCuenta = null;
        this.esAdmin = false;
    },

    async cargarPerfilCuenta(uid) {
        if (!configurado || !uid) return null;
        try {
            const snap = await getDoc(doc(db, "cuentas", uid));
            if (snap.exists()) {
                const data = snap.data();
                this.perfilCuenta = { uid, ...data };
                this.esAdmin = data.rolSistema === "admin" || norm(data.nombreMaestro) === "kixuz";
                return this.perfilCuenta;
            }
        } catch {}
        return null;
    },

    async cargarSubpersonajes() {
        const locales = leerLocales();
        if (!configurado || !this.usuarioActual?.uid) {
            window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
            return locales;
        }
        try {
            const uid = this.usuarioActual.uid;
            const mapa = new Map();
            locales.forEach(p => { if (p.handle) mapa.set(p.handle, p); });

            const q = query(collection(db, "personajes"), where("uidMaestro", "==", uid));
            const snap = await getDocs(q);
            snap.forEach(d => {
                const f = normalizarFichaPersonaje({ id: d.id, ...d.data() });
                if (f.handle) mapa.set(f.handle, { ...mapa.get(f.handle), ...f });
            });

            const combinados = Array.from(mapa.values());
            guardarLocales(combinados);
            window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
            return combinados;
        } catch {
            window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
            return locales;
        }
    },

    async guardarSubpersonaje(personaje) {
        const ficha = normalizarFichaPersonaje(personaje);
        if (!ficha.handle) return null;

        const locales = leerLocales();
        const idx = locales.findIndex(p => p.handle === ficha.handle);
        if (idx >= 0) locales[idx] = { ...locales[idx], ...ficha };
        else locales.push(ficha);
        guardarLocales(locales);

        if (configurado && this.usuarioActual?.uid) {
            const uid = this.usuarioActual.uid;
            const docId = `${uid}_${ficha.handle.replace(/^@/, "")}`;
            const payload = {
                ...ficha,
                id: docId,
                uidMaestro: uid,
                actualizadoEn: serverTimestamp()
            };
            await setDoc(doc(db, "personajes", docId), payload, { merge: true });
        }
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
        return ficha;
    },

    async eliminarSubpersonaje(handleOrId) {
        const h = normHandle(handleOrId);
        const locales = leerLocales().filter(p => p.handle !== h && p.id !== handleOrId);
        guardarLocales(locales);
        if (configurado && this.usuarioActual?.uid) {
            const uid = this.usuarioActual.uid;
            const docId = String(handleOrId).includes("_") ? handleOrId : `${uid}_${h.replace(/^@/, "")}`;
            try { await deleteDoc(doc(db, "personajes", docId)); } catch {}
        }
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
    },

    async listarPersonajesPublicos() {
        const mapa = new Map();
        leerLocales().forEach(p => {
            if (p.handle) mapa.set(p.handle, p);
        });

        if (configurado && db) {
            try {
                const snap = await getDocs(collection(db, "personajes"));
                snap.forEach(d => {
                    const f = normalizarFichaPersonaje({ id: d.id, ...d.data() });
                    if (f.handle && f.handle !== "@cypher_hacker") {
                        const prev = mapa.get(f.handle) || {};
                        mapa.set(f.handle, {
                            ...prev,
                            ...f,
                            avatar: f.avatar || prev.avatar || "",
                            banner: f.banner || prev.banner || "",
                            fondo: f.fondo || prev.fondo || "",
                            bio: f.bio || prev.bio || ""
                        });
                    }
                });
            } catch (err) {
                console.warn("No se pudo leer personajes públicos de Firestore:", err);
            }
        }
        return Array.from(mapa.values());
    },

    async buscarPersonajePublico(handleOrName) {
        const targetH = normHandle(handleOrName);
        const targetN = norm(handleOrName);
        if (!targetH && !targetN) return null;

        const todos = await this.listarPersonajesPublicos();
        return (
            todos.find(p => normHandle(p.handle) === targetH) ||
            todos.find(p => norm(p.nombre) === targetN) ||
            null
        );
    },

    puedeEliminar(autorUid, autorHandle) {
        if (this.esAdmin) return true;
        if (autorUid && this.usuarioActual?.uid && String(autorUid) === String(this.usuarioActual.uid)) {
            return true;
        }
        const activo = window.KIXUZ_ACTIVE_CHAR;
        if (activo && autorHandle && normHandle(activo.handle) === normHandle(autorHandle)) {
            return true;
        }
        return false;
    }
};

if (configurado && auth) {
    onAuthStateChanged(auth, async user => {
        window.KIXUZ_DB.usuarioActual = user || null;
        if (user) {
            await window.KIXUZ_DB.cargarPerfilCuenta(user.uid);
            await window.KIXUZ_DB.cargarSubpersonajes();
        } else {
            window.KIXUZ_DB.perfilCuenta = null;
            window.KIXUZ_DB.esAdmin = false;
        }
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
    });
}
