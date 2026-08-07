import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useFestival } from '@/context/FestivalContext'
import { fetchAvailability, submitRegistration } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import {
  accent,
  categoryForClass,
  cn,
  isValidEmail,
  isValidPhone,
} from '@/lib/utils'
import type {
  EntryDraft,
  SelectionAvailability,
  Track,
} from '@/lib/types'
import { PageHeader } from '@/components/site/PageHeader'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select } from '@/components/ui/Form'
import { Badge, LoadingBlock } from '@/components/ui/Primitives'
import { SlotMeter } from '@/components/site/SlotMeter'
import {
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  SparklesIcon,
  TrackIcon,
  UsersIcon,
} from '@/components/Icons'
import { Lotus } from '@/components/Decor'

const STEPS = ['Student', 'School', 'Competitions', 'Your choices', 'Review'] as const
const OTHER_SCHOOL = '__other__'

interface EntryState {
  trackId: string
  selectionItemId: string | null
  teamName: string
  members: { full_name: string; class_level: string }[]
}

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { settings, tracks, categories, tracksForCategory, schools, loading } = useFestival()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ---- form state --------------------------------------------------------
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [section, setSection] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [otherSchool, setOtherSchool] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [consent, setConsent] = useState(false)
  const [entries, setEntries] = useState<EntryState[]>([])

  const maxTracks = settings?.registration.max_tracks_per_student ?? 3
  const regOpen = settings?.registration.open ?? false

  const category = useMemo(
    () => categoryForClass(categories, classLevel ? Number(classLevel) : null),
    [categories, classLevel],
  )

  const eligibleTracks = useMemo(
    () => (category ? tracksForCategory(category.id) : []),
    [category, tracksForCategory],
  )

  // Pre-select a track when arriving from a track page (?track=slug).
  useEffect(() => {
    const slug = params.get('track')
    if (!slug || entries.length > 0) return
    const t = tracks.find((x) => x.slug === slug)
    if (t) {
      setEntries([{ trackId: t.id, selectionItemId: null, teamName: '', members: [] }])
    }
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  // Drop any entry that the chosen class is not eligible for.
  useEffect(() => {
    if (!category) return
    const allowed = new Set(eligibleTracks.map((t) => t.id))
    setEntries((prev) => prev.filter((e) => allowed.has(e.trackId)))
  }, [category, eligibleTracks])

  // ---- availability ------------------------------------------------------
  const selectedTracks = useMemo(
    () =>
      entries
        .map((e) => tracks.find((t) => t.id === e.trackId))
        .filter((t): t is Track => Boolean(t)),
    [entries, tracks],
  )

  const needsChoices = selectedTracks.some((t) => t.requires_selection || t.is_team)

  const [availability, setAvailability] = useState<SelectionAvailability[]>([])
  const [availLoading, setAvailLoading] = useState(false)

  // Refetch whenever we land on the choices step, so counts are current.
  useEffect(() => {
    if (step !== 3 || selectedTracks.length === 0) return
    let active = true
    setAvailLoading(true)
    Promise.all(
      selectedTracks.filter((t) => t.requires_selection).map((t) => fetchAvailability(t.id)),
    )
      .then((lists) => {
        if (active) setAvailability(lists.flat())
      })
      .catch(() => {
        /* the RPC is the real gate; a stale list is not fatal */
      })
      .finally(() => {
        if (active) setAvailLoading(false)
      })
    return () => {
      active = false
    }
  }, [step, selectedTracks])

  if (loading) return <LoadingBlock label="Opening the registration desk…" />

  if (!regOpen) {
    return (
      <>
        <PageHeader
          eyebrow="Registration"
          title="Registration is closed right now"
          subtitle="Follow us or get in touch and we will let you know the moment it opens for the next edition."
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
      if (!classLevel) e.classLevel = 'Please choose a class.'
    }

    if (s === 1) {
      if (!schoolId) e.schoolId = 'Please choose a school.'
      if (schoolId === OTHER_SCHOOL && !otherSchool.trim())
        e.otherSchool = 'Please type the school name.'
      if (!guardianName.trim()) e.guardianName = 'Please enter a parent or guardian’s name.'
      if (!guardianPhone.trim()) e.guardianPhone = 'A contact number is required.'
      else if (!isValidPhone(guardianPhone)) e.guardianPhone = 'That does not look like a valid number.'
      if (studentPhone && !isValidPhone(studentPhone))
        e.studentPhone = 'That does not look like a valid number.'
      if (email && !isValidEmail(email)) e.email = 'That email address looks incomplete.'
    }

    if (s === 2) {
      if (entries.length === 0) e.entries = 'Choose at least one competition.'
    }

    if (s === 3) {
      for (const entry of entries) {
        const t = tracks.find((x) => x.id === entry.trackId)
        if (!t) continue
        if (t.requires_selection && !entry.selectionItemId) {
          e[`sel-${t.id}`] = `Please choose a ${t.selection_label?.toLowerCase()} for ${t.name}.`
        }
        if (t.is_team) {
          const filled = entry.members.filter((m) => m.full_name.trim()).length + 1
          if (filled < t.min_team_size)
            e[`team-${t.id}`] = `${t.name} needs at least ${t.min_team_size} participants (including you).`
          if (filled > t.max_team_size)
            e[`team-${t.id}`] = `${t.name} allows at most ${t.max_team_size} participants.`
        }
      }
    }

    if (s === 4 && !consent) {
      e.consent = 'Please confirm the details are correct to continue.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const visibleSteps = needsChoices ? STEPS : STEPS.filter((_, i) => i !== 3)

  function goNext() {
    if (!validateStep(step)) return
    setFormError(null)
    // Skip the "choices" step when nothing needs choosing.
    const next = step === 2 && !needsChoices ? 4 : step + 1
    setStep(Math.min(next, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    const prev = step === 4 && !needsChoices ? 2 : step - 1
    setStep(Math.max(prev, 0))
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* -------------------------------------------------------------- submit */

  async function onSubmit() {
    if (!validateStep(4)) return
    setSubmitting(true)
    setFormError(null)

    const payload = {
      full_name: fullName.trim(),
      date_of_birth: dob || null,
      gender: gender || null,
      class_level: Number(classLevel),
      section: section.trim() || null,
      school_id: schoolId === OTHER_SCHOOL ? null : schoolId,
      school_name_other: schoolId === OTHER_SCHOOL ? otherSchool.trim() : null,
      guardian_name: guardianName.trim(),
      guardian_phone: guardianPhone.trim(),
      student_phone: studentPhone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      consent_media: consent,
      entries: entries.map<EntryDraft>((e) => {
        const t = tracks.find((x) => x.id === e.trackId)
        return {
          track_id: e.trackId,
          selection_item_id: t?.requires_selection ? e.selectionItemId : null,
          team_name: t?.is_team ? e.teamName.trim() || null : null,
          members: t?.is_team
            ? e.members
                .filter((m) => m.full_name.trim())
                .map((m) => ({
                  full_name: m.full_name.trim(),
                  class_level: m.class_level ? Number(m.class_level) : null,
                }))
            : undefined,
        }
      }),
    }

    try {
      const result = await submitRegistration(payload)
      navigate('/register/success', {
        state: {
          regCode: result.reg_code,
          fullName: result.full_name,
          entries: selectedTracks.map((t) => t.name),
        },
        replace: true,
      })
    } catch (err) {
      const message = friendlyError(err)
      setFormError(message)
      // A slot filling up mid-flow is the one error worth rewinding for.
      if (/already full|no longer available|choose another/i.test(message) && needsChoices) {
        setStep(3)
        // Refresh the counts so the student sees the truth.
        Promise.all(
          selectedTracks.filter((t) => t.requires_selection).map((t) => fetchAvailability(t.id)),
        )
          .then((lists) => setAvailability(lists.flat()))
          .catch(() => {})
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------------------------------------------------------- view */

  const stepIndexForBar = needsChoices ? step : step > 3 ? 3 : step

  return (
    <>
      <PageHeader
        eyebrow="Registration"
        title={
          <>
            Let's get you <span className="text-gradient-festival">on that stage</span>
          </>
        }
        subtitle="It takes about two minutes. Everything is free."
      />

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* stepper */}
        <ol className="mb-9 flex items-center gap-1.5 sm:gap-2">
          {visibleSteps.map((label, i) => {
            const done = i < stepIndexForBar
            const current = i === stepIndexForBar
            return (
              <li key={label} className="flex flex-1 flex-col gap-2">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    done
                      ? 'bg-marigold-500'
                      : current
                        ? 'bg-gradient-to-r from-marigold-500 to-marigold-200'
                        : 'bg-night-950/10',
                  )}
                />
                <span
                  className={cn(
                    'hidden text-[11px] font-bold uppercase tracking-wide sm:block',
                    current ? 'text-marigold-700' : done ? 'text-night-950/55' : 'text-night-950/30',
                  )}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>

        {formError ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 px-5 py-4"
          >
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
              <CloseIcon className="size-3" strokeWidth={3} />
            </span>
            <p className="text-sm font-medium leading-relaxed text-rose-900">{formError}</p>
          </motion.div>
        ) : null}

        <div className="rounded-4xl border border-night-950/8 bg-white p-6 stack-shadow sm:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ------------------------------------------------ step 0 */}
              {step === 0 ? (
                <div className="space-y-5">
                  <StepTitle
                    n={1}
                    title="About the student"
                    hint="Exactly as it should appear on the certificate."
                  />

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
                    <Select
                      label="Class"
                      required
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      error={errors.classLevel}
                    >
                      <option value="">Select class…</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Class {i + 1}
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="A"
                      maxLength={4}
                    />
                  </div>

                  {category ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-2xl border border-peacock-200 bg-peacock-50 px-5 py-4"
                    >
                      <SparklesIcon className="size-5 shrink-0 text-peacock-600" />
                      <p className="text-sm text-peacock-900">
                        You will compete in the{' '}
                        <strong className="font-bold">{category.name}</strong> group (Class{' '}
                        {category.min_class}–{category.max_class}) — against students your own age.
                      </p>
                    </motion.div>
                  ) : null}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Date of birth"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      hint="Optional"
                    />
                    <Select
                      label="Gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      hint="Optional"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>
              ) : null}

              {/* ------------------------------------------------ step 1 */}
              {step === 1 ? (
                <div className="space-y-5">
                  <StepTitle
                    n={2}
                    title="School and contact"
                    hint="So we know where to hold your first round, and how to reach you."
                  />

                  <Select
                    label="School"
                    required
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    error={errors.schoolId}
                  >
                    <option value="">Select your school…</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.area ? ` — ${s.area}` : ''}
                      </option>
                    ))}
                    <option value={OTHER_SCHOOL}>My school is not listed</option>
                  </Select>

                  {schoolId === OTHER_SCHOOL ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <Input
                        label="School name"
                        required
                        value={otherSchool}
                        onChange={(e) => setOtherSchool(e.target.value)}
                        error={errors.otherSchool}
                        placeholder="Type the full school name"
                        hint="We will add it to our list and contact your school."
                      />
                    </motion.div>
                  ) : null}

                  <div className="rule-gold my-2" />

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
                      hint="We call this number about results."
                    />
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
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                      placeholder="Optional"
                      autoComplete="email"
                    />
                  </div>

                  <Input
                    label="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Optional"
                    hint="Only used if we need to courier a certificate."
                  />
                </div>
              ) : null}

              {/* ------------------------------------------------ step 2 */}
              {step === 2 ? (
                <div className="space-y-5">
                  <StepTitle
                    n={3}
                    title="Choose your competitions"
                    hint={`Pick up to ${maxTracks}. Only those open to the ${category?.name ?? ''} group are shown.`}
                  />

                  {errors.entries ? (
                    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                      {errors.entries}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between rounded-2xl bg-night-950/4 px-5 py-3">
                    <span className="text-sm font-semibold text-night-950/60">Selected</span>
                    <span className="font-display text-lg font-black text-night-950">
                      {entries.length} / {maxTracks}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {eligibleTracks.map((t) => {
                      const chosen = entries.some((e) => e.trackId === t.id)
                      const atLimit = entries.length >= maxTracks && !chosen
                      const a = accent(t.accent)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={atLimit}
                          onClick={() =>
                            setEntries((prev) =>
                              chosen
                                ? prev.filter((e) => e.trackId !== t.id)
                                : [
                                    ...prev,
                                    {
                                      trackId: t.id,
                                      selectionItemId: null,
                                      teamName: '',
                                      members: [],
                                    },
                                  ],
                            )
                          }
                          className={cn(
                            'group flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition',
                            chosen
                              ? 'border-marigold-400 bg-marigold-50'
                              : 'border-night-950/10 bg-white hover:border-marigold-300',
                            atLimit && 'cursor-not-allowed opacity-45',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-12 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-105',
                              a.solid,
                            )}
                          >
                            <TrackIcon name={t.icon} className="size-6" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block font-bold text-night-950">{t.name}</span>
                            <span className="block truncate text-[13px] text-night-950/55">
                              {t.tagline}
                            </span>
                            <span className="mt-1.5 flex flex-wrap gap-1.5">
                              {t.is_team ? (
                                <Badge tone="info">
                                  <UsersIcon className="size-3" />
                                  Team {t.min_team_size}–{t.max_team_size}
                                </Badge>
                              ) : (
                                <Badge>Solo</Badge>
                              )}
                              {t.requires_selection ? (
                                <Badge tone="warning">Limited {t.selection_label?.toLowerCase()} slots</Badge>
                              ) : null}
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
                <div className="space-y-8">
                  <StepTitle
                    n={4}
                    title="Your choices"
                    hint="Songs, slokas and characters have limited slots — first come, first served."
                  />

                  {availLoading && availability.length === 0 ? (
                    <LoadingBlock label="Checking what is still available…" />
                  ) : (
                    selectedTracks.map((t) => {
                      const entry = entries.find((e) => e.trackId === t.id)
                      if (!entry) return null
                      if (!t.requires_selection && !t.is_team) return null

                      const opts = availability.filter(
                        (i) =>
                          i.track_id === t.id &&
                          (i.category_id === null || i.category_id === category?.id),
                      )
                      const a = accent(t.accent)

                      return (
                        <div
                          key={t.id}
                          className="rounded-3xl border-2 border-night-950/8 p-5 sm:p-6"
                        >
                          <div className="mb-4 flex items-center gap-3">
                            <span className={cn('grid size-10 place-items-center rounded-xl', a.solid)}>
                              <TrackIcon name={t.icon} className="size-5" />
                            </span>
                            <h3 className="text-lg font-black text-night-950">{t.name}</h3>
                          </div>

                          {/* selection picker */}
                          {t.requires_selection ? (
                            <>
                              {t.selection_help ? (
                                <p className="mb-4 rounded-2xl bg-night-950/4 px-4 py-3 text-[13px] leading-relaxed text-night-950/65">
                                  {t.selection_help}
                                </p>
                              ) : null}

                              {errors[`sel-${t.id}`] ? (
                                <p className="mb-3 text-[13px] font-semibold text-rose-600">
                                  {errors[`sel-${t.id}`]}
                                </p>
                              ) : null}

                              <div className="grid max-h-96 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                {opts.map((o) => {
                                  const picked = entry.selectionItemId === o.id
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
                            </>
                          ) : null}

                          {/* team builder */}
                          {t.is_team ? (
                            <div className={cn(t.requires_selection && 'mt-6 border-t border-night-950/8 pt-5')}>
                              <Input
                                label="Team name"
                                value={entry.teamName}
                                onChange={(ev) =>
                                  setEntries((prev) =>
                                    prev.map((e) =>
                                      e.trackId === t.id ? { ...e, teamName: ev.target.value } : e,
                                    ),
                                  )
                                }
                                placeholder="e.g. The Bhaktas"
                                hint="Optional, but it looks good on the schedule."
                              />

                              <p className="mt-5 text-sm font-semibold text-night-950">
                                Team members
                                <span className="ml-2 font-normal text-night-950/50">
                                  You are member 1. Add {t.min_team_size - 1}–{t.max_team_size - 1}{' '}
                                  more.
                                </span>
                              </p>

                              {errors[`team-${t.id}`] ? (
                                <p className="mt-1.5 text-[13px] font-semibold text-rose-600">
                                  {errors[`team-${t.id}`]}
                                </p>
                              ) : null}

                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 rounded-2xl border-2 border-marigold-200 bg-marigold-50 px-4 py-3">
                                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-marigold-500 text-[11px] font-black text-white">
                                    1
                                  </span>
                                  <span className="text-sm font-bold text-night-950">
                                    {fullName || 'You'}
                                  </span>
                                  <span className="ml-auto text-[12px] text-night-950/45">
                                    Class {classLevel}
                                  </span>
                                </div>

                                {entry.members.map((m, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="mt-3.5 grid size-6 shrink-0 place-items-center rounded-full bg-night-950/10 text-[11px] font-black text-night-950/60">
                                      {idx + 2}
                                    </span>
                                    <input
                                      value={m.full_name}
                                      onChange={(ev) =>
                                        setEntries((prev) =>
                                          prev.map((e) =>
                                            e.trackId === t.id
                                              ? {
                                                  ...e,
                                                  members: e.members.map((mm, i) =>
                                                    i === idx
                                                      ? { ...mm, full_name: ev.target.value }
                                                      : mm,
                                                  ),
                                                }
                                              : e,
                                          ),
                                        )
                                      }
                                      placeholder="Team member name"
                                      className="flex-1 rounded-2xl border-2 border-night-950/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
                                    />
                                    <input
                                      value={m.class_level}
                                      onChange={(ev) =>
                                        setEntries((prev) =>
                                          prev.map((e) =>
                                            e.trackId === t.id
                                              ? {
                                                  ...e,
                                                  members: e.members.map((mm, i) =>
                                                    i === idx
                                                      ? { ...mm, class_level: ev.target.value }
                                                      : mm,
                                                  ),
                                                }
                                              : e,
                                          ),
                                        )
                                      }
                                      placeholder="Class"
                                      inputMode="numeric"
                                      className="w-20 rounded-2xl border-2 border-night-950/10 bg-white px-3 py-3 text-sm outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
                                    />
                                    <button
                                      type="button"
                                      aria-label="Remove member"
                                      onClick={() =>
                                        setEntries((prev) =>
                                          prev.map((e) =>
                                            e.trackId === t.id
                                              ? {
                                                  ...e,
                                                  members: e.members.filter((_, i) => i !== idx),
                                                }
                                              : e,
                                          ),
                                        )
                                      }
                                      className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-night-950/35 transition hover:bg-rose-50 hover:text-rose-600"
                                    >
                                      <CloseIcon className="size-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {entry.members.length + 1 < t.max_team_size ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEntries((prev) =>
                                      prev.map((e) =>
                                        e.trackId === t.id
                                          ? {
                                              ...e,
                                              members: [
                                                ...e.members,
                                                { full_name: '', class_level: '' },
                                              ],
                                            }
                                          : e,
                                      ),
                                    )
                                  }
                                  className="mt-3 w-full rounded-2xl border-2 border-dashed border-night-950/15 py-3 text-sm font-bold text-night-950/55 transition hover:border-marigold-400 hover:text-marigold-700"
                                >
                                  + Add a team member
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              ) : null}

              {/* ------------------------------------------------ step 4 */}
              {step === 4 ? (
                <div className="space-y-6">
                  <StepTitle n={5} title="Check and confirm" hint="One last look before we save it." />

                  <dl className="grid gap-x-6 gap-y-4 rounded-3xl bg-cream-100/70 p-6 sm:grid-cols-2">
                    <Row label="Student" value={fullName} />
                    <Row label="Class" value={`Class ${classLevel}${section ? ` · ${section}` : ''}`} />
                    <Row label="Age group" value={category?.name ?? '—'} />
                    <Row
                      label="School"
                      value={
                        schoolId === OTHER_SCHOOL
                          ? otherSchool
                          : (schools.find((s) => s.id === schoolId)?.name ?? '—')
                      }
                    />
                    <Row label="Guardian" value={guardianName} />
                    <Row label="Phone" value={guardianPhone} />
                    {email ? <Row label="Email" value={email} /> : null}
                  </dl>

                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                      Competitions
                    </h3>
                    <ul className="space-y-2.5">
                      {selectedTracks.map((t) => {
                        const entry = entries.find((e) => e.trackId === t.id)
                        const pick = availability.find((i) => i.id === entry?.selectionItemId)
                        const a = accent(t.accent)
                        return (
                          <li
                            key={t.id}
                            className="flex items-center gap-3 rounded-2xl border border-night-950/8 bg-white px-4 py-3.5"
                          >
                            <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', a.solid)}>
                              <TrackIcon name={t.icon} className="size-4.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-night-950">{t.name}</span>
                              {pick ? (
                                <span className="block truncate text-[13px] text-night-950/55">
                                  {pick.title}
                                </span>
                              ) : null}
                              {entry?.teamName ? (
                                <span className="block truncate text-[13px] italic text-night-950/45">
                                  Team: {entry.teamName}
                                  {entry.members.filter((m) => m.full_name.trim()).length > 0
                                    ? ` · ${entry.members.filter((m) => m.full_name.trim()).length + 1} members`
                                    : ''}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
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
            </motion.div>
          </AnimatePresence>

          {/* nav */}
          <div className="mt-9 flex items-center justify-between gap-3 border-t border-night-950/8 pt-6">
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
              <Button
                onClick={onSubmit}
                size="lg"
                shimmer
                loading={submitting}
                icon={<Lotus className="size-5" />}
              >
                {submitting ? 'Saving…' : 'Complete registration'}
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ bits */

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-600">
        Step {n}
      </p>
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
