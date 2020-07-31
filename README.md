## MulTiDR: A Visual Analytics Framework for Reviewing Multivariate Time-Series Data with Dimensionality Reduction

About
-----
* MulTiDR is from: Fujiwara et al., "A Visual Analytics Framework for ReviewingMultivariate Time-Series Data with Dimensionality Reduction." 2020.  

* Implementation of MulTiDR back-end
 * Two-step DR (TDR): Framework of dimensionality reduction for multivariate time-series data. TDR produces a low-dimensional representation from a third-order tensor.
 * ccPCA with sign adjustment of feature contributions (Coming soon).

* Implementation of MulTiDR front-end (The source code will tentatively be released in the future).

* Demonstration video of a system using MulTiDR: https://takanori-fujiwara.github.io/s/multidr/

******

Requirements
-----
* Python3
* Note: Tested on macOS Catalina.

******

Setup
-----
#### Mac OS with Homebrew
* Install with pip3. Move to the directory of this repository. Then,

    `pip3 install .`

******

Usage
-----
* Import installed modules from python (e.g., `from multidr.tdr import TDR`). See sample.py for examples.

******

## How to Cite
Please, cite:    
Takanori Fujiwara, Shilpika, Naohisa Sakamoto, Jorji Nonaka, Keiji Yamamoto, and Kwan-Liu Ma, "A Visual Analytics Framework for ReviewingMultivariate Time-Series Data with Dimensionality Reduction".
(Journal information will be provided soon), 2020.
