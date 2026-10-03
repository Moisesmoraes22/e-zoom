"use client";
import React from "react";
import { motion } from "framer-motion";
import Link, { type LinkProps } from "next/link";

import { cn } from "@/lib/utils";

const transition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}) => {
  const isActive = active === item;

  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.p
        transition={{ duration: 0.3 }}
        className={cn(
          "cursor-pointer text-sm font-semibold transition-colors",
          isActive ? "text-primary" : "text-foreground hover:text-primary",
        )}
      >
        {item}
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {isActive && (
            <div className="absolute top-[calc(100%_+_1.4rem)] left-1/2 -translate-x-1/2 pt-4">
              <motion.div
                transition={transition}
                layoutId="active"
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 ring-1 ring-black/5"
              >
                <motion.div layout className="h-full w-max p-5">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)}
      className="relative flex items-center justify-center gap-8 rounded-full border border-border bg-background px-8 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex space-x-3 rounded-xl p-2 transition-colors hover:bg-accent/50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        width={140}
        height={90}
        alt={title}
        className="h-[90px] w-[140px] shrink-0 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="flex flex-col justify-center">
        <h4 className="mb-1 line-clamp-1 max-w-[10rem] text-base font-bold text-foreground">
          {title}
        </h4>
        <p className="max-w-[10rem] text-sm font-semibold text-primary">
          {description}
        </p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({
  className,
  children,
  ...rest
}: LinkProps & {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <Link
      {...rest}
      className={cn(
        "text-muted-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
};
