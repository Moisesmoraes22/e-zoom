"use client"

import { LazyMotion, MotionConfig } from "framer-motion"

/**
 * The animation engine is not part of the first JavaScript: components use the light `m` element,
 * and the features load right after the page is interactive. Until they arrive an element simply
 * sits in its final state, so nothing blocks a tap. "reduce motion" is honoured as before.
 */
const loadFeatures = () => import("@/lib/motion-features").then((module) => module.default)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
