"use client";

import { motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";
import { SiteHeader } from "@/components/site-header";
import { STORES } from "@/lib/mock-data";

export function CommerceHero() {
  return (
    <div className="w-full">
      <SiteHeader />

      <div className="container relative mx-auto max-w-7xl px-2">
        <div className="relative mt-6 rounded-2xl bg-accent/50">
          <motion.section
            className="w-full px-4 py-16 sm:py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mx-auto max-w-2xl text-center">
              <motion.h1
                className="mb-4 text-3xl font-bold tracking-tight leading-tight sm:text-4xl lg:text-5xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                <span className="text-foreground">Encontre as melhores</span>{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  ofertas
                </span>
                <span className="text-foreground">, em um só lugar.</span>
              </motion.h1>
              <motion.p
                className="mx-auto mb-8 max-w-lg text-base text-muted-foreground leading-relaxed sm:text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
              >
                Pesquise produtos, compare ofertas de várias lojas e vá direto
                para a loja com o melhor preço.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              >
                <SearchBar />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm"
              >
                <span>Ofertas de</span>
                {Object.values(STORES)
                  .filter((store) => store.id !== "telegram")
                  .map((store, index, arr) => (
                    <span key={store.id} className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {store.name}
                      </span>
                      {index < arr.length - 1 && <span aria-hidden>·</span>}
                    </span>
                  ))}
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
