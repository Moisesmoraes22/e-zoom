"use client";

import { motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";

export function CommerceHero({ storeNames }: { storeNames: string[] }) {
  return (
    <div className="container relative mx-auto max-w-7xl px-2">
      <div className="relative mt-4 rounded-2xl bg-accent/50">
        <motion.section
          className="w-full px-4 py-10 sm:py-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-foreground">Encontre </span>
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                ofertas
              </span>
              <span className="text-foreground"> que realmente valem a pena.</span>
            </h1>
            <p className="mx-auto mb-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Compare preços e descubra onde comprar pelo melhor preço.
            </p>

            <SearchBar />

            {storeNames.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                <span>Ofertas de</span>
                {storeNames.map((name, index) => (
                  <span key={name} className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{name}</span>
                    {index < storeNames.length - 1 && <span aria-hidden>·</span>}
                  </span>
                ))}
              </p>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
