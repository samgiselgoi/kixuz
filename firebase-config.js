import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
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
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

const configurado = Boolean(
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("TU_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("TU_")
);

let app = null;
let auth = null;
let db = null;

if (configurado) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

const normH = v => {
    const s = String(v || "").trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "_");
    return s ? "@" + s : "";
};

window.KIXUZ_DB = {
    activo: configurado,
    usuarioActual: null,
    perfilCuenta: null,

    async iniciarSesion(email, password) {
        if (!configurado) throw new Error("Firebase no configurado");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        this.usuarioActual = cred.user;
        await this.sincronizarMisSubpersonajes();
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        return cred.user;
    },

    async registrarCuenta(email, password, apodo = "") {
        if (!configurado) throw new Error("Firebase no configurado");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        this.usuarioActual = cred.user;
        const perfil = {
            uid: cred.user.uid,
            email: cred.user.email,
            apodo: apodo || email.split("@")[0],
            createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "usuarios", cred.user.uid), perfil, { merge: true });
        this.perfilCuenta = perfil;
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        return cred.user;
    },

    async cerrarSesion() {
        if (!configurado) return;
        await signOut(auth);
        this.usuarioActual = null;
        this.perfilCuenta = null;
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
    },

    async guardarSubpersonaje(personaje) {
        if (!personaje) return;
        const handle = normH(personaje.handle);
        if (!handle) return;
        const uid = this.usuarioActual?.uid || "";
        const docId = uid ? `${uid}_${handle.slice(1)}` : handle.slice(1);
        const payload = {
            ...personaje,
            handle,
            uidMaestro: uid || personaje.uidMaestro || "",
            updatedAt: serverTimestamp()
        };
        if (configurado) {
            await setDoc(doc(db, "personajes", docId), payload, { merge: true });
        }
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
    },

    async actualizarSubpersonaje(personaje) {
        return this.guardarSubpersonaje(personaje);
    },

    async eliminarSubpersonaje(handle, docId = "") {
        if (!configurado) return;
        const h = normH(handle);
        const uid = this.usuarioActual?.uid || "";
        const targetId = docId || (uid ? `${uid}_${h.slice(1)}` : h.slice(1));
        await deleteDoc(doc(db, "personajes", targetId));
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
    },

    async sincronizarMisSubpersonajes() {
        if (!configurado || !this.usuarioActual?.uid) return [];
        const snap = await getDocs(collection(db, "personajes"));
        const mios = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.uidMaestro === this.usuarioActual.uid);

        if (mios.length) {
            localStorage.setItem("kixuz_subpersonajes", JSON.stringify(mios));
            const act = JSON.parse(localStorage.getItem("kixuz_personaje_activo") || "null");
            if (!act || !mios.some(m => normH(m.handle) === normH(act.handle))) {
                localStorage.setItem("kixuz_personaje_activo", JSON.stringify(mios[0]));
                window.KIXUZ_ACTIVE_CHAR = mios[0];
            }
        }
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
        return mios;
    },

    // Devuelve TODOS los personajes registrados en Firestore (tuyos y de otras cuentas)
    async listarPersonajesPublicos() {
        if (!configurado) {
            try {
                return JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]");
            } catch {
                return [];
            }
        }
        const snap = await getDocs(collection(db, "personajes"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async buscarPersonajePublico(handle) {
        const h = normH(handle);
        if (!h) return null;
        const todos = await this.listarPersonajesPublicos();
        return todos.find(p => normH(p.handle) === h) || null;
    },

    async publicarPost(post) {
        if (!configurado) return null;
        const ref = await addDoc(collection(db, "posts"), {
            ...post,
            createdAt: serverTimestamp()
        });
        return ref.id;
    },

    escucharPosts(callback) {
        if (!configurado) return () => {};
        const q = query(collection(db, "posts"), orderBy("createdAtMs", "desc"));
        return onSnapshot(q, snap => {
            callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }
};

if (configurado) {
    onAuthStateChanged(auth, async user => {
        window.KIXUZ_DB.usuarioActual = user || null;
        if (user) {
            try {
                const uDoc = await getDoc(doc(db, "usuarios", user.uid));
                window.KIXUZ_DB.perfilCuenta = uDoc.exists() ? uDoc.data() : { uid: user.uid, email: user.email };
            } catch {}
            await window.KIXUZ_DB.sincronizarMisSubpersonajes();
        }
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
    });
}
