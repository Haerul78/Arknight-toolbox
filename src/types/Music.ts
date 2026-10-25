export type Song = {
    cid: string
    name: string
    artists: string[]
    // format and byte size of the source file, read once at build time
    ext: string | null
    size: number | null
}

export type Album = {
    cid: string
    name: string
    intro: string
    songs: Song[]
}

// a song together with the album it belongs to, in play order
export type Track = Song & {
    index: number
    albumCid: string
    albumName: string
}
