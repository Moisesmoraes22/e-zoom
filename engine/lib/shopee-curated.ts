/**
 * Shopee items picked by hand (from affiliate storefronts, 28 Oct 2026), collected by id on every run with
 * our own affiliate link. Only unbranded items: anything named after a third-party brand or alluding to one
 * ("Nike", "estilo Zara", "3 listras", "jacaré", "Asuna"...) stays out, since at those prices they are replicas.
 * Key = "shopId.itemId", the same external id the keyword search uses.
 */
export const CURATED_SHOPEE: Record<string, string> = {
  "1581042768.58216533131": "moda", // tênis casual masculino básico
  "1188204652.19498294600": "moda", // chinelo slide nuvem
  "727094907.22493675780": "moda", // calça jeans estilo jogador
  "475585007.58214824616": "moda", // camisa de malha peruana
  "1861375372.58268974968": "moda", // short tactel
  "1380113833.55853157009": "moda", // calça Y2K bordada
  "1614787351.22094950758": "moda", // calça baggy moletom
  "1614787351.58252602322": "moda", // calça baggy estonada
  "1614787351.23294396318": "moda", // calça baggy balão
  "441503847.20899551729": "moda", // camiseta canelada
  "1045210677.57754966850": "moda", // moletom gola alta com zíper
  "458168114.22295563189": "moda", // moletom de zíper
  "439291598.58255593590": "moda", // calça jeans jogger destroyed
  "529766033.22494065095": "moda", // moletom com balaclava
  "1258706180.58257856423": "moda", // calça jogger
  "1326670508.22494351028": "moda", // calça jogger jeans
  "675755095.22898864829": "moda", // conjunto feminino de tricô
  "1878056670.56314915632": "moda", // moletom unissex com capuz
}

/** Hand-picked items have few sales, so the floor is lower than the keyword search, but not zero. */
export const CURATED_MIN_SALES = 1
export const CURATED_MIN_RATING = 4.5
