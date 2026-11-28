"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureReferralFromLink } from "@/lib/referral-client";

export function ReferralTracker() {
  const search = useSearchParams().toString();
  useEffect(() => {
    void captureReferralFromLink(search);
  }, [search]);
  return null;
}
