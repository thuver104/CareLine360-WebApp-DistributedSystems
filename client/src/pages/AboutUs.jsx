import React from "react";
import { Link } from "react-router-dom";
import {
  FaHeartbeat,
  FaBullseye,
  FaEye,
  FaUserMd,
  FaShieldAlt,
  FaUsers,
  FaArrowRight,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import PatientNavbar from "./patient/components/PatientNavbar";

export default function AboutUs() {
  const values = [
    {
      icon: <FaHeartbeat />,
      title: "Compassionate Care",
      desc: "We believe healthcare should be accessible, human-centered, and supportive for every patient, regardless of location.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Trust & Security",
      desc: "We prioritize patient trust by maintaining secure access to medical information and reliable digital healthcare services.",
    },
    {
      icon: <FaUsers />,
      title: "Community Impact",
      desc: "Our platform is designed to strengthen healthcare access for rural communities and improve connections with specialists.",
    },
  ];

  const highlights = [
    "Connect rural patients with specialist doctors",
    "Simplify appointment booking and consultations",
    "Support better access to medical records",
    "Reduce healthcare barriers caused by distance",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white] p-6">
      <div className="absolute top-0 left-0 w-full h-[380px] bg-gradient-to-r from-[#dff6f6] via-[#eff8f8] to-[#d9f1f2] blur-3xl opacity-70 -z-10" />

      {/* Navbar */}
      <PatientNavbar />
      <section className="w-full mx-auto bg-white/80 backdrop-blur-xl border border-white/60 overflow-hidden relative">
        <div className="absolute top-[-60px] right-[-40px] w-[220px] h-[220px] rounded-full bg-[#178d95]/10 blur-2xl" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[260px] h-[260px] rounded-full bg-[#178d95]/10 blur-2xl" />

        {/* Hero Section */}
        <section
          id="about"
          className="max-w-[1500px] mx-auto px-6 md:px-12 pt-10 md:pt-14 pb-12"
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="max-w-[620px]">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#178d95]/10 text-[#178d95] text-xs font-semibold mb-5">
                <FaShieldAlt className="text-[11px]" />
                Professional Digital Healthcare Platform
              </div>

              <h2 className="text-[34px] sm:text-[42px] lg:text-[52px] leading-[1] font-bold tracking-tight text-[#0f172a]">
                About
                <span className="block text-[#178d95]">Care Line 360</span>
              </h2>

              <p className="mt-5 text-[#5b6b7b] text-sm md:text-base leading-7 max-w-[560px]">
                Care Line 360 is a smart healthcare platform designed to connect
                rural communities with specialist doctors through a simple,
                accessible, and reliable digital system. We aim to reduce the
                healthcare gap between urban medical services and village
                patients by making specialist care easier to reach.
              </p>

              <p className="mt-4 text-[#5b6b7b] text-sm md:text-base leading-7 max-w-[560px]">
                Our platform supports patients in finding doctors, booking
                appointments, managing medical records, and receiving timely
                healthcare assistance through one seamless experience.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition"
                >
                  Get Started
                  <FaArrowRight className="text-xs" />
                </Link>

                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d7dee5] bg-white text-[#0f172a] text-sm font-medium hover:bg-[#f8fafc] transition"
                >
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e5e7eb]">
                <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                  <FaUserMd />
                </div>
                <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
                  Better Access to Specialists
                </h3>
                <p className="text-[#6b7280] leading-6 text-sm">
                  We help village patients connect with specialist doctors more
                  quickly and conveniently through a modern healthcare platform.
                </p>
              </div>

              <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e5e7eb]">
                <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                  <FaHeartbeat />
                </div>
                <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
                  Patient-Centered Experience
                </h3>
                <p className="text-[#6b7280] leading-6 text-sm">
                  From appointments to medical records, every feature is built
                  to create a simpler and more supportive patient journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section
          id="mission"
          className="max-w-[1500px] mx-auto px-6 md:px-12 pb-10 md:pb-12"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e5e7eb]">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaBullseye />
              </div>
              <h3 className="text-xl font-semibold text-[#0f172a] mb-3">
                Our Mission
              </h3>
              <p className="text-[#6b7280] leading-7 text-sm">
                Our mission is to improve healthcare accessibility by bringing
                specialist medical services closer to rural communities through
                digital innovation, trust, and convenience.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e5e7eb]">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaEye />
              </div>
              <h3 className="text-xl font-semibold text-[#0f172a] mb-3">
                Our Vision
              </h3>
              <p className="text-[#6b7280] leading-7 text-sm">
                Our vision is to create a future where every patient,
                regardless of location, can access quality healthcare services
                without barriers.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="max-w-[1500px] mx-auto px-6 md:px-12 pb-10 md:pb-12">
          <div className="mb-8">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em] mb-2">
              What We Do
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
              Building a better healthcare connection
            </h3>
            <p className="text-[#6b7280] max-w-[560px] mt-3 text-sm leading-6">
              We focus on improving the healthcare journey for rural patients by
              making digital healthcare services more practical, organized, and
              easier to use.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((item, index) => (
              <div
                key={index}
                className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb]"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#178d95]" />
                  <p className="text-[#6b7280] text-sm leading-6">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section
          id="values"
          className="max-w-[1500px] mx-auto px-6 md:px-12 pb-10 md:pb-12"
        >
          <div className="mb-8">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em] mb-2">
              Our Values
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
              What drives Care Line 360
            </h3>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {values.map((item, index) => (
              <div
                key={index}
                className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e5e7eb]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                  {item.icon}
                </div>
                <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                  {item.title}
                </h4>
                <p className="text-[#6b7280] leading-6 text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="max-w-[1500px] mx-auto px-6 md:px-12 pb-10 md:pb-12">
          <div className="rounded-[26px] bg-gradient-to-r from-[#178d95] to-[#126f76] p-7 md:p-9 text-white">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div>
                <p className="uppercase tracking-[0.16em] text-xs font-semibold text-white/80">
                  Our Commitment
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold mt-2">
                  Making healthcare more accessible for every community
                </h3>
                <p className="mt-4 text-white/85 leading-7 max-w-[560px] text-sm">
                  At Care Line 360, we believe healthcare should not be limited
                  by distance. By combining technology with compassion, we aim
                  to make specialist healthcare more available, more convenient,
                  and more meaningful for every patient.
                </p>
              </div>

              <div className="flex flex-wrap lg:justify-end gap-3">
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-full bg-white text-[#178d95] text-sm font-medium hover:bg-[#f8fafc] transition"
                >
                  Join Now
                </Link>

                <Link
                  to="/contact"
                  className="px-6 py-3 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          id="contact"
          className="px-6 md:px-12 py-10 border-t border-[#e2e8f0] bg-white/40"
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
                <Link to="/" className="hover:text-[#178d95] transition">
                  Home
                </Link>
                <a href="#about" className="hover:text-[#178d95] transition">
                  About
                </a>
                <a href="#mission" className="hover:text-[#178d95] transition">
                  Mission
                </a>
                <a href="#values" className="hover:text-[#178d95] transition">
                  Values
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Contact
              </h4>
              <div className="flex flex-col gap-3 text-[#6b7280] text-sm">
                <div className="flex items-center gap-3">
                  <FaPhoneAlt className="text-[#178d95]" />
                  <span>+94 77 123 4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-[#178d95]" />
                  <span>careline360@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-[#178d95]" />
                  <span>Jaffna, Sri Lanka</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Why Choose Us
              </h4>
              <div className="flex flex-col gap-3 text-[#6b7280] text-sm">
                <p>Accessible for rural communities</p>
                <p>Secure and reliable system</p>
                <p>Easy specialist doctor access</p>
                <p>Simple and modern healthcare experience</p>
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