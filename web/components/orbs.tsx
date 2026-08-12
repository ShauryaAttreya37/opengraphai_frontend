type OrbSpec = {
  color: string;
  size: string;
  top: string;
  left?: string;
  right?: string;
  delay?: string;
};

const arrangements: Record<string, OrbSpec[]> = {
  hero: [
    { color: "var(--orb-lavender)", size: "44rem", top: "-16rem", left: "-10rem" },
    { color: "var(--orb-mint)", size: "36rem", top: "6rem", right: "-8rem", delay: "-6s" },
    { color: "var(--orb-peach)", size: "30rem", top: "18rem", left: "34%", delay: "-12s" },
  ],
  band: [
    { color: "var(--orb-sky)", size: "34rem", top: "-12rem", right: "-6rem" },
    { color: "var(--orb-rose)", size: "26rem", top: "10rem", left: "-6rem", delay: "-9s" },
  ],
  close: [
    { color: "var(--orb-peach)", size: "38rem", top: "-14rem", left: "22%" },
    { color: "var(--orb-mint)", size: "26rem", top: "6rem", right: "-4rem", delay: "-7s" },
  ],
};

/**
 * The only colour moments on the page. Pure atmosphere — orbs never sit behind
 * body copy at full strength and never carry content.
 */
export function Orbs({ arrangement = "band" }: { arrangement?: keyof typeof arrangements }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {arrangements[arrangement].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[90px] [animation:orb-drift_24s_ease-in-out_infinite]"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            opacity: "var(--orb-opacity)",
            animationDelay: orb.delay,
            background: `radial-gradient(circle at 50% 50%, ${orb.color} 0%, transparent 68%)`,
          }}
        />
      ))}
    </div>
  );
}
