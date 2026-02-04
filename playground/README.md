# Playground

This directory contains Jupyter notebooks and Python scripts for one-off analysis, experimentation, and testing of the economics calculations.

## Structure

- `notebooks/` - Jupyter notebooks for interactive analysis
- `scripts/` - Python scripts for quick experiments and batch processing

## Setup

### Install Dependencies

```bash
# From the project root
pip install -r playground/requirements.txt
```

### Start Jupyter Lab

```bash
# From the project root
jupyter lab
```

This will open Jupyter Lab in your browser, where you can navigate to `playground/notebooks/` to open or create notebooks.

Alternatively, to start from the playground directory:

```bash
cd playground
jupyter lab
```

## Using Backend Economics Functions

The playground can directly import and use the backend Python economics module (once implemented). This allows you to:

- Run type curve forecasts
- Calculate economics for well portfolios
- Generate sensitivity matrices
- Compare results with the TypeScript implementation

### Example: Direct Module Import

```python
import sys
sys.path.insert(0, '../backend')

from economics import calculate_economics
from models import Well, TypeCurveParams, CapexAssumptions, PricingAssumptions

# Create sample well
well = Well(
    id="well-1",
    name="Test Well",
    lat=32.0,
    lng=-102.0,
    lateral_length=10000,
    status="PRODUCING",
    operator="Test Operator"
)

# Define type curve
type_curve = TypeCurveParams(
    qi=1000,
    b=1.2,
    di=0.50,
    terminal_decline=0.05
)

# Run calculations...
```

## Example Notebooks

1. **`type_curve_analysis.ipynb`** - Explore type curve parameters and their impact on production profiles
2. **`sensitivity_demo.ipynb`** - Generate and visualize sensitivity matrices

## Example Scripts

1. **`quick_economics.py`** - Run a quick economics calculation from the command line
2. **`batch_sensitivity.py`** - Run multiple sensitivity scenarios and export results

## Tips

- Use notebooks for exploration and visualization
- Use scripts for repeatable batch processing
- Both can import from `../backend/` to reuse core logic
- Add `.ipynb_checkpoints/` to .gitignore (already done)
- Consider adding your own notebooks to .gitignore if they contain sensitive data

## Notes

- The playground is independent of the web UI - it's for direct Python analysis
- You can test backend functions here before integrating them with the FastAPI endpoints
- Notebooks are great for documentation - consider keeping clean example notebooks in the repo
