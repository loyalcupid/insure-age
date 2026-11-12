/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  parseBirthString,
  calculateInsurance,
  CalculationResult,
} from './utils/insuranceCalculator';
import {
  Calendar,
  Copy,
  Check,
  RotateCcw,
  Info,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Smartphone,
  ExternalLink,
  Cake,
} from 'lucide-react';

const downloadApps = [
  {
    title: '뱅크다이어리 앱 다운로드',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.appg.bankdiary.client&hl=ko',
    iphoneUrl: 'https://apps.apple.com/kr/app/%EB%B1%85%ED%81%AC%EB%8B%A4%EC%9D%B4%EC%96%B4%EB%A6%AC-%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%95%9C-%EB%B3%B4%ED%97%98%EA%B4%80%EB%A6%AC-%EB%B3%B4%ED%97%98%EC%B2%AD%EA%B5%AC/id1543640471',
  },
  {
    title: '전문가용 앱 다운로드',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.appg.bankdiary.expert',
    iphoneUrl: 'https://apps.apple.com/kr/app/%EB%B1%85%ED%81%AC%EB%8B%A4%EC%9D%B4%EC%96%B4%EB%A6%AC-%EB%B3%B4%ED%97%98-%EC%A0%84%EB%AC%B8%EA%B0%80%EC%9A%A9/id1543640453',
  },
];

export default function App() {
  // 현재 기준일 (한국 시간 기준)
  const defaultRefDate = useMemo(() => {
    // 2026년 11월 12일 기준
    const now = new Date();
    // KST 기준으로 보정
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstOffset = 9 * 60 * 60000;
    const kstDate = new Date(utc + kstOffset);
    return kstDate;
  }, []);

  const [inputVal, setInputVal] = useState<string>('');
  const [refDate, setRefDate] = useState<Date>(defaultRefDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showFaq, setShowFaq] = useState<boolean>(false);

  // 기준일 포맷 (YYYY.MM.DD)
  const refFormatted = useMemo(() => {
    const y = refDate.getFullYear();
    const m = String(refDate.getMonth() + 1).padStart(2, '0');
    const d = String(refDate.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  }, [refDate]);

  // 오늘인지 여부
  const isToday = useMemo(() => {
    return (
      refDate.getFullYear() === defaultRefDate.getFullYear() &&
      refDate.getMonth() === defaultRefDate.getMonth() &&
      refDate.getDate() === defaultRefDate.getDate()
    );
  }, [refDate, defaultRefDate]);

  // 입력값 숫자만 필터링 (최대 8자리)
  const rawDigits = inputVal.replace(/\D/g, '').slice(0, 8);

  // 생년월일 파싱 및 계산
  const calculation: CalculationResult | null = useMemo(() => {
    if (rawDigits.length !== 8) {
      return null;
    }
    const parseRes = parseBirthString(rawDigits);
    if (!parseRes.date) {
      return null;
    }
    return calculateInsurance(parseRes.date, refDate);
  }, [rawDigits, refDate]);

  // 유효하지 않은 날짜 에러 메시지
  const validationError = useMemo(() => {
    if (rawDigits.length === 8) {
      const parseRes = parseBirthString(rawDigits);
      if (parseRes.error) return parseRes.error;
    }
    if (calculation && !calculation.isValid) {
      return calculation.errorMessage;
    }
    return null;
  }, [rawDigits, calculation]);

  // 빠른 예시 입력
  const handleQuickInput = (sample: string) => {
    setInputVal(sample);
  };

  // 초기화
  const handleReset = () => {
    setInputVal('');
    setRefDate(defaultRefDate);
  };

  // 날짜 직접 변경 핸들러
  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split('-').map(Number);
      const newD = new Date(year, month - 1, day);
      setRefDate(newD);
    }
  };

  // 기준일 변경 프리셋 (+n개월)
  const handleAddMonths = (months: number) => {
    const nextDate = new Date(defaultRefDate);
    nextDate.setMonth(nextDate.getMonth() + months);
    setRefDate(nextDate);
    setIsDatePickerOpen(false);
  };

  // 결과 복사 기능
  const handleCopyResult = () => {
    if (!calculation || !calculation.isValid) return;
    const text = `[보험나이 계산 결과]
• 생년월일: ${calculation.birthDate?.formatted}
• 기준일: ${refFormatted}${isToday ? ' (오늘)' : ''}
• 보험나이: ${calculation.insuranceAge}세
• 상령일: ${calculation.nextSangryeongDate} (D-${calculation.sangryeongDDay})
• 만 나이: 만 ${calculation.internationalAge}세 (${calculation.ageMonthsElapsed}개월)
• 띠: ${calculation.zodiac?.animal} (${calculation.zodiac?.ganji})
※ 출처: 보험나이 계산기`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="app-shell min-h-screen text-slate-800 flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6">
      <main className="w-full max-w-[520px] mx-auto">
        {/* 보험나이 계산기 제목 위: 앱 다운로드 탭 */}
        <div className="download-panel mb-8 overflow-hidden rounded-2xl border border-white bg-white/80 p-1.5">
          {downloadApps.map((app) => (
            <div key={app.title} className="download-row rounded-xl p-2.5 flex flex-col min-[520px]:flex-row items-stretch min-[520px]:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{app.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={app.androidUrl}
                  aria-label={`${app.title} - 안드로이드용`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] whitespace-nowrap font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 transition-colors group cursor-pointer"
                  title="안드로이드용 Google Play 다운로드"
                >
                  {/* Android Icon SVG */}
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.5516 0 .9997.4482.9997.9997s-.4481 1.0001-.9997 1.0001m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0001s.4482-.9997.9993-.9997c.5516 0 .9997.4482.9997.9997s-.4481 1.0001-.9997 1.0001m11.4045-6.02l1.9967-3.4583a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.411 13.8562 8.125 12 8.125c-1.8562 0-3.5902.286-5.1362.8256L4.8415 5.4476a.416.416 0 0 0-.5676-.1521.416.416 0 0 0-.1521.5676l1.9967 3.4583C2.6889 11.1867.3432 14.6589 0 18.75h24c-.3432-4.0911-2.6889-7.5633-6.1185-9.4286" />
                  </svg>
                  <span>안드로이드용</span>
                  <ExternalLink className="hidden min-[380px]:block w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-700" />
                </a>

                <a
                  href={app.iphoneUrl}
                  aria-label={`${app.title} - 아이폰용`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] whitespace-nowrap font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 transition-colors group cursor-pointer"
                  title="아이폰용 App Store 다운로드"
                >
                  {/* Apple Icon SVG */}
                  <svg className="w-3.5 h-3.5 text-slate-800 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.18c.63-.78 1.06-1.87.94-2.96-.92.04-2.07.62-2.73 1.4-.58.67-1.09 1.77-.96 2.84 1.03.08 2.11-.53 2.75-1.28" />
                  </svg>
                  <span>아이폰용</span>
                  <ExternalLink className="hidden min-[380px]:block w-2.5 h-2.5 text-slate-400 group-hover:text-slate-800" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 상단 타이틀 */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="title-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#124F46] text-white" aria-hidden="true">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.7} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-teal-700">BANK DIARY</p>
              <h1 className="text-[24px] sm:text-[27px] leading-tight font-bold text-[#173F38] tracking-tight">
                보험나이 계산기
              </h1>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500">생년월일 하나로 보험나이와 상령일을 한눈에.</p>
        </header>

        {/* 첫 번째 카드: 입력 카드 */}
        <section className="surface-card rounded-3xl p-5 sm:p-6" aria-label="생년월일 및 기준일 입력">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[11px] font-semibold text-teal-800"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-50 text-[10px]">01</span> 생년월일 입력</span>
            {/* 부가 유틸 버튼 (예시 채우기 / 초기화) */}
            <div className="flex items-center gap-1.5 text-xs">
              {inputVal ? (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
                  title="입력 내용 지우기"
                >
                  <RotateCcw className="w-3 h-3" />
                  지우기
                </button>
              ) : (
                <button
                  onClick={() => handleQuickInput('19900620')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-teal-700 hover:text-teal-900 bg-teal-50/80 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer font-medium"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  예시 19900620
                </button>
              )}
            </div>
          </div>
          <label
            htmlFor="birth-input"
            className="block text-slate-500 text-xs font-medium mb-2"
          >
            생년월일 8자리
          </label>

          {/* 메인 숫자 입력 인풋 */}
          <div className="relative">
            <input
              id="birth-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? 'birth-error' : 'birth-hint'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="19900620"
              className="birth-input w-full min-w-0 text-[34px] sm:text-[42px] font-semibold text-[#173F38] placeholder:text-slate-300 bg-[#F7F9F8] rounded-xl border border-slate-200/70 tracking-[0.06em] px-3 py-3 tabular-nums transition-colors"
            />
          </div>

          <p id="birth-hint" className="mt-2 text-[11px] text-slate-400">연도 4자리 · 월 2자리 · 일 2자리</p>

          {/* 오류 메시지 표시 */}
          {validationError && (
            <div id="birth-error" role="alert" className="text-xs text-rose-600 font-medium mt-2 px-0.5">
              ⚠️ {validationError}
            </div>
          )}

          {/* 두 번째 분리 라인 */}
          <div className="h-px bg-slate-100 my-5"></div>

          {/* 기준일 영역 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex items-center gap-3">
              <span className="text-slate-600 text-sm font-medium">기준일</span>
              <div>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200/80 bg-white text-slate-700 text-xs font-medium hover:bg-teal-50 transition-colors cursor-pointer"
                  aria-expanded={isDatePickerOpen}
                  title="기준일 변경하기"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {refFormatted} {isToday && '(오늘)'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* 기준일 변경 팝오버 */}
                {isDatePickerOpen && (
                  <div className="absolute left-0 top-full mt-2 z-20 w-64 max-w-[calc(100vw-72px)] bg-white rounded-2xl shadow-xl border border-slate-200 p-3 text-xs">
                    <div className="font-semibold text-slate-700 mb-2">계약 기준일 설정</div>
                    <input
                      type="date"
                      aria-label="계약 기준일"
                      value={`${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`}
                      onChange={handleCustomDateChange}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 mb-2.5 focus:outline-teal-600"
                    />
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setRefDate(defaultRefDate);
                          setIsDatePickerOpen(false);
                        }}
                        className="py-1 px-2 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                      >
                        오늘 ({refFormatted})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddMonths(1)}
                        className="py-1 px-2 rounded bg-teal-50 text-teal-800 font-medium hover:bg-teal-100 transition-colors"
                      >
                        +1개월 뒤
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 빠른 추천 생년월일 버튼들 */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
              <span className="text-slate-400">예시:</span>
              <button
                type="button"
                onClick={() => handleQuickInput('20020415')}
                className="hover:text-teal-700 underline cursor-pointer"
              >
                02년생
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleQuickInput('19851103')}
                className="hover:text-teal-700 underline cursor-pointer"
              >
                85년생
              </button>
            </div>
          </div>
        </section>

        {/* 두 번째 카드: 결과 카드 */}
        <section className="surface-card rounded-3xl overflow-hidden mt-4" aria-label="계산 결과" aria-live="polite" aria-atomic="true">
          {/* 민트 헤더 (보험나이) */}
          <div className="result-heading px-5 sm:px-6 py-6 flex items-center justify-between gap-3">
            <div>
              <span className="mb-2 block text-[10px] font-semibold tracking-[0.15em] text-teal-200/80">YOUR INSURANCE AGE</span>
              <h2 className="font-semibold text-white text-base tracking-tight">보험나이</h2>
            </div>

            {calculation && calculation.isValid && calculation.insuranceAge !== null ? (
              <div className="flex items-baseline gap-1">
                <span className="text-[44px] leading-none font-semibold tracking-tight text-white tabular-nums">
                  {calculation.insuranceAge}
                </span>
                <span className="text-base font-medium text-teal-100">세</span>
              </div>
            ) : (
              <span className="text-4xl font-light text-white/60" aria-label="생년월일 입력 대기">—</span>
            )}
          </div>

          {/* 행 리스트 */}
          <div className="divide-y divide-slate-100">
            {/* 1. 상령일 */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 mr-1 text-teal-600/70" aria-hidden="true" />
                <span className="text-slate-600 text-sm font-medium">상령일</span>
              </div>
              <div>
                {calculation && calculation.isValid && calculation.nextSangryeongDate ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-semibold text-sm sm:text-base tabular-nums">
                      {calculation.nextSangryeongDate}
                    </span>
                    {calculation.sangryeongDDay !== null && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          calculation.sangryeongDDay <= 30
                            ? 'bg-rose-100 text-rose-700'
                            : calculation.sangryeongDDay <= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100/80 text-teal-800'
                        }`}
                      >
                        D-{calculation.sangryeongDDay}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-300 font-medium text-base select-none">—</span>
                )}
              </div>
            </div>

            {/* 2. 만 나이 */}
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-slate-600 text-sm font-medium"><Cake className="h-4 w-4 text-teal-600/70" aria-hidden="true" />만 나이</span>
              <div>
                {calculation && calculation.isValid && calculation.internationalAge !== null ? (
                  <div className="text-slate-800 font-semibold text-sm sm:text-base tabular-nums">
                    <span>만 {calculation.internationalAge}세</span>
                    {calculation.ageMonthsElapsed !== null && (
                      <span className="text-xs text-slate-400 font-normal ml-1.5">
                        ({calculation.ageMonthsElapsed}개월)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-300 font-medium text-base select-none">—</span>
                )}
              </div>
            </div>

            {/* 3. 띠 */}
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-slate-600 text-sm font-medium"><Sparkles className="h-4 w-4 text-teal-600/70" aria-hidden="true" />띠</span>
              <div>
                {calculation && calculation.isValid && calculation.zodiac ? (
                  <div className="text-slate-800 font-semibold text-sm sm:text-base">
                    <span>{calculation.zodiac.animal}</span>
                    <span className="text-xs text-slate-400 font-normal ml-1.5">
                      ({calculation.zodiac.ganji})
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 font-medium text-base select-none">—</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 상령일 D-Day 알림 및 보험 팁 (계산 완료 시 표시) */}
        {calculation && calculation.isValid && (
          <div className="mt-3.5 bg-white/90 border border-teal-100 rounded-xl p-3.5 shadow-2xs text-xs text-slate-600">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    상령일 알림 (D-{calculation.sangryeongDDay})
                  </p>
                  <p className="mt-0.5 text-slate-500 leading-relaxed">
                    <strong className="text-teal-700">
                      {calculation.nextSangryeongDate}
                    </strong>
                    이 되면 보험나이가{' '}
                    <strong className="text-teal-700">
                      {(calculation.insuranceAge ?? 0) + 1}세
                    </strong>
                    로 1살 증가합니다. 상령일 이전에 가입하시면 1년 치 보험료를 절약할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyResult}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors font-medium cursor-pointer"
                title="결과 클립보드 복사"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-teal-700">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 하단 고지 문구 */}
        <div className="mt-4 flex items-start gap-2 px-1 text-[11px] text-[#71828A] leading-relaxed">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <p>
          보험나이는 만 나이의 끝수가 6개월 이상이면 1년으로 올려 계산합니다. 띠는 출생 연도 기준입니다.
          입력한 번호는 저장하거나 전송하지 않습니다.
          </p>
        </div>

        {/* 보험나이 상식 & 계산 공식 아코디언 */}
        <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/50 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            aria-expanded={showFaq}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-800 py-1 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              보험나이 및 상령일 계산 공식 알아보기
            </span>
            {showFaq ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {showFaq && (
            <div className="mt-3 bg-white rounded-xl p-4 border border-slate-200/70 text-xs text-slate-600 space-y-3 leading-relaxed animate-in fade-in">
              <div>
                <strong className="text-slate-800 block mb-0.5">Q. 보험나이란?</strong>
                생명보험 및 손해보험에서 보험료 산정이나 가입 가능 연령을 판정할 때 사용하는 나이입니다. 만 나이를 기준으로 6개월 미만 단수는 버리고, 6개월 이상 단수는 1년으로 올려 계산합니다.
              </div>

              <div>
                <strong className="text-slate-800 block mb-0.5">Q. 상령일(上齡日)이란?</strong>
                매년 생년월일의 월에 6개월을 더한 날로, 보험나이가 1살 증가하는 기준일입니다. (예: 6월 20일생의 상령일은 매년 12월 20일) 상령일 전날까지 가입해야 더 낮은 보험나이로 가입할 수 있습니다.
              </div>

              <div>
                <strong className="text-slate-800 block mb-0.5">Q. 만 나이 통일법 시행 후에도 적용되나요?</strong>
                2023년 6월 만 나이 통일법이 시행되었으나, 보험 약관의 금융감독원 표준약관에 따라 보험 계약 체결 시에는 여전히 '보험나이' 기준이 적용됩니다.
              </div>

              <div>
                <strong className="text-slate-800 block mb-0.5">Q. 띠 계산 기준은 무엇인가요?</strong>
                입력하신 출생 연도를 기준으로 12간지(십이지) 및 육십간지를 산출합니다.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="w-full max-w-[520px] mx-auto flex items-center justify-center gap-1.5 mt-8 text-[10px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> 개인정보 수집 없이, 내 브라우저에서 안전하게
      </footer>
    </div>
  );
}
