#!/usr/bin/env python3
"""
Batch Sensitivity Analysis

Run sensitivity analysis for multiple scenarios and export results to CSV.

Usage:
    python batch_sensitivity.py
    python batch_sensitivity.py --output results.csv
"""

import argparse
import sys
from typing import List, Dict
import csv


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


def calculate_npv(
    qi: float,
    b: float,
    di: float,
    oil_price: float,
    capex: float,
    opex_per_month: float,
    nri: float = 0.75,
    months: int = 120,
    discount_rate: float = 0.10
) -> float:
    """Calculate NPV for given parameters."""
    import numpy as np
    
    production = calculate_type_curve(qi, b, di, months)
    
    discount_monthly = discount_rate / 12
    revenue = production * oil_price * nri
    opex = np.full(months, opex_per_month)
    
    net_cash_flow = revenue - opex
    net_cash_flow[0] -= capex
    
    discount_factors = np.array([1 / (1 + discount_monthly) ** t for t in range(1, months + 1)])
    npv = np.sum(net_cash_flow * discount_factors)
    
    return npv


def run_sensitivity_analysis(
    base_params: Dict,
    variable_name: str,
    param_key: str,
    values: List[float]
) -> List[Dict]:
    """Run sensitivity analysis for a single variable."""
    results = []
    
    for value in values:
        params = base_params.copy()
        params[param_key] = value
        
        npv = calculate_npv(**params)
        
        results.append({
            'variable': variable_name,
            'value': value,
            'npv': npv
        })
    
    return results


def run_two_variable_matrix(
    base_params: Dict,
    x_var_name: str,
    x_param_key: str,
    x_values: List[float],
    y_var_name: str,
    y_param_key: str,
    y_values: List[float]
) -> List[Dict]:
    """Run two-variable sensitivity matrix."""
    results = []
    
    for y_val in y_values:
        for x_val in x_values:
            params = base_params.copy()
            params[x_param_key] = x_val
            params[y_param_key] = y_val
            
            npv = calculate_npv(**params)
            
            results.append({
                'x_variable': x_var_name,
                'x_value': x_val,
                'y_variable': y_var_name,
                'y_value': y_val,
                'npv': npv
            })
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Batch Sensitivity Analysis')
    parser.add_argument('--output', type=str, default='sensitivity_results.csv', help='Output CSV file')
    parser.add_argument('--mode', choices=['single', 'matrix'], default='matrix', help='Analysis mode')
    
    args = parser.parse_args()
    
    try:
        import numpy as np
    except ImportError:
        print("Error: NumPy is required. Install with: pip install numpy")
        sys.exit(1)
    
    print("=" * 60)
    print("Batch Sensitivity Analysis")
    print("=" * 60)
    
    # Base case parameters
    base_params = {
        'qi': 1000,
        'b': 1.2,
        'di': 0.50,
        'oil_price': 75,
        'capex': 8_000_000,
        'opex_per_month': 10_000,
        'nri': 0.75,
        'months': 120,
        'discount_rate': 0.10
    }
    
    print("\nBase Case Parameters:")
    print(f"  qi={base_params['qi']:.0f} bbl/d")
    print(f"  b={base_params['b']}")
    print(f"  Di={base_params['di']*100:.0f}%")
    print(f"  Oil Price=${base_params['oil_price']:.0f}/bbl")
    print(f"  CAPEX=${base_params['capex']:,.0f}")
    print(f"  OPEX=${base_params['opex_per_month']:,.0f}/month")
    print(f"  NRI={base_params['nri']*100:.0f}%")
    
    if args.mode == 'single':
        print("\nRunning single-variable sensitivities...")
        
        all_results = []
        
        # Oil price sensitivity
        oil_prices = list(range(40, 121, 10))
        all_results.extend(run_sensitivity_analysis(
            base_params, 'Oil Price', 'oil_price', oil_prices
        ))
        
        # CAPEX sensitivity
        capex_values = list(range(6_000_000, 10_500_000, 500_000))
        all_results.extend(run_sensitivity_analysis(
            base_params, 'CAPEX', 'capex', capex_values
        ))
        
        # Qi sensitivity
        qi_values = list(range(600, 1401, 100))
        all_results.extend(run_sensitivity_analysis(
            base_params, 'Initial Production', 'qi', qi_values
        ))
        
        # Write results
        with open(args.output, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['variable', 'value', 'npv'])
            writer.writeheader()
            writer.writerows(all_results)
        
        print(f"\n✓ Wrote {len(all_results)} single-variable sensitivity results to {args.output}")
    
    else:  # matrix
        print("\nRunning two-variable sensitivity matrix...")
        print("  X-axis: Oil Price ($40-$100, step $10)")
        print("  Y-axis: CAPEX ($6MM-$10MM, step $0.5MM)")
        
        oil_prices = list(range(40, 101, 10))
        capex_values = list(range(6_000_000, 10_500_000, 500_000))
        
        results = run_two_variable_matrix(
            base_params,
            'Oil Price',
            'oil_price',
            oil_prices,
            'CAPEX',
            'capex',
            capex_values
        )
        
        # Write results
        with open(args.output, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['x_variable', 'x_value', 'y_variable', 'y_value', 'npv'])
            writer.writeheader()
            writer.writerows(results)
        
        print(f"\n✓ Wrote {len(results)} matrix results to {args.output}")
    
    print("\nDone! You can now:")
    print(f"  - Import {args.output} into Excel or other tools")
    print(f"  - Load it in a Jupyter notebook with: pd.read_csv('{args.output}')")
    print("=" * 60)


if __name__ == '__main__':
    main()
