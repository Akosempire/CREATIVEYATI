import HomePortfolio from "@/Components/home/HomePortfolio";
import { getPortfolioPageData } from "@/lib/data/portfolio-page";
import { SERVICES_PAGE } from "@/lib/content/home";

export const metadata = {
  title: { absolute: SERVICES_PAGE.title },
  description: SERVICES_PAGE.description,
  alternates: { canonical: "https://aivideocreator.cv/services" },
};

// services lead the stream; every project still follows underneath
export default async function ServicesPage() {
  const data = await getPortfolioPageData();
  return <HomePortfolio page="services" {...data} />;
}
