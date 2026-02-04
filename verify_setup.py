#!/usr/bin/env python3
"""
Verify that all required packages are installed and working.
"""

import sys

def check_imports():
    """Check that all required packages can be imported."""
    packages = {
        'jupyter': 'Jupyter',
        'jupyterlab': 'JupyterLab',
        'notebook': 'Notebook',
        'ipykernel': 'IPyKernel',
        'numpy': 'NumPy',
        'pandas': 'Pandas',
        'matplotlib': 'Matplotlib',
        'seaborn': 'Seaborn',
        'scipy': 'SciPy',
        'tqdm': 'tqdm',
        'rich': 'Rich'
    }
    
    print("=" * 60)
    print("Verifying Playground Setup")
    print("=" * 60)
    print(f"\nPython: {sys.version}")
    print(f"Executable: {sys.executable}")
    print("\nChecking package imports:")
    
    all_ok = True
    for module, name in packages.items():
        try:
            __import__(module)
            print(f"  ✓ {name}")
        except ImportError as e:
            print(f"  ✗ {name} - {e}")
            all_ok = False
    
    if all_ok:
        print("\n" + "=" * 60)
        print("✓ All packages installed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. In Cursor, open a .ipynb file")
        print("2. Click 'Select Kernel' in the top right")
        print("3. Choose the Python interpreter from .venv")
        print("4. Run the notebook cells!")
        print("\nOr start Jupyter Lab:")
        print("  jupyter lab")
    else:
        print("\n" + "=" * 60)
        print("✗ Some packages are missing")
        print("=" * 60)
        print("\nTry running:")
        print("  pip install -r playground/requirements.txt")
        sys.exit(1)

if __name__ == '__main__':
    check_imports()
