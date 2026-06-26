'use client'

import { Heart } from 'lucide-react'
import { useState } from 'react'

interface TourMediaBadgesProps {
    showFavorite?: boolean
}

export function TourMediaBadges({
    showFavorite = true,
}: TourMediaBadgesProps) {
    const [isFavorite, setIsFavorite] = useState(false)

    return (
        <>
            {showFavorite && (
                <button
                    type="button"
                    onClick={() => setIsFavorite((v) => !v)}
                    className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-sm transition duration-200 hover:scale-105 hover:bg-black/50 active:scale-95 lg:h-10 lg:w-10"
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <Heart
                        className={`h-4 w-4 transition-all duration-200 ${isFavorite
                            ? 'fill-white stroke-white'
                            : 'fill-transparent stroke-white'
                            }`}
                    />
                </button>
            )}
        </>
    )
}
