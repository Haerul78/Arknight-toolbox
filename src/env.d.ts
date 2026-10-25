/// <reference types="vite/client" />

interface ImportMetaEnv {
    // where the full-body art lives: "/art" (public/art, the default) or an external
    // storage origin such as https://<bucket>.r2.dev/art
    readonly VITE_ART_BASE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
