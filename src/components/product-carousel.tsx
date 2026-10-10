"use client"

import { ProductCard } from "@/components/product-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { Product } from "@/lib/types"

/**
 * One row of cards side by side, with arrows on every screen size (phones also swipe).
 * It wraps around at both ends, so it reads as endless.
 */
export function ProductCarousel({
  items,
  cardClassName,
}: {
  items: { product: Product; label?: string }[]
  cardClassName?: string
}) {
  return (
    <Carousel opts={{ align: "start", loop: items.length > 7 }} className="w-full" aria-label="Ofertas">
      <CarouselContent>
        {items.map(({ product, label }) => (
          <CarouselItem key={product.id} className="basis-[60%] min-[375px]:basis-[50%] min-[480px]:basis-[40%] md:basis-[28.57%] lg:basis-[22.22%] xl:basis-[18.18%] 2xl:basis-[15.38%]">
            <div className="h-full">
              <ProductCard product={product} label={label} className={cardClassName} compact />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-2 active:scale-90 sm:-left-4" />
      <CarouselNext className="-right-2 active:scale-90 sm:-right-4" />
    </Carousel>
  )
}
