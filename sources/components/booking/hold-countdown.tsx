"use client";

import { useEffect, useState } from "react";

type HoldCountdownProps = {
  holdExpiresAt: string;
};

function remainingFrom(holdExpiresAt: string) {
  return Math.max(0, new Date(holdExpiresAt).getTime() - Date.now());
}

function formatRemaining(milliseconds: number) {
  if (milliseconds <= 0) return "Đã hết hạn giữ chỗ";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút ${seconds} giây`;
}

export function HoldCountdown({ holdExpiresAt }: HoldCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    remainingFrom(holdExpiresAt),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(remainingFrom(holdExpiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [holdExpiresAt]);

  return (
    <span
      aria-live="off"
      className={
        remaining > 0
          ? "font-mono font-semibold text-clay tabular-nums"
          : "font-semibold text-danger"
      }
    >
      {formatRemaining(remaining)}
    </span>
  );
}
