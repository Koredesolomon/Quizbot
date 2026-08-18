"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  Phone,
  Quote,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";
import Image from "next/image";

const speakers = [
  {
    name: "Dr. Olawale Akimide Christopher (PhD)",
    role: "Department of Science and Technology Education, University of Ibadan",
    focus: "Science Education",
    bio: "A science and technology education scholar bringing classroom, curriculum, and teacher-development perspective to the discussion.",
    initials: "OC",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    name: "Mr. Sulaymon Tajudeen",
    role: "Software Engineer and EdTech Expert",
    focus: "EdTech Systems",
    bio: "A software engineer focused on education technology systems, digital learning products, and practical school implementation.",
    initials: "ST",
    accent: "from-blue-700 to-sky-500",
  },
  {
    name: "Mr. Abayomi Ajao",
    role: "Founder, Zulfah Virtual Lab and STEM Innovation Expert",
    focus: "Virtual Labs",
    bio: "A STEM innovation expert working on virtual laboratory access and technology-enabled science learning.",
    initials: "AA",
    accent: "from-slate-900 to-blue-700",
  },
];

const attendees = [
  "Science teachers",
  "Heads of science departments",
  "School principals",
  "School owners and administrators",
  "EdTech founders and innovators",
  "Education stakeholders",
  "Policy makers",
];

const outcomes = [
  "See how virtual labs and simulations can make STEM concepts easier to teach.",
  "Learn practical routes for digital tools in Nigerian schools.",
  "Join a live Q&A with educators, technologists, and STEM innovation leaders.",
];

const host = {
  name: "Taiwo Fapohunda",
  role: "Founder, TLCHub",
  focus: "Host & Convener",
  initials: "TF",
  bio: "An EdTech advocate and education innovator convening educators, school leaders, and technology builders around practical STEM transformation.",
  mission: "Creating spaces where education stakeholders can discover usable digital tools and turn STEM learning into a more practical classroom experience.",
};

const ctaCards = [
  {
    title: "Attend the Live Webinar",
    text: "Join educators and innovation leaders for a focused conversation on practical STEM learning.",
    tone: "bg-white text-slate-950",
  },
  {
    title: "Lead the Conversation",
    text: "Bring your questions to the live Q&A and connect classroom needs with practical technology ideas.",
    tone: "bg-emerald-700 text-white",
  },
  {
    title: "Get the Resources",
    text: "Participants receive resource materials and an e-certificate after the webinar.",
    tone: "bg-slate-950 text-white",
  },
  {
    title: "Share With Your Team",
    text: "Invite science departments, school owners, principals, and EdTech teams to attend together.",
    tone: "bg-lime-300 text-slate-950",
  },
  {
    title: "Build Practical STEM",
    text: "Explore how virtual labs, simulations, and digital tools can support Nigerian classrooms.",
    tone: "bg-gradient-to-br from-emerald-800 to-blue-900 text-white",
  },
];

const registrationUrl = "https://forms.gle/mQf4QxmsRyY5B4T76";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function WebinarLanding() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHasScrolled(window.scrollY > 24);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <main className="min-h-screen bg-white font-['Inter','Helvetica_Neue',Arial,sans-serif] text-slate-950 antialiased">
      <header
        className={`fixed inset-x-0 top-0 z-30 border-b transition-[background-color,border-color,box-shadow,color,backdrop-filter] duration-700 ease-out ${
          hasScrolled
            ? "border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur"
            : "border-white/10 bg-transparent text-white"
        }`}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => scrollToSection("top")}
            className="inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left outline-none transition hover:-translate-y-0.5 hover:opacity-85 focus-visible:ring-4 focus-visible:ring-emerald-200 active:translate-y-0 sm:gap-3"
            aria-label="TLCHub webinar home"
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors duration-700 ease-out sm:h-10 sm:w-10 ${
                hasScrolled ? "bg-emerald-700 text-white" : "bg-white text-emerald-800"
              }`}
            >
              <GraduationCap aria-hidden="true" size={21} />
            </span>
            <span className="min-w-0">
              <span
                className={`block text-lg font-black tracking-tight transition-colors duration-700 ease-out sm:text-xl ${
                  hasScrolled ? "text-emerald-800" : "text-white"
                }`}
              >
                TLCHub
              </span>
              <span
                className={`hidden text-[10px] font-black uppercase tracking-[0.18em] transition-colors duration-700 ease-out min-[420px]:block ${
                  hasScrolled ? "text-slate-500" : "text-white/75"
                }`}
              >
                BeyondTheory
              </span>
            </span>
          </button>
          <nav
            className={`hidden items-center gap-6 text-[11px] font-semibold tracking-normal transition-colors duration-700 ease-out md:flex ${
              hasScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            <button className="cursor-pointer rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300 active:translate-y-0" type="button" onClick={() => scrollToSection("about")}>About</button>
            <button className="cursor-pointer rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300 active:translate-y-0" type="button" onClick={() => scrollToSection("host")}>Host</button>
            <button className="cursor-pointer rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300 active:translate-y-0" type="button" onClick={() => scrollToSection("speakers")}>Speakers</button>
            <button className="cursor-pointer rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300 active:translate-y-0" type="button" onClick={() => scrollToSection("register")}>Register</button>
          </nav>
          <a
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.04em] outline-none transition duration-700 ease-out hover:-translate-y-0.5 focus-visible:ring-4 active:translate-y-0 sm:px-4 sm:py-3 sm:text-[11px] ${
              hasScrolled
                ? "bg-slate-950 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200"
                : "bg-white text-slate-950 hover:bg-emerald-400 focus-visible:ring-white/40"
            }`}
            href={registrationUrl}
            rel="noreferrer"
            target="_blank"
          >
            Register Now
            <ArrowRight aria-hidden="true" size={15} />
          </a>
        </div>
      </header>

      <section id="top" className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image
          src="/webinar/stem-lab-hero.png"
          alt="Scientist using a virtual lab interface beside STEM equipment"
          fill
          priority
          className="absolute inset-0 -z-20 object-cover object-[58%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-slate-950/68" />
        <div className="mx-auto grid min-h-[76vh] max-w-[1200px] items-center px-5 py-16 text-left sm:px-8 lg:px-10">
          <div className="max-w-3xl content-rise">
            <p className="text-[32px] font-light uppercase leading-tight tracking-normal text-white sm:text-[40px]">TLCHub Presents</p>
            <h1 className="mt-3 text-[56px] font-black uppercase leading-[0.9] tracking-normal text-white sm:text-[72px] lg:text-[92px]">
              Beyond
              <span className="block text-emerald-400">Theory</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] font-black uppercase leading-6 tracking-[0.05em] text-sky-100 sm:text-[17px]">
              Technology Innovation for Practical<br/> STEM Education in Nigeria
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-emerald-400 bg-emerald-500 px-6 py-3 text-[12px] font-black uppercase tracking-[0.04em] text-white shadow-xl shadow-emerald-950/30 outline-none transition hover:-translate-y-0.5 hover:bg-emerald-400 focus-visible:ring-4 focus-visible:ring-emerald-200 active:translate-y-0"
                href={registrationUrl}
                rel="noreferrer"
                target="_blank"
              >
                Register Now
                <ArrowRight aria-hidden="true" size={19} />
              </a>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-white/45 px-6 py-3 text-[12px] font-black uppercase tracking-[0.04em] text-white outline-none transition hover:-translate-y-0.5 hover:bg-white/12 focus-visible:ring-4 focus-visible:ring-white/40 active:translate-y-0"
                onClick={() => scrollToSection("about")}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 bg-white px-5 py-16 text-center sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.06em] text-slate-700">
            About <span className="text-emerald-700">BeyondTheory</span>
          </p>
          <p className="mt-6 text-[14px] font-normal leading-[1.85] text-slate-700">
            BeyondTheory explores how Nigerian schools can move STEM education from abstract explanation to practical learning through virtual labs, simulations, and digital classroom tools. With educators, EdTech builders, and innovation leaders in one room, the webinar creates space for useful conversation, shared insight, and realistic next steps for schools.
          </p>
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => scrollToSection("host")}
              aria-label="Continue to host profile"
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-slate-200 text-slate-800 outline-none transition hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-700 focus-visible:ring-4 focus-visible:ring-emerald-200 active:translate-y-0"
            >
              <ArrowDown aria-hidden="true" size={28} />
            </button>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-[1200px] gap-4 md:grid-cols-3">
          <Detail icon={<CalendarDays size={22} />} label="Date" value="Saturday, 29 August 2026" />
          <Detail icon={<Clock3 size={22} />} label="Time" value="11:00am WAT" tone="orange" />
          <Detail icon={<Video size={22} />} label="Venue" value="Online Webinar" tone="blue" />
        </div>
      </section>

      <section className="bg-[#f4f8fb] px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-3">
          {outcomes.map((outcome) => (
            <div key={outcome} className="border-l-4 border-emerald-500 bg-white p-6 shadow-sm">
              <CheckCircle2 aria-hidden="true" className="text-emerald-600" size={24} />
              <p className="mt-4 text-[14px] font-semibold leading-6 text-slate-700">{outcome}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="host" className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid items-stretch overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[0.78fr_1.22fr]">
            <ProfileImage
              initials={host.initials}
              label={host.focus}
              accent="from-slate-950 via-blue-800 to-emerald-600"
              marker="H"
              stretch
            />

            <div className="relative p-7 sm:p-9 lg:p-10">
              <Quote aria-hidden="true" className="absolute right-8 top-8 text-emerald-100" size={44} />
              <p className="border-l-4 border-emerald-500 pl-3 text-[12px] font-black uppercase tracking-[0.04em] text-blue-700">
                Host Profile
              </p>
              <h2 className="mt-5 max-w-2xl text-[34px] font-black uppercase leading-tight tracking-normal text-slate-950 sm:text-[42px]">
                {host.name}
              </h2>
              <p className="mt-2 text-[14px] font-black text-emerald-700">{host.role}</p>
              <p className="mt-5 max-w-3xl text-[14px] font-normal leading-[1.85] text-slate-600">{host.bio}</p>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <div className="bg-slate-50 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-600 text-white">
                    <UserRound aria-hidden="true" size={21} />
                  </div>
                  <h3 className="mt-4 text-[13px] font-black uppercase tracking-normal text-slate-950">Convener Role</h3>
                  <p className="mt-3 text-[14px] font-normal leading-6 text-slate-600">
                    Facilitates the live conversation, connects the panel, and frames the discussion around practical school needs.
                  </p>
                </div>
                <div className="bg-slate-50 p-5">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-blue-700 text-white">
                    <Sparkles aria-hidden="true" size={21} />
                  </div>
                  <h3 className="mt-4 text-[13px] font-black uppercase tracking-normal text-slate-950">Host Mission</h3>
                  <p className="mt-3 text-[14px] font-normal leading-6 text-slate-600">{host.mission}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="speakers" className="scroll-mt-20 bg-white px-5 py-16 text-slate-950 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-[34px] font-black leading-tight tracking-normal text-slate-900 sm:text-[40px]">
              Meet the Speakers for <span className="text-emerald-700">BeyondTheory</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] font-normal leading-6 text-slate-600">
              These are the educators, technologists, and STEM innovation voices guiding the conversation on practical digital learning in Nigerian schools.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {speakers.map((speaker, index) => (
              <article
                key={speaker.name}
                className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/70"
              >
                <ProfileImage
                  initials={speaker.initials}
                  label={speaker.focus}
                  accent={speaker.accent}
                  marker={`0${index + 1}`}
                />
                <div className="bg-white p-6 text-center">
                  <h3 className="text-[14px] font-black uppercase leading-6 text-slate-950">{speaker.name}</h3>
                  <p className="mt-2 text-[12px] font-bold leading-5 text-blue-700">{speaker.role}</p>
                  <p className="mx-auto mt-4 max-w-sm text-[14px] font-normal leading-6 text-slate-600">{speaker.bio}</p>
                  <div className="mx-auto mt-5 h-1 w-14 bg-emerald-500 transition group-hover:w-24" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="register" className="scroll-mt-20 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-center text-[34px] font-black tracking-normal text-slate-900 sm:text-[40px]">
            Take Your Place at <span className="text-emerald-700">BeyondTheory</span>
          </h2>
          <div className="mt-10 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {ctaCards.map((card, index) => (
              index === 4 ? (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => scrollToSection("about")}
                  className={`${card.tone} group min-h-52 cursor-pointer p-6 text-left shadow-sm outline-none transition hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-emerald-300 active:translate-y-0 md:col-span-2`}
                >
                  <h3 className="text-[16px] font-black leading-6">{card.title}</h3>
                  <p className="mt-4 max-w-md text-[13px] font-normal leading-6 opacity-85">{card.text}</p>
                </button>
              ) : (
                <a
                  key={card.title}
                  href={registrationUrl}
                  rel="noreferrer"
                  target="_blank"
                  className={`${card.tone} group min-h-52 cursor-pointer p-6 shadow-sm outline-none transition hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-emerald-300 active:translate-y-0`}
                >
                  <h3 className="text-[16px] font-black leading-6">{card.title}</h3>
                  <p className="mt-4 max-w-md text-[13px] font-normal leading-6 opacity-85">{card.text}</p>
                </a>
              )
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5fbff] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.06em] text-emerald-700">Who Should Attend?</p>
            <h2 className="mt-3 text-[30px] font-black tracking-normal text-slate-950 sm:text-[36px]">
              Built for the people shaping STEM learning.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {attendees.map((attendee) => (
              <div key={attendee} className="flex items-start gap-3 bg-white p-4 shadow-sm">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                <span className="text-[14px] font-semibold leading-6 text-slate-700">{attendee}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 px-5 py-14 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-10 border-b border-white/15 pb-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-white text-emerald-800">
                <GraduationCap aria-hidden="true" size={23} />
              </span>
              <span>
                <span className="block text-[20px] font-black">TLCHub</span>
                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-100">BeyondTheory</span>
              </span>
            </div>
            <p className="mt-6 max-w-sm text-[14px] font-normal leading-6 text-emerald-50">
              Technology innovation for practical STEM education in Nigeria.
            </p>
          </div>

          <FooterColumn
            title="Explore"
            links={[
              ["About", "about"],
              ["Host", "host"],
              ["Speakers", "speakers"],
              ["Who Should Attend", "register"],
            ]}
          />
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.1em] text-white">Get Involved</h3>
            <div className="mt-7 grid gap-3 text-[14px] font-semibold text-emerald-50">
              <a className="inline-flex cursor-pointer items-center gap-2 rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0" href="tel:+2348132455031">
                <Phone aria-hidden="true" size={16} />
                +234 813 245 5031
              </a>
              <a className="inline-flex cursor-pointer items-center gap-2 rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0" href="tel:+2347034932667">
                <Phone aria-hidden="true" size={16} />
                +234 703 493 2667
              </a>
              <a className="inline-flex cursor-pointer items-center gap-2 rounded-sm outline-none transition hover:-translate-y-0.5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0" href="mailto:info@tlchub.com">
                <Mail aria-hidden="true" size={16} />
                info@tlchub.com
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.1em] text-white">Connect</h3>
            <div className="mt-6 flex gap-3">
              <SocialLink label="Instagram" initials="IG" />
              <SocialLink label="Facebook" initials="FB" />
              <SocialLink label="X" initials="X" />
              <SocialLink label="LinkedIn" initials="IN" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] pt-7 text-center text-[11px] font-semibold text-emerald-50">
          <p>© 2026 TLCHub. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function ProfileImage({
  initials,
  label,
  accent,
  marker,
  stretch = false,
}: {
  initials: string;
  label: string;
  accent: string;
  marker: string;
  stretch?: boolean;
}) {
  return (
    <div
      className={`relative grid place-items-end overflow-hidden bg-gradient-to-br ${accent} ${
        stretch ? "min-h-[360px] lg:h-full lg:min-h-0" : "aspect-[4/3.4]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,transparent_42%,rgba(2,6,23,0.22)_100%)]" />
      <div className="absolute left-5 top-5 rounded-md bg-white/92 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-900 shadow-lg">
        {label}
      </div>
      <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 rounded-t-full border border-white/40 bg-white/16 shadow-2xl shadow-slate-950/20 backdrop-blur-sm" />
      <div className="relative mb-8 grid h-32 w-32 place-items-center rounded-full border-4 border-white bg-slate-950 text-[36px] font-black text-white shadow-2xl shadow-slate-950/35">
        {initials}
      </div>
      <span className="absolute bottom-5 right-5 text-[64px] font-black leading-none text-white/18">{marker}</span>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  tone = "green",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "green" | "orange" | "blue";
}) {
  const tones = {
    green: "bg-emerald-500 text-white",
    orange: "bg-orange-500 text-white",
    blue: "bg-blue-600 text-white",
  };

  return (
    <div className="rounded-md bg-white p-4 text-left text-slate-950 shadow-lg shadow-slate-200/70">
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-md ${tones[tone]}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-[15px] font-black leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="text-[12px] font-black uppercase tracking-[0.1em] text-white">{title}</h3>
      <div className="mt-6 grid gap-3 text-[13px] font-normal text-emerald-50">
        {links.map(([label, sectionId]) => (
          <button
            key={label}
            className="cursor-pointer rounded-sm text-left outline-none transition hover:-translate-y-0.5 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 active:translate-y-0"
            type="button"
            onClick={() => scrollToSection(sectionId)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SocialLink({ label, initials }: { label: string; initials: string }) {
  return (
    <a
      href="mailto:info@tlchub.com"
      aria-label={label}
      className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/30 text-[10px] font-black text-white outline-none transition hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-white/50 active:translate-y-0"
    >
      {initials}
    </a>
  );
}
