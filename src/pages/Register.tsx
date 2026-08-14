import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFestival } from '@/context/FestivalContext'
import { fetchAvailability, submitRegistration } from '@/lib/queries'
import { payForRegistration } from '@/lib/razorpay'
import { friendlyError } from '@/lib/supabase'
import {
  accent,
  cn,
  formatLongDate,
  formatMoney,
  isValidEmail,
  isValidPhone,
} from '@/lib/utils'
import type {
  EntryDraft,
  PaymentMethod,
  SelectionAvailability,
  Track,
} from '@/lib/types'
import { PageHeader } from '@/components/site/PageHeader'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select } from '@/components/ui/Form'
import { LoadingBlock } from '@/components/ui/Primitives'
import { SlotMeter } from '@/components/site/SlotMeter'
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
  QrIcon,
  TrackIcon,
} from '@/components/Icons'

const STEPS = ['Student', 'Contact', 'Competitions', 'Your song', 'Payment'] as const

interface EntryState {
  trackId: string
  selectionItemId: string | null
}

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { settings, tracks, loading } = useFestival()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [payStage, setPayStage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ---- form state --------------------------------------------------------
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [consent, setConsent] = useState(false)
  const [entries, setEntries] = useState<EntryState[]>([])
  const [method, setMethod] = useState<PaymentMethod>('upi_manual')

  const fee = settings?.registration.fee ?? 99
  const regOpen = settings?.registration.open ?? false
  const event = settings?.event
  const payment = settings?.payment
  const methods = payment?.methods

  // Pre-select when arriving from a competition page.
  useEffect(() => {
    const slug = params.get('competition')
    if (!slug || entries.length > 0 || tracks.length === 0) return
    const t = tracks.find((x) => x.slug === slug)
    if (t) setEntries([{ trackId: t.id, selectionItemId: null }])
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  // Drop entries the chosen class is not eligible for.
  useEffect(() => {
    const n = classLevel ? Number(classLevel) : null
    if (!n) return
    setEntries((prev) =>
      prev.filter((e) => {
        const t = tracks.find((x) => x.id === e.trackId)
        if (!t) return false
        return n >= (t.min_class ?? 1) && n <= (t.max_class ?? 10)
      }),
    )
  }, [classLevel, tracks])

  const selectedTracks = useMemo(
    () =>
      entries
        .map((e) => tracks.find((t) => t.id === e.trackId))
        .filter((t): t is Track => Boolean(t)),
    [entries, tracks],
  )

  const songTracks = selectedTracks.filter((t) => t.requires_selection)
  const needsSong = songTracks.length > 0
  const hasOnsite = selectedTracks.some((t) => t.mode === 'onsite')

  /**
   * Keep the chosen method legal as the student changes their competitions or
   * as organisers switch methods on and off. Paying at the venue only makes
   * sense with at least one competition held there.
   */
  useEffect(() => {
    if (!methods) return
    const allowed: PaymentMethod[] = []
    if (methods.upi_manual) allowed.push('upi_manual')
    if (methods.razorpay) allowed.push('razorpay')
    if (methods.pay_at_venue && hasOnsite) allowed.push('pay_at_venue')

    if (allowed.length > 0 && !allowed.includes(method)) setMethod(allowed[0])
  }, [methods, hasOnsite, method])

  // ---- song availability -------------------------------------------------
  const [availability, setAvailability] = useState<SelectionAvailability[]>([])
  const [availLoading, setAvailLoading] = useState(false)

  useEffect(() => {
    if (step !== 3 || songTracks.length === 0) return
    let active = true
    setAvailLoading(true)
    Promise.all(songTracks.map((t) => fetchAvailability(t.id)))
      .then((lists) => {
        if (active) setAvailability(lists.flat())
      })
      .catch(() => {
        /* the database is the real gate; a stale list is not fatal */
      })
      .finally(() => {
        if (active) setAvailLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, songTracks.length])

  if (loading) return <LoadingBlock label="Opening the registration desk…" />

  if (!regOpen) {
    return (
      <>
        <PageHeader
          eyebrow="Registration"
          title="Registration is closed right now"
          subtitle="Get in touch and we will let you know the moment it opens."
        />
        <div className="mx-auto max-w-md px-4 pb-24 text-center">
          <Button onClick={() => navigate('/contact')} size="lg" variant="outline">
            Contact the organisers
          </Button>
        </div>
      </>
    )
  }

  /* ---------------------------------------------------------- validation */

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {}

    if (s === 0) {
      if (!fullName.trim()) e.fullName = 'Please enter the student’s full name.'
      else if (fullName.trim().length < 3) e.fullName = 'That name looks too short.'
      if (!dob) e.dob = 'Date of birth is required.'
      else {
        const d = new Date(dob)
        const age = (Date.now() - d.getTime()) / 31_557_600_000
        if (Number.isNaN(d.getTime())) e.dob = 'That date does not look right.'
        else if (age < 3 || age > 25) e.dob = 'Please check the year — that age looks unlikely.'
      }
      if (!gender) e.gender = 'Please select a gender.'
      if (!classLevel) e.classLevel = 'Please choose a class.'
      if (!schoolName.trim()) e.schoolName = 'Please enter your school name.'
      else if (schoolName.trim().length < 2) e.schoolName = 'Please write the full school name.'
    }

    if (s === 1) {
      if (!guardianName.trim()) e.guardianName = 'Please enter a parent or guardian’s name.'
      if (!guardianPhone.trim()) e.guardianPhone = 'A contact number is required.'
      else if (!isValidPhone(guardianPhone)) e.guardianPhone = 'That does not look like a valid number.'
      if (studentPhone && !isValidPhone(studentPhone))
        e.studentPhone = 'That does not look like a valid number.'
      if (email && !isValidEmail(email)) e.email = 'That email address looks incomplete.'
      if (whatsapp && !isValidPhone(whatsapp)) e.whatsapp = 'That does not look like a valid number.'
      if (!email.trim() && !whatsapp.trim())
        e.reach = 'Please give us an email address or a WhatsApp number — we send certificates there.'
    }

    if (s === 2 && entries.length === 0) {
      e.entries = 'Choose at least one competition.'
    }

    if (s === 3) {
      for (const t of songTracks) {
        const entry = entries.find((x) => x.trackId === t.id)
        if (!entry?.selectionItemId) {
          e[`sel-${t.id}`] = `Please choose a ${t.selection_label?.toLowerCase()} for ${t.name}.`
        }
      }
    }

    if (s === 4 && !consent) {
      e.consent = 'Please confirm the details are correct to continue.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const visibleSteps = needsSong ? STEPS : STEPS.filter((_, i) => i !== 3)
  const barIndex = needsSong ? step : step > 3 ? 3 : step

  function goNext() {
    if (!validateStep(step)) return
    setFormError(null)
    setStep(Math.min(step === 2 && !needsSong ? 4 : step + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setStep(Math.max(step === 4 && !needsSong ? 2 : step - 1, 0))
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* -------------------------------------------------------------- submit */

  async function onSubmit() {
    if (!validateStep(4)) return
    setSubmitting(true)
    setFormError(null)

    const draft = {
      full_name: fullName.trim(),
      date_of_birth: dob,
      gender,
      class_level: Number(classLevel),
      school_name: schoolName.trim(),
      guardian_name: guardianName.trim(),
      guardian_phone: guardianPhone.trim(),
      student_phone: studentPhone.trim() || null,
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
      address: address.trim() || null,
      payment_method: method,
      consent_media: consent,
      entries: entries.map<EntryDraft>((e) => {
        const t = tracks.find((x) => x.id === e.trackId)
        return {
          track_id: e.trackId,
          selection_item_id: t?.requires_selection ? e.selectionItemId : null,
        }
      }),
    }

    let result
    try {
      result = await submitRegistration(draft)
    } catch (err) {
      const message = friendlyError(err)
      setFormError(message)
      // A song filling up mid-flow is the one error worth rewinding for.
      if (/taken by the maximum|no longer available|choose another/i.test(message) && needsSong) {
        setStep(3)
        Promise.all(songTracks.map((t) => fetchAvailability(t.id)))
          .then((lists) => setAvailability(lists.flat()))
          .catch(() => {})
      }
      setSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Registration is saved. Only Razorpay needs a gateway round trip from
    // here — UPI and pay-at-venue both settle on the next screen or on the day.
    if (method === 'pay_at_venue' || method === 'upi_manual') {
      setSubmitting(false)
      navigate('/register/success', {
        state: {
          regCode: result.reg_code,
          fullName: result.full_name,
          entries: selectedTracks.map((t) => t.name),
          paid: false,
          method,
          fee: result.fee_amount,
          registrationId: result.registration_id,
          holdExpiresAt: result.hold_expires_at,
        },
        replace: true,
      })
      return
    }

    // Online payment. If anything goes wrong from here the registration still
    // exists — the student can finish paying from the status page.
    try {
      const outcome = await payForRegistration(result.registration_id, {
        onProgress: (stage) =>
          setPayStage(
            stage === 'creating'
              ? 'Starting a secure payment…'
              : stage === 'opening'
                ? 'Opening the payment window…'
                : 'Confirming your payment…',
          ),
      })

      if (outcome.status === 'dismissed') {
        setPayStage(null)
        setSubmitting(false)
        setFormError(
          `Your place is saved as ${result.reg_code}, but the ${formatMoney(fee)} fee has not been paid yet. You can pay any time from the “Check status” page.`,
        )
        navigate('/register/success', {
          state: {
            regCode: result.reg_code,
            fullName: result.full_name,
            entries: selectedTracks.map((t) => t.name),
            paid: false,
            method,
            fee: result.fee_amount,
            registrationId: result.registration_id,
          },
          replace: true,
        })
        return
      }

      navigate('/register/success', {
        state: {
          regCode: result.reg_code,
          fullName: result.full_name,
          entries: selectedTracks.map((t) => t.name),
          paid: true,
          method,
          fee: result.fee_amount,
        },
        replace: true,
      })
    } catch (err) {
      setPayStage(null)
      setSubmitting(false)
      navigate('/register/success', {
        state: {
          regCode: result.reg_code,
          fullName: result.full_name,
          entries: selectedTracks.map((t) => t.name),
          paid: false,
          method,
          fee: result.fee_amount,
          registrationId: result.registration_id,
          paymentError: friendlyError(err),
        },
        replace: true,
      })
    }
  }

  /* ---------------------------------------------------------------- view */

  return (
    <>
      <PageHeader
        eyebrow="Registration"
        title={
          <>
            Let's get you <span className="text-gradient-festival">on that stage</span>
          </>
        }
        subtitle={`About two minutes, and ${formatMoney(fee)} for as many competitions as you like.`}
      />

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* stepper */}
        <ol className="mb-8 flex items-center gap-1.5 sm:gap-2">
          {visibleSteps.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col gap-2">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-300',
                  i < barIndex
                    ? 'bg-marigold-500'
                    : i === barIndex
                      ? 'bg-marigold-400'
                      : 'bg-night-950/10',
                )}
              />
              <span
                className={cn(
                  'hidden text-[11px] font-bold uppercase tracking-wide sm:block',
                  i === barIndex
                    ? 'text-marigold-700'
                    : i < barIndex
                      ? 'text-night-950/55'
                      : 'text-night-950/30',
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        {formError ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 px-5 py-4">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
              <CloseIcon className="size-3" strokeWidth={3} />
            </span>
            <p className="text-sm font-medium leading-relaxed text-rose-900">{formError}</p>
          </div>
        ) : null}

        <div className="rounded-4xl border border-night-950/8 bg-white p-5 stack-shadow sm:p-8">
          {/* ------------------------------------------------ step 0 */}
          {step === 0 ? (
            <div className="space-y-5">
              <StepTitle n={1} title="About the student" hint="As it should appear on the certificate." />

              <Input
                label="Full name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                placeholder="Aarav Sharma"
                autoComplete="name"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Date of birth"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  error={errors.dob}
                />
                <Select
                  label="Gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  error={errors.gender}
                >
                  <option value="">Select…</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <Select
                label="Class"
                required
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                error={errors.classLevel}
              >
                <option value="">Select class…</option>
                {Array.from({ length: 10 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Class {i + 1}
                  </option>
                ))}
              </Select>

              <Input
                label="School name"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                error={errors.schoolName}
                placeholder="e.g. Don Bosco School, Panbazar"
                hint="Write it out in full."
              />
            </div>
          ) : null}

          {/* ------------------------------------------------ step 1 */}
          {step === 1 ? (
            <div className="space-y-5">
              <StepTitle
                n={2}
                title="How we reach you"
                hint="For the competition link, results, and your certificate."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Parent / guardian name"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  error={errors.guardianName}
                  placeholder="Full name"
                />
                <Input
                  label="Guardian phone"
                  required
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  error={errors.guardianPhone}
                  placeholder="98640 00000"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <div
                className={cn(
                  'rounded-2xl border-2 p-4 transition-colors',
                  errors.reach ? 'border-rose-300 bg-rose-50' : 'border-peacock-200 bg-peacock-50/60',
                )}
              >
                <p className="text-sm font-bold text-night-950">
                  At least one of these is required
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-night-950/65">
                  If you do not collect your certificate at the temple on{' '}
                  {event?.onsite_date ? formatLongDate(event.onsite_date) : '30 August'}, we will
                  send a digital copy here.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                  <Input
                    label="WhatsApp number"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    error={errors.whatsapp}
                    placeholder="98640 00000"
                    inputMode="tel"
                  />
                </div>

                {errors.reach ? (
                  <p className="mt-3 text-[13px] font-semibold text-rose-700">{errors.reach}</p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Student phone"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  error={errors.studentPhone}
                  placeholder="Optional"
                  inputMode="tel"
                />
                <Input
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------ step 2 */}
          {step === 2 ? (
            <div className="space-y-5">
              <StepTitle
                n={3}
                title="Choose your competitions"
                hint={`Pick as many as you like — the ${formatMoney(fee)} fee covers all of them.`}
              />

              {errors.entries ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                  {errors.entries}
                </p>
              ) : null}

              <div className="flex items-center justify-between rounded-2xl bg-night-950/4 px-5 py-3">
                <span className="text-sm font-semibold text-night-950/60">Selected</span>
                <span className="font-display text-lg font-black text-night-950">
                  {entries.length} of {tracks.length}
                </span>
              </div>

              <div className="grid gap-3">
                {tracks.map((t) => {
                  const chosen = entries.some((e) => e.trackId === t.id)
                  const n = classLevel ? Number(classLevel) : null
                  // Fail open: if a competition has no class range recorded,
                  // treat it as open to everyone rather than disabling it. The
                  // database re-checks on submit, so this cannot let a bad
                  // entry through — it just avoids locking the whole form.
                  const min = t.min_class ?? 1
                  const max = t.max_class ?? 10
                  const eligible = n ? n >= min && n <= max : true
                  const a = accent(t.accent)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!eligible}
                      onClick={() =>
                        setEntries((prev) =>
                          chosen
                            ? prev.filter((e) => e.trackId !== t.id)
                            : [...prev, { trackId: t.id, selectionItemId: null }],
                        )
                      }
                      className={cn(
                        'flex items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition sm:p-4',
                        chosen
                          ? 'border-marigold-400 bg-marigold-50'
                          : 'border-night-950/10 bg-white hover:border-marigold-300',
                        !eligible && 'cursor-not-allowed opacity-45',
                      )}
                    >
                      <span
                        className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', a.solid)}
                      >
                        <TrackIcon name={t.icon} className="size-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-night-950">{t.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-night-950/55">
                          <span
                            className={cn(
                              'font-bold',
                              t.mode === 'online' ? 'text-peacock-700' : 'text-marigold-700',
                            )}
                          >
                            {t.mode === 'online' ? 'Online' : 'At the temple'}
                          </span>
                          {t.event_date ? <span>· {formatLongDate(t.event_date)}</span> : null}
                        </span>
                      </span>

                      <span
                        className={cn(
                          'grid size-7 shrink-0 place-items-center rounded-full border-2 transition',
                          chosen
                            ? 'border-marigold-500 bg-marigold-500 text-white'
                            : 'border-night-950/20 text-transparent',
                        )}
                      >
                        <CheckIcon className="size-4" strokeWidth={3} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* ------------------------------------------------ step 3 */}
          {step === 3 ? (
            <div className="space-y-6">
              {/*
                Only competitions flagged `requires_selection` reach this step,
                which today means Devotional Bhajan alone. The step is skipped
                entirely when none is selected. It still loops rather than
                hard-coding bhajan, so switching the flag on for another
                competition needs no code change — but each list is labelled,
                so it can never be unclear which competition is being answered.
              */}
              <StepTitle
                n={4}
                title={
                  songTracks.length === 1
                    ? `Choose your ${songTracks[0].selection_label?.toLowerCase() ?? 'option'}`
                    : 'Your choices'
                }
                hint={songTracks.length === 1 ? (songTracks[0].selection_help ?? undefined) : undefined}
              />

              {availLoading && availability.length === 0 ? (
                <LoadingBlock label="Checking what is still available…" />
              ) : (
                songTracks.map((t) => {
                  const entry = entries.find((e) => e.trackId === t.id)
                  const opts = availability.filter((i) => i.track_id === t.id)
                  const a = accent(t.accent)
                  return (
                    <div key={t.id}>
                      {songTracks.length > 1 ? (
                        <div className="mb-3 flex items-center gap-2.5">
                          <span className={cn('grid size-8 place-items-center rounded-xl', a.solid)}>
                            <TrackIcon name={t.icon} className="size-4" />
                          </span>
                          <h3 className="font-bold text-night-950">{t.name}</h3>
                        </div>
                      ) : null}

                      {errors[`sel-${t.id}`] ? (
                        <p className="mb-3 text-[13px] font-semibold text-rose-600">
                          {errors[`sel-${t.id}`]}
                        </p>
                      ) : null}

                      <div className="grid max-h-[26rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                        {opts.map((o) => {
                          const picked = entry?.selectionItemId === o.id
                          return (
                            <button
                              key={o.id}
                              type="button"
                              disabled={o.is_full && !picked}
                              onClick={() =>
                                setEntries((prev) =>
                                  prev.map((e) =>
                                    e.trackId === t.id
                                      ? { ...e, selectionItemId: picked ? null : o.id }
                                      : e,
                                  ),
                                )
                              }
                              className={cn(
                                'flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition',
                                picked
                                  ? 'border-marigold-500 bg-marigold-50'
                                  : o.is_full
                                    ? 'cursor-not-allowed border-night-950/8 bg-night-950/[0.03] opacity-60'
                                    : 'border-night-950/10 bg-white hover:border-marigold-300',
                              )}
                            >
                              <span className="min-w-0">
                                <span
                                  className={cn(
                                    'block truncate text-sm font-bold',
                                    o.is_full && !picked
                                      ? 'text-night-950/45 line-through'
                                      : 'text-night-950',
                                  )}
                                >
                                  {o.title}
                                </span>
                                {o.subtitle ? (
                                  <span className="block truncate text-[12px] italic text-night-950/50">
                                    {o.subtitle}
                                  </span>
                                ) : null}
                                <SlotMeter item={o} className="mt-1.5" />
                              </span>
                              {picked ? (
                                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-marigold-500 text-white">
                                  <CheckIcon className="size-3.5" strokeWidth={3} />
                                </span>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : null}

          {/* ------------------------------------------------ step 4 */}
          {step === 4 ? (
            <div className="space-y-6">
              <StepTitle n={5} title="Check and pay" hint="One last look before we save it." />

              <dl className="grid gap-x-6 gap-y-4 rounded-3xl bg-cream-100/70 p-5 sm:grid-cols-2">
                <Row label="Student" value={fullName} />
                <Row label="Class" value={`Class ${classLevel}`} />
                <Row label="School" value={schoolName} />
                <Row label="Guardian" value={`${guardianName} · ${guardianPhone}`} />
                {email ? <Row label="Email" value={email} /> : null}
                {whatsapp ? <Row label="WhatsApp" value={whatsapp} /> : null}
              </dl>

              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                  Competitions
                </h3>
                <ul className="space-y-2">
                  {selectedTracks.map((t) => {
                    const entry = entries.find((e) => e.trackId === t.id)
                    const pick = availability.find((i) => i.id === entry?.selectionItemId)
                    const a = accent(t.accent)
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 rounded-2xl border border-night-950/8 bg-white px-4 py-3"
                      >
                        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', a.solid)}>
                          <TrackIcon name={t.icon} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-night-950">{t.name}</span>
                          <span className="block truncate text-[12px] text-night-950/55">
                            {pick ? `${pick.title} · ` : ''}
                            {t.mode === 'online' ? 'Online' : 'At the temple'}
                            {t.event_date ? ` · ${formatLongDate(t.event_date)}` : ''}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* ---- payment ---- */}
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                  Payment
                </h3>

                <div className="mb-3 flex items-center justify-between rounded-2xl bg-night px-5 py-4 text-cream-50">
                  <span className="text-sm font-semibold text-cream-100/75">
                    Registration fee
                  </span>
                  <span className="font-display text-2xl font-black">{formatMoney(fee)}</span>
                </div>

                <div className="grid gap-2.5">
                  {methods?.upi_manual ? (
                    <PayOption
                      active={method === 'upi_manual'}
                      onClick={() => setMethod('upi_manual')}
                      title="Pay by UPI"
                      body="Scan a QR or tap through to GPay, PhonePe or Paytm on the next screen, then enter the reference number so we can match your payment."
                      icon={<QrIcon className="size-5" />}
                    />
                  ) : null}

                  {methods?.razorpay ? (
                    <PayOption
                      active={method === 'razorpay'}
                      onClick={() => setMethod('razorpay')}
                      title="Pay by card or net banking"
                      body="Secure payment through Razorpay. Your place is confirmed straight away."
                      icon={<LockIcon className="size-5" />}
                    />
                  ) : null}

                  {methods?.pay_at_venue ? (
                    <PayOption
                      active={method === 'pay_at_venue'}
                      onClick={() => hasOnsite && setMethod('pay_at_venue')}
                      disabled={!hasOnsite}
                      title="Pay at the temple on the day"
                      body={
                        hasOnsite
                          ? `Bring ${formatMoney(fee)} in cash to ${event?.venue ?? 'the temple'} on ${
                              event?.onsite_date ? formatLongDate(event.onsite_date) : '30 August'
                            }.`
                          : 'Only available if you have entered at least one competition held at the temple. Your competitions are all online.'
                      }
                      icon={<CalendarIcon className="size-5" />}
                    />
                  ) : null}
                </div>

                {!hasOnsite ? (
                  <p className="mt-3 rounded-2xl border border-peacock-200 bg-peacock-50 px-4 py-3 text-[13px] leading-relaxed text-peacock-900">
                    Your competitions are all online, so the fee needs to be paid online. You are
                    still very welcome to come to the temple on{' '}
                    {event?.onsite_date ? formatLongDate(event.onsite_date) : '30 August'} to collect
                    your certificate and prasadam.
                  </p>
                ) : null}
              </div>

              <Checkbox
                checked={consent}
                onChange={setConsent}
                label="I confirm these details are correct"
                description="I also allow photographs and video from the festival, which may include the participant, to be used by the organisers for the festival's own publicity."
              />
              {errors.consent ? (
                <p className="-mt-3 text-[13px] font-semibold text-rose-600">{errors.consent}</p>
              ) : null}
            </div>
          ) : null}

          {/* nav */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-night-950/8 pt-6">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className={cn(step === 0 && 'invisible')}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={goNext} size="lg" iconRight={<ArrowRightIcon className="size-5" />}>
                Continue
              </Button>
            ) : (
              <Button onClick={onSubmit} size="lg" loading={submitting}>
                {payStage ??
                  (method === 'razorpay'
                    ? `Pay ${formatMoney(fee)} & register`
                    : method === 'upi_manual'
                      ? 'Register & pay by UPI'
                      : 'Complete registration')}
              </Button>
            )}
          </div>
        </div>

        {step === 4 ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[13px] text-night-950/45">
            <LockIcon className="size-3.5" />
            {method === 'razorpay'
              ? 'Card and net banking details are handled by Razorpay. We never see them.'
              : 'You pay directly to the temple’s own UPI account. We never see your bank details.'}
          </p>
        ) : null}
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ bits */

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-600">Step {n}</p>
      <h2 className="mt-1 text-2xl font-black text-night-950">{title}</h2>
      {hint ? <p className="mt-1.5 text-[15px] text-night-950/60">{hint}</p> : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-night-950/45">{label}</dt>
      <dd className="mt-0.5 font-semibold text-night-950">{value || '—'}</dd>
    </div>
  )
}

function PayOption({
  active,
  onClick,
  title,
  body,
  icon,
  disabled,
}: {
  active: boolean
  onClick: () => void
  title: string
  body: string
  icon: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition',
        active
          ? 'border-marigold-500 bg-marigold-50'
          : 'border-night-950/10 bg-white hover:border-marigold-300',
        disabled && 'cursor-not-allowed opacity-45 hover:border-night-950/10',
      )}
    >
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          active ? 'bg-marigold-500 text-white' : 'bg-night-950/6 text-night-950/50',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-night-950">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-night-950/60">{body}</span>
      </span>
      <span
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition',
          active ? 'border-marigold-500 bg-marigold-500 text-white' : 'border-night-950/20 text-transparent',
        )}
      >
        <CheckIcon className="size-3" strokeWidth={3.5} />
      </span>
    </button>
  )
}
