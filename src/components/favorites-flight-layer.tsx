"use client"

import { AnimatePresence, motion } from "framer-motion"

import { useFavorites } from "@/lib/favorites-context"

const SIZE = 44

export function FavoritesFlightLayer() {
  const { flights, completeFlight } = useFavorites()

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <AnimatePresence>
        {flights.map((flight) => {
          const fromX = flight.from.left + flight.from.width / 2 - SIZE / 2
          const fromY = flight.from.top + flight.from.height / 2 - SIZE / 2
          const toX = flight.to.left + flight.to.width / 2 - SIZE / 2
          const toY = flight.to.top + flight.to.height / 2 - SIZE / 2
          const midX = fromX + (toX - fromX) * 0.55
          const midY = Math.min(fromY, toY) - 90

          return (
            <motion.img
              key={flight.id}
              src={flight.image}
              alt=""
              aria-hidden
              initial={{
                left: fromX,
                top: fromY,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                left: [fromX, midX, toX],
                top: [fromY, midY, toY],
                scale: [1, 0.85, 0.25],
                opacity: [1, 1, 0.6],
              }}
              transition={{
                duration: 0.7,
                ease: [0.33, 1, 0.68, 1],
                times: [0, 0.55, 1],
              }}
              onAnimationComplete={() => completeFlight(flight.id)}
              className="fixed rounded-full border-2 border-primary object-cover shadow-lg"
              style={{ width: SIZE, height: SIZE }}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
