"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/hooks/useCandles";
import { TIMEFRAMES, type Timeframe } from "@/lib/amm/constants";
import { formatPrice } from "@/lib/amm/format";

type Props = {
  candles: Candle[];
  timeframe: Timeframe;
  onTimeframe: (timeframe: Timeframe) => void;
  loading: boolean;
};

export default function Chart({
  candles,
  timeframe,
  onTimeframe,
  loading,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLine = useRef<IPriceLine | null>(null);

  useEffect(() => {
    if (!container.current) return;

    const instance = createChart(container.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
        textColor: "#56565e",
        fontSize: 11,
        fontFamily:
          'var(--font-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(0,0,0,0.055)" },
        horzLines: { color: "rgba(0,0,0,0.055)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(0,0,0,0.28)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#e2e2da",
        },
        horzLine: {
          color: "rgba(0,0,0,0.28)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#e2e2da",
        },
      },
      rightPriceScale: {
        borderColor: "#e2e2da",
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: "#e2e2da",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(6),
      },
    });

    const candleSeries = instance.addSeries(CandlestickSeries, {
      upColor: "#3f7d20",
      downColor: "#d92d20",
      borderVisible: false,
      wickUpColor: "#3f7d20",
      wickDownColor: "#d92d20",
      priceFormat: {
        type: "price",
        precision: 6,
        minMove: 0.000001,
      },
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chart.current = instance;
    series.current = candleSeries;

    return () => {
      priceLine.current = null;
      series.current = null;
      chart.current = null;
      instance.remove();
    };
  }, []);

  useEffect(() => {
    if (!series.current) return;

    series.current.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );

    if (priceLine.current) {
      series.current.removePriceLine(priceLine.current);
      priceLine.current = null;
    }

    const last = candles[candles.length - 1];
    if (last) {
      priceLine.current = series.current.createPriceLine({
        price: last.close,
        color: "#3f7d20",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        axisLabelColor: "#3f7d20",
        axisLabelTextColor: "#f7f7f4",
        title: "",
      });
    }
  }, [candles]);

  const last = candles[candles.length - 1];
  const rising = last ? last.close >= last.open : true;

  return (
    <section className="rounded-xl border border-pool-border bg-pool-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-pool-border px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-pool-muted">
          <span className="font-sans font-medium text-pool-text">MAN/SOL</span>
          {last ? (
            <>
              <span>
                O <span className="text-pool-text">{formatPrice(last.open)}</span>
              </span>
              <span>
                H <span className="text-pool-text">{formatPrice(last.high)}</span>
              </span>
              <span>
                L <span className="text-pool-text">{formatPrice(last.low)}</span>
              </span>
              <span>
                C{" "}
                <span className={rising ? "text-pool-accent" : "text-pool-danger"}>
                  {formatPrice(last.close)}
                </span>
              </span>
            </>
          ) : (
            <span>Waiting for trades</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-pool-border bg-pool-bg/60 p-0.5">
          {TIMEFRAMES.map((item) => {
            const active = item === timeframe;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onTimeframe(item)}
                className={`relative rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-pool-accent"
                    : "text-pool-muted hover:text-pool-text"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="pool-timeframe"
                    className="absolute inset-0 rounded-md bg-pool-accent/10 ring-1 ring-pool-accent/25"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative z-10">{item}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="relative">
        <div ref={container} className="h-[380px] w-full" />
        {candles.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-lg border border-pool-border bg-pool-panel/90 px-3 py-2 text-xs text-pool-muted">
              {loading ? "Loading price history…" : "No trades yet"}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
