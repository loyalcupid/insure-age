/**
 * 보험나이 및 만 나이, 상령일 계산 유틸리티
 */
import { getKoreanZodiac } from './lunarNewYear';

export interface BirthDateInfo {
  year: number;
  month: number;
  day: number;
  formatted: string; // YYYY.MM.DD
}

export interface CalculationResult {
  isValid: boolean;
  errorMessage?: string;
  birthDate?: BirthDateInfo;
  referenceDate: {
    year: number;
    month: number;
    day: number;
    formatted: string;
    isToday: boolean;
  };
  insuranceAge: number | null; // 보험나이
  internationalAge: number | null; // 만 나이
  ageMonthsElapsed: number | null; // 만 나이 이후 경과 개월
  ageDaysElapsed: number | null; // 만 나이 이후 경과 일
  nextSangryeongDate: string | null; // 다음 상령일 YYYY.MM.DD
  sangryeongDDay: number | null; // D-Day (남은 일수)
  zodiac: {
    animal: string; // 예: 말띠
    ganji: string; // 예: 경오년
    description: string; // 예: 하얀 말의 해 (경오년)
  } | null;
  ageIncreaseAlert?: string;
}

/**
 * 말일 보정 포함 n개월 추가 함수
 */
export function addMonthsClamped(year: number, month: number, day: number, monthsToAdd: number): {
  year: number;
  month: number;
  day: number;
} {
  let targetYear = year + Math.floor((month - 1 + monthsToAdd) / 12);
  let targetMonth = ((month - 1 + monthsToAdd) % 12 + 12) % 12 + 1;
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, daysInTargetMonth);
  return { year: targetYear, month: targetMonth, day: targetDay };
}

/**
 * 생년월일 8자리(YYYYMMDD) 파싱
 */
export function parseBirthString(rawInput: string): { date?: BirthDateInfo; error?: string } {
  const digits = rawInput.replace(/\D/g, '');

  if (digits.length !== 8) {
    return { error: '생년월일 8자리(YYYYMMDD)를 입력해주세요.' };
  }

  const year = parseInt(digits.slice(0, 4), 10);
  const month = parseInt(digits.slice(4, 6), 10);
  const day = parseInt(digits.slice(6, 8), 10);

  if (year < 1900 || year > 2100) {
    return { error: '연도는 1900년부터 2100년 사이로 입력해주세요.' };
  }

  if (month < 1 || month > 12) {
    return { error: '월은 1월부터 12월 사이여야 합니다.' };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { error: `${month}월은 1일부터 ${daysInMonth}일까지 있습니다.` };
  }

  const mmStr = String(month).padStart(2, '0');
  const ddStr = String(day).padStart(2, '0');

  return {
    date: {
      year,
      month,
      day,
      formatted: `${year}.${mmStr}.${ddStr}`,
    },
  };
}

/**
 * 보험나이, 상령일, 만 나이, 띠 종합 계산
 */
export function calculateInsurance(
  birthDate: BirthDateInfo,
  refDate: Date
): CalculationResult {
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth() + 1;
  const refDay = refDate.getDate();

  const refFormatted = `${refYear}.${String(refMonth).padStart(2, '0')}.${String(refDay).padStart(2, '0')}`;

  const today = new Date();
  const isToday =
    today.getFullYear() === refYear &&
    today.getMonth() + 1 === refMonth &&
    today.getDate() === refDay;

  // 1. 만 나이 계산
  let intAge = refYear - birthDate.year;
  const hasHadBirthdayThisYear =
    refMonth > birthDate.month ||
    (refMonth === birthDate.month && refDay >= birthDate.day);

  if (!hasHadBirthdayThisYear) {
    intAge -= 1;
  }

  if (intAge < 0) {
    return {
      isValid: false,
      errorMessage: '기준일이 생년월일보다 이전입니다.',
      birthDate,
      referenceDate: {
        year: refYear,
        month: refMonth,
        day: refDay,
        formatted: refFormatted,
        isToday,
      },
      insuranceAge: null,
      internationalAge: null,
      ageMonthsElapsed: null,
      ageDaysElapsed: null,
      nextSangryeongDate: null,
      sangryeongDDay: null,
      zodiac: null,
    };
  }

  // 2. 만 나이 이후 경과 개월 및 일수 계산
  // 직전 생일 계산
  const lastBirthdayYear = hasHadBirthdayThisYear ? refYear : refYear - 1;
  const lastBirthdayDaysInMonth = new Date(lastBirthdayYear, birthDate.month, 0).getDate();
  const lastBirthdayDay = Math.min(birthDate.day, lastBirthdayDaysInMonth);

  // 직전 생일부터 기준일까지 경과 개월수/일수
  let elapsedMonths = (refYear - lastBirthdayYear) * 12 + (refMonth - birthDate.month);
  let elapsedDays = refDay - lastBirthdayDay;

  if (elapsedDays < 0) {
    elapsedMonths -= 1;
    // 이전 달의 일수 가져오기
    const prevMonthDays = new Date(refYear, refMonth - 1, 0).getDate();
    elapsedDays += prevMonthDays;
  }

  // 3. 보험나이 산출:
  // "만 나이의 끝수가 6개월 이상이면 1년으로 올려 계산합니다."
  // 즉 경과 개월수가 6개월 이상이면 +1
  const isHalfYearOrMore = elapsedMonths >= 6;
  const insuranceAge = isHalfYearOrMore ? intAge + 1 : intAge;

  // 4. 상령일 계산:
  // 매년 생월 + 6개월에 해당하는 날짜가 상령일입니다.
  // 기준일 이후 가장 가까운 다가오는 상령일을 구합니다.
  let nextSangryeongYear = refYear;
  let candidateSangryeong = addMonthsClamped(
    nextSangryeongYear,
    birthDate.month,
    birthDate.day,
    6
  );

  const candidateDateObj = new Date(
    candidateSangryeong.year,
    candidateSangryeong.month - 1,
    candidateSangryeong.day
  );
  const refDateObj = new Date(refYear, refMonth - 1, refDay);

  // 이미 올해의 상령일이 지났다면 다음 해의 상령일
  if (candidateDateObj <= refDateObj) {
    nextSangryeongYear += 1;
    candidateSangryeong = addMonthsClamped(
      nextSangryeongYear,
      birthDate.month,
      birthDate.day,
      6
    );
  }

  const finalNextSangryeongDateObj = new Date(
    candidateSangryeong.year,
    candidateSangryeong.month - 1,
    candidateSangryeong.day
  );

  const diffMs = finalNextSangryeongDateObj.getTime() - refDateObj.getTime();
  const sangryeongDDay = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const nextSangryeongFormatted = `${candidateSangryeong.year}.${String(
    candidateSangryeong.month
  ).padStart(2, '0')}.${String(candidateSangryeong.day).padStart(2, '0')}`;

  // 5. 띠 계산 (입력한 연도 기준)
  const zodiacResult = getKoreanZodiac(birthDate.year);

  let ageIncreaseAlert: string | undefined;
  if (sangryeongDDay <= 90) {
    ageIncreaseAlert = `${sangryeongDDay}일 뒤 상령일(${nextSangryeongFormatted})에 보험나이가 ${insuranceAge + 1}세로 1살 증가합니다.`;
  }

  return {
    isValid: true,
    birthDate,
    referenceDate: {
      year: refYear,
      month: refMonth,
      day: refDay,
      formatted: refFormatted,
      isToday,
    },
    insuranceAge,
    internationalAge: intAge,
    ageMonthsElapsed: elapsedMonths,
    ageDaysElapsed: elapsedDays,
    nextSangryeongDate: nextSangryeongFormatted,
    sangryeongDDay,
    zodiac: {
      animal: zodiacResult.zodiacName,
      ganji: zodiacResult.ganjiName,
      description: zodiacResult.description,
    },
    ageIncreaseAlert,
  };
}
