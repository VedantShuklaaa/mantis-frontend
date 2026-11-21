"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  error: string | null;
};

/*
 * `quote` is the currency the price is expressed in: "sol" is the pool's
 * native MAN/SOL quote, "man" is the inverted SOL/MAN quote. Candle history is
 * built once in SOL per MAN, so the inverse is derived here.
 */
type Quote = "sol" | "man";

const QUOTES: { id: Quote; label: string; hint: string }[] = [
  { id: "sol", label: "SOL", hint: "Price in SOL (MAN/SOL)" },
  { id: "man", label: "MAN", hint: "Price in MAN (SOL/MAN)" },
];

const UP_COLOR = "#3f7d20";
const DOWN_COLOR = "#d92d20";

function invertCandle(candle: Candle): Candle {
  const { open, high, low, close } = candle;

  if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
    return { time: candle.time, open: 0, high: 0, low: 0, close: 0 };
  }

  // Inverting flips the extremes: the inverted high comes from the low.
  return {
    time: candle.time,
    open: 1 / open,
    high: 1 / low,
    low: 1 / high,
    close: 1 / close,
  };
}

export default function Chart({
  candles,
  timeframe,
  onTimeframe,
  loading,
  error,
}: Props) {
  const [quote, setQuote] = useState<Quote>("sol");
  const quoteDigits = quote === "sol" ? 6 : 4;

  const displayCandles = useMemo(
    () => (quote === "sol" ? candles : candles.map(invertCandle)),
    [candles, quote],
  );

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
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderVisible: false,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
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

  /*
   * Axis labels and the crosshair read the same precision, so both switch
   * together when the quote flips.
   */
  useEffect(() => {
    const instance = chart.current;
    const candleSeries = series.current;
    if (!instance || !candleSeries) return;

    candleSeries.applyOptions({
      priceFormat: {
        type: "price",
        precision: quoteDigits,
        minMove: 10 ** -quoteDigits,
      },
    });
    instance.applyOptions({
      localization: {
        priceFormatter: (price: number) => price.toFixed(quoteDigits),
      },
    });
  }, [quoteDigits]);

  useEffect(() => {
    if (!series.current) return;

    series.current.setData(
      displayCandles.map((candle) => ({
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

    const latest = displayCandles[displayCandles.length - 1];
    if (latest) {
      const color = latest.close >= latest.open ? UP_COLOR : DOWN_COLOR;
      priceLine.current = series.current.createPriceLine({
        price: latest.close,
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        axisLabelColor: color,
        axisLabelTextColor: "#f7f7f4",
        title: "",
      });
    }
  }, [displayCandles]);

  const last = displayCandles[displayCandles.length - 1];
  const rising = last ? last.close >= last.open : true;
  const pairLabel = quote === "sol" ? "MAN/SOL" : "SOL/MAN";

  return (
    <section className="rounded-xl border border-pool-border bg-pool-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-pool-border px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-pool-muted">
          <span className="font-sans font-medium text-pool-text">{pairLabel}</span>
          {last ? (
            <>
              <span>
                O{" "}
                <span className="text-pool-text">
                  {formatPrice(last.open, quoteDigits)}
                </span>
              </span>
              <span>
                H{" "}
                <span className="text-pool-text">
                  {formatPrice(last.high, quoteDigits)}
                </span>
              </span>
              <span>
                L{" "}
                <span className="text-pool-text">
                  {formatPrice(last.low, quoteDigits)}
                </span>
              </span>
              <span>
                C{" "}
                <span className={rising ? "text-pool-accent" : "text-pool-danger"}>
                  {formatPrice(last.close, quoteDigits)}
                </span>
              </span>
            </>
          ) : (
            <span>Waiting for trades</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="hidden text-[10px] font-medium uppercase tracking-wide text-pool-muted sm:inline">
              Price in
            </span>
            <div
              role="group"
              aria-label="Price quote"
              className="flex items-center gap-0.5 rounded-lg border border-pool-border bg-pool-bg/60 p-0.5"
            >
              {QUOTES.map((item) => {
                const active = item.id === quote;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQuote(item.id)}
                    aria-pressed={active}
                    title={item.hint}
                    className={`relative rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      active
                        ? "text-pool-accent"
                        : "text-pool-muted hover:text-pool-text"
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="pool-price-quote"
                        className="absolute inset-0 rounded-md bg-pool-accent/10 ring-1 ring-pool-accent/25"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden h-4 w-px bg-pool-border sm:block" aria-hidden />

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
        </div>
      </header>

      <div className="relative">
        <div ref={container} className="h-[380px] w-full" />
        {displayCandles.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-lg border border-pool-border bg-pool-panel/90 px-3 py-2 text-xs text-pool-muted">
              {loading
                ? "Loading price history…"
                : error ?? "No trades yet"}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
