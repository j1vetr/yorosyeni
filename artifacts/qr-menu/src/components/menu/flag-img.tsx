const LANG_TO_COUNTRY: Record<string, string> = {
  tr: "tr",
  en: "gb",
  ru: "ru",
  ar: "sa",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  ja: "jp",
  zh: "cn",
};

export function FlagImg({
  code,
  size = 24,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const cc = LANG_TO_COUNTRY[code.toLowerCase()] ?? code.toLowerCase().slice(0, 2);
  const h = Math.round(size * 0.67);
  return (
    <img
      src={`https://flagcdn.com/w40/${cc}.png`}
      srcSet={`https://flagcdn.com/w80/${cc}.png 2x`}
      alt={code.toUpperCase()}
      width={size}
      height={h}
      className={`rounded-sm object-cover inline-block flex-shrink-0 ${className}`}
      style={{ width: size, height: h }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
