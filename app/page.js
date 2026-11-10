import HomePortfolio from "@/Components/home/HomePortfolio";
import { getPortfolioPageData } from "@/lib/data/portfolio-page";
import { HOME } from "@/lib/content/home";

export const metadata = {
  title: { absolute: HOME.title },
  description: HOME.description,
  alternates: { canonical: "https://aivideocreator.cv/" },
  openGraph: { title: HOME.title, description: HOME.description, url: "https://aivideocreator.cv/" },
};

// the front page: intro panel + the stream of work, ending in contact.
// services and about are their own pages with the same panel and stream.
export default async function Home() {
  const data = await getPortfolioPageData();
  return <HomePortfolio page="work" {...data} />;
}
