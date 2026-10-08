-- All photos of the product (Mercado Livre gives several), up to 8, first one = offers.image.
-- Read by the product page only, never by the catalog lists (they would carry 8x the URLs).
alter table public.offers add column images text[];
