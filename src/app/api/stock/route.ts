import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getThaiDatePrefix, nextDailySeqNumber } from "@/lib/doc-number";

export type UnifiedUsageType = "SALE" | "ISSUE" | "BOTH";

export interface UnifiedStockItem {
  key: string;
  usageType: UnifiedUsageType;
  menuItemId: string | null;
  supplyItemId: string | null;
  name: string;
  sku: string;
  barcode: string;
  cost: number;
  price: number;
  stockQty: number;
  minStock: number;
  trackStock: boolean;
  unit: string;
  menuCategoryId: string | null;
  menuCategoryName: string;
  supplyCategory: string;
  isMinibar: boolean;
}

const DEFAULT_SUPPLY_CATEGORIES = [
  "ของใช้ในห้องพัก",
  "ทำความสะอาด",
  "เครื่องเขียน/สำนักงาน",
  "ซ่อมบำรุง",
  "เครื่องดื่ม/มินิบาร์",
];

let cachedUnifiedStock: { data: { items: UnifiedStockItem[]; menuCategories: any[]; stockCategories: any[] }; timestamp: number } | null = null;
const STOCK_CACHE_TTL = 15 * 1000; // 15 seconds cache

export function invalidateStockCache() {
  cachedUnifiedStock = null;
}

export async function buildUnifiedStockPayload(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cachedUnifiedStock && now - cachedUnifiedStock.timestamp < STOCK_CACHE_TTL) {
    return cachedUnifiedStock.data;
  }
  const existingCatCount = await prisma.stockCategory.count();
  if (existingCatCount === 0) {
    const supplyCatsInItems = await prisma.supplyItem.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ["category"],
    });
    const merged = Array.from(
      new Set([
        ...DEFAULT_SUPPLY_CATEGORIES,
        ...supplyCatsInItems.map((s) => s.category.trim()).filter(Boolean),
      ])
    );
    await Promise.all(
      merged.map((name, idx) =>
        prisma.stockCategory.upsert({
          where: { name },
          update: {},
          create: { name, sortOrder: idx + 1 },
        })
      )
    );
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { active: true },
    include: { category: true, supplyItem: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  const supplyItems = await prisma.supplyItem.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const menuCategories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const stockCategories = await prisma.stockCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const linkedSupplyIds = new Set<string>();
  const unified: UnifiedStockItem[] = [];

  for (const m of menuItems) {
    const linkedSupply = m.supplyItem && m.supplyItem.active ? m.supplyItem : null;
    if (linkedSupply) linkedSupplyIds.add(linkedSupply.id);

    unified.push({
      key: linkedSupply ? `both-${m.id}` : `sale-${m.id}`,
      usageType: linkedSupply ? "BOTH" : "SALE",
      menuItemId: m.id,
      supplyItemId: linkedSupply ? linkedSupply.id : null,
      name: m.name,
      sku: m.sku || linkedSupply?.sku || "",
      barcode: m.barcode || linkedSupply?.barcode || "",
      cost: m.cost,
      price: m.price,
      stockQty: m.stockQty,
      minStock: linkedSupply ? linkedSupply.minStock : 5,
      trackStock: m.trackStock,
      unit: linkedSupply ? linkedSupply.unit : "ชิ้น",
      menuCategoryId: m.categoryId,
      menuCategoryName: m.category.name,
      supplyCategory: linkedSupply ? linkedSupply.category : "",
      isMinibar: m.isMinibar,
    });
  }

  for (const s of supplyItems) {
    if (linkedSupplyIds.has(s.id)) continue;
    unified.push({
      key: `issue-${s.id}`,
      usageType: "ISSUE",
      menuItemId: null,
      supplyItemId: s.id,
      name: s.name,
      sku: s.sku || "",
      barcode: s.barcode || "",
      cost: s.cost,
      price: 0,
      stockQty: s.stockQty,
      minStock: s.minStock,
      trackStock: true,
      unit: s.unit,
      menuCategoryId: null,
      menuCategoryName: "",
      supplyCategory: s.category,
      isMinibar: false,
    });
  }

  const result = { items: unified, menuCategories, stockCategories };
  cachedUnifiedStock = { data: result, timestamp: now };
  return result;
}

export interface ReceivingHistoryRecord {
  id: string;
  receiptNo: string;
  supplier: string;
  notes: string;
  userName: string;
  totalCost: number;
  createdAt: string;
  lines: Array<{
    name: string;
    barcode: string;
    unit: string;
    usageType: UnifiedUsageType;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
}

export async function getReceivingHistory(): Promise<ReceivingHistoryRecord[]> {
  const logs = await prisma.auditLog.findMany({
    where: { action: "STOCK_RECEIVE" },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return logs.map((l) => {
    let parsed: {
      receiptNo?: string;
      supplier?: string;
      notes?: string;
      totalCost?: number;
      lines?: ReceivingHistoryRecord["lines"];
    } = {};
    try {
      parsed = JSON.parse(l.details || "{}");
    } catch {
      parsed = {};
    }
    return {
      id: l.id,
      receiptNo: parsed.receiptNo || l.entityId,
      supplier: parsed.supplier || "",
      notes: parsed.notes || "",
      userName: l.user?.name || "ผู้ดูแลระบบ",
      totalCost: Number(parsed.totalCost ?? 0),
      createdAt: l.createdAt.toISOString(),
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await buildUnifiedStockPayload();
  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  invalidateStockCache();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "UPSERT_PRODUCT") {
    const {
      menuItemId,
      supplyItemId,
      usageType,
      name,
      sku,
      barcode,
      cost,
      price,
      stockQty,
      minStock,
      trackStock,
      unit,
      menuCategoryId,
      supplyCategory,
      isMinibar,
    } = body as {
      menuItemId?: string | null;
      supplyItemId?: string | null;
      usageType: UnifiedUsageType;
      name: string;
      sku?: string;
      barcode?: string;
      cost: number;
      price?: number;
      stockQty?: number;
      minStock?: number;
      trackStock?: boolean;
      unit?: string;
      menuCategoryId?: string | null;
      supplyCategory?: string;
      isMinibar?: boolean;
    };

    const trimmedName = String(name ?? "").trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "กรุณาระบุชื่อสินค้า" }, { status: 400 });
    }

    const numericCost = Number(cost ?? 0);
    if (Number.isNaN(numericCost) || numericCost < 0) {
      return NextResponse.json({ error: "ต้นทุนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" }, { status: 400 });
    }

    const numericPrice = Number(price ?? 0);
    const numericStock = Math.max(0, Math.round(Number(stockQty ?? 0)));
    const numericMinStock = Math.max(0, Math.round(Number(minStock ?? 5)));
    const cleanSku = String(sku ?? "").trim();
    const cleanBarcode = String(barcode ?? "").trim();
    const cleanUnit = String(unit ?? "ชิ้น").trim() || "ชิ้น";
    const cleanSupplyCat = String(supplyCategory ?? "ของใช้ในห้องพัก").trim() || "ของใช้ในห้องพัก";

    await prisma.$transaction(async (tx) => {
      let targetMenuId = menuItemId || null;

      if (usageType === "SALE" || usageType === "BOTH") {
        let catId = menuCategoryId || null;
        if (!catId) {
          const firstCat = await tx.menuCategory.findFirst({ orderBy: { sortOrder: "asc" } });
          if (!firstCat) {
            const createdCat = await tx.menuCategory.create({
              data: { name: "สินค้าหน้าร้าน", station: "MINIBAR", sortOrder: 1 },
            });
            catId = createdCat.id;
          } else {
            catId = firstCat.id;
          }
        }

        const shouldTrack = usageType === "BOTH" ? true : Boolean(trackStock ?? true);

        if (targetMenuId) {
          await tx.menuItem.update({
            where: { id: targetMenuId },
            data: {
              categoryId: catId,
              name: trimmedName,
              sku: cleanSku,
              barcode: cleanBarcode,
              cost: numericCost,
              price: numericPrice,
              stockQty: numericStock,
              trackStock: shouldTrack,
              isMinibar: Boolean(isMinibar),
              active: true,
            },
          });
        } else {
          const created = await tx.menuItem.create({
            data: {
              categoryId: catId,
              name: trimmedName,
              sku: cleanSku,
              barcode: cleanBarcode,
              cost: numericCost,
              price: numericPrice,
              stockQty: numericStock,
              trackStock: shouldTrack,
              isMinibar: Boolean(isMinibar),
              active: true,
            },
          });
          targetMenuId = created.id;
        }
      } else if (targetMenuId) {
        // Switched away from SALE/BOTH -> deactivate MenuItem
        await tx.menuItem.update({
          where: { id: targetMenuId },
          data: { active: false },
        });
        targetMenuId = null;
      }

      if (usageType === "ISSUE" || usageType === "BOTH") {
        await tx.stockCategory.upsert({
          where: { name: cleanSupplyCat },
          update: {},
          create: { name: cleanSupplyCat, sortOrder: 99 },
        });

        if (supplyItemId) {
          await tx.supplyItem.update({
            where: { id: supplyItemId },
            data: {
              menuItemId: usageType === "BOTH" ? targetMenuId : null,
              name: trimmedName,
              sku: cleanSku,
              barcode: cleanBarcode,
              category: cleanSupplyCat,
              unit: cleanUnit,
              cost: numericCost,
              stockQty: numericStock,
              minStock: numericMinStock,
              active: true,
            },
          });
        } else {
          await tx.supplyItem.create({
            data: {
              menuItemId: usageType === "BOTH" ? targetMenuId : null,
              name: trimmedName,
              sku: cleanSku,
              barcode: cleanBarcode,
              category: cleanSupplyCat,
              unit: cleanUnit,
              cost: numericCost,
              stockQty: numericStock,
              minStock: numericMinStock,
              active: true,
            },
          });
        }
      } else if (supplyItemId) {
        // Switched away from ISSUE/BOTH -> unlink & deactivate SupplyItem
        await tx.supplyItem.update({
          where: { id: supplyItemId },
          data: { menuItemId: null, active: false },
        });
      }
    });

    const payload = await buildUnifiedStockPayload();
    return NextResponse.json(payload);
  }

  if (body.action === "ADJUST_STOCK") {
    const { menuItemId, supplyItemId, newStockQty } = body as {
      menuItemId?: string | null;
      supplyItemId?: string | null;
      newStockQty: number;
    };
    const qty = Math.max(0, Math.round(Number(newStockQty ?? 0)));

    await prisma.$transaction(async (tx) => {
      if (menuItemId) {
        await tx.menuItem.update({
          where: { id: menuItemId },
          data: { stockQty: qty, trackStock: true },
        });
      }
      if (supplyItemId) {
        await tx.supplyItem.update({
          where: { id: supplyItemId },
          data: { stockQty: qty },
        });
      }
    });

    const payload = await buildUnifiedStockPayload();
    return NextResponse.json(payload);
  }

  if (body.action === "DEACTIVATE") {
    const { menuItemId, supplyItemId } = body as {
      menuItemId?: string | null;
      supplyItemId?: string | null;
    };

    await prisma.$transaction(async (tx) => {
      if (supplyItemId) {
        await tx.supplyItem.update({
          where: { id: supplyItemId },
          data: { menuItemId: null, active: false },
        });
      }
      if (menuItemId) {
        await tx.menuItem.update({
          where: { id: menuItemId },
          data: { active: false },
        });
      }
    });

    const payload = await buildUnifiedStockPayload();
    return NextResponse.json(payload);
  }

  if (body.action === "RECEIVE_STOCK") {
    const { supplier, notes, lines } = body as {
      supplier?: string;
      notes?: string;
      lines: Array<{
        menuItemId?: string | null;
        supplyItemId?: string | null;
        name: string;
        barcode?: string;
        unit?: string;
        usageType: UnifiedUsageType;
        quantity: number;
        unitCost: number;
      }>;
    };

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "กรุณาเพิ่มรายการสินค้าที่จะรับเข้าคลัง" }, { status: 400 });
    }

    const cleanLines = lines.map((l) => {
      const quantity = Math.max(1, Math.round(Number(l.quantity || 0)));
      const unitCost = Math.max(0, Number(l.unitCost ?? 0));
      return {
        menuItemId: l.menuItemId || null,
        supplyItemId: l.supplyItemId || null,
        name: l.name,
        barcode: l.barcode || "",
        unit: l.unit || "ชิ้น",
        usageType: l.usageType,
        quantity,
        unitCost,
        lineTotal: quantity * unitCost,
      };
    });

    const totalCost = cleanLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const cleanSupplier = String(supplier ?? "").trim();
    const cleanNotes = String(notes ?? "").trim();

    await prisma.$transaction(async (tx) => {
      const datePrefix = getThaiDatePrefix();
      const existingLogs = await tx.auditLog.findMany({
        where: {
          action: "STOCK_RECEIVE",
          entityId: { contains: `${datePrefix}-` },
        },
        select: { entityId: true },
      });
      const receiptNo = nextDailySeqNumber(
        existingLogs.map((l) => l.entityId ?? ""),
        "RCV"
      );
      for (const line of cleanLines) {
        if (line.menuItemId) {
          await tx.menuItem.update({
            where: { id: line.menuItemId },
            data: {
              stockQty: { increment: line.quantity },
              trackStock: true,
              cost: line.unitCost,
            },
          });
        }
        if (line.supplyItemId) {
          await tx.supplyItem.update({
            where: { id: line.supplyItemId },
            data: {
              stockQty: { increment: line.quantity },
              cost: line.unitCost,
            },
          });
          await tx.supplyMovement.create({
            data: {
              supplyItemId: line.supplyItemId,
              type: "RESTOCK",
              quantity: line.quantity,
              department: cleanSupplier || "รับเข้าคลัง",
              notes: `ใบรับ ${receiptNo} (ทุน ฿${line.unitCost})${cleanNotes ? ` - ${cleanNotes}` : ""}`,
              userName: user.name,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "STOCK_RECEIVE",
          entityType: "STOCK",
          entityId: receiptNo,
          details: JSON.stringify({
            receiptNo,
            supplier: cleanSupplier,
            notes: cleanNotes,
            totalCost,
            lines: cleanLines,
          }),
        },
      });
    });

    const [payload, history] = await Promise.all([
      buildUnifiedStockPayload(),
      getReceivingHistory(),
    ]);
    return NextResponse.json({
      ...payload,
      history,
      receipt: history[0] ?? null,
    });
  }

  if (body.action === "CREATE_CATEGORY") {
    const { categoryType, name, station } = body as {
      categoryType: "MENU" | "SUPPLY";
      name: string;
      station?: string;
    };
    const trimmed = String(name ?? "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหมวดสินค้า" }, { status: 400 });
    }

    if (categoryType === "MENU") {
      const existing = await prisma.menuCategory.findFirst({
        where: { name: trimmed },
      });
      if (existing) {
        return NextResponse.json({ error: "มีหมวดสินค้านี้อยู่แล้ว" }, { status: 400 });
      }
      const count = await prisma.menuCategory.count();
      await prisma.menuCategory.create({
        data: {
          name: trimmed,
          station: station || "MINIBAR",
          sortOrder: count + 1,
        },
      });
    } else {
      const existing = await prisma.stockCategory.findUnique({
        where: { name: trimmed },
      });
      if (existing) {
        return NextResponse.json({ error: "มีหมวดหมู่นี้อยู่แล้ว" }, { status: 400 });
      }
      const count = await prisma.stockCategory.count();
      await prisma.stockCategory.create({
        data: { name: trimmed, sortOrder: count + 1 },
      });
    }

    const payload = await buildUnifiedStockPayload();
    return NextResponse.json(payload);
  }

  if (body.action === "RENAME_CATEGORY") {
    const { categoryType, id, name, station } = body as {
      categoryType: "MENU" | "SUPPLY";
      id: string;
      name: string;
      station?: string;
    };
    const trimmed = String(name ?? "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหมวดสินค้าใหม่" }, { status: 400 });
    }

    if (categoryType === "MENU") {
      const cleanStation = station !== undefined ? String(station).trim() : undefined;
      await prisma.menuCategory.update({
        where: { id },
        data: {
          name: trimmed,
          ...(cleanStation ? { station: cleanStation } : {}),
        },
      });
    } else {
      const target = await prisma.stockCategory.findUnique({ where: { id } });
      if (!target) {
        return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
      }
      await prisma.$transaction(async (tx) => {
        await tx.stockCategory.update({
          where: { id },
          data: { name: trimmed },
        });
        await tx.supplyItem.updateMany({
          where: { category: target.name },
          data: { category: trimmed },
        });
      });
    }

    const payload = await buildUnifiedStockPayload();
    return NextResponse.json(payload);
  }

  if (body.action === "DELETE_CATEGORY") {
    const { categoryType, id } = body as {
      categoryType: "MENU" | "SUPPLY";
      id: string;
    };

    if (categoryType === "MENU") {
      const usedCount = await prisma.menuItem.count({
        where: { categoryId: id, active: true },
      });
      if (usedCount > 0) {
        return NextResponse.json(
          { error: `ไม่สามารถลบได้ เนื่องจากมีสินค้าใช้งานอยู่ในหมวดนี้ ${usedCount} รายการ` },
          { status: 400 }
        );
      }
      await prisma.menuItem.deleteMany({ where: { categoryId: id, active: false } });
      await prisma.menuCategory.delete({ where: { id } });
    } else {
      const target = await prisma.stockCategory.findUnique({ where: { id } });
      if (target) {
        const usedCount = await prisma.supplyItem.count({
          where: { category: target.name, active: true },
        });
        if (usedCount > 0) {
          return NextResponse.json(
            { error: `ไม่สามารถลบได้ เนื่องจากมีของใช้ในหมวดนี้ ${usedCount} รายการ` },
            { status: 400 }
          );
        }
        await prisma.stockCategory.delete({ where: { id } });
      }
    }

    const payload = await buildUnifiedStockPayload();
    return NextResponse.json(payload);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
