#!/usr/bin/env python3
"""
Quick Economics Calculator

A simple command-line script to calculate economics for a single well
with default or custom parameters.

Usage:
    python quick_economics.py
    python quick_economics.py --qi 1200 --oil-price 80 --capex 8500000
"""

import argparse
import sys
from typing import Dict


def calculate_type_curve(qi: float, b: float, di_annual: float, months: int = 120):
    """Calculate monthly production rates."""
    import numpy as np
    
    di_monthly = 1 - (1 - di_annual) ** (1/12)
    qi_monthly = qi * 30.4
    
    rates = []
    for t in range(1, months + 1):
        if b == 0:
            q_t = qi_monthly * np.exp(-di_monthly * t)
        else:
            q_t = qi_monthly / ((1 + b * di_monthly * t) ** (1/b))
        rates.append(q_t)
    
    return np.array(rates)


def calculate_economics(
    qi: float,
    b: float,
    di: float,
    oil_price: float,
    capex: float,
    opex_per_month: float,
    nri: float = 0.75,
    months: int = 120,
    discount_rate: float = 0.10
) -> Dict:
    """Calculate full economics for a single well."""
    import numpy as np
    
    # Calculate production
    production = calculate_type_curve(qi, b, di, months)
    eur = production.sum()
    
    # Calculate cash flows
    discount_monthly = discount_rate / 12
    revenue = production * oil_price * nri
    opex = np.full(months, opex_per_month)
    
    net_cash_flow = revenue - opex
    net_cash_flow[0] -= capex
    
    # Calculate cumulative cash flow
    cumulative = np.cumsum(net_cash_flow)
    
    # Find payout month
    payout_month = None
    for i, cum in enumerate(cumulative):
        if cum >= 0:
            payout_month = i + 1
            break
    
    # Calculate NPV
    discount_factors = np.array([1 / (1 + discount_monthly) ** t for t in range(1, months + 1)])
    npv = np.sum(net_cash_flow * discount_factors)
    
    # Simple IRR approximation (Newton's method would be better)
    irr_approx = 0.0
    if capex > 0:
        total_undiscounted_profit = revenue.sum() - opex.sum() - capex
        irr_approx = (total_undiscounted_profit / capex) * 12 / months  # Annualized
    
    return {
        'eur': eur,
        'total_revenue': revenue.sum(),
        'total_opex': opex.sum(),
        'capex': capex,
        'npv10': npv,
        'irr_approx': irr_approx,
        'payout_months': payout_month,
        'year1_production': production[:12].sum()
    }


def main():
    parser = argparse.ArgumentParser(description='Quick Economics Calculator')
    
    # Type curve parameters
    parser.add_argument('--qi', type=float, default=1000, help='Initial production (bbl/d)')
    parser.add_argument('--b', type=float, default=1.2, help='b-factor')
    parser.add_argument('--di', type=float, default=0.50, help='Initial decline rate (decimal)')
    
    # Economic parameters
    parser.add_argument('--oil-price', type=float, default=75, help='Oil price ($/bbl)')
    parser.add_argument('--capex', type=float, default=8_000_000, help='CAPEX ($)')
    parser.add_argument('--opex', type=float, default=10_000, help='OPEX per month ($)')
    parser.add_argument('--nri', type=float, default=0.75, help='Net revenue interest (decimal)')
    
    # Calculation parameters
    parser.add_argument('--months', type=int, default=120, help='Months to project')
    parser.add_argument('--discount', type=float, default=0.10, help='Discount rate (decimal)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Quick Economics Calculator")
    print("=" * 60)
    print("\nInput Parameters:")
    print(f"  Type Curve: qi={args.qi:.0f} bbl/d, b={args.b}, Di={args.di*100:.0f}%")
    print(f"  Economics: Oil=${args.oil_price:.0f}/bbl, NRI={args.nri*100:.0f}%")
    print(f"  CAPEX: ${args.capex:,.0f}")
    print(f"  OPEX: ${args.opex:,.0f}/month")
    print(f"  Projection: {args.months} months @ {args.discount*100:.0f}% discount")
    
    try:
        import numpy as np
    except ImportError:
        print("\nError: NumPy is required. Install with: pip install numpy")
        sys.exit(1)
    
    # Calculate
    results = calculate_economics(
        qi=args.qi,
        b=args.b,
        di=args.di,
        oil_price=args.oil_price,
        capex=args.capex,
        opex_per_month=args.opex,
        nri=args.nri,
        months=args.months,
        discount_rate=args.discount
    )
    
    # Print results
    print("\n" + "=" * 60)
    print("Results:")
    print("=" * 60)
    print(f"  EUR: {results['eur']:,.0f} bbl")
    print(f"  Year 1 Production: {results['year1_production']:,.0f} bbl")
    print(f"  Total Revenue: ${results['total_revenue']:,.0f}")
    print(f"  Total OPEX: ${results['total_opex']:,.0f}")
    print(f"  Total CAPEX: ${results['capex']:,.0f}")
    print(f"  NPV @ {args.discount*100:.0f}%: ${results['npv10']:,.0f}")
    print(f"  IRR (approx): {results['irr_approx']*100:.1f}%")
    
    if results['payout_months']:
        print(f"  Payout: {results['payout_months']} months")
    else:
        print(f"  Payout: Never (within {args.months} months)")
    
    # Additional metrics
    revenue_per_bbl = results['total_revenue'] / results['eur'] if results['eur'] > 0 else 0
    finding_cost = results['capex'] / results['eur'] if results['eur'] > 0 else 0
    
    print(f"\n  Revenue per bbl: ${revenue_per_bbl:.2f}/bbl")
    print(f"  Finding & Development Cost: ${finding_cost:.2f}/bbl")
    print("=" * 60)


if __name__ == '__main__':
    main()
