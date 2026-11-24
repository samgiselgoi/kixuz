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

const KEY_LISTA = "kixuz_subpersonajes";
const KEY_ACTIVO = "kixuz_personaje_activo";

const normHandle = h => {
    const s = String(h || "").trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "_");
    return s ? "@" + s : "";
};

function leerLocalSubpersonajes() {
    try {
        const arr = JSON.parse(localStorage.getItem(KEY_LISTA) || "[]");
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function guardarLocalSubpersonajes(lista) {
    try {
        localStorage.setItem(KEY_LISTA, JSON.stringify(lista));
    } catch {}
}

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
        await this.sincronizarTodoDispositivo(uid);
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
        await this.sincronizarTodoDispositivo(uid);
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
        const uid = auth.currentUser?.uid || personaje.uidMaestro || "";
        const payload = {
            ...personaje,
            handle: h,
            uidMaestro: uid,
            actualizadoEn: Date.now()
        };
        const publicPayload = {
            nombre: payload.nombre || h.slice(1),
            handle: h,
            avatar: payload.avatar || "",
            clan: payload.clan || "",
            universos: Array.isArray(payload.universos) ? payload.universos : [],
            actualizadoEn: payload.actualizadoEn
        };
        try {
            await setDoc(doc(db, "personajes", h.slice(1)), payload, { merge: true });
            await setDoc(doc(db, "personajes_publicos", h.slice(1)), publicPayload, { merge: true });
            if (uid) {
                await setDoc(doc(db, "cuentas", uid, "personajes", h.slice(1)), payload, { merge: true });
            }
        } catch {}
    },

    async sincronizarTodoDispositivo(uidParam) {
        const uid = uidParam || auth.currentUser?.uid || "";
        const locales = leerLocalSubpersonajes();
        const mapa = new Map();

        locales.forEach(p => {
            const h = normHandle(p?.handle);
            if (h) mapa.set(h, { ...p, handle: h });
        });

        try {
            if (uid) {
                const subSnap = await getDocs(collection(db, "cuentas", uid, "personajes"));
                subSnap.forEach(d => {
                    const data = d.data();
                    const h = normHandle(data?.handle);
                    if (h) mapa.set(h, { ...(mapa.get(h) || {}), ...data, handle: h });
                });
            }
            const pubSnap = await getDocs(collection(db, "personajes"));
            pubSnap.forEach(d => {
                const data = d.data();
                const h = normHandle(data?.handle);
                if (!h) return;
                if ((uid && data.uidMaestro === uid) || mapa.has(h)) {
                    mapa.set(h, { ...(mapa.get(h) || {}), ...data, handle: h });
                }
            });
        } catch {}

        // Subir a Firestore cualquier personaje local o de la cuenta para que aparezca en el directorio global
        for (const p of mapa.values()) {
            const actualizado = uid && (!p.uidMaestro || p.uidMaestro === uid) ? { ...p, uidMaestro: uid } : p;
            mapa.set(p.handle, actualizado);
            await this.guardarSubpersonaje(actualizado);
        }

        const fusionados = Array.from(mapa.values());
        if (fusionados.length > 0) {
            guardarLocalSubpersonajes(fusionados);
            try {
                const act = JSON.parse(localStorage.getItem(KEY_ACTIVO) || "null");
                const actH = normHandle(act?.handle);
                const elegido = (actH && mapa.get(actH)) || fusionados[0];
                if (elegido) {
                    localStorage.setItem(KEY_ACTIVO, JSON.stringify(elegido));
                    window.KIXUZ_ACTIVE_CHAR = elegido;
                }
            } catch {}
        }

        await this.sincronizarPostsNube();
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
        return fusionados;
    },

    async guardarPostNube(postObj) {
        if (!postObj?.id) return;
        try {
            await setDoc(doc(db, "posts", String(postObj.id)), {
                ...postObj,
                actualizadoEn: Date.now()
            }, { merge: true });
        } catch {}
    },

    async sincronizarPostsNube() {
        try {
            const p1 = JSON.parse(localStorage.getItem("kixuz_posts") || "[]");
            const p2 = JSON.parse(localStorage.getItem("kixuz_posts_v1") || "[]");
            const mapa = new Map();
            [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])].forEach(it => {
                if (it && it.id) mapa.set(String(it.id), it);
            });

            const snap = await getDocs(collection(db, "posts"));
            snap.forEach(d => {
                const data = d.data();
                if (data && data.id) {
                    const prev = mapa.get(String(data.id));
                    if (!prev || Number(data.actualizadoEn || 0) >= Number(prev.actualizadoEn || 0)) {
                        mapa.set(String(data.id), data);
                    }
                }
            });

            const todos = Array.from(mapa.values()).sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
            localStorage.setItem("kixuz_posts", JSON.stringify(todos));
            window.dispatchEvent(new Event("kixuz:posts-actualizados"));
        } catch {}
    },

    async listarPersonajesPublicos() {
        const mapa = new Map();
        leerLocalSubpersonajes().forEach(p => {
            const h = normHandle(p?.handle);
            if (h) mapa.set(h, { ...p, handle: h });
        });
        try {
            const postsLocal = JSON.parse(localStorage.getItem("kixuz_posts") || "[]");
            if (Array.isArray(postsLocal)) {
                postsLocal.forEach(it => {
                    const h = normHandle(it?.autorHandle || it?.handle);
                    if (h && !mapa.has(h)) {
                        mapa.set(h, { nombre: it.autorNombre || it.author || h.slice(1), handle: h });
                    }
                });
            }
        } catch {}
        try {
            const pubSnap = await getDocs(collection(db, "personajes_publicos"));
            pubSnap.forEach(d => {
                const data = d.data() || {};
                const h = normHandle(data.handle || ("@" + d.id));
                if (h) {
                    mapa.set(h, {
                        ...(mapa.get(h) || {}),
                        ...data,
                        nombre: data.nombre || mapa.get(h)?.nombre || h.slice(1),
                        handle: h
                    });
                }
            });
        } catch {}
        try {
            const snap = await getDocs(collection(db, "personajes"));
            snap.forEach(d => {
                const data = d.data() || {};
                const h = normHandle(data.handle || ("@" + d.id));
                if (h) {
                    mapa.set(h, {
                        ...(mapa.get(h) || {}),
                        ...data,
                        nombre: data.nombre || mapa.get(h)?.nombre || h.slice(1),
                        handle: h
                    });
                }
            });
        } catch {}
        return Array.from(mapa.values()).sort((a, b) =>
            String(a.nombre || a.handle).localeCompare(String(b.nombre || b.handle), "es")
        );
    },

    async buscarPersonajePublico(handle) {
        const h = normHandle(handle);
        if (!h) return null;
        const idDoc = h.slice(1);
        try {
            const pubSnap = await getDoc(doc(db, "personajes_publicos", idDoc));
            if (pubSnap.exists()) return { handle: h, ...pubSnap.data() };
        } catch {}
        try {
            const snap = await getDoc(doc(db, "personajes", idDoc));
            if (snap.exists()) return { handle: h, ...snap.data() };
        } catch {}
        const lista = await this.listarPersonajesPublicos();
        return lista.find(p => normHandle(p.handle) === h) || null;
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
        await window.KIXUZ_DB.sincronizarTodoDispositivo(user.uid);
    } else {
        window.KIXUZ_DB.perfilCuenta = null;
        await window.KIXUZ_DB.sincronizarPostsNube();
    }
    window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
});
