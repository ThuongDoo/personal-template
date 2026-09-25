/**
 * Everything the app keeps in Firebase, all scoped to the signed-in user:
 *
 * Firestore
 *   users/{uid}                 profile (name, email, avatar, providers, role, createdAt, lastLoginAt)
 *                               role is 'user' when created; only the Firebase Console can change it to 'admin'
 *   users/{uid}/designs/{id}    one document per page the user made ({ page, elements, createdAt, updatedAt })
 *   users/{uid}/exports/{id}    one record per "Lưu" / "Xuất HTML" (file name, kind, size, Storage path, url)
 *
 *   templates/{id}              page templates made by admins ({ name, description, page, elements, … })
 *
 * Storage
 *   users/{uid}/images/…        uploaded images (the design stores their download URLs)
 *   users/{uid}/exports/…       exported .json / .html files
 *   templates/images/…          copies of the images used by templates, so they outlive the source design
 */
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
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

export const ROLES = { user: 'user', admin: 'admin' }

/**
 * Creates or refreshes users/{uid} and returns the user's role. Called on every sign-in and app start.
 * A new profile gets role 'user'; an existing role is never sent back, so the rules (which forbid
 * changing it from the app) accept the update and an admin set in the Console stays admin.
 */
export async function saveUserProfile(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  const role = snap.data()?.role
  await setDoc(
    ref,
    {
      uid: user.uid,
      displayName: user.displayName ?? null,
      email: user.email ?? user.providerData.find((p) => p.email)?.email ?? null,
      photoURL: user.photoURL ?? null,
      providers: user.providerData.map((p) => p.providerId),
      createdAt: new Date(user.metadata.creationTime),
      lastLoginAt: serverTimestamp(),
      // Profiles created before roles existed get one too.
      ...(role ? {} : { role: ROLES.user }),
    },
    { merge: true },
  )
  return role ?? ROLES.user
}

// ---------------------------------------------------------------- design

const designsCol = (uid) => collection(db, 'users', uid, 'designs')

/** All of the user's designs, most recently edited first: `[{ id, page, elements, updatedAt: Date }]`. */
export async function listDesigns(uid) {
  const snap = await getDocs(query(designsCol(uid), orderBy('updatedAt', 'desc')))
  return snap.docs.flatMap((d) => {
    try {
      return [{ id: d.id, ...normalizeDoc(d.data()), updatedAt: d.data().updatedAt?.toDate() ?? null }]
    } catch {
      return [] // Skip a corrupt document rather than hiding every other design.
    }
  })
}

/** One design, or null if it doesn't exist (e.g. it was deleted in another tab). */
export async function loadDesign(uid, id) {
  const snap = await getDoc(doc(designsCol(uid), id))
  return snap.exists() ? normalizeDoc(snap.data()) : null
}

const checkSize = (data) => {
  if (new Blob([JSON.stringify(data)]).size > MAX_DESIGN_BYTES) throw new DesignTooLargeError()
}

/** How many pages one user may keep; they have to delete one to make another. */
export const MAX_DESIGNS = 3

export class DesignLimitError extends Error {
  constructor() {
    super(`Mỗi tài khoản chỉ được lưu tối đa ${MAX_DESIGNS} trang`)
    this.name = 'DesignLimitError'
  }
}

/** Stores a new design and returns its id. Throws DesignLimitError when the user already has MAX_DESIGNS. */
export async function createDesign(uid, design) {
  const data = { page: design.page, elements: design.elements }
  checkSize(data)
  // Counted on the server, not from the list on screen, so another open tab can't push past the limit.
  const count = (await getCountFromServer(designsCol(uid))).data().count
  if (count >= MAX_DESIGNS) throw new DesignLimitError()
  const ref = doc(designsCol(uid))
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export const deleteDesign = (uid, id) => deleteDoc(doc(designsCol(uid), id))

export class DesignTooLargeError extends Error {
  constructor() {
    super('Thiết kế vượt quá giới hạn 1MB của Firestore')
    this.name = 'DesignTooLargeError'
  }
}

export async function saveDesign(uid, id, design) {
  const data = { page: design.page, elements: design.elements }
  checkSize(data)
  // merge keeps createdAt; `page` always carries every key and arrays are replaced, so nothing stale survives.
  await setDoc(doc(designsCol(uid), id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// ---------------------------------------------------------------- images

const userImages = (uid) => `users/${uid}/images`

async function uploadImageBlob(folder, blob) {
  const ext = IMAGE_EXT[blob.type] ?? 'img'
  const fileRef = ref(storage, `${folder}/${Date.now()}-${randomId()}.${ext}`)
  await uploadBytes(fileRef, blob, { contentType: blob.type, cacheControl: 'public, max-age=31536000' })
  return getDownloadURL(fileRef)
}

/** Reads (and downscales) an image file, uploads it, and returns `{ src, width, height }` with a Storage URL. */
export async function uploadImage(file) {
  const uid = currentUid()
  const { blob, width, height } = await readImageFile(file)
  return { src: await uploadImageBlob(userImages(uid), blob), width, height }
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
        uploads.set(src, fetch(src).then((r) => r.blob()).then((blob) => uploadImageBlob(userImages(uid), blob)))
      }
      return { ...el, props: { ...el.props, src: await uploads.get(src) } }
    }),
  )
  return { ...design, elements }
}

// ---------------------------------------------------------------- admin & templates

/** Every user profile, most recently active first. Admin only (enforced by the rules). */
export async function listUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('lastLoginAt', 'desc')))
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id, lastLoginAt: d.data().lastLoginAt?.toDate() ?? null }))
}

const templatesCol = () => collection(db, 'templates')

/** Admin-made templates, newest first, shaped like BLANK_TEMPLATE in templates.js. */
export async function listTemplates() {
  const snap = await getDocs(query(templatesCol(), orderBy('createdAt', 'desc')))
  return snap.docs.flatMap((d) => {
    const data = d.data()
    try {
      const design = normalizeDoc(data)
      return [
        {
          id: `cloud-${d.id}`,
          templateId: d.id,
          name: data.name,
          description: data.description ?? '',
          create: () => normalizeDoc(structuredClone(design)),
        },
      ]
    } catch {
      return []
    }
  })
}

const isTemplateImage = (src) => src.includes('/o/templates%2F')

/**
 * Copies the design's Storage images into templates/images, so deleting or replacing them in the
 * source design can't break the template. An image that can't be copied (usually because the
 * bucket has no CORS config, see cors.json) keeps its original URL, which still works.
 */
async function copyImagesForTemplate(design) {
  const copies = new Map()
  let failed = 0
  const copy = async (src) => {
    try {
      const res = await fetch(src)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await uploadImageBlob('templates/images', await res.blob())
    } catch (e) {
      console.warn('Không chép được ảnh sang mẫu, giữ đường dẫn gốc', src, e)
      failed++
      return src
    }
  }
  const elements = await Promise.all(
    design.elements.map(async (el) => {
      const src = el.props?.src
      if (typeof src !== 'string' || !isUploadedImage(src) || isTemplateImage(src)) return el
      if (!copies.has(src)) copies.set(src, copy(src))
      return { ...el, props: { ...el.props, src: await copies.get(src) } }
    }),
  )
  return { design: { ...design, elements }, failedImages: failed }
}

/**
 * Publishes a design as a template. `source` records where it came from (`{ uid, designId }`).
 * Returns `{ id, failedImages }`.
 */
export async function saveTemplate(design, { name, description, source }) {
  const { design: copied, failedImages } = await copyImagesForTemplate(design)
  const data = { page: copied.page, elements: copied.elements }
  checkSize(data)
  const ref = await addDoc(templatesCol(), {
    ...data,
    name,
    description,
    sourceUid: source?.uid ?? null,
    sourceDesignId: source?.designId ?? null,
    createdBy: currentUid(),
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, failedImages }
}

// Copied images stay in Storage: another template may still use them.
export const deleteTemplate = (id) => deleteDoc(doc(templatesCol(), id))

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
