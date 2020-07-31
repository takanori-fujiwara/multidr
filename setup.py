import sys
import os
from distutils.core import setup

setup(name='multidr',
      version=0.01,
      packages=[''],
      package_dir={'': '.'},
      install_requires=['numpy', 'sklearn', 'umap-learn', 'matplotlib'],
      py_modules=['multidr', 'multidr.tdr'])
