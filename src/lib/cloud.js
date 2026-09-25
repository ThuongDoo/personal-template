/**
 * Everything the app keeps in Firebase, all scoped to the signed-in user:
 *
 * Firestore
 *   users/{uid}                 profile (name, email, avatar, providers, createdAt, lastLoginAt)
 *   users/{uid}/designs/main    the page being edited ({ page, elements, updatedAt })
 *   users/{uid}/exports/{id}    one record per "Lưu" / "Xuất HTML" (file name, kind, size, Storage path, url)
 *
 * Storage
 *   users/{uid}/images/…        uploaded images (the design stores their download URLs)
 *   users/{uid}/exports/…       exported .json / .html files
 */
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { normalizeDoc, uid as randomId } from './elements.js'
import { auth, db, facebookProvider, googleProvider, storage } from './firebase.js'
import { readImageFile } from './image.js'

/** Firestore documents are capped at 1 MiB; leave room for field names and metadata. */
const MAX_DESIGN_BYTES = 900_000

const PROVIDERS = { google: googleProvider, facebook: facebookProvider }

const IMAGE_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
}

const currentUid = () => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Chưa đăng nhập')
  return uid
}

// ---------------------------------------------------------------- auth & profile

export const signIn = (provider) => signInWithPopup(auth, PROVIDERS[provider])

export const signOut = () => fbSignOut(auth)

/** Creates or refreshes users/{uid}. Called on every sign-in and app start. */
export function saveUserProfile(user) {
  return setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? user.providerData.find((p) => p.email)?.email ?? null,
      photoURL: user.photoURL ?? null,
      providers: user.providerData.map((p) => p.providerId),
      createdAt: new Date(user.metadata.creationTime),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  )
}

// ---------------------------------------------------------------- design

const designRef = (uid) => doc(db, 'users', uid, 'designs', 'main')

/** The user's saved design, or null if they have none yet. */
export async function loadDesign(uid) {
  const snap = await getDoc(designRef(uid))
  return snap.exists() ? normalizeDoc(snap.data()) : null
}

export class DesignTooLargeError extends Error {
  constructor() {
    super('Thiết kế vượt quá giới hạn 1MB của Firestore')
    this.name = 'DesignTooLargeError'
  }
}

export async function saveDesign(uid, design) {
  const data = { page: design.page, elements: design.elements }
  if (new Blob([JSON.stringify(data)]).size > MAX_DESIGN_BYTES) throw new DesignTooLargeError()
  await setDoc(designRef(uid), { ...data, updatedAt: serverTimestamp() })
}

// ---------------------------------------------------------------- images

async function uploadImageBlob(uid, blob) {
  const ext = IMAGE_EXT[blob.type] ?? 'img'
  const fileRef = ref(storage, `users/${uid}/images/${Date.now()}-${randomId()}.${ext}`)
  await uploadBytes(fileRef, blob, { contentType: blob.type, cacheControl: 'public, max-age=31536000' })
  return getDownloadURL(fileRef)
}

/** Reads (and downscales) an image file, uploads it, and returns `{ src, width, height }` with a Storage URL. */
export async function uploadImage(file) {
  const uid = currentUid()
  const { blob, width, height } = await readImageFile(file)
  return { src: await uploadImageBlob(uid, blob), width, height }
}

/** True for images stored in Firebase Storage (as opposed to a link the user pasted). */
export const isUploadedImage = (src = '') =>
  src.startsWith('data:') || /^https:\/\/firebasestorage\.googleapis\.com\//.test(src)

/**
 * Moves inline data-URL images (from an imported JSON file or an older local save) to Storage,
 * so the design fits in Firestore. Identical images are uploaded once.
 */
export async function uploadInlineImages(design) {
  const uid = currentUid()
  const uploads = new Map()
  const elements = await Promise.all(
    design.elements.map(async (el) => {
      const src = el.props?.src
      if (typeof src !== 'string' || !src.startsWith('data:')) return el
      if (!uploads.has(src)) {
        uploads.set(src, fetch(src).then((r) => r.blob()).then((blob) => uploadImageBlob(uid, blob)))
      }
      return { ...el, props: { ...el.props, src: await uploads.get(src) } }
    }),
  )
  return { ...design, elements }
}

// ---------------------------------------------------------------- exports

/** Uploads an exported file and records it under users/{uid}/exports. */
export async function saveExport(fileName, content, type) {
  const uid = currentUid()
  const blob = new Blob([content], { type })
  const path = `users/${uid}/exports/${Date.now()}-${fileName}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, blob, { contentType: type })
  const url = await getDownloadURL(fileRef)
  await addDoc(collection(db, 'users', uid, 'exports'), {
    fileName,
    kind: type === 'text/html' ? 'html' : 'json',
    size: blob.size,
    path,
    url,
    createdAt: serverTimestamp(),
  })
  return url
}
