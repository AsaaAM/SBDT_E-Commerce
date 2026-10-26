'use client';

import React from 'react';

export default function WarehouseStockBadge({ warehouseStock = [] }) {
  if (!warehouseStock || warehouseStock.length === 0) {
    return <span className="text-xs text-slate-400 italic">Stok belum dialokasikan</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {warehouseStock.map((wh) => {
        const qty = parseInt(wh.qty, 10);
        let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let dotColor = 'bg-emerald-500';

        if (qty === 0) {
          badgeColor = 'bg-red-50 text-red-700 border-red-200';
          dotColor = 'bg-red-500';
        } else if (qty <= 3) {
          badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          dotColor = 'bg-amber-500';
        }

        return (
          <span
            key={wh.warehouse_id}
            title={`${wh.warehouse_name} (${wh.city}): ${qty} unit`}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
            <span>{wh.city || wh.warehouse_code}: {qty}</span>
          </span>
        );
      })}
    </div>
  );
}
