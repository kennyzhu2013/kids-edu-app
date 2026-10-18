import catalog from "@/content/fixtures/catalog.json";
import { PackScreen } from "@/components/screens/course-screens";

export function generateStaticParams() {
  return catalog.packs.map((pack) => ({ packId: pack.id }));
}

export default function Page() {
  return <PackScreen />;
}
