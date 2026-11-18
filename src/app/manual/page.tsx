import type { Metadata } from "next";
import { ManualClient } from "./ManualClient";

export const metadata: Metadata = {
  title: "คู่มือการใช้งานระบบ — TheRoom Resort ชุมแพ",
  description: "คู่มือการปฏิบัติงานและใช้งานระบบบริหารโรงแรม TheRoom Resort ชุมแพ พร้อมภาพประกอบแยกตามตำแหน่งงาน",
};

export default function ManualPage() {
  return <ManualClient />;
}
