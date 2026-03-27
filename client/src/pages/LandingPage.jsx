import React from "react";
import { Link } from "react-router-dom";
import {
  FaUserMd,
  FaCalendarCheck,
  FaHeartbeat,
  FaClinicMedical,
  FaArrowRight,
  FaPhoneAlt,
  FaShieldAlt,
  FaStar,
  FaMapMarkerAlt,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

export default function LandingPage() {
  const testimonials = [
    {
      name: "Sivapriya",
      role: "Patient",
      text: "This platform made it easy for my family to find a specialist doctor without traveling far. The process was simple and very helpful.",
    },
    {
      name: "Kajan",
      role: "Village User",
      text: "Booking appointments became much easier. The design is clear, and we can quickly connect with the right doctor.",
    },
    {
      name: "Dr. Nirmala",
      role: "Specialist Doctor",
      text: "Care Line 360 improves access to healthcare for rural communities and helps doctors connect with patients more efficiently.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#edf4f4] overflow-x-hidden text-[15px]">
      {/* background glow */}
      <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-r from-[#dff6f6] via-[#eff8f8] to-[#d9f1f2] blur-3xl opacity-70 -z-10" />

      <section className="w-full mx-auto bg-white/80 backdrop-blur-xl border border-white/60 overflow-hidden relative">
        {/* decorative circles */}
        <div className="absolute top-[-60px] right-[-40px] w-[220px] h-[220px] rounded-full bg-[#178d95]/10 blur-2xl" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[260px] h-[260px] rounded-full bg-[#178d95]/10 blur-2xl" />

        {/* navbar */}
        <header className="flex items-center justify-between px-6 md:px-12 py-4 mt-6 rounded-lg max-w-[1500px] mx-auto relative z-10 bg-white/70 border border-[#edf1f3]">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#0f172a]">
              Care Line 360
            </h1>
            <p className="text-[11px] md:text-xs text-[#178d95] font-medium tracking-[0.14em] uppercase mt-1">
              Smart Rural Healthcare Access
            </p>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[#334155]">
            <a href="#home" className="hover:text-[#178d95] transition">
              Home
            </a>
            <a href="#services" className="hover:text-[#178d95] transition">
              Services
            </a>
            <a href="#how" className="hover:text-[#178d95] transition">
              How It Works
            </a>
            <a href="#contact" className="hover:text-[#178d95] transition">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden md:inline-flex px-4 py-2 rounded-full border border-[#178d95]/30 text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition hover:shadow-sm transition hover:-translate-y-1 duration-300"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition hover:shadow-sm transition hover:-translate-y-1 duration-300"
            >
              Register
            </Link>

            <button className="w-10 h-10 rounded-full bg-white border border-[#dbe4e6] flex items-center justify-center lg:hidden">
              <div className="space-y-[4px]">
                <span className="block w-5 h-[2px] bg-[#334155]" />
                <span className="block w-5 h-[2px] bg-[#334155]" />
                <span className="block w-5 h-[2px] bg-[#334155]" />
              </div>
            </button>
          </div>
        </header>

        {/* hero */}
        <main
          id="home"
          className="grid lg:grid-cols-2 gap-10 px-6 md:px-12 pt-8 md:pt-10 pb-14 items-center relative z-10 max-w-[1500px] mx-auto"
        >
          {/* left */}
          <div className="max-w-[580px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#178d95]/10 text-[#178d95] text-xs font-semibold mb-5">
              <FaShieldAlt className="text-[11px]" />
              Trusted Digital Healthcare Platform
            </div>

            <h2 className="text-[34px] sm:text-[44px] lg:text-[56px] leading-[0.98] font-bold tracking-tight text-[#0f172a]">
              Bringing
              <span className="block text-[#178d95]">Specialist Care</span>
              <span className="block text-[#94a3b8]">Closer to Villages</span>
            </h2>

            <p className="mt-5 text-[#5b6b7b] text-sm md:text-base leading-7 max-w-[540px]">
              Care Line 360 helps rural communities easily connect with
              specialist doctors, book appointments, access medical records,
              and receive timely healthcare support through one modern digital
              platform.
            </p>

            {/* CTA buttons */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition hover:shadow-sm transition hover:-translate-y-1 duration-300"
              >
                Get Started
                <FaArrowRight className="text-xs" />
              </Link>

              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d7dee5] bg-white text-[#0f172a] text-sm font-medium hover:bg-[#f8fafc] transition hover:shadow-sm transition hover:-translate-y-1 duration-300"
              >
                Find Doctors
              </Link>
            </div>

            {/* trust chips */}
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="px-3.5 py-2 rounded-full bg-[#f4f7f8] text-[#4b5563] text-xs font-medium hover:shadow-md transition hover:-translate-y-1 duration-300">
                100+ Verified Specialists
              </span>
              <span className="px-3.5 py-2 rounded-full bg-[#f4f7f8] text-[#4b5563] text-xs font-medium hover:shadow-md transition hover:-translate-y-1 duration-300">
                24/7 Access Support
              </span>
              <span className="px-3.5 py-2 rounded-full bg-[#f4f7f8] text-[#4b5563] text-xs font-medium hover:shadow-md transition hover:-translate-y-1 duration-300">
                Rural Friendly Platform
              </span>
            </div>

            {/* stats */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-[520px]">
              <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl p-4 hover:shadow-md transition hover:-translate-y-1 duration-300">
                <h3 className="text-xl md:text-2xl font-semibold text-[#178d95]">
                  100+
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-5">
                  Specialist Doctors
                </p>
              </div>

              <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl p-4 hover:shadow-md transition hover:-translate-y-1 duration-300">
                <h3 className="text-xl md:text-2xl font-semibold text-[#178d95]">
                  5K+
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-5">
                  Patients Helped
                </p>
              </div>

              <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl p-4 hover:shadow-md transition hover:-translate-y-1 duration-300">
                <h3 className="text-xl md:text-2xl font-semibold text-[#178d95]">
                  24/7
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-5">
                  Care Accessibility
                </p>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="relative">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] bg-gradient-to-br from-[#178d95]/15 to-[#178d95]/5 blur-sm" />

            <div className="relative rounded-[28px] overflow-hidden border border-[#eef2f4] bg-white">
              <img
                src="/hero-doctor.jpg"
                alt="Rural patients connecting with specialist doctors"
                className="w-full h-[500px] object-cover"
              />
            </div>

            <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e5e7eb] px-4 py-3 w-[210px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#178d95]/10 flex items-center justify-center text-[#178d95]">
                  <FaUserMd className="text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    Specialist Access
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    Connect with verified doctors
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e5e7eb] px-4 py-3 w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#178d95]/10 flex items-center justify-center text-[#178d95]">
                  <FaCalendarCheck className="text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    Easy Appointments
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    Faster booking for rural patients
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -right-3 md:-right-6 -translate-y-1/2 bg-[#178d95] text-white rounded-[24px] px-5 py-4 w-[190px]">
              <p className="text-xs font-medium opacity-90 leading-5">
                Healthcare that reaches beyond cities
              </p>
              <div className="mt-3 flex items-center gap-2">
                <FaPhoneAlt className="text-xs" />
                <span className="text-xs font-semibold">Online Consult</span>
              </div>
            </div>
          </div>
        </main>

        {/* services */}
        <section
          id="services"
          className="px-6 md:px-12 pb-10 md:pb-12 pt-2 relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="mb-8 mt-12 flex flex-col items-center text-center gap-3">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em] mb-2">
              Core Services
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
              Everything needed for better digital care
            </h3>
            <p className="text-[#6b7280] max-w-[520px] mt-3 text-sm leading-6">
              Designed to help village patients discover specialists, schedule
              consultations, and manage their healthcare journey with ease.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaCalendarCheck />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Easy Appointments
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Book and manage appointments with top doctors in just a few
                clicks.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaHeartbeat />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Medical Records
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Securely store and access your medical history anytime,
                anywhere.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaPhoneAlt />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Telemedicine
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Connect with healthcare professionals through online
                consultations.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaClinicMedical />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                E-Prescriptions
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Receive digital prescriptions and continue your treatment with
                ease.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaUserMd />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Health Monitoring
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Track your health journey and stay connected with the right care
                support.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaShieldAlt />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Data Security
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Your health data is encrypted and managed with better security
                standards.
              </p>
            </div>
          </div>
        </section>

        {/* how it works */}
        <section
          id="how"
          className="px-6 md:px-12 pb-12 md:pb-14 relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="grid lg:grid-rows-2 gap-8 items-center lg:mb-12 mt-12">
            <div className="flex flex-col items-center text-center">
              <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em]">
                How It Works
              </p>
              <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mt-2 mb-4">
                Simple steps to access specialist care
              </h3>
              <p className="text-[#6b7280] leading-7 max-w-[540px] text-sm">
                The platform is designed to be simple and easy for anyone to
                use, even for first-time digital healthcare users in rural
                communities.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex gap-4 bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-[#178d95] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] text-base">
                    Create Your Account
                  </h4>
                  <p className="text-sm text-[#6b7280] mt-1 leading-6">
                    Register securely and set up your patient profile with basic
                    details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-[#178d95] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] text-base">
                    Search Specialist Doctors
                  </h4>
                  <p className="text-sm text-[#6b7280] mt-1 leading-6">
                    Find the right doctor based on specialty and available
                    consultation time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-[#178d95] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] text-base">
                    Book and Receive Care
                  </h4>
                  <p className="text-sm text-[#6b7280] mt-1 leading-6">
                    Confirm your appointment and continue your healthcare
                    journey with easier access and follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* testimonials */}
        <section
          id="testimonials"
          className="px-6 md:px-12 pb-10 md:pb-12 relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em]">
              Testimonials
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mt-2">
              What people say about Care Line 360
            </h3>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300"
              >
                <div className="flex gap-1 text-[#f59e0b] mb-4 text-sm">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
                <p className="text-[#6b7280] leading-6 text-sm mb-5">
                  {item.text}
                </p>
                <div>
                  <h4 className="text-base font-semibold text-[#0f172a]">
                    {item.name}
                  </h4>
                  <p className="text-sm text-[#178d95]">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* emergency banner */}
        <section className="px-6 md:px-12 pb-10 md:pb-12 relative z-10 max-w-[1500px] mx-auto">
          <div className="rounded-[26px] bg-gradient-to-r from-[#178d95] to-[#126f76] p-7 md:p-9 text-white">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div>
                <p className="uppercase tracking-[0.16em] text-xs font-semibold text-white/80">
                  Need Immediate Support
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold mt-2">
                  Access healthcare support anytime, anywhere
                </h3>
                <p className="mt-4 text-white/85 leading-7 max-w-[560px] text-sm">
                  Connect patients from rural communities with the right
                  healthcare guidance faster through a reliable and easy-to-use
                  digital platform.
                </p>
              </div>

              <div className="flex flex-wrap lg:justify-end gap-3">
                <Link
                  to="/doctors"
                  className="px-6 py-3 rounded-full bg-white text-[#178d95] text-sm font-medium hover:bg-[#f8fafc] transition hover:shadow-sm transition hover:-translate-y-1 duration-300"
                >
                  Find a Doctor
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-3 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition hover:shadow-sm transition hover:-translate-y-1 duration-300"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer
          id="contact"
          className="px-6 md:px-12 py-10 border-t border-[#e2e8f0] bg-white/40 relative z-10"
        >
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-[1500px] mx-auto">
            <div>
              <h3 className="text-xl font-semibold text-[#0f172a]">
                Care Line 360
              </h3>
              <p className="text-[#6b7280] leading-6 mt-4 max-w-[320px] text-sm">
                A smart healthcare platform helping rural patients connect with
                specialist doctors and access digital care more easily.
              </p>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Quick Links
              </h4>
              <div className="flex flex-col gap-3 text-[#6b7280] text-sm">
                <a href="#home" className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300">
                  Home
                </a>
                <a href="#services" className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300">
                  Services
                </a>
                <a href="#how" className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300">
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300"
                >
                  Testimonials
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Contact
              </h4>
              <div className="flex flex-col gap-3 text-[#6b7280] text-sm">
                <div className="flex items-center gap-3 hover:transition hover:-translate-y-1 duration-300">
                  <FaPhoneAlt className="text-[#178d95]" />
                  <span>+94 77 123 4567</span>
                </div>
                <div className="flex items-center gap-3 hover:transition hover:-translate-y-1 duration-300">
                  <FaEnvelope className="text-[#178d95]" />
                  <span>careline360@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 hover:transition hover:-translate-y-1 duration-300">
                  <FaMapMarkerAlt className="text-[#178d95]" />
                  <span>Jaffna, Sri Lanka</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Follow Us
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="/"
                  className="w-10 h-10 rounded-full bg-[#178d95]/10 text-[#178d95] flex items-center justify-center hover:bg-[#178d95] hover:text-white transition hover:-translate-y-1 duration-300"
                >
                  <FaFacebookF className="text-sm" />
                </a>
                <a
                  href="/"
                  className="w-10 h-10 rounded-full bg-[#178d95]/10 text-[#178d95] flex items-center justify-center hover:bg-[#178d95] hover:text-white transition hover:-translate-y-1 duration-300"
                >
                  <FaInstagram className="text-sm" />
                </a>
                <a
                  href="/"
                  className="w-10 h-10 rounded-full bg-[#178d95]/10 text-[#178d95] flex items-center justify-center hover:bg-[#178d95] hover:text-white transition hover:-translate-y-1 duration-300"
                >
                  <FaLinkedinIn className="text-sm" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#e2e8f0] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6b7280] max-w-[1500px] mx-auto">
            <p>© 2026 Care Line 360. All rights reserved.</p>
            <p>Designed for accessible digital healthcare.</p>
          </div>
        </footer>
      </section>
    </div>
  );
}