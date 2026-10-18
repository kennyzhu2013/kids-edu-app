import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { LockScreen } from "@/components/screens/account-screens";

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LockScreen />
    </Suspense>
  );
}
