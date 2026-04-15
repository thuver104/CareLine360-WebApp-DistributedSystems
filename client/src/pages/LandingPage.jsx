import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import {
  Calendar,
  Video,
  Shield,
  Heart,
  Users,
  Clock,
  ArrowRight,
  ChevronDown,
  Star,
  Activity,
  Stethoscope,
  MessageCircle,
} from "lucide-react";

import BlurText from "../components/animations/BlurText";
import ScrollVelocity from "../components/animations/ScrollVelocity";
import FallBeamBackground from "../components/animations/FallBeamBackground";
import ThreeDSlider from "../components/animations/ThreeDSlider";

import logo from "../assets/logo.png";
import doctorImg1 from "../assets/images/landing page doctor img 11.png";
import doctorImg2 from "../assets/images/doctor img 22.png";

// Carousel images for 3D slider
import carImg1 from "../assets/carousel/img1.png";
import carImg2 from "../assets/carousel/img2.png";
import carImg3 from "../assets/carousel/img3.png";
import carImg4 from "../assets/carousel/img4.png";
import carImg5 from "../assets/carousel/img5.png";
import carImg6 from "../assets/carousel/img6.png";
import carImg7 from "../assets/carousel/img7.png";
import carImg8 from "../assets/carousel/img8.png";
import carImg9 from "../assets/carousel/img9.png";
import carImg10 from "../assets/carousel/img10.png";

import "./LandingPage.css";

/* ════════════════════════════════════════════════════════
   SECTION WRAPPER — fade-up on scroll entry
════════════════════════════════════════════════════════ */
function FadeSection({ children, className = "", delay = 0, id, ...rest }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════
   ANIMATED COUNTER
════════════════════════════════════════════════════════ */
function Counter({ target, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = parseInt(target, 10);
    const step = Math.max(1, Math.floor(end / (duration * 60)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="lp-stat-number">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ════════════════════════════════════════════════════════
   FAQ ITEM
════════════════════════════════════════════════════════ */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lp-faq-item py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="lp-faq-question text-sm md:text-base pr-4">
          {question}
        </span>
        <span
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center border transition-all duration-500"
          style={{
            borderColor: open ? "#0d9488" : "rgba(26,26,26,0.2)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDown size={14} />
        </span>
      </button>
      <div
        className="lp-faq-answer lp-sans text-sm leading-relaxed"
        style={{
          maxHeight: open ? "300px" : "0px",
          opacity: open ? 1 : 0,
          marginTop: open ? "1rem" : "0",
          color: "#6C6863",
        }}
      >
        {answer}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN LANDING PAGE
════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Navigation items
  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "features", label: "Features" },
    { id: "faq", label: "FAQ" },
  ];

  // 3D Slider items using carousel images
  const sliderItems = [
    { title: "Patient Care", num: "01", imageUrl: carImg1 },
    { title: "Expert Doctors", num: "02", imageUrl: carImg2 },
    { title: "Appointments", num: "03", imageUrl: carImg3 },
    { title: "AI Insights", num: "04", imageUrl: carImg4 },
    { title: "Video Consult", num: "05", imageUrl: carImg5 },
    { title: "Health Records", num: "06", imageUrl: carImg6 },
    { title: "Lab Reports", num: "07", imageUrl: carImg7 },
    { title: "Prescriptions", num: "08", imageUrl: carImg8 },
    { title: "Live Chat", num: "09", imageUrl: carImg9 },
    { title: "Dashboard", num: "10", imageUrl: carImg10 },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracking via scroll position
  useEffect(() => {
    const sectionIds = ["home", "about", "features", "faq"];
    let isClickScrolling = false;

    const handleScroll = () => {
      if (isClickScrolling) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // If scrolled to bottom, activate last section
      if (scrollY + windowHeight >= docHeight - 50) {
        setActiveSection(sectionIds[sectionIds.length - 1]);
        return;
      }

      // Find the section currently in view
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= windowHeight * 0.3) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // set initial state

    // Expose the lock setter for the click handler
    window.__clScrollLock = (lock) => {
      isClickScrolling = lock;
    };

    return () => {
      window.removeEventListener("scroll", handleScroll);
      delete window.__clScrollLock;
    };
  }, []);

  // Smooth scroll handler
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setActiveSection(sectionId);
    setMobileMenu(false);

    // Lock scroll tracking during smooth scroll animation
    if (window.__clScrollLock) window.__clScrollLock(true);

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }

    // Unlock after animation completes
    setTimeout(() => {
      if (window.__clScrollLock) window.__clScrollLock(false);
    }, 1000);
  };

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      desc: "Book appointments with specialist doctors instantly. Our intelligent system matches you with available time slots for in-person, video, or phone consultations.",
    },
    {
      icon: Video,
      title: "Video Consultations",
      desc: "Connect with your doctor face-to-face from the comfort of your home. Secure, HD-quality video calls with integrated medical record sharing.",
    },
    {
      icon: Shield,
      title: "Secure Health Records",
      desc: "Your complete medical history in one place — prescriptions, diagnoses, lab results, and visit notes. All encrypted and accessible only to you and your care team.",
    },
    {
      icon: MessageCircle,
      title: "AI Health Companion",
      desc: "Get instant, easy-to-understand explanations of your medical reports and prescriptions, powered by advanced medical AI technology.",
    },
    {
      icon: Activity,
      title: "Emergency Response",
      desc: "One-tap emergency reporting with real-time GPS location sharing and nearest hospital coordination. Help arrives when seconds matter.",
    },
    {
      icon: Stethoscope,
      title: "Doctor Dashboard",
      desc: "Comprehensive tools for healthcare professionals — patient management, analytics, prescription generation, and availability management.",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Amanda Perera",
      role: "Cardiologist",
      text: "CareLine 360 has transformed how I manage my practice. The seamless appointment system and medical record integration saves me hours every week.",
      stars: 5,
    },
    {
      name: "Kasun Wijeratne",
      role: "Patient",
      text: "I was able to consult with a specialist within hours of booking. The video consultation felt just as personal as an in-person visit. Truly remarkable.",
      stars: 5,
    },
    {
      name: "Dr. Nishantha Silva",
      role: "General Practitioner",
      text: "The analytics dashboard gives me incredible insights into patient trends. The prescription PDF generation and digital records are game-changers.",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "How do I book an appointment?",
      a: "Simply create a free account, browse our directory of specialist doctors, and select a convenient time slot. You can choose between in-person, video, or phone consultations.",
    },
    {
      q: "Is my medical data secure?",
      a: "Absolutely. We use enterprise-grade encryption for all data at rest and in transit. Your medical records are accessible only to you and your authorized healthcare providers.",
    },
    {
      q: "Can I access my prescriptions digitally?",
      a: "Yes! All prescriptions are generated as professional PDFs and stored in your secure patient portal. You can download, share, or print them anytime.",
    },
    {
      q: "What happens in an emergency?",
      a: "Our emergency module allows one-tap emergency reporting with real-time GPS location sharing. The system coordinates with the nearest hospitals and emergency responders.",
    },
    {
      q: "Do doctors use the same platform?",
      a: "Yes, CareLine 360 provides a comprehensive doctor dashboard with patient management, scheduling, analytics, medical record creation, and prescription tools.",
    },
  ];

  return (
    <div
      className="lp-smooth-scroll"
      style={{
        background: "#F9F8F6",
        color: "#1A1A1A",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* Paper noise overlay */}
      <div className="landing-noise" />

      {/* ═══════════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-[60] transition-all duration-700"
        style={{
          background: scrolled ? "rgba(249,248,246,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(26,26,26,0.08)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-16 flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="CareLine 360"
              className="h-10 md:h-12 w-auto"
            />
            <span className="lp-serif text-lg md:text-xl font-medium tracking-tight">
              CareLine{" "}
              <span style={{ color: "#0d9488", fontStyle: "italic" }}>360</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`lp-nav-link${
                  activeSection === item.id ? " lp-nav-link--active" : ""
                }`}
                onClick={(e) => scrollToSection(e, item.id)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center gap-4 ml-6">
              <Link
                to="/login"
                className="lp-btn-secondary"
                style={{
                  height: "2.75rem",
                  padding: "0 1.75rem",
                  fontSize: "0.65rem",
                }}
              >
                Sign In
              </Link>
              <a
                href="#about"
                className="lp-btn-primary"
                style={{
                  height: "2.75rem",
                  padding: "0 1.75rem",
                  fontSize: "0.65rem",
                }}
                onClick={(e) => scrollToSection(e, "about")}
              >
                <span className="btn-gold-bg" />
                <span className="btn-label">Get Started</span>
              </a>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <span
              className="w-6 h-px bg-[#1A1A1A] transition-transform duration-500"
              style={{
                transform: mobileMenu
                  ? "rotate(45deg) translateY(4px)"
                  : "none",
              }}
            />
            <span
              className="w-6 h-px bg-[#1A1A1A] transition-opacity duration-500"
              style={{ opacity: mobileMenu ? 0 : 1 }}
            />
            <span
              className="w-6 h-px bg-[#1A1A1A] transition-transform duration-500"
              style={{
                transform: mobileMenu
                  ? "rotate(-45deg) translateY(-4px)"
                  : "none",
              }}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t"
            style={{
              background: "rgba(249,248,246,0.97)",
              borderColor: "rgba(26,26,26,0.08)",
            }}
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`lp-nav-link${
                    activeSection === item.id ? " lp-nav-link--active" : ""
                  }`}
                  onClick={(e) => scrollToSection(e, item.id)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                <Link to="/login" className="lp-btn-secondary text-center">
                  Sign In
                </Link>
                <a
                  href="#about"
                  className="lp-btn-primary text-center"
                  onClick={(e) => scrollToSection(e, "about")}
                >
                  <span className="btn-gold-bg" />
                  <span className="btn-label">Get Started</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section id="home" className="relative min-h-screen flex items-center pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        {/* Falling beam background animation */}
        <FallBeamBackground lineCount={15} beamColorClass="teal-400" />

        {/* Teal glow — large ambient aura surrounding the entire doctor image */}
        <div
          className="hidden lg:block absolute pointer-events-none select-none"
          style={{
            right: "-2%",
            top: "10%",
            width: "1000px",
            height: "750px",
            zIndex: 5,
            background: "radial-gradient(ellipse at center, rgba(13,148,136,0.42) 0%, rgba(6,182,212,0.22) 35%, rgba(13,148,136,0.10) 60%, transparent 80%)",
            filter: "blur(90px)",
            borderRadius: "50%",
          }}
        />

        {/* Doctor image — absolutely positioned on the right, ABOVE the glow */}
        <motion.img
          src={doctorImg1}
          alt="CareLine360 Medical Team"
          initial={{ opacity: 0, x: 60, scale: 0.95, y: 20 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            y: [-28, -58, -28],
          }}
          transition={{
            opacity: { duration: 1.4, delay: 0.5 },
            x: { duration: 1.4, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
            scale: {
              duration: 1.4,
              delay: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            },
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          }}
          className="hidden lg:block absolute right-0 bottom-0 pointer-events-none select-none"
          style={{
            zIndex: 10,
            marginBottom: "clamp(48px, 7vh, 88px)",
            height: "92%",
            width: "auto",
            maxWidth: "58%",
            objectFit: "contain",
            objectPosition: "right",
            filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.12))",
          }}
        />

        <div className="max-w-[1600px] mx-auto px-6 md:px-16 w-full relative z-20">
          <div className="max-w-xl lg:max-w-[45%]">
            {/* Overline */}
            <div className="flex items-center gap-4 mb-6">
              <span className="lp-overline" style={{ color: "#0d9488" }}>
                Healthcare Reimagined
              </span>
            </div>

            {/* Hero Headline */}
            <h1 className="lp-serif text-[2.5rem] md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[0.95] mb-6">
              <BlurText
                text="Your Health,"
                delay={180}
                animateBy="words"
                direction="bottom"
                className="lp-serif text-[2.5rem] md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[0.95]"
                stepDuration={0.5}
              />
              <span className="block mt-1">
                <BlurText
                  text="Our"
                  delay={200}
                  animateBy="words"
                  direction="bottom"
                  className="lp-serif text-[2.5rem] md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[0.95]"
                  stepDuration={0.5}
                />
                <span className="lp-serif italic" style={{ color: "#0d9488" }}>
                  {" "}
                  <BlurText
                    text="Priority"
                    delay={300}
                    animateBy="words"
                    direction="bottom"
                    className="lp-serif italic text-[2.5rem] md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[0.95]"
                    stepDuration={0.6}
                  />
                </span>
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              className="lp-sans text-base md:text-lg leading-relaxed max-w-md mb-10"
              style={{ color: "#6C6863" }}
            >
              A smart healthcare platform connecting patients with specialist
              doctors — seamless appointments, secure records, and AI-powered
              insights, all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/register" className="lp-btn-primary">
                <span className="btn-gold-bg" />
                <span className="btn-label flex items-center gap-2">
                  Book Appointment <ArrowRight size={14} />
                </span>
              </Link>
              <a href="#features" className="lp-btn-secondary">
                Explore Features
              </a>
            </div>

            {/* Micro stats */}
            <div className="flex gap-8 md:gap-12">
              <div>
                <Counter target={5000} suffix="+" />
                <p className="lp-overline mt-1" style={{ fontSize: "0.6rem" }}>
                  Patients Served
                </p>
              </div>
              <div>
                <Counter target={200} suffix="+" />
                <p className="lp-overline mt-1" style={{ fontSize: "0.6rem" }}>
                  Expert Doctors
                </p>
              </div>
              <div>
                <Counter target={98} suffix="%" />
                <p className="lp-overline mt-1" style={{ fontSize: "0.6rem" }}>
                  Satisfaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SCROLL VELOCITY TEXT
      ═══════════════════════════════════════════════ */}
      <div
        className="py-8 md:py-12 overflow-hidden border-t border-b"
        style={{ borderColor: "rgba(26,26,26,0.06)" }}
      >
        <ScrollVelocity
          texts={[
            "CareLine 360",
            "Smart Healthcare",
            "Patient Care",
            "Doctor Connect",
          ]}
          velocity={60}
          className="lp-scroll-velocity"
          numCopies={4}
        />
      </div>

      {/* ═══════════════════════════════════════════════
          ABOUT / MISSION SECTION
      ═══════════════════════════════════════════════ */}
      <FadeSection id="about" className="py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center relative">
            {/* Teal glow behind the about doctor image */}
            <div
              className="hidden lg:block absolute pointer-events-none select-none"
              style={{
                left: "2%",
                top: "50%",
                transform: "translateY(-50%)",
                width: "900px",
                height: "900px",
                zIndex: 5,
                background: "radial-gradient(ellipse at center, rgba(13,148,136,0.45) 0%, rgba(6,182,212,0.25) 35%, rgba(13,148,136,0.12) 60%, transparent 80%)",
                filter: "blur(100px)",
                borderRadius: "50%",
              }}
            />

            {/* Doctor image — wider column, slightly scaled up */}
            <div className="lg:col-span-6 lg:col-start-1 relative">
              <img
                src={doctorImg2}
                alt="Healthcare professionals team"
                className="w-full h-auto object-contain relative"
                style={{
                  zIndex: 10,
                  transform: "scale(1.44)",
                  transformOrigin: "center bottom",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.08))",
                }}
              />
            </div>

            {/* Text — starts right next to the image */}
            <div className="lg:col-span-5 lg:col-start-7">
              <span className="lp-overline" style={{ color: "#0d9488" }}>
                Our Mission
              </span>
              <h2 className="lp-serif text-3xl md:text-5xl lg:text-6xl font-normal leading-[0.95] mt-4 mb-6">
                Connecting{" "}
                <span className="italic" style={{ color: "#0d9488" }}>
                  Lives
                </span>
                <br />
                Through Care
              </h2>
              <p
                className="lp-sans text-base leading-relaxed lp-drop-cap"
                style={{ color: "#6C6863" }}
              >
                CareLine 360 bridges the gap between patients and healthcare
                providers through intelligent technology. We believe that
                quality healthcare should be accessible, transparent, and
                seamless. Our platform empowers both doctors and patients with
                tools that simplify every step of the healthcare journey — from
                booking that first appointment to receiving your AI-explained
                medical report.
              </p>
              <div className="mt-8">
                <Link to="/register" className="lp-btn-primary">
                  <span className="btn-gold-bg" />
                  <span className="btn-label flex items-center gap-2">
                    Join CareLine Today <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ═══════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════ */}
      <FadeSection
        id="features"
        className="py-20 md:py-32 border-t"
        style={{ borderColor: "rgba(26,26,26,0.06)" }}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          {/* Section Header */}
          <div className="max-w-xl mb-16 md:mb-20">
            <span className="lp-overline" style={{ color: "#0d9488" }}>
              What We Offer
            </span>
            <h2 className="lp-serif text-3xl md:text-5xl lg:text-6xl font-normal leading-[0.95] mt-4">
              The{" "}
              <span className="italic" style={{ color: "#0d9488" }}>
                Features
              </span>
            </h2>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  className="lp-feature-card px-6 md:px-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <div
                    className="lp-feature-icon w-12 h-12 flex items-center justify-center border mb-5"
                    style={{ borderColor: "rgba(26,26,26,0.15)" }}
                  >
                    <Icon size={20} strokeWidth={1.2} />
                  </div>
                  <h3 className="lp-serif text-xl md:text-2xl font-normal mb-3">
                    {f.title}
                  </h3>
                  <p
                    className="lp-sans text-sm leading-relaxed"
                    style={{ color: "#6C6863" }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ═══════════════════════════════════════════════
          3D IMAGE SLIDER
      ═══════════════════════════════════════════════ */}
      <div className="relative border-t border-b overflow-hidden" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
        {/* Teal glow behind slider */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "900px",
            height: "600px",
            zIndex: 0,
            background: "radial-gradient(ellipse at center, rgba(13,148,136,0.30) 0%, rgba(6,182,212,0.15) 35%, rgba(13,148,136,0.06) 60%, transparent 80%)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
        <ThreeDSlider
          items={sliderItems}
          speedWheel={0.05}
          speedDrag={-0.15}
          containerStyle={{ height: "80vh" }}
        />
      </div>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <FadeSection id="testimonials" className="py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="max-w-xl mb-16">
            <span className="lp-overline" style={{ color: "#0d9488" }}>
              What People Say
            </span>
            <h2 className="lp-serif text-3xl md:text-5xl lg:text-6xl font-normal leading-[0.95] mt-4">
              Trusted by{" "}
              <span className="italic" style={{ color: "#0d9488" }}>
                Thousands
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="lp-testimonial group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      fill="#0d9488"
                      stroke="none"
                      className="transition-transform duration-500 group-hover:scale-110"
                    />
                  ))}
                </div>
                <p
                  className="lp-serif text-base md:text-lg italic leading-relaxed mb-6"
                  style={{ color: "#1A1A1A" }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="lp-sans text-sm font-medium transition-colors duration-500 group-hover:text-[#0d9488]">
                    {t.name}
                  </p>
                  <p
                    className="lp-overline mt-1"
                    style={{ fontSize: "0.6rem" }}
                  >
                    {t.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <FadeSection
        className="py-20 md:py-32 border-t"
        style={{ borderColor: "rgba(26,26,26,0.06)" }}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="text-center max-w-xl mx-auto mb-16 md:mb-20">
            <span className="lp-overline" style={{ color: "#0d9488" }}>
              Simple Process
            </span>
            <h2 className="lp-serif text-3xl md:text-5xl lg:text-6xl font-normal leading-[0.95] mt-4">
              How It{" "}
              <span className="italic" style={{ color: "#0d9488" }}>
                Works
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Register as a patient or doctor. Set up your profile with essential medical information for personalized care.",
                icon: Users,
              },
              {
                step: "02",
                title: "Book & Consult",
                desc: "Browse our directory of specialist doctors, choose your preferred consultation type, and book instantly.",
                icon: Calendar,
              },
              {
                step: "03",
                title: "Manage Health",
                desc: "Access your medical records, prescriptions, and AI-powered insights. Track your health journey seamlessly.",
                icon: Heart,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  className="text-center md:text-left"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                >
                  <span
                    className="lp-serif text-6xl md:text-7xl font-normal block mb-4"
                    style={{ color: "rgba(13,148,136,0.12)" }}
                  >
                    {item.step}
                  </span>
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      style={{ color: "#0d9488" }}
                    />
                    <h3 className="lp-serif text-xl md:text-2xl font-normal">
                      {item.title}
                    </h3>
                  </div>
                  <p
                    className="lp-sans text-sm leading-relaxed"
                    style={{ color: "#6C6863" }}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FadeSection>

      {/* ═══════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════ */}
      <FadeSection id="faq" className="py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left label */}
            <div className="lg:col-span-4">
              <span className="lp-overline" style={{ color: "#0d9488" }}>
                Questions
              </span>
              <h2 className="lp-serif text-3xl md:text-5xl font-normal leading-[0.95] mt-4 mb-4">
                Frequently{" "}
                <span className="italic" style={{ color: "#0d9488" }}>
                  Asked
                </span>
              </h2>
              <p
                className="lp-sans text-sm leading-relaxed"
                style={{ color: "#6C6863" }}
              >
                Can&apos;t find the answer you&apos;re looking for? Reach out to
                our support team.
              </p>
            </div>

            {/* Right FAQ items */}
            <div className="lg:col-span-7 lg:col-start-6">
              {faqs.map((f, i) => (
                <FaqItem key={i} question={f.q} answer={f.a} />
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ═══════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════ */}
      <FadeSection className="lp-cta-section py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16 text-center">
          <span
            className="lp-overline"
            style={{ color: "rgba(249,248,246,0.4)" }}
          >
            Get Started Today
          </span>
          <h2
            className="lp-serif text-3xl md:text-5xl lg:text-7xl font-normal leading-[0.95] mt-4 mb-6"
            style={{ color: "#F9F8F6" }}
          >
            Your Health Journey
            <br />
            <span className="italic" style={{ color: "#0d9488" }}>
              Starts Here
            </span>
          </h2>
          <p
            className="lp-sans text-base leading-relaxed max-w-md mx-auto mb-10"
            style={{ color: "rgba(249,248,246,0.6)" }}
          >
            Join thousands of patients and doctors who trust CareLine 360 for
            modern, secure, and intelligent healthcare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="lp-btn-primary"
              style={{ background: "#0d9488", color: "#F9F8F6" }}
            >
              <span className="btn-gold-bg" style={{ background: "#F9F8F6" }} />
              <span
                className="btn-label flex items-center gap-2"
                style={{ mixBlendMode: "difference" }}
              >
                Create Free Account <ArrowRight size={14} />
              </span>
            </Link>
            <Link
              to="/login"
              className="lp-btn-secondary"
              style={{
                borderColor: "rgba(249,248,246,0.3)",
                color: "#F9F8F6",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </FadeSection>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="lp-footer py-16 md:py-20">
        <div className="max-w-[1600px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logo}
                  alt="CareLine 360"
                  className="h-10 w-auto brightness-200"
                />
                <span
                  className="lp-serif text-lg font-medium"
                  style={{ color: "#F9F8F6" }}
                >
                  CareLine{" "}
                  <span style={{ color: "#0d9488", fontStyle: "italic" }}>
                    360
                  </span>
                </span>
              </div>
              <p
                className="lp-sans text-sm leading-relaxed"
                style={{ color: "rgba(249,248,246,0.5)" }}
              >
                A smart healthcare platform connecting patients with specialist
                doctors through intelligent technology.
              </p>
            </div>

            {/* Links */}
            <div className="md:col-span-2 md:col-start-6">
              <h4
                className="lp-overline mb-4"
                style={{ color: "rgba(249,248,246,0.3)", fontSize: "0.6rem" }}
              >
                Platform
              </h4>
              <div className="flex flex-col gap-3">
                <a href="#features">Features</a>
                <a href="#about">About</a>
                <a href="#testimonials">Testimonials</a>
                <a href="#faq">FAQ</a>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4
                className="lp-overline mb-4"
                style={{ color: "rgba(249,248,246,0.3)", fontSize: "0.6rem" }}
              >
                Access
              </h4>
              <div className="flex flex-col gap-3">
                <Link to="/login">Sign In</Link>
                <Link to="/register">Register</Link>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4
                className="lp-overline mb-4"
                style={{ color: "rgba(249,248,246,0.3)", fontSize: "0.6rem" }}
              >
                Legal
              </h4>
              <div className="flex flex-col gap-3">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderColor: "rgba(249,248,246,0.08)" }}
          >
            <p
              className="lp-sans"
              style={{ color: "rgba(249,248,246,0.3)", fontSize: "0.7rem" }}
            >
              © {new Date().getFullYear()} CareLine 360. All rights reserved.
            </p>
            <p
              className="lp-sans"
              style={{
                color: "rgba(249,248,246,0.2)",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Designed with care
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}