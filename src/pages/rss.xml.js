import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import site from "../../content/site.json";

export async function GET(context) {
  const posts = (await getCollection("posts")).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  return rss({
    title: `${site.name} — Writing`,
    description: site.tagline,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: new Date(p.data.date),
      link: `/writing/${p.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
