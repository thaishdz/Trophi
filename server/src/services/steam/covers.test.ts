import { getCoverUrls } from "./covers";

describe("getCoverUrls", () => {
  it("construye la portada vertical y la cabecera de respaldo a partir del appid", () => {
    expect(getCoverUrls(1145360)).toEqual({
      cover: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg",
      coverFallback: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
    });
  });
});
