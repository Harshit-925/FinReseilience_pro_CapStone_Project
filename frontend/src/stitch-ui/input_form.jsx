

<header className="w-full top-0 sticky bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-50">
<div className="flex justify-between items-center h-16 px-6 max-w-full mx-auto">
<div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-headline">
                FinResilience Pro
            </div>
<nav className="hidden md:flex items-center space-x-8">
<a className="font-body text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out" href="#">Platform</a>
<a className="font-body text-sm font-medium text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-50 pb-1" href="#">Solutions</a>
<a className="font-body text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out" href="#">Resources</a>
<a className="font-body text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors duration-200 ease-in-out" href="#">Pricing</a>
</nav>
<div className="flex items-center space-x-4">
<button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-200">Login</button>
<button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200">Get Started</button>
</div>
</div>
</header>

<main className="flex-grow container mx-auto px-6 py-12 max-w-6xl">
<div className="mb-10">
<h1 className="text-3xl font-bold text-slate-900 font-headline mb-2">Financial Profile Orchestration</h1>
<p className="text-slate-500 max-w-2xl">Complete your institutional-grade wealth assessment. Enter your current financial standing to generate a high-precision resilience model.</p>
</div>
<form className="space-y-8" id="wealthForm">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

<section className="bg-white border border-slate-200 p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-slate-900" style={{'font-variation-settings': ''FILL' 1'}}>payments</span>
<h2 className="text-lg font-bold text-slate-900 font-headline tracking-tight uppercase">Income</h2>
</div>
<div className="space-y-4">
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="monthly_salary">Monthly Salary</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="monthly_salary" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="annual_bonus">Annual Bonus (Pro-rata)</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="annual_bonus" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="investment_income">Investment Dividends</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="investment_income" placeholder="0.00" type="number"/>
</div>
</div>
</div>
</section>

<section className="bg-white border border-slate-200 p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-slate-900" style={{'font-variation-settings': ''FILL' 1'}}>receipt_long</span>
<h2 className="text-lg font-bold text-slate-900 font-headline tracking-tight uppercase">Expenses</h2>
</div>
<div className="space-y-4">
<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="rent_mortgage">Rent / Mortgage</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="rent_mortgage" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="utilities">Utilities</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="utilities" placeholder="0.00" type="number"/>
</div>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="lifestyle">Lifestyle &amp; Discretionary</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="lifestyle" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="insurance">Insurance Premiums</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="insurance" placeholder="0.00" type="number"/>
</div>
</div>
</div>
</section>

<section className="bg-white border border-slate-200 p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-slate-900" style={{'font-variation-settings': ''FILL' 1'}}>account_balance</span>
<h2 className="text-lg font-bold text-slate-900 font-headline tracking-tight uppercase">Total Debt</h2>
</div>
<div className="space-y-4">
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="credit_card">Credit Card Balances</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="credit_card" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="personal_loans">Unsecured Personal Loans</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="personal_loans" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="other_debt">Other Liabilities</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="other_debt" placeholder="0.00" type="number"/>
</div>
</div>
</div>
</section>

<section className="bg-white border border-slate-200 p-6 shadow-sm">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-slate-900" style={{'font-variation-settings': ''FILL' 1'}}>calendar_today</span>
<h2 className="text-lg font-bold text-slate-900 font-headline tracking-tight uppercase">Total EMI</h2>
</div>
<div className="space-y-4">
<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="car_loan_emi">Car Loan EMI</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="car_loan_emi" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="home_loan_emi">Home Loan EMI</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="home_loan_emi" placeholder="0.00" type="number"/>
</div>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="education_loan">Education Loan EMI</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="education_loan" placeholder="0.00" type="number"/>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="misc_emi">Misc. Installments</label>
<div className="relative">
<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
<input className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-0 text-slate-900 transition-all outline-none" id="misc_emi" placeholder="0.00" type="number"/>
</div>
</div>
</div>
</section>
</div>

<div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-6">
<div>
<h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 mb-1">Financial Integrity Status</h3>
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-emerald-500"></div>
<span className="text-sm font-medium">Ready for orchestration processing</span>
</div>
</div>
<button className="w-full md:w-auto px-10 py-4 bg-white text-slate-950 font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors duration-150 border-none" type="submit">
                    Optimize Wealth
                </button>
</div>
</form>
</main>

<footer className="w-full mt-auto bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
<div className="flex flex-col md:flex-row justify-between items-center py-12 px-8 w-full max-w-7xl mx-auto">
<div className="mb-8 md:mb-0">
<div className="text-lg font-bold text-white mb-2">FinResilience Pro</div>
<p className="font-body text-xs uppercase tracking-wider text-slate-300 dark:text-slate-400">© 2024 FinResilience Pro. Institutional Wealth Orchestration. All rights reserved.</p>
</div>
<div className="flex flex-wrap justify-center gap-6">
<a className="font-body text-xs uppercase tracking-wider text-slate-400 hover:text-white transition-colors hover:underline" href="#">Privacy Policy</a>
<a className="font-body text-xs uppercase tracking-wider text-slate-400 hover:text-white transition-colors hover:underline" href="#">Terms of Service</a>
<a className="font-body text-xs uppercase tracking-wider text-slate-400 hover:text-white transition-colors hover:underline" href="#">Regulatory Disclosures</a>
<a className="font-body text-xs uppercase tracking-wider text-slate-400 hover:text-white transition-colors hover:underline" href="#">Security</a>
<a className="font-body text-xs uppercase tracking-wider text-slate-400 hover:text-white transition-colors hover:underline" href="#">Sitemap</a>
</div>
</div>
</footer>
<script>
        // Micro-interaction for form focus
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.parentElement.classList.add('scale-[1.01]');
                input.parentElement.parentElement.classList.add('transition-transform');
            });
            input.addEventListener('blur', () => {
                input.parentElement.parentElement.classList.remove('scale-[1.01]');
            });
        });

        // Basic form submission simulation
        document.getElementById('wealthForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'PROCESSING...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.innerText = 'CALCULATION COMPLETE';
                btn.classList.replace('bg-white', 'bg-emerald-500');
                btn.classList.replace('text-slate-950', 'text-white');
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.replace('bg-emerald-500', 'bg-white');
                    btn.classList.replace('text-white', 'text-slate-950');
                    btn.disabled = false;
                }, 2000);
            }, 1500);
        });
    </script>
