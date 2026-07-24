import { Solar } from "lunar-typescript";

const STEM_ELEMENTS: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

export const TEN_GODS = [
  "比肩", "劫財", "食神", "傷官", "正財",
  "偏財", "正官", "七殺", "正印", "偏印",
] as const;

function normalizeTenGod(value: string) {
  return value
    .replaceAll("劫财", "劫財")
    .replaceAll("伤官", "傷官")
    .replaceAll("正财", "正財")
    .replaceAll("偏财", "偏財")
    .replaceAll("七杀", "七殺");
}

function uniqueTenGods(values: string[]) {
  const normalized = new Set(values.map(normalizeTenGod));
  return TEN_GODS.filter((item) => normalized.has(item));
}

function parseBirthTime(value?: string | null) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return { hour: 12, minute: 0, second: 0, known: false };
  return {
    hour: Math.min(23, Number(match[1])),
    minute: Math.min(59, Number(match[2])),
    second: Math.min(59, Number(match[3] || 0)),
    known: true,
  };
}

type BirthChartInput = {
  birth_date: string;
  birth_time?: string | null;
  birth_time_confidence?: string | null;
};

export function calculateBirthChart(input: BirthChartInput) {
  const dateMatch = input.birth_date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) throw new Error("INVALID_BIRTH_DATE");
  const [, yearText, monthText, dayText] = dateMatch;
  const time = parseBirthTime(input.birth_time);
  const solar = Solar.fromYmdHms(
    Number(yearText),
    Number(monthText),
    Number(dayText),
    time.hour,
    time.minute,
    time.second,
  );
  const eightChar = solar.getLunar().getEightChar();
  const pillarSources = [
    {
      key: "year",
      label: "年柱",
      ganZhi: eightChar.getYear(),
      stem: eightChar.getYearGan(),
      branch: eightChar.getYearZhi(),
      hiddenStems: eightChar.getYearHideGan(),
      stemTenGod: eightChar.getYearShiShenGan(),
      branchTenGods: eightChar.getYearShiShenZhi(),
    },
    {
      key: "month",
      label: "月柱",
      ganZhi: eightChar.getMonth(),
      stem: eightChar.getMonthGan(),
      branch: eightChar.getMonthZhi(),
      hiddenStems: eightChar.getMonthHideGan(),
      stemTenGod: eightChar.getMonthShiShenGan(),
      branchTenGods: eightChar.getMonthShiShenZhi(),
    },
    {
      key: "day",
      label: "日柱",
      ganZhi: eightChar.getDay(),
      stem: eightChar.getDayGan(),
      branch: eightChar.getDayZhi(),
      hiddenStems: eightChar.getDayHideGan(),
      stemTenGod: eightChar.getDayShiShenGan(),
      branchTenGods: eightChar.getDayShiShenZhi(),
    },
    {
      key: "time",
      label: "時柱",
      ganZhi: eightChar.getTime(),
      stem: eightChar.getTimeGan(),
      branch: eightChar.getTimeZhi(),
      hiddenStems: eightChar.getTimeHideGan(),
      stemTenGod: eightChar.getTimeShiShenGan(),
      branchTenGods: eightChar.getTimeShiShenZhi(),
    },
  ];

  const includedPillars = time.known ? pillarSources : pillarSources.filter((item) => item.key !== "time");
  const pillars = Object.fromEntries(pillarSources.map((item) => [item.key, {
    label: item.label,
    gan_zhi: item.ganZhi,
    stem: item.stem,
    branch: item.branch,
    stem_ten_god: normalizeTenGod(item.stemTenGod),
    hidden_stems: item.hiddenStems,
    branch_ten_gods: item.branchTenGods.map(normalizeTenGod),
    included_in_quadrants: item.key !== "time" || time.known,
  }]));
  const heavenly = uniqueTenGods(includedPillars
    .map((item) => item.stemTenGod)
    .filter((item) => item !== "日主"));
  const earthly = uniqueTenGods(includedPillars.flatMap((item) => item.branchTenGods));
  const heavenlySet = new Set(heavenly);
  const earthlySet = new Set(earthly);

  return {
    day_stem: eightChar.getDayGan(),
    day_element: STEM_ELEMENTS[eightChar.getDayGan()] || "",
    pillars,
    heavenly_stem_ten_gods: heavenly,
    earthly_branch_ten_gods: earthly,
    ten_god_quadrants: {
      current: TEN_GODS.filter((item) => heavenlySet.has(item) && earthlySet.has(item)),
      external: TEN_GODS.filter((item) => !heavenlySet.has(item) && earthlySet.has(item)),
      hidden: TEN_GODS.filter((item) => heavenlySet.has(item) && !earthlySet.has(item)),
      unknown: TEN_GODS.filter((item) => !heavenlySet.has(item) && !earthlySet.has(item)),
    },
    precision: time.known && input.birth_time_confidence === "exact" ? "standard_time" : "initial",
    birth_time_included: time.known,
    requires_true_solar_time_verification: true,
    calculator_version: "lunar-typescript-1.8.6-standard-time-1.0",
  };
}
