import HomePortfolio from "@/Components/home/HomePortfolio";
import { getPortfolioPageData } from "@/lib/data/portfolio-page";
import { ABOUT_PAGE } from "@/lib/content/home";

export const metadata = {
  title: { absolute: ABOUT_PAGE.title },
  description: ABOUT_PAGE.description,
  alternates: { canonical: "https://aivideocreator.cv/about" },
};

// the story leads the stream; every project still follows underneath
export default async function AboutPage() {
  const data = await getPortfolioPageData();
  return <HomePortfolio page="about" {...data} />;
}
