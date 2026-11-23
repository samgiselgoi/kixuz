import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    arrayUnion,
    increment,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpCcFOBm8smfGe8bR8eAk04h9_b3g1ScU",
    authDomain: "kixuz-rol.firebaseapp.com",
    projectId: "kixuz-rol",
    storageBucket: "kixuz-rol.firebasestorage.app",
    messagingSenderId: "430394972675",
    appId: "1:430394972675:web:6811861650fde334c00c36"
};

const configurado = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY");

let app = null;
let auth = null;
let db = null;

if (configurado) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

const norm = v => String(v || "").trim().toLowerCase();
const normHandle = h => {
    const limp = norm(h).replace(/^@+/, "").replace(/\s+/g, "_");
    return limp ? "@" + limp : "";
};

function guardarLocalListaYActivo(personaje) {
    try {
        const existentes = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]");
        const hNuevo = normHandle(personaje.handle);
        const filtrados = existentes.filter(p => normHandle(p.handle) !== hNuevo);
        filtrados.push(personaje);
        localStorage.setItem("kixuz_subpersonajes", JSON.stringify(filtrados));
        localStorage.setItem("kixuz_personaje_activo", JSON.stringify(personaje));
    } catch {}
}

window.KIXUZ_DB = {
    activo: configurado,
    usuarioActual: null,
    perfilCuenta: null,
    esAdmin: false,

    async cargarPerfilCuenta(userOverride = null) {
        const u = userOverride || auth?.currentUser || this.usuarioActual;
        if (!configurado || !u) return this.perfilCuenta;
        try {
            const snap = await getDoc(doc(db, "cuentas", u.uid));
            const data = snap.exists() ? snap.data() : {};
            this.perfilCuenta = { id: snap.id || u.uid, uid: u.uid, email: u.email, ...data };
            this.esAdmin = false;
            window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
            return this.perfilCuenta;
        } catch {
            return this.perfilCuenta;
        }
    },

    esDuenioDePersonaje(personaje = null) {
        if (!personaje) return false;
        const miUid = norm(auth?.currentUser?.uid || this.usuarioActual?.uid || this.perfilCuenta?.uid || "");
        const duenioUid = norm(personaje.uidMaestro || "");
        if (duenioUid && miUid) return duenioUid === miUid;
        if (duenioUid && !miUid) return false;
        const handleObj = normHandle(personaje.handle || "");
        if (!handleObj) return false;
        try {
            const locales = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]");
            return locales.some(p => {
                if (normHandle(p.handle) !== handleObj) return false;
                if (miUid && p.uidMaestro && norm(p.uidMaestro) !== miUid) return false;
                return true;
            });
        } catch {
            return false;
        }
    },

    puedeEliminar(autorUid = "", autorHandle = "") {
        const miUid = norm(auth?.currentUser?.uid || this.usuarioActual?.uid || "");
        const miHandle = normHandle(window.KIXUZ_ACTIVE_CHAR?.handle || "");
        if (autorUid && miUid && norm(autorUid) === miUid) return true;
        if (autorHandle && miHandle && normHandle(autorHandle) === miHandle) return true;
        return false;
    },

    async registrarCuenta(email, password, nombreMaestro) {
        if (!configurado) {
            const localUser = { email, nombreMaestro, rolSistema: "user" };
            localStorage.setItem("kixuz_usuario_local", JSON.stringify(localUser));
            this.perfilCuenta = localUser;
            window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
            return { modo: "local", email };
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        this.usuarioActual = cred.user;
        const perfilDoc = {
            nombreMaestro,
            email,
            rolSistema: "user",
            creadoEn: serverTimestamp()
        };
        await setDoc(doc(db, "cuentas", cred.user.uid), perfilDoc);
        this.perfilCuenta = { ...perfilDoc, id: cred.user.uid, uid: cred.user.uid };
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        return cred.user;
    },

    async iniciarSesion(email, password) {
        if (!configurado) {
            const localUser = { email, rolSistema: "user" };
            localStorage.setItem("kixuz_usuario_local", JSON.stringify(localUser));
            this.perfilCuenta = localUser;
            window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
            return { modo: "local", email };
        }
        const cred = await signInWithEmailAndPassword(auth, email, password);
        this.usuarioActual = cred.user;
        await this.cargarPerfilCuenta(cred.user);
        await this.cargarSubpersonajes();
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        return cred.user;
    },

    async cerrarSesion() {
        localStorage.removeItem("kixuz_personaje_activo");
        localStorage.removeItem("kixuz_usuario_local");
        this.perfilCuenta = null;
        if (configurado && auth) {
            try { await signOut(auth); } catch {}
        }
        this.usuarioActual = null;
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
    },

    async guardarSubpersonaje(personaje) {
        if (!personaje) return { modo: "bloqueado" };
        guardarLocalListaYActivo(personaje);
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));

        if (!configurado || !auth?.currentUser) return { modo: "local" };

        const handleLimpio = normHandle(personaje.handle).replace(/^@/, "") || "char";
        const docId = `${auth.currentUser.uid}_${handleLimpio}`;
        const payload = {
            ...personaje,
            id: docId,
            uidMaestro: personaje.uidMaestro || auth.currentUser.uid,
            actualizadoEn: serverTimestamp()
        };

        await setDoc(doc(db, "personajes", docId), payload, { merge: true });
        guardarLocalListaYActivo(payload);
        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
        return docId;
    },

    async eliminarSubpersonaje(handle, docId = "") {
        const hTarget = normHandle(handle);
        const miUidReal = auth?.currentUser?.uid || this.usuarioActual?.uid || this.perfilCuenta?.uid || "";
        const handleLimpio = hTarget.replace(/^@/, "") || "char";
        const idFinal = docId || (miUidReal ? `${miUidReal}_${handleLimpio}` : "");

        try {
            const existentes = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]");
            const filtrados = existentes.filter(p => normHandle(p.handle) !== hTarget);
            localStorage.setItem("kixuz_subpersonajes", JSON.stringify(filtrados));

            const activoRaw = localStorage.getItem("kixuz_personaje_activo");
            if (activoRaw) {
                const activo = JSON.parse(activoRaw);
                if (normHandle(activo?.handle) === hTarget) {
                    if (filtrados.length > 0) {
                        localStorage.setItem("kixuz_personaje_activo", JSON.stringify(filtrados[0]));
                    } else {
                        localStorage.removeItem("kixuz_personaje_activo");
                    }
                }
            }
        } catch {}

        if (configurado && auth?.currentUser && idFinal) {
            try { await deleteDoc(doc(db, "personajes", idFinal)); } catch {}
        }

        window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
        return true;
    },

    async cargarSubpersonajes() {
        let locales = [];
        try { locales = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]"); } catch { locales = []; }
        if (!Array.isArray(locales)) locales = [];

        if (!configurado || !auth?.currentUser) {
            return locales;
        }
        try {
            const q = query(collection(db, "personajes"), where("uidMaestro", "==", auth.currentUser.uid));
            const snap = await getDocs(q);
            const remotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const mapa = new Map();
            locales.forEach(p => {
                const k = normHandle(p?.handle || p?.nombre);
                if (k) mapa.set(k, p);
            });
            remotos.forEach(p => {
                const k = normHandle(p?.handle || p?.nombre);
                if (k) mapa.set(k, { ...mapa.get(k), ...p });
            });
            const combinados = Array.from(mapa.values());
            localStorage.setItem("kixuz_subpersonajes", JSON.stringify(combinados));

            if (combinados.length > 0) {
                let activo = null;
                try {
                    const parsed = JSON.parse(localStorage.getItem("kixuz_personaje_activo") || "null");
                    if (parsed?.handle) {
                        activo = combinados.find(p => normHandle(p.handle) === normHandle(parsed.handle));
                    }
                } catch {}
                localStorage.setItem("kixuz_personaje_activo", JSON.stringify(activo || combinados[0]));
            }

            window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
            return combinados;
        } catch {
            return locales;
        }
    },

    async listarPersonajesPublicos() {
        let locales = [];
        try { locales = JSON.parse(localStorage.getItem("kixuz_subpersonajes") || "[]"); } catch { locales = []; }
        if (!configurado) return locales;

        try {
            const snap = await getDocs(collection(db, "personajes"));
            const remotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const mapa = new Map();
            locales.forEach(p => {
                const k = normHandle(p?.handle || p?.nombre);
                if (k) mapa.set(k, p);
            });
            remotos.forEach(p => {
                const k = normHandle(p?.handle || p?.nombre);
                if (k) mapa.set(k, { ...mapa.get(k), ...p });
            });
            return Array.from(mapa.values());
        } catch {
            return locales;
        }
    },

    async buscarPersonajePublico(handle) {
        const target = normHandle(handle);
        if (!target) return null;
        const lista = await this.listarPersonajesPublicos();
        return lista.find(p => normHandle(p.handle) === target) || null;
    },

    async publicarPost({
        contenido,
        universo = "",
        imagen = "",
        muroHandle = "",
        muroNombre = "",
        alcanceTipo = "general",
        alcanceDestino = "",
        autorNombre = "",
        autorHandle = ""
    }) {
        const personaje = window.KIXUZ_ACTIVE_CHAR || { nombre: "Personaje", handle: "@rol" };
        const uid = auth?.currentUser?.uid || this.perfilCuenta?.uid || "invitado";

        const payload = {
            autorNombre: autorNombre || personaje.nombre,
            autorHandle: autorHandle || personaje.handle,
            autorAvatar: personaje.avatar || "",
            autorUid: uid,
            uidMaestro: uid,
            muroHandle: muroHandle || personaje.handle,
            muroNombre: muroNombre || "",
            contenido,
            universo,
            imagen,
            alcanceTipo,
            alcanceDestino,
            kixiz: 0,
            respuestas: [],
            creadoEn: serverTimestamp()
        };

        if (!configurado) {
            return { id: "local_" + Date.now(), ...payload };
        }

        const docRef = await addDoc(collection(db, "publicaciones"), payload);
        return docRef.id;
    },

    async eliminarPost(postId) {
        if (!configurado || !postId || String(postId).startsWith("local_")) return;
        await deleteDoc(doc(db, "publicaciones", String(postId)));
    },

    async darKix(postId, delta = 1) {
        if (!configurado || !postId || String(postId).startsWith("local_")) return;
        await updateDoc(doc(db, "publicaciones", String(postId)), {
            kixiz: increment(Number(delta) || 1)
        });
    },

    async agregarRespuestaPost(postId, respuesta) {
        if (!configurado || !postId || String(postId).startsWith("local_")) return;
        await updateDoc(doc(db, "publicaciones", String(postId)), {
            respuestas: arrayUnion(respuesta)
        });
    },

    async actualizarRespuestasPost(postId, respuestasArray) {
        if (!configurado || !postId || String(postId).startsWith("local_")) return;
        await updateDoc(doc(db, "publicaciones", String(postId)), {
            respuestas: respuestasArray
        });
    },

    escucharPosts(callback) {
        if (!configurado) return;
        const q = query(collection(db, "publicaciones"), orderBy("creadoEn", "desc"));
        return onSnapshot(q, snap => {
            const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(posts);
        }, () => {});
    },

    async crearConversacionChat({ nombre, usuario = "", tipo = "privado", participantesExtra = [] }) {
        if (!configurado) return null;
        const autor = window.KIXUZ_ACTIVE_CHAR || { nombre: "Personaje", handle: "@rol" };
        const participantes = Array.from(new Set([
            normHandle(autor.handle),
            normHandle(usuario),
            ...(Array.isArray(participantesExtra) ? participantesExtra.map(normHandle) : [])
        ].filter(Boolean)));

        const docRef = await addDoc(collection(db, "chats"), {
            nombre,
            usuario: normHandle(usuario),
            tipo,
            participantes,
            uidMaestro: auth?.currentUser ? auth.currentUser.uid : "invitado",
            mensajes: [],
            creadoEn: serverTimestamp()
        });
        return { id: docRef.id, nombre, usuario: normHandle(usuario), tipo, participantes, mensajes: [] };
    },

    async guardarMensajesChat(chatId, mensajes) {
        if (!configurado || !chatId || String(chatId).startsWith("chat_")) return;
        await updateDoc(doc(db, "chats", String(chatId)), {
            mensajes,
            actualizadoEn: serverTimestamp()
        });
    },

    async eliminarConversacionChat(chatId) {
        if (!configurado || !chatId || String(chatId).startsWith("chat_")) return;
        await deleteDoc(doc(db, "chats", String(chatId)));
    },

    escucharChats(callback) {
        if (!configurado) return;
        const q = query(collection(db, "chats"), orderBy("creadoEn", "desc"));
        return onSnapshot(q, snap => {
            const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(lista);
        }, () => {});
    },

    async enviarSolicitudVinculo(datos) {
        if (!configurado) return null;
        const origen = window.KIXUZ_ACTIVE_CHAR || { nombre: "Personaje", handle: "@rol" };
        const docRef = await addDoc(collection(db, "solicitudes_vinculo"), {
            ...datos,
            deNombre: origen.nombre,
            deHandle: normHandle(origen.handle),
            paraHandle: normHandle(datos.destinoHandle),
            estado: "pendiente",
            creadoEn: serverTimestamp()
        });
        return docRef.id;
    },

    escucharSolicitudesVinculo(callback) {
        if (!configurado) return;
        const q = query(collection(db, "solicitudes_vinculo"), where("estado", "==", "pendiente"));
        return onSnapshot(q, snap => {
            const sols = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(sols);
        }, () => {});
    },

    async aceptarSolicitudVinculo(solicitud) {
        if (!configurado || !solicitud?.id) return;
        await updateDoc(doc(db, "solicitudes_vinculo", String(solicitud.id)), {
            estado: "aceptada",
            aceptadaEn: serverTimestamp()
        });
    },

    async rechazarSolicitudVinculo(solicitudId) {
        if (!configurado || !solicitudId) return;
        await deleteDoc(doc(db, "solicitudes_vinculo", String(solicitudId)));
    },

    async enviarSolicitudAmistad({ destinoNombre = "", destinoHandle = "" }) {
        if (!configurado) return null;
        const origen = window.KIXUZ_ACTIVE_CHAR || { nombre: "Personaje", handle: "@rol" };
        const deH = normHandle(origen.handle);
        const paraH = normHandle(destinoHandle);
        if (!deH || !paraH || deH === paraH) return null;

        const docRef = await addDoc(collection(db, "solicitudes_amistad"), {
            deNombre: origen.nombre || deH.replace(/^@/, ""),
            deHandle: deH,
            paraNombre: destinoNombre || paraH.replace(/^@/, ""),
            paraHandle: paraH,
            estado: "pendiente",
            creadoEn: serverTimestamp()
        });
        return docRef.id;
    },

    escucharSolicitudesAmistad(callback) {
        if (!configurado) return;
        const q = query(collection(db, "solicitudes_amistad"));
        return onSnapshot(q, snap => {
            const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(lista);
        }, () => {});
    },

    async aceptarSolicitudAmistad(solicitudId) {
        if (!configurado || !solicitudId || String(solicitudId).startsWith("local_am_")) return;
        await updateDoc(doc(db, "solicitudes_amistad", String(solicitudId)), {
            estado: "aceptada",
            aceptadaEn: serverTimestamp()
        });
    },

    async eliminarSolicitudAmistad(solicitudId) {
        if (!configurado || !solicitudId || String(solicitudId).startsWith("local_am_")) return;
        await deleteDoc(doc(db, "solicitudes_amistad", String(solicitudId)));
    }
};

if (configurado) {
    onAuthStateChanged(auth, async user => {
        window.KIXUZ_DB.usuarioActual = user || null;
        if (user) {
            await window.KIXUZ_DB.cargarPerfilCuenta(user);
            await window.KIXUZ_DB.cargarSubpersonajes();
        } else {
            window.KIXUZ_DB.perfilCuenta = null;
            window.dispatchEvent(new Event("kixuz:personajes-actualizados"));
        }
        window.dispatchEvent(new Event("kixuz:sesion-actualizada"));
    });
} else {
    try {
        const localUser = JSON.parse(localStorage.getItem("kixuz_usuario_local") || "null");
        if (localUser) window.KIXUZ_DB.perfilCuenta = localUser;
    } catch {}
}
