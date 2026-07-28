function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** Rejilla decorativa tipo QR generada de forma determinista a partir de un id. No es un código escaneable real. */
export default function QrPreview({ seed, size = 9 }: { seed: string; size?: number }) {
  const base = hash(seed);
  const cells = Array.from({ length: size * size }, (_, i) => {
    const isFinder =
      (i < size * 3 && i % size < 3) ||
      (i < size * 3 && i % size >= size - 3) ||
      (i >= (size - 3) * size && i % size < 3);
    if (isFinder) return true;
    return ((base >> (i % 31)) & 1) === 1;
  });

  return (
    <div
      className="grid aspect-square w-full max-w-[10rem] gap-[2px] rounded-xl bg-carrot-50 p-3"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {cells.map((on, i) => (
        <div key={i} className={on ? "rounded-[1px] bg-ink-950" : "rounded-[1px] bg-transparent"} />
      ))}
    </div>
  );
}
