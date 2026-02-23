export default function Footer() {
    return (
        <footer className="w-full border-t dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-center">
                © {new Date().getFullYear()} CareLine360 — All rights reserved.
            </div>
        </footer>
    );
}
